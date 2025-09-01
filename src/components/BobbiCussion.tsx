import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PresetBrowser } from './PresetBrowser';
import { TweakPanel } from './TweakPanel';
import { WaveformVisualizer } from './WaveformVisualizer';
import { TriggerButton } from './TriggerButton';
import { Switch } from './ui/switch';
import { generateModularSound } from './ModularSynthEngine';
import { 
  exportPTWavV2, 
  exportStandardWav, 
  validatePTWavExport,
  linearResampleMono,
  applyDitherThenQuantize,
  writeWavU8Mono
} from '../lib/ptWavExport';
import { normalizeMonoBuffer, floatTo16BitPCMWithTPDF } from '../lib/audio-normalize';
import { encodeWavMono16 } from '../lib/wav-encode';
import { useToast } from '../hooks/use-toast';

// Preset definitions
export interface Preset {
  id: string;
  name: string;
  category: 'drums' | 'sounds' | 'textures' | 'chaos' | 'physical';
  description: string;
  parameters: SynthParams;
}

// Enhanced modular sound engine parameters
export interface SynthParams {
  // Basic parameters (always visible)
  envelopeShape: number;
  noiseLayer: number;
  fmAmount: number;
  resonance: number;
  driveColor: number;
  crossMod: number;
  ringMod: number;
  lfoRate: number;
  
  // Advanced parameters
  waveMorph: number;
  feedback: number;
  filterRoute: number;
  sampleHold: number;
  chaosLevel: number;
  reverbAmount: number;
  reverbSize: number;
  delayTime: number;
  delayFeedback: number;
  
  // Experimental parameters (only in experimental mode)
  grainSize: number;
  grainDensity: number;
  grainPitch: number;
  grainPosition: number;
  matrixDepth: number;
  voltageDrift: number;
  cvSequencer: number;
  modWheel: number;
  bitCrusher: number;
  freqShifter: number;
  formantFilter: number;
  waveshaperDrive: number;
}

const defaultParams: SynthParams = {
  // Basic parameters
  envelopeShape: 0.3,
  noiseLayer: 0.2,
  fmAmount: 0.4,
  resonance: 0.5,
  driveColor: 0.3,
  crossMod: 0.2,
  ringMod: 0.1,
  lfoRate: 0.3,
  
  // Advanced parameters
  waveMorph: 0.5,
  feedback: 0.1,
  filterRoute: 0.4,
  sampleHold: 0.2,
  chaosLevel: 0.1,
  reverbAmount: 0.2,
  reverbSize: 0.5,
  delayTime: 0.3,
  delayFeedback: 0.4,
  
  // Experimental parameters
  grainSize: 0.3,
  grainDensity: 0.4,
  grainPitch: 0.5,
  grainPosition: 0.5,
  matrixDepth: 0.2,
  voltageDrift: 0.1,
  cvSequencer: 0.3,
  modWheel: 0.5,
  bitCrusher: 0.0,
  freqShifter: 0.0,
  formantFilter: 0.5,
  waveshaperDrive: 0.3,
};

// Enhanced modular presets with experimental parameters
const DEMO_PRESETS: Preset[] = [
  {
    id: 'kick-1',
    name: 'Deep Analog Kick',
    category: 'drums',
    description: 'Punchy 808-style kick with warm analog drive',
    parameters: { 
      envelopeShape: 0.8, noiseLayer: 0.1, fmAmount: 0.6, resonance: 0.3, driveColor: 0.7,
      crossMod: 0.3, ringMod: 0.1, lfoRate: 0.2, waveMorph: 0.3, feedback: 0.2, 
      filterRoute: 0.4, sampleHold: 0.1, chaosLevel: 0.1,
      reverbAmount: 0.1, reverbSize: 0.3, delayTime: 0.0, delayFeedback: 0.1,
      grainSize: 0.2, grainDensity: 0.3, grainPitch: 0.5, grainPosition: 0.4,
      matrixDepth: 0.1, voltageDrift: 0.05, cvSequencer: 0.2, modWheel: 0.3,
      bitCrusher: 0.0, freqShifter: 0.0, formantFilter: 0.4, waveshaperDrive: 0.2
    }
  },
  {
    id: 'snare-1',
    name: 'Crispy Digital Snare',
    category: 'drums',
    description: 'Sharp attack with metallic noise burst',
    parameters: { 
      envelopeShape: 0.2, noiseLayer: 0.8, fmAmount: 0.3, resonance: 0.7, driveColor: 0.4,
      crossMod: 0.5, ringMod: 0.6, lfoRate: 0.7, waveMorph: 0.8, feedback: 0.3,
      filterRoute: 0.6, sampleHold: 0.4, chaosLevel: 0.3,
      reverbAmount: 0.3, reverbSize: 0.4, delayTime: 0.2, delayFeedback: 0.3,
      grainSize: 0.1, grainDensity: 0.6, grainPitch: 0.7, grainPosition: 0.3,
      matrixDepth: 0.4, voltageDrift: 0.2, cvSequencer: 0.5, modWheel: 0.6,
      bitCrusher: 0.2, freqShifter: 0.1, formantFilter: 0.8, waveshaperDrive: 0.4
    }
  },
  {
    id: 'hihat-1',
    name: 'Sizzling Hi-Hat',
    category: 'drums',
    description: 'Bright metallic texture with quick decay',
    parameters: { 
      envelopeShape: 0.1, noiseLayer: 0.9, fmAmount: 0.2, resonance: 0.8, driveColor: 0.2,
      crossMod: 0.2, ringMod: 0.9, lfoRate: 0.9, waveMorph: 0.7, feedback: 0.1,
      filterRoute: 0.8, sampleHold: 0.8, chaosLevel: 0.2,
      reverbAmount: 0.4, reverbSize: 0.6, delayTime: 0.1, delayFeedback: 0.2,
      grainSize: 0.05, grainDensity: 0.9, grainPitch: 0.8, grainPosition: 0.9,
      matrixDepth: 0.3, voltageDrift: 0.4, cvSequencer: 0.8, modWheel: 0.7,
      bitCrusher: 0.3, freqShifter: 0.2, formantFilter: 0.9, waveshaperDrive: 0.1
    }
  },
  {
    id: 'fm-blip-1',
    name: 'Snappy FM Tick',
    category: 'sounds',
    description: 'Percussive chirp with sizzling tail',
    parameters: { 
      envelopeShape: 0.15, noiseLayer: 0.3, fmAmount: 0.9, resonance: 0.6, driveColor: 0.5,
      crossMod: 0.8, ringMod: 0.4, lfoRate: 0.6, waveMorph: 0.9, feedback: 0.4,
      filterRoute: 0.3, sampleHold: 0.6, chaosLevel: 0.5,
      reverbAmount: 0.2, reverbSize: 0.7, delayTime: 0.4, delayFeedback: 0.5,
      grainSize: 0.3, grainDensity: 0.4, grainPitch: 0.9, grainPosition: 0.2,
      matrixDepth: 0.7, voltageDrift: 0.1, cvSequencer: 0.3, modWheel: 0.8,
      bitCrusher: 0.1, freqShifter: 0.3, formantFilter: 0.6, waveshaperDrive: 0.6
    }
  },
  {
    id: 'metal-hit-1',
    name: 'Industrial Clank',
    category: 'sounds',
    description: 'Heavy metallic impact with resonant ring',
    parameters: { 
      envelopeShape: 0.4, noiseLayer: 0.7, fmAmount: 0.5, resonance: 0.9, driveColor: 0.8,
      crossMod: 0.7, ringMod: 0.8, lfoRate: 0.3, waveMorph: 0.4, feedback: 0.9,
      filterRoute: 0.9, sampleHold: 0.3, chaosLevel: 0.8,
      reverbAmount: 0.5, reverbSize: 0.8, delayTime: 0.3, delayFeedback: 0.4,
      grainSize: 0.4, grainDensity: 0.2, grainPitch: 0.3, grainPosition: 0.6,
      matrixDepth: 0.8, voltageDrift: 0.3, cvSequencer: 0.2, modWheel: 0.4,
      bitCrusher: 0.4, freqShifter: 0.5, formantFilter: 0.3, waveshaperDrive: 0.8
    }
  },
  {
    id: 'noise-burst-1',
    name: 'Filtered Noise Pop',
    category: 'sounds',
    description: 'Explosive texture with analog warmth',
    parameters: { 
      envelopeShape: 0.25, noiseLayer: 0.95, fmAmount: 0.1, resonance: 0.4, driveColor: 0.6,
      crossMod: 0.1, ringMod: 0.2, lfoRate: 0.8, waveMorph: 0.2, feedback: 0.5,
      filterRoute: 0.2, sampleHold: 0.9, chaosLevel: 0.4,
      reverbAmount: 0.3, reverbSize: 0.5, delayTime: 0.2, delayFeedback: 0.3,
      grainSize: 0.6, grainDensity: 0.8, grainPitch: 0.2, grainPosition: 0.8,
      matrixDepth: 0.2, voltageDrift: 0.6, cvSequencer: 0.9, modWheel: 0.2,
      bitCrusher: 0.5, freqShifter: 0.0, formantFilter: 0.2, waveshaperDrive: 0.3
    }
  },
  // New experimental presets
  {
    id: 'granular-texture-1',
    name: 'Granular Cloud',
    category: 'textures',
    description: 'Atmospheric granular synthesis with evolving textures',
    parameters: {
      envelopeShape: 0.6, noiseLayer: 0.4, fmAmount: 0.2, resonance: 0.5, driveColor: 0.3,
      crossMod: 0.3, ringMod: 0.1, lfoRate: 0.2, waveMorph: 0.6, feedback: 0.3,
      filterRoute: 0.4, sampleHold: 0.2, chaosLevel: 0.2,
      reverbAmount: 0.6, reverbSize: 0.8, delayTime: 0.5, delayFeedback: 0.4,
      grainSize: 0.8, grainDensity: 0.9, grainPitch: 0.6, grainPosition: 0.7,
      matrixDepth: 0.5, voltageDrift: 0.3, cvSequencer: 0.4, modWheel: 0.7,
      bitCrusher: 0.0, freqShifter: 0.2, formantFilter: 0.6, waveshaperDrive: 0.2
    }
  },
  {
    id: 'chaos-generator-1',
    name: 'Digital Chaos',
    category: 'chaos',
    description: 'Unpredictable digital noise with extreme processing',
    parameters: {
      envelopeShape: 0.3, noiseLayer: 0.8, fmAmount: 0.7, resonance: 0.6, driveColor: 0.9,
      crossMod: 0.9, ringMod: 0.7, lfoRate: 0.8, waveMorph: 0.9, feedback: 0.6,
      filterRoute: 0.7, sampleHold: 0.9, chaosLevel: 0.9,
      reverbAmount: 0.4, reverbSize: 0.6, delayTime: 0.3, delayFeedback: 0.7,
      grainSize: 0.2, grainDensity: 0.7, grainPitch: 0.9, grainPosition: 0.4,
      matrixDepth: 0.9, voltageDrift: 0.8, cvSequencer: 0.8, modWheel: 0.9,
      bitCrusher: 0.8, freqShifter: 0.6, formantFilter: 0.4, waveshaperDrive: 0.9
    }
  }
];

export const BobbiCussion: React.FC = () => {
  console.log('BobbiCussion component starting...');
  
  const [selectedPreset, setSelectedPreset] = useState<Preset>(DEMO_PRESETS[0]);
  const [synthParams, setSynthParams] = useState<SynthParams>(() => {
    // Initialize with default experimental parameters
    return { ...DEMO_PRESETS[0].parameters, ...defaultParams };
  });
  const [experimentalMode, setExperimentalMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sampleLength, setSampleLength] = useState(22050);
  const audioContextRef = useRef<AudioContext | null>(null);
  const waveformRef = useRef<number[]>([]);
  
  const { toast } = useToast();

  // Initialize Web Audio Context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Advanced modular sound synthesis engine
  const generateSound = useCallback(async () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Use the advanced modular synthesis engine
    const durationMs = generateModularSound(ctx, synthParams, selectedPreset);
    
    // Generate complex waveform visualization
    const waveformData = [];
    for (let i = 0; i < 64; i++) {
      const t = i / 64;
      
      // Multiple mathematical wave sources
      const fundamental = Math.sin(t * Math.PI * 12);
      const crossMod = Math.sin(t * Math.PI * 12 * (1 + synthParams.crossMod));
      const ringMod = Math.sin(t * Math.PI * 8) * Math.sin(t * Math.PI * 20) * synthParams.ringMod;
      const lfoMod = Math.sin(t * Math.PI * synthParams.lfoRate * 4) * 0.3;
      const chaos = Math.tan(t * Math.PI * synthParams.chaosLevel * 6) * synthParams.chaosLevel * 0.2;
      
      // Sample & hold stepping
      const sampleHoldSteps = Math.floor(t * (8 + synthParams.sampleHold * 24));
      const sampleHold = (Math.sin(sampleHoldSteps) * synthParams.sampleHold * 0.2);
      
      // Mathematical envelope with feedback
      const envelope = t < 0.08 ? Math.pow(t * 12.5, 1.5) : Math.exp(-(t - 0.08) * (6 + synthParams.feedback * 4));
      
      // Combine all sources with complex mathematical relationships
      const combined = (fundamental + crossMod + ringMod + lfoMod + chaos + sampleHold) * envelope;
      const shaped = Math.tanh(combined * (1 + synthParams.driveColor * 2));
      
      waveformData.push(Math.abs(shaped) * (0.8 + Math.random() * 0.2));
    }
    waveformRef.current = waveformData;
    
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), durationMs);
  }, [synthParams, selectedPreset]);

  const handlePresetSelect = useCallback((preset: Preset) => {
    setSelectedPreset(preset);
    setSynthParams(preset.parameters);
  }, []);

  const handleParamChange = useCallback((param: keyof SynthParams, value: number) => {
    setSynthParams(prev => ({ ...prev, [param]: value }));
  }, []);

  const handleTrigger = useCallback(() => {
    generateSound();
  }, [generateSound]);

  // PT-WAV Export functionality - Render & Conditioning Pipeline
  const renderAudioToBuffer = useCallback(async (currentSynthParams: SynthParams, preset: Preset, customSampleLength?: number): Promise<Float32Array> => {
    if (!audioContextRef.current) throw new Error('AudioContext not available');
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Use custom sample length if provided, otherwise use duration-based calculation
    const sampleRate = ctx.sampleRate;
    const bufferLength = customSampleLength || Math.floor((Math.max(0.2, 0.1 + (currentSynthParams.envelopeShape * 0.8))) * sampleRate);
    
    const offlineCtx = new OfflineAudioContext(1, bufferLength, sampleRate);
    
    // Generate sound in offline context with current modified parameters
    // The offline context requires immediate parameter scheduling
    const actualDuration = generateModularSound(offlineCtx, currentSynthParams, preset);
    
    // Ensure offline context processes all scheduled events
    const renderedBuffer = await offlineCtx.startRendering();
    
    // Return the rendered audio data - offline context captures all modular functions
    return renderedBuffer.getChannelData(0); // Get mono channel
  }, []);

  // Enhanced WAV Export using integrated audio utilities
  const exportWav = useCallback(async (currentSynthParams: SynthParams, preset: Preset, opts: { 
    filename?: string; 
    targetRmsDBFS?: number;
    format?: 'standard' | 'pt-wav';
    customSampleLength?: number;
  } = {}): Promise<any> => {
    if (!audioContextRef.current) {
      throw new Error("Audio engine not ready");
    }
    
    setIsExporting(true);
    
    try {
      // 1) Render to buffer with current modified parameters
      const render = await renderAudioToBuffer(currentSynthParams, preset, opts.customSampleLength);

      // 2) Normalize in place
      const info = normalizeMonoBuffer(render, { 
        targetRmsDBFS: opts.targetRmsDBFS || -14,
        limiterThresholdDBFS: -1,
        maxGainDB: 24
      });

      let wav: ArrayBuffer;
      let filename: string;

      if (opts.format === 'pt-wav') {
        // PT-WAV Export (8-bit, 22.168kHz)
        const resampled = linearResampleMono(render, audioContextRef.current.sampleRate, 22168);
        const pcmU8 = applyDitherThenQuantize(resampled, 8);
        wav = writeWavU8Mono(pcmU8, 22168).buffer;
        filename = opts.filename || `${preset.name.replace(/[^a-zA-Z0-9]/g, '')}_PT-F-3_22168Hz.wav`;
      } else {
        // Standard 16-bit WAV Export - use proper sample rate from context
        const pcm16 = floatTo16BitPCMWithTPDF(render);
        wav = encodeWavMono16(pcm16, audioContextRef.current.sampleRate);
        filename = opts.filename || `BobbiCussion_${preset.name.replace(/[^a-zA-Z0-9]/g, '')}_44k.wav`;
      }

      // 4) Trigger file download
      const blob = new Blob([wav], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      // Show success toast
      const gainInfo = info.applied ? ` (Gain: ${info.gain.toFixed(1)}x)` : '';
      toast({
        title: opts.format === 'pt-wav' ? "PT-WAV Export Complete" : "WAV Export Complete",
        description: `Exported ${filename}${gainInfo}`,
      });

      return { ...info, durationSec: render.length / audioContextRef.current.sampleRate };
      
    } catch (error) {
      console.error('WAV Export failed:', error);
      toast({
        title: "Export Failed", 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [toast]);

  // Smart Randomization with Conservative Limits - Avoid "overbursting madness"
  const handleRandomizePreset = useCallback((preset: Preset) => {
    const random = (min: number, max: number) => min + Math.random() * (max - min);
    
      // More conservative ranges to prevent unstable sounds - now includes effects
      const ranges = preset.category === 'drums' ? {
        // DRUMS: Keep tight control for musical results
        envelopeShape: [0.2, 0.5],    // Medium punch, not too long
        noiseLayer: [0.1, 0.7],       // Controlled noise levels
        fmAmount: [0.1, 0.6],         // Moderate FM to avoid harsh chirps
        resonance: [0.2, 0.7],        // Prevent screaming resonance
        driveColor: [0.1, 0.6],       // Controlled saturation
        crossMod: [0.1, 0.5],         // Subtle cross-modulation
        ringMod: [0.0, 0.5],          // Conservative ring mod
        lfoRate: [0.1, 0.4],          // Slower, more musical LFO
        waveMorph: [0.3, 0.7],        // Mid-range wave morphing
        feedback: [0.0, 0.4],         // Low feedback to prevent instability
        filterRoute: [0.2, 0.6],      // Moderate filter routing
        sampleHold: [0.1, 0.6],       // Controlled S&H effects
        chaosLevel: [0.0, 0.3],       // Very conservative chaos
        // Effects for drums - subtle
        reverbAmount: [0.0, 0.4],     // Light reverb for drums
        reverbSize: [0.2, 0.6],       // Small to medium rooms
        delayTime: [0.0, 0.3],        // Short delays
        delayFeedback: [0.0, 0.4],    // Conservative feedback
      } : {
        // SOUNDS: More experimental but still controlled
        envelopeShape: [0.2, 0.8],    // Wider sustain range
        noiseLayer: [0.0, 0.6],       // Can be clean or moderately noisy
        fmAmount: [0.0, 0.7],         // More FM range but not extreme
        resonance: [0.1, 0.8],        // Higher resonance but not screaming
        driveColor: [0.0, 0.7],       // More saturation range
        crossMod: [0.0, 0.6],         // Moderate cross-mod
        ringMod: [0.0, 0.6],          // Controlled ring mod
        lfoRate: [0.0, 0.6],          // Wider LFO range
        waveMorph: [0.1, 0.9],        // More wave morphing
        feedback: [0.0, 0.5],         // Still conservative feedback
        filterRoute: [0.0, 0.8],      // More filter routing
        sampleHold: [0.0, 0.7],       // More S&H variety
        chaosLevel: [0.0, 0.4],       // Conservative chaos limit
        // Effects for sounds - more experimental
        reverbAmount: [0.0, 0.7],     // More reverb range
        reverbSize: [0.3, 0.9],       // Larger spaces
        delayTime: [0.0, 0.6],        // Longer delays
        delayFeedback: [0.0, 0.6],    // More feedback
      };

    // Apply stronger bias toward original character (60% new, 40% original)
    const originalParams = preset.parameters;
    const randomizedParams: SynthParams = {} as SynthParams;

    Object.keys(ranges).forEach(key => {
      const paramKey = key as keyof SynthParams;
      const [min, max] = ranges[paramKey];
      const original = originalParams[paramKey];
      
      // Stronger bias toward original + safety clamping
      const baseRandom = random(min, max);
      const biasedValue = baseRandom * 0.6 + original * 0.4;
      
      randomizedParams[paramKey] = Math.max(0, Math.min(1, biasedValue));
    });

    // Safety interdependencies to prevent unstable combinations
    
    // If high resonance, reduce feedback to prevent runaway
    if (randomizedParams.resonance > 0.6) {
      randomizedParams.feedback = Math.min(randomizedParams.feedback, 0.3);
    }
    
    // If high feedback, reduce chaos and resonance
    if (randomizedParams.feedback > 0.4) {
      randomizedParams.chaosLevel = Math.min(randomizedParams.chaosLevel, 0.2);
      randomizedParams.resonance = Math.min(randomizedParams.resonance, 0.6);
    }
    
    // If high chaos, reduce other extreme parameters
    if (randomizedParams.chaosLevel > 0.3) {
      randomizedParams.feedback = Math.min(randomizedParams.feedback, 0.2);
      randomizedParams.ringMod = Math.min(randomizedParams.ringMod, 0.4);
      randomizedParams.fmAmount = Math.min(randomizedParams.fmAmount, 0.5);
    }
    
    // If high FM, reduce ring mod to prevent harshness
    if (randomizedParams.fmAmount > 0.6) {
      randomizedParams.ringMod = Math.min(randomizedParams.ringMod, 0.3);
      randomizedParams.chaosLevel = Math.min(randomizedParams.chaosLevel, 0.2);
    }

    // Preset-specific safety rules
    if (preset.id.includes('kick')) {
      // Kicks need controlled low-end
      randomizedParams.fmAmount = Math.min(randomizedParams.fmAmount, 0.4);
      randomizedParams.envelopeShape = Math.max(randomizedParams.envelopeShape, 0.3);
      randomizedParams.chaosLevel = Math.min(randomizedParams.chaosLevel, 0.2);
    }
    
    if (preset.id.includes('hihat')) {
      // Hi-hats need brightness but control
      randomizedParams.noiseLayer = Math.max(randomizedParams.noiseLayer, 0.4);
      randomizedParams.envelopeShape = Math.min(randomizedParams.envelopeShape, 0.4);
      randomizedParams.feedback = Math.min(randomizedParams.feedback, 0.3);
    }
    
    if (preset.id.includes('snare')) {
      // Snares need punch but not chaos
      randomizedParams.chaosLevel = Math.min(randomizedParams.chaosLevel, 0.3);
      randomizedParams.feedback = Math.min(randomizedParams.feedback, 0.4);
    }

    // Apply the controlled randomization
    setSynthParams(randomizedParams);
    
    // Auto-trigger to hear the result
    setTimeout(() => {
      generateSound();
    }, 100);

    toast({
      title: "Parameters Randomized",
      description: `Applied controlled variations to ${preset.name}`,
    });
  }, [generateSound, toast]);

  // Export handlers that use current modified parameters
  const handleExportStandardWav = useCallback(async () => {
    return exportWav(synthParams, selectedPreset, { format: 'standard', targetRmsDBFS: -14, customSampleLength: sampleLength });
  }, [exportWav, synthParams, selectedPreset, sampleLength]);

  const handleExportPTWav = useCallback(async () => {
    return exportWav(synthParams, selectedPreset, { format: 'pt-wav', targetRmsDBFS: -14, customSampleLength: sampleLength });
  }, [exportWav, synthParams, selectedPreset, sampleLength]);

  // AI Sound Design Logic
  const handleAiGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple keyword matching to find closest preset and adjust parameters
    const prompt = aiPrompt.toLowerCase();
    let bestPreset = DEMO_PRESETS[0];
    let paramAdjustments: Partial<SynthParams> = {};
    
    // Find best matching preset based on keywords
    if (prompt.includes('kick') || prompt.includes('bass') || prompt.includes('low')) {
      bestPreset = DEMO_PRESETS.find(p => p.id === 'kick-1') || DEMO_PRESETS[0];
    } else if (prompt.includes('snare') || prompt.includes('crack') || prompt.includes('snap')) {
      bestPreset = DEMO_PRESETS.find(p => p.id === 'snare-1') || DEMO_PRESETS[1];
    } else if (prompt.includes('hihat') || prompt.includes('hi-hat') || prompt.includes('sizzle')) {
      bestPreset = DEMO_PRESETS.find(p => p.id === 'hihat-1') || DEMO_PRESETS[2];
    } else if (prompt.includes('fm') || prompt.includes('tick') || prompt.includes('chirp')) {
      bestPreset = DEMO_PRESETS.find(p => p.id === 'fm-blip-1') || DEMO_PRESETS[3];
    } else if (prompt.includes('metal') || prompt.includes('clank') || prompt.includes('industrial')) {
      bestPreset = DEMO_PRESETS.find(p => p.id === 'metal-hit-1') || DEMO_PRESETS[4];
    } else if (prompt.includes('noise') || prompt.includes('burst') || prompt.includes('texture')) {
      bestPreset = DEMO_PRESETS.find(p => p.id === 'noise-burst-1') || DEMO_PRESETS[5];
    }
    
    // Adjust parameters based on descriptive words
    paramAdjustments = { ...bestPreset.parameters };
    
    if (prompt.includes('long') || prompt.includes('sustained')) {
      paramAdjustments.envelopeShape = Math.min(1, (paramAdjustments.envelopeShape || 0.5) + 0.3);
    }
    if (prompt.includes('short') || prompt.includes('quick') || prompt.includes('snappy')) {
      paramAdjustments.envelopeShape = Math.max(0, (paramAdjustments.envelopeShape || 0.5) - 0.3);
    }
    
    if (prompt.includes('dirty') || prompt.includes('gritty') || prompt.includes('distorted')) {
      paramAdjustments.noiseLayer = Math.min(1, (paramAdjustments.noiseLayer || 0.5) + 0.4);
      paramAdjustments.driveColor = Math.min(1, (paramAdjustments.driveColor || 0.5) + 0.3);
    }
    if (prompt.includes('clean') || prompt.includes('pure') || prompt.includes('smooth')) {
      paramAdjustments.noiseLayer = Math.max(0, (paramAdjustments.noiseLayer || 0.5) - 0.3);
      paramAdjustments.driveColor = Math.max(0, (paramAdjustments.driveColor || 0.5) - 0.2);
    }
    
    if (prompt.includes('harsh') || prompt.includes('aggressive') || prompt.includes('digital')) {
      paramAdjustments.fmAmount = Math.min(1, (paramAdjustments.fmAmount || 0.5) + 0.4);
    }
    if (prompt.includes('subtle') || prompt.includes('soft') || prompt.includes('gentle')) {
      paramAdjustments.fmAmount = Math.max(0, (paramAdjustments.fmAmount || 0.5) - 0.3);
    }
    
    if (prompt.includes('resonant') || prompt.includes('ring') || prompt.includes('sharp')) {
      paramAdjustments.resonance = Math.min(1, (paramAdjustments.resonance || 0.5) + 0.4);
    }
    if (prompt.includes('dull') || prompt.includes('muffled') || prompt.includes('soft')) {
      paramAdjustments.resonance = Math.max(0, (paramAdjustments.resonance || 0.5) - 0.3);
    }
    
    if (prompt.includes('warm') || prompt.includes('vintage') || prompt.includes('analog')) {
      paramAdjustments.driveColor = Math.min(1, (paramAdjustments.driveColor || 0.5) + 0.2);
    }
    if (prompt.includes('crunchy') || prompt.includes('modern') || prompt.includes('hard')) {
      paramAdjustments.driveColor = Math.min(1, (paramAdjustments.driveColor || 0.5) + 0.4);
    }
    
    // Apply the changes
    setSelectedPreset(bestPreset);
    setSynthParams(paramAdjustments as SynthParams);
    setIsGenerating(false);
    setAiPrompt('');
    
    // Automatically trigger the new sound
    setTimeout(() => {
      generateSound();
    }, 200);
    
  }, [aiPrompt, generateSound]);

  const handleAiPromptKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAiGenerate();
    }
  }, [handleAiGenerate]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-primary tracking-wide">
                BobbiCussion
              </h1>
              <p className="text-muted-foreground text-lg">
                Modular Percussion Synthesizer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Synthesis Mode</div>
              <div className="flex items-center space-x-3">
                <span className={`text-sm ${!experimentalMode ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  Basic
                </span>
                <Switch
                  checked={experimentalMode}
                  onCheckedChange={setExperimentalMode}
                  className="data-[state=checked]:bg-primary"
                />
                <span className={`text-sm ${experimentalMode ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  Experimental
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preset Browser - Left */}
          <div className="rack-panel p-6">
            <PresetBrowser
              presets={DEMO_PRESETS}
              selectedPreset={selectedPreset}
              onSelectPreset={handlePresetSelect}
              onRandomizePreset={handleRandomizePreset}
            />
          </div>

          {/* Tweak Panel - Center */}
          <div className="rack-panel p-6">
            <TweakPanel
              parameters={synthParams}
              onParameterChange={handleParamChange}
              experimentalMode={experimentalMode}
            />
          </div>

          {/* Waveform, Trigger & AI - Right */}
          <div className="space-y-4">
            {/* Waveform */}
            <div className="rack-panel p-4">
              <WaveformVisualizer
                waveformData={waveformRef.current}
                isPlaying={isPlaying}
              />
            </div>
            
            {/* Trigger */}
            <div className="rack-panel p-4">
              <TriggerButton
                onTrigger={handleTrigger}
                isPlaying={isPlaying}
                presetName={selectedPreset.name}
              />
            </div>

            {/* Export Controls - NEW SECTION */}
            <div className="rack-panel p-4">
              <h3 className="text-sm font-semibold text-neon-cyan mb-3 flex items-center">
                <div className="w-2 h-2 bg-neon-cyan rounded-full mr-2"></div>
                Export Audio
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Sample Length (max 65534)
                  </label>
                  <input
                    type="number"
                    value={sampleLength}
                    onChange={(e) => setSampleLength(Math.min(65534, Math.max(1, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="65534"
                    className="w-full bg-input text-foreground px-3 py-2 rounded border border-border focus:border-primary focus:outline-none text-sm"
                  />
                </div>
                <button
                  onClick={handleExportStandardWav}
                  disabled={isExporting}
                  className="w-full px-3 py-2 text-sm bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30 rounded hover:bg-neon-yellow/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export → Standard WAV (16-bit @ 44.1 kHz) - Uses current tweaked parameters"
                >
                  {isExporting ? 'Exporting...' : 'Standard WAV'}
                </button>
                <button
                  onClick={handleExportPTWav}
                  disabled={isExporting}
                  className="w-full px-3 py-2 text-sm bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30 rounded hover:bg-neon-magenta/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export → PT-WAV (8-bit @ 22.168 kHz) - Uses current tweaked parameters"
                >
                  {isExporting ? 'Exporting...' : 'PT-WAV'}
                </button>
                <p className="text-xs text-muted-foreground">
                  Exports use your current tweaked parameters
                </p>
              </div>
            </div>

            {/* AI Sound Design */}
            <div className="rack-panel p-4">
              <h3 className="text-sm font-semibold text-neon-cyan mb-3 flex items-center">
                <div className="w-2 h-2 bg-neon-cyan rounded-full mr-2"></div>
                AI Sound Design
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={handleAiPromptKeyDown}
                  placeholder="'resonant industrial snare'"
                  className="w-full bg-input text-foreground px-3 py-2 rounded border border-border focus:border-primary focus:outline-none text-sm"
                  disabled={isGenerating}
                />
                <button 
                  onClick={handleAiGenerate}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
                <p className="text-xs text-muted-foreground">
                  Describe your sound for AI preset matching
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BobbiCussion;