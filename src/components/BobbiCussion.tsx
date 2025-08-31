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

  // Basic sound generation using Web Audio API
  const generateSound = useCallback(async () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const duration = 0.1 + (synthParams.envelopeShape * 0.4); // 0.1s to 0.5s
    
    // Main oscillator for tonal content
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    // Noise generator
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * synthParams.noiseLayer;
    }
    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    noiseSource.buffer = noiseBuffer;
    
    // Filter for character
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200 + (synthParams.resonance * 2000), now);
    filter.Q.setValueAtTime(1 + (synthParams.resonance * 15), now);
    
    // Master gain with envelope
    const masterGain = ctx.createGain();
    
    // Set frequencies based on preset
    let baseFreq = 60; // Kick frequency
    if (selectedPreset.category === 'sounds') {
      baseFreq = 200 + (synthParams.fmAmount * 800);
    }
    
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(
      baseFreq * (1 + synthParams.fmAmount), 
      now + (duration * 0.1)
    );
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + duration);
    
    // Connect audio graph
    osc.connect(oscGain);
    noiseSource.connect(noiseGain);
    oscGain.connect(filter);
    noiseGain.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    // Envelope
    const attackTime = 0.01;
    const releaseTime = duration - attackTime;
    const peakLevel = 0.3 + (synthParams.driveColor * 0.4);
    
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(peakLevel * 0.7, now + attackTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(peakLevel * synthParams.noiseLayer, now + attackTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(1, now + attackTime);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Start sources
    osc.start(now);
    noiseSource.start(now);
    osc.stop(now + duration);
    noiseSource.stop(now + duration);
    
    // Generate waveform data for visualization
    const waveformData = [];
    for (let i = 0; i < 32; i++) {
      const t = i / 32;
      const envelope = t < 0.1 ? t * 10 : Math.exp(-(t - 0.1) * 10);
      waveformData.push(envelope * (0.5 + Math.random() * 0.5));
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
              placeholder="Describe your sound: 'I want a resonant industrial snare'"
              className="flex-1 bg-input text-foreground px-4 py-2 rounded border border-border focus:border-primary focus:outline-none"
            />
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors">
              Generate
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