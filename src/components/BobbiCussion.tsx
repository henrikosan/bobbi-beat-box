import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PresetBrowser } from './PresetBrowser';
import { TweakPanel } from './TweakPanel';
import { WaveformVisualizer } from './WaveformVisualizer';
import { TriggerButton } from './TriggerButton';

// Preset definitions
export interface Preset {
  id: string;
  name: string;
  category: 'drums' | 'sounds';
  description: string;
  parameters: {
    envelopeShape: number;
    noiseLayer: number;
    fmAmount: number;
    resonance: number;
    driveColor: number;
  };
}

// Sound engine parameters
export interface SynthParams {
  envelopeShape: number;
  noiseLayer: number;
  fmAmount: number;
  resonance: number;
  driveColor: number;
}

const defaultParams: SynthParams = {
  envelopeShape: 0.3,
  noiseLayer: 0.2,
  fmAmount: 0.4,
  resonance: 0.5,
  driveColor: 0.3,
};

// Demo presets
const DEMO_PRESETS: Preset[] = [
  {
    id: 'kick-1',
    name: 'Deep Analog Kick',
    category: 'drums',
    description: 'Punchy 808-style kick with warm analog drive',
    parameters: { envelopeShape: 0.8, noiseLayer: 0.1, fmAmount: 0.6, resonance: 0.3, driveColor: 0.7 }
  },
  {
    id: 'snare-1',
    name: 'Crispy Digital Snare',
    category: 'drums',
    description: 'Sharp attack with metallic noise burst',
    parameters: { envelopeShape: 0.2, noiseLayer: 0.8, fmAmount: 0.3, resonance: 0.7, driveColor: 0.4 }
  },
  {
    id: 'hihat-1',
    name: 'Sizzling Hi-Hat',
    category: 'drums',
    description: 'Bright metallic texture with quick decay',
    parameters: { envelopeShape: 0.1, noiseLayer: 0.9, fmAmount: 0.2, resonance: 0.8, driveColor: 0.2 }
  },
  {
    id: 'fm-blip-1',
    name: 'Snappy FM Tick',
    category: 'sounds',
    description: 'Percussive chirp with sizzling tail',
    parameters: { envelopeShape: 0.15, noiseLayer: 0.3, fmAmount: 0.9, resonance: 0.6, driveColor: 0.5 }
  },
  {
    id: 'metal-hit-1',
    name: 'Industrial Clank',
    category: 'sounds',
    description: 'Heavy metallic impact with resonant ring',
    parameters: { envelopeShape: 0.4, noiseLayer: 0.7, fmAmount: 0.5, resonance: 0.9, driveColor: 0.8 }
  },
  {
    id: 'noise-burst-1',
    name: 'Filtered Noise Pop',
    category: 'sounds',
    description: 'Explosive texture with analog warmth',
    parameters: { envelopeShape: 0.25, noiseLayer: 0.95, fmAmount: 0.1, resonance: 0.4, driveColor: 0.6 }
  }
];

export const BobbiCussion: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<Preset>(DEMO_PRESETS[0]);
  const [synthParams, setSynthParams] = useState<SynthParams>(DEMO_PRESETS[0].parameters);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const waveformRef = useRef<number[]>([]);

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

  // Enhanced sound generation with mathematical operations
  const generateSound = useCallback(async () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const duration = 0.1 + (synthParams.envelopeShape * 0.4); // 0.1s to 0.5s
    
    // Mathematical frequency relationships
    let baseFreq = 60; // Kick frequency
    if (selectedPreset.category === 'sounds') {
      baseFreq = 200 + (synthParams.fmAmount * 800);
    }
    
    // Create multiple oscillators with mathematical relationships
    const oscillators = [];
    const gains = [];
    
    // Primary oscillator
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.frequency.setValueAtTime(baseFreq, now);
    oscillators.push(osc1);
    gains.push(gain1);
    
    // Mathematical harmonic - multiply by golden ratio for interesting intervals
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const harmonicFreq = baseFreq * 1.618; // Golden ratio
    osc2.frequency.setValueAtTime(harmonicFreq, now);
    oscillators.push(osc2);
    gains.push(gain2);
    
    // Subharmonic - divide by mathematical ratio
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    const subFreq = baseFreq / Math.PI; // Pi ratio for unique character
    osc3.frequency.setValueAtTime(subFreq, now);
    oscillators.push(osc3);
    gains.push(gain3);
    
    // Mathematical FM modulator
    const fmOsc = ctx.createOscillator();
    const fmGain = ctx.createGain();
    const fmFreq = baseFreq * (2 + synthParams.fmAmount * 8); // Modulator frequency
    fmOsc.frequency.setValueAtTime(fmFreq, now);
    fmGain.gain.setValueAtTime(synthParams.fmAmount * 100, now); // FM depth
    
    // Connect FM modulator to primary oscillator frequency
    fmOsc.connect(fmGain);
    fmGain.connect(osc1.frequency);
    
    // Enhanced noise with mathematical filtering
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    
    // Generate mathematically shaped noise
    for (let i = 0; i < noiseData.length; i++) {
      const t = i / noiseData.length;
      
      // Combine multiple noise sources with mathematical operations
      const whiteNoise = Math.random() * 2 - 1;
      const pinkNoise = Math.sin(t * Math.PI * 10) * (Math.random() * 2 - 1);
      const brownianNoise = Math.pow(Math.random(), 2) * 2 - 1;
      
      // Mathematical combination based on parameters
      const noiseMix = (
        whiteNoise * (1 - synthParams.noiseLayer * 0.5) +
        pinkNoise * (synthParams.noiseLayer * 0.3) +
        brownianNoise * (synthParams.noiseLayer * 0.2)
      );
      
      // Apply mathematical waveshaping
      const shaped = Math.tanh(noiseMix * (1 + synthParams.driveColor * 3));
      noiseData[i] = shaped * synthParams.noiseLayer;
    }
    
    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noiseSource.buffer = noiseBuffer;
    
    // Mathematical filter cascade
    const filter1 = ctx.createBiquadFilter();
    const filter2 = ctx.createBiquadFilter();
    
    filter1.type = 'lowpass';
    filter2.type = 'highpass';
    
    // Mathematical frequency relationships
    const cutoffFreq = 200 + (synthParams.resonance * 2000);
    const qFactor = 1 + (synthParams.resonance * 15);
    
    filter1.frequency.setValueAtTime(cutoffFreq, now);
    filter1.Q.setValueAtTime(qFactor, now);
    filter2.frequency.setValueAtTime(cutoffFreq * 0.1, now);
    filter2.Q.setValueAtTime(qFactor * 0.5, now);
    
    // Mathematical distortion/waveshaper
    const waveshaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    const driveAmount = synthParams.driveColor * 10;
    
    for (let i = 0; i < curve.length; i++) {
      const x = (i / 128) - 1;
      // Mathematical distortion curve using hyperbolic tangent
      curve[i] = Math.tanh(x * driveAmount) * (1 / Math.tanh(driveAmount));
    }
    waveshaper.curve = curve;
    waveshaper.oversample = '4x';
    
    // Master gain with mathematical envelope
    const masterGain = ctx.createGain();
    
    // Connect oscillators with mathematical mixing
    oscillators.forEach((osc, index) => {
      const gain = gains[index];
      
      // Mathematical amplitude relationships
      const amplitude = index === 0 ? 0.6 : 0.3 / (index + 1); // Decreasing harmonic series
      
      osc.connect(gain);
      gain.connect(filter1);
      
      // Set mathematical frequency modulation
      const freqMod = baseFreq * Math.pow(2, synthParams.fmAmount * (index + 1) * 0.1);
      osc.frequency.exponentialRampToValueAtTime(freqMod, now + (duration * 0.1));
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + duration);
      
      // Mathematical envelope with exponential curves
      const attackTime = 0.01;
      const decayTime = duration - attackTime;
      const peakLevel = amplitude * (0.3 + synthParams.driveColor * 0.4);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peakLevel, now + attackTime);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    });
    
    // Connect noise path
    noiseSource.connect(noiseGain);
    noiseGain.connect(filter2);
    filter2.connect(filter1);
    
    // Connect through waveshaper and filters
    filter1.connect(waveshaper);
    waveshaper.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    // Mathematical master envelope with curves
    const attackCurve = 1 - Math.exp(-5 * (0.01 / 0.01)); // Exponential attack
    const decayCurve = Math.exp(-3 * (duration - 0.01) / duration); // Exponential decay
    
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(attackCurve, now + 0.01);
    masterGain.gain.exponentialRampToValueAtTime(0.001 * decayCurve, now + duration);
    
    // Noise envelope with different mathematical curve
    const noisePeak = 0.4 * synthParams.noiseLayer;
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(noisePeak, now + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);
    
    // Start all sources
    fmOsc.start(now);
    oscillators.forEach(osc => osc.start(now));
    noiseSource.start(now);
    
    // Stop all sources
    fmOsc.stop(now + duration);
    oscillators.forEach(osc => osc.stop(now + duration));
    noiseSource.stop(now + duration);
    
    // Generate enhanced waveform data with mathematical visualization
    const waveformData = [];
    for (let i = 0; i < 32; i++) {
      const t = i / 32;
      
      // Mathematical combination of multiple wave sources
      const fundamental = Math.sin(t * Math.PI * 8);
      const harmonic = Math.sin(t * Math.PI * 8 * 1.618) * 0.3; // Golden ratio harmonic
      const subharmonic = Math.sin(t * Math.PI * 8 / Math.PI) * 0.2; // Pi ratio subharmonic
      const noise = (Math.random() - 0.5) * synthParams.noiseLayer;
      
      // Mathematical envelope
      const envelope = t < 0.1 ? Math.pow(t * 10, 2) : Math.exp(-(t - 0.1) * 8);
      
      // Combine all sources mathematically
      const combined = (fundamental + harmonic + subharmonic + noise) * envelope;
      const shaped = Math.tanh(combined * (1 + synthParams.driveColor));
      
      waveformData.push(Math.abs(shaped));
    }
    waveformRef.current = waveformData;
    
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), duration * 1000);
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
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 tracking-wide">
            BobbiCussion
          </h1>
          <p className="text-muted-foreground text-lg">
            Modular Percussion Synthesizer
          </p>
        </header>

        {/* Main interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Preset Browser - Left */}
          <div className="rack-panel p-6">
            <PresetBrowser
              presets={DEMO_PRESETS}
              selectedPreset={selectedPreset}
              onSelectPreset={handlePresetSelect}
            />
          </div>

          {/* Tweak Panel - Center */}
          <div className="rack-panel p-6">
            <TweakPanel
              parameters={synthParams}
              onParameterChange={handleParamChange}
            />
          </div>

          {/* Waveform & Trigger - Right */}
          <div className="space-y-6">
            <div className="rack-panel p-6 h-64">
              <WaveformVisualizer
                waveformData={waveformRef.current}
                isPlaying={isPlaying}
              />
            </div>
            <div className="rack-panel p-6 flex-1">
              <TriggerButton
                onTrigger={handleTrigger}
                isPlaying={isPlaying}
                presetName={selectedPreset.name}
              />
            </div>
          </div>
        </div>

        {/* AI Prompt Area */}
        <div className="mt-8 rack-panel p-6">
          <h3 className="text-lg font-semibold text-primary mb-3">AI Sound Design</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={handleAiPromptKeyDown}
              placeholder="Describe your sound: 'I want a resonant industrial snare'"
              className="flex-1 bg-input text-foreground px-4 py-2 rounded border border-border focus:border-primary focus:outline-none"
              disabled={isGenerating}
            />
            <button 
              onClick={handleAiGenerate}
              disabled={!aiPrompt.trim() || isGenerating}
              className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Describe the sound you want, and AI will find the closest preset and adjust parameters.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BobbiCussion;