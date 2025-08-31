// src/lib/audio-normalize.ts
export const dBToLinear = (db: number) => Math.pow(10, db / 20);
export const linearToDB = (lin: number) => 20 * Math.log10(Math.max(lin, 1e-12));

export function getAbsPeak(buf: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = Math.abs(buf[i]);
    if (v > peak) peak = v;
  }
  return peak;
}

export function getRms(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    sum += buf[i] * buf[i];
  }
  return Math.sqrt(sum / buf.length);
}

export function applyGainInPlace(buf: Float32Array, gain: number) {
  for (let i = 0; i < buf.length; i++) {
    let v = buf[i] * gain;
    // Safety clip
    if (v > 1) v = 1;
    else if (v < -1) v = -1;
    buf[i] = v;
  }
}

/**
 * Simple TPDF dithering to 16-bit PCM.
 * Converts float [-1,1] to Int16 with triangular noise.
 */
export function floatTo16BitPCMWithTPDF(buffer: Float32Array): Int16Array {
  const out = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    // TPDF: sum of two uniform noises in [-0.5,0.5]
    const r1 = Math.random() - 0.5;
    const r2 = Math.random() - 0.5;
    const dither = (r1 + r2) * (1 / 32768); // scale around 1 LSB
    let s = buffer[i] + dither;

    // clip float to [-1,1]
    if (s > 1) s = 1;
    else if (s < -1) s = -1;

    out[i] = s < 0 ? s * 32768 : s * 32767;
  }
  return out;
}

/**
 * Normalizes a mono buffer in place to target dBFS if not silent.
 * This version uses a more intelligent RMS-based approach with a limiter.
 */
export function normalizeMonoBuffer(
  mono: Float32Array,
  {
    targetRmsDBFS = -14, // A common target for perceived loudness
    limiterThresholdDBFS = -1, // The ceiling the audio won't exceed
    silenceThreshold = 1e-6,
    maxGainDB = 24
  }: { targetRmsDBFS?: number; limiterThresholdDBFS?: number; silenceThreshold?: number; maxGainDB?: number } = {}
) {
  const peakBefore = getAbsPeak(mono);
  if (peakBefore < silenceThreshold) {
    return { applied: false, peakBefore, peakAfter: peakBefore, gain: 1 };
  }

  // 1. Calculate RMS and needed gain
  const rms = getRms(mono);
  const targetRmsLin = dBToLinear(targetRmsDBFS);
  const neededGain = targetRmsLin / (rms || 1e-12);
  
  const maxGainLin = dBToLinear(maxGainDB);
  const gain = Math.min(neededGain, maxGainLin);
  
  // 2. Apply gain and a simple limiter
  const limiterThresholdLin = dBToLinear(limiterThresholdDBFS);
  for (let i = 0; i < mono.length; i++) {
    let val = mono[i] * gain;
    if (Math.abs(val) > limiterThresholdLin) {
        val = Math.sign(val) * limiterThresholdLin;
    }
    mono[i] = val;
  }

  const peakAfter = getAbsPeak(mono);
  return { applied: true, peakBefore, peakAfter, gain };
}