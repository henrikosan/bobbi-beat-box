// PT-WAV Export (8-bit unsigned PCM, 22_168 Hz, mono) — V2
// - DC offset removal (mean + simple HPF)
// - Linear resample to 22_168 Hz
// - TPDF dither (1 LSB) before 8-bit quantization
// - Correct RIFF/WAV header (fmt PCM=1, mono, 8-bit, 22168 Hz)
// - Filename suggestion: <PresetName>_PT-F-3_22168Hz.wav

import { normalizeMonoBuffer, floatTo16BitPCMWithTPDF } from './audio-normalize';
import { encodeWavMono16 } from './wav-encode';

type PTWavExportOptions = {
  srcSampleRate: number;    // e.g., 48000
  targetSampleRate?: number; // default 22168
  presetName?: string;       // used for filename
  returnBlob?: boolean;      // default true (Blob), else Uint8Array
};

function removeDC(samples: Float32Array): Float32Array {
  // 1) subtract mean
  let mean = 0;
  for (let i = 0; i < samples.length; i++) mean += samples[i];
  mean /= samples.length || 1;
  const tmp = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) tmp[i] = samples[i] - mean;

  // 2) simple one-pole HPF around ~10 Hz at 48k (roughly scaled)
  const sr = 48000; // assume typical engine rate; this is a gentle extra safeguard
  const fc = 10;
  const x = Math.exp(-2 * Math.PI * fc / sr);
  let yPrev = 0, inPrev = 0;
  for (let i = 0; i < tmp.length; i++) {
    const y = x * (yPrev + tmp[i] - inPrev);
    tmp[i] = y;
    yPrev = y;
    inPrev = tmp[i];
  }
  return tmp;
}

export function linearResampleMono(input: Float32Array, srcRate: number, dstRate: number): Float32Array {
  if (srcRate === dstRate) return input.slice();
  const ratio = dstRate / srcRate;
  const outLength = Math.max(1, Math.floor(input.length * ratio));
  const out = new Float32Array(outLength);

  let pos = 0;
  for (let i = 0; i < outLength; i++) {
    const idx = pos | 0;
    const frac = pos - idx;
    const s0 = input[Math.min(idx, input.length - 1)];
    const s1 = input[Math.min(idx + 1, input.length - 1)];
    out[i] = s0 + (s1 - s0) * frac;
    pos += 1 / ratio;
  }
  return out;
}

function tpdfDither(sample: number, lsb: number): number {
  // TPDF noise with peak-to-peak ≈ 2 * lsb (sum of two uniform noises)
  const n = (Math.random() + Math.random() - 1) * lsb;
  return sample + n;
}

function floatTo8BitUnsignedPCM(input: Float32Array): Uint8Array {
  const out = new Uint8Array(input.length);
  for (let i = 0; i < input.length; i++) {
    // clamp
    let s = Math.max(-1, Math.min(1, input[i]));
    // map [-1..1] -> [0..255]
    const u = Math.round((s * 0.5 + 0.5) * 255);
    out[i] = Math.max(0, Math.min(255, u));
  }
  return out;
}

export function applyDitherThenQuantize(input: Float32Array, bits: number = 8): Uint8Array {
  const lsbNorm = 1 / (Math.pow(2, bits - 1)); // for 8-bit signed scale: 1/128
  const dithered = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    // scale dither to about 1 LSB in signed space; we'll later bias to unsigned
    dithered[i] = tpdfDither(input[i], lsbNorm);
  }
  return floatTo8BitUnsignedPCM(dithered);
}

export function writeWavU8Mono(pcmU8: Uint8Array, sampleRate: number): Uint8Array {
  // RIFF header sizes
  const numChannels = 1;
  const bitsPerSample = 8;
  const blockAlign = numChannels * (bitsPerSample >> 3 || 1); // =1 for 8-bit mono
  const byteRate = sampleRate * blockAlign;

  const dataSize = pcmU8.length;
  const fmtChunkSize = 16; // PCM
  const headerSize = 44;   // classic RIFF PCM header
  const fileSize = headerSize - 8 + dataSize;

  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);
  let p = 0;

  // Helper to write ASCII
  function ascii(str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(p++, str.charCodeAt(i));
  }

  // RIFF chunk
  ascii('RIFF');
  view.setUint32(p, fileSize, true); p += 4;
  ascii('WAVE');

  // fmt  chunk
  ascii('fmt ');
  view.setUint32(p, fmtChunkSize, true); p += 4;
  view.setUint16(p, 1, true); p += 2;                // PCM format
  view.setUint16(p, numChannels, true); p += 2;
  view.setUint32(p, sampleRate, true); p += 4;
  view.setUint32(p, byteRate, true); p += 4;
  view.setUint16(p, blockAlign, true); p += 2;
  view.setUint16(p, bitsPerSample, true); p += 2;

  // data chunk
  ascii('data');
  view.setUint32(p, dataSize, true); p += 4;

  // PCM bytes
  new Uint8Array(buffer, headerSize).set(pcmU8);

  return new Uint8Array(buffer);
}

export function exportPTWavV2(
  inputFloatMono: Float32Array,
  opts: PTWavExportOptions
): { bytes: Uint8Array; filename: string; blob?: Blob } {
  const {
    srcSampleRate,
    targetSampleRate = 22168,
    presetName = 'ModularPerc',
    returnBlob = true
  } = opts;

  if (inputFloatMono.length === 0) {
    throw new Error('Empty buffer');
  }

  // Conditioning with enhanced normalization
  const dcFixed = removeDC(inputFloatMono);
  
  // Apply intelligent normalization for better quality
  const normalizeResult = normalizeMonoBuffer(dcFixed, {
    targetRmsDBFS: -12, // Slightly louder for PT samples
    limiterThresholdDBFS: -0.5,
    maxGainDB: 20
  });

  // Resample to PT note F-3 target rate
  const resampled = linearResampleMono(dcFixed, srcSampleRate, targetSampleRate);

  // Gentle end fade if needed (avoid clicks)
  const fadeMs = 0.01 * 1000; // 10 ms
  const fadeSamples = Math.min(resampled.length, Math.floor(targetSampleRate * 0.01));
  for (let i = 0; i < fadeSamples; i++) {
    const k = i / fadeSamples;
    // no start fade; just end fade
    const idx = resampled.length - 1 - i;
    resampled[idx] *= (1 - k);
  }

  // Dither + Quantize to 8-bit unsigned
  const pcmU8 = applyDitherThenQuantize(resampled, 8);

  // Write WAV
  const wav = writeWavU8Mono(pcmU8, targetSampleRate);

  const filename = `${presetName}_PT-F-3_22168Hz.wav`;

  if (returnBlob && typeof Blob !== 'undefined') {
    const blob = new Blob([wav], { type: 'audio/wav' });
    return { bytes: wav, filename, blob };
  }
  return { bytes: wav, filename };
}

// Standard 16-bit WAV Export (44.1kHz) with enhanced processing
export function exportStandardWav(
  inputFloatMono: Float32Array,
  opts: {
    srcSampleRate: number;
    targetSampleRate?: number;
    presetName?: string;
    returnBlob?: boolean;
  }
): { buffer: ArrayBuffer; filename: string; blob?: Blob; normalizeStats?: any } {
  const {
    srcSampleRate,
    targetSampleRate = 44100,
    presetName = 'ModularPerc',
    returnBlob = true
  } = opts;

  if (inputFloatMono.length === 0) {
    throw new Error('Empty buffer');
  }

  // Enhanced conditioning pipeline
  let processed = removeDC(inputFloatMono);
  
  // Apply intelligent normalization
  const normalizeStats = normalizeMonoBuffer(processed, {
    targetRmsDBFS: -14,
    limiterThresholdDBFS: -1,
    maxGainDB: 24
  });

  // Resample if needed
  if (srcSampleRate !== targetSampleRate) {
    processed = linearResampleMono(processed, srcSampleRate, targetSampleRate);
  }

  // Convert to 16-bit with TPDF dithering
  const int16Data = floatTo16BitPCMWithTPDF(processed);

  // Encode to WAV
  const buffer = encodeWavMono16(int16Data, targetSampleRate);

  const filename = `${presetName}_16bit_${targetSampleRate}Hz.wav`;

  if (returnBlob && typeof Blob !== 'undefined') {
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return { buffer, filename, blob, normalizeStats };
  }
  return { buffer, filename, normalizeStats };
}

// Validation functions
export function validatePTWavExport(bytes: Uint8Array): {
  valid: boolean;
  errors: string[];
  stats: {
    sampleRate?: number;
    channels?: number;
    bitsPerSample?: number;
    duration?: number;
    peakClipping?: number;
  };
} {
  const errors: string[] = [];
  const stats: any = {};

  try {
    const view = new DataView(bytes.buffer);
    
    // Check RIFF header
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (riff !== 'RIFF') errors.push('Invalid RIFF header');

    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
    if (wave !== 'WAVE') errors.push('Invalid WAVE header');

    // Check fmt chunk
    const fmtId = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15));
    if (fmtId !== 'fmt ') errors.push('Invalid fmt chunk');

    const audioFormat = view.getUint16(20, true);
    if (audioFormat !== 1) errors.push('Not PCM format');

    const channels = view.getUint16(22, true);
    stats.channels = channels;
    if (channels !== 1) errors.push('Not mono');

    const sampleRate = view.getUint32(24, true);
    stats.sampleRate = sampleRate;
    if (sampleRate !== 22168) errors.push('Not 22168 Hz');

    const bitsPerSample = view.getUint16(34, true);
    stats.bitsPerSample = bitsPerSample;
    if (bitsPerSample !== 8) errors.push('Not 8-bit');

    // Check data chunk
    const dataId = String.fromCharCode(view.getUint8(36), view.getUint8(37), view.getUint8(38), view.getUint8(39));
    if (dataId !== 'data') errors.push('Invalid data chunk');

    const dataSize = view.getUint32(40, true);
    stats.duration = dataSize / sampleRate;
    
    if (stats.duration < 0.005) errors.push('Duration < 5ms');
    if (stats.duration > 10) errors.push('Duration > 10s');

    // Check for clipping
    const pcmData = new Uint8Array(bytes.buffer, 44, dataSize);
    let clippedSamples = 0;
    for (let i = 0; i < pcmData.length; i++) {
      if (pcmData[i] === 0 || pcmData[i] === 255) clippedSamples++;
    }
    stats.peakClipping = clippedSamples / pcmData.length;
    if (stats.peakClipping > 0.01) errors.push('Peak clipping > 1%');

  } catch (e) {
    errors.push(`Validation error: ${e}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    stats
  };
}