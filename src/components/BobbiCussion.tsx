import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PresetBrowser } from './PresetBrowser';
import { TweakPanel } from './TweakPanel';
import { WaveformVisualizer } from './WaveformVisualizer';
import { TriggerButton } from './TriggerButton';
import { generateModularSound } from './ModularSynthEngine';
import { exportPTWavV2, validatePTWavExport } from '../lib/ptWavExport';
import { useToast } from '../hooks/use-toast';

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
    crossMod: number;
    ringMod: number;
    lfoRate: number;
    waveMorph: number;
    feedback: number;
    filterRoute: number;
    sampleHold: number;
    chaosLevel: number;
  };
}

// Enhanced modular sound engine parameters
export interface SynthParams {
  envelopeShape: number;
  noiseLayer: number;
  fmAmount: number;
  resonance: number;
  driveColor: number;
  // New modular parameters
  crossMod: number;
  ringMod: number;
  lfoRate: number;
  waveMorph: number;
  feedback: number;
  filterRoute: number;
  sampleHold: number;
  chaosLevel: number;
}

const defaultParams: SynthParams = {
  envelopeShape: 0.3,
  noiseLayer: 0.2,
  fmAmount: 0.4,
  resonance: 0.5,
  driveColor: 0.3,
  crossMod: 0.2,
  ringMod: 0.1,
  lfoRate: 0.3,
  waveMorph: 0.5,
  feedback: 0.1,
  filterRoute: 0.4,
  sampleHold: 0.2,
  chaosLevel: 0.1,
};

// Enhanced modular presets
const DEMO_PRESETS: Preset[] = [
  {
    id: 'kick-1',
    name: 'Deep Analog Kick',
    category: 'drums',
    description: 'Punchy 808-style kick with warm analog drive',
    parameters: { 
      envelopeShape: 0.8, noiseLayer: 0.1, fmAmount: 0.6, resonance: 0.3, driveColor: 0.7,
      crossMod: 0.3, ringMod: 0.1, lfoRate: 0.2, waveMorph: 0.3, feedback: 0.2, 
      filterRoute: 0.4, sampleHold: 0.1, chaosLevel: 0.1 
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
      filterRoute: 0.6, sampleHold: 0.4, chaosLevel: 0.3
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
      filterRoute: 0.8, sampleHold: 0.8, chaosLevel: 0.2
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
      filterRoute: 0.3, sampleHold: 0.6, chaosLevel: 0.5
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
      filterRoute: 0.9, sampleHold: 0.3, chaosLevel: 0.8
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
      filterRoute: 0.2, sampleHold: 0.9, chaosLevel: 0.4
    }
  }
];

export const BobbiCussion: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<Preset>(DEMO_PRESETS[0]);
  const [synthParams, setSynthParams] = useState<SynthParams>(DEMO_PRESETS[0].parameters);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
  const renderAudioToBuffer = useCallback(async (preset: Preset): Promise<Float32Array> => {
    if (!audioContextRef.current) throw new Error('AudioContext not available');
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Create offline context for rendering
    const duration = Math.max(0.1, 0.1 + (preset.parameters.envelopeShape * 0.5));
    const sampleRate = ctx.sampleRate;
    const bufferLength = Math.floor(duration * sampleRate);
    
    const offlineCtx = new OfflineAudioContext(1, bufferLength, sampleRate);
    
    // Generate sound in offline context (no audio output, just buffer capture)
    generateModularSound(offlineCtx, preset.parameters, preset);
    
    // Render and return the buffer
    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer.getChannelData(0); // Get mono channel
  }, []);

  // PT-WAV Export Handler with validation
  const handleExportPTWav = useCallback(async (preset: Preset) => {
    if (isExporting) return;
    
    setIsExporting(true);
    
    try {
      // Step 2: Render & Conditioning Pipeline
      const audioBuffer = await renderAudioToBuffer(preset);
      
      if (!audioContextRef.current) throw new Error('AudioContext not available');
      
      // Step 3-4: Resample & Quantize + WAV Container Writing
      const { blob, filename } = exportPTWavV2(audioBuffer, {
        srcSampleRate: audioContextRef.current.sampleRate,
        targetSampleRate: 22168, // PT-F-3 target rate
        presetName: preset.name.replace(/[^a-zA-Z0-9]/g, ''), // Clean name for filename
        returnBlob: true
      });

      if (!blob) throw new Error('Failed to create WAV blob');

      // Step 6: Filenames & Validation - Auto-test after export
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const validation = validatePTWavExport(bytes);
      
      if (!validation.valid) {
        console.warn('PT-WAV validation warnings:', validation.errors);
        toast({
          title: "Export Warning",
          description: `WAV exported with warnings: ${validation.errors.join(', ')}`,
          variant: "destructive",
        });
      }

      // Step 5: UI Integration - Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Show success toast with exact filename
      toast({
        title: "PT-WAV Export Complete",
        description: `Exported ${filename}`,
      });

      // Log validation stats for dev notes
      console.log('PT-WAV Export Stats:', validation.stats);
      
    } catch (error) {
      console.error('PT-WAV Export failed:', error);
      toast({
        title: "Export Failed", 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, renderAudioToBuffer, toast]);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preset Browser - Left */}
          <div className="rack-panel p-6 h-[600px]">
            <PresetBrowser
              presets={DEMO_PRESETS}
              selectedPreset={selectedPreset}
              onSelectPreset={handlePresetSelect}
              onExportPreset={handleExportPTWav}
              isExporting={isExporting}
            />
          </div>

          {/* Tweak Panel - Center */}
          <div className="rack-panel p-6 h-[600px]">
            <TweakPanel
              parameters={synthParams}
              onParameterChange={handleParamChange}
            />
          </div>

          {/* Waveform, Trigger & AI - Right */}
          <div className="space-y-4 h-[600px] flex flex-col">
            {/* Waveform */}
            <div className="rack-panel p-4 h-48 flex-shrink-0">
              <WaveformVisualizer
                waveformData={waveformRef.current}
                isPlaying={isPlaying}
              />
            </div>
            
            {/* Trigger */}
            <div className="rack-panel p-4 h-40 flex-shrink-0">
              <TriggerButton
                onTrigger={handleTrigger}
                isPlaying={isPlaying}
                presetName={selectedPreset.name}
              />
            </div>

            {/* AI Sound Design */}
            <div className="rack-panel p-4 flex-1 min-h-0">
              <h3 className="text-sm font-semibold text-neon-cyan mb-3 flex items-center">
                <div className="w-2 h-2 bg-neon-cyan rounded-full mr-2"></div>
                AI Sound Design
              </h3>
              <div className="space-y-3 h-full flex flex-col">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={handleAiPromptKeyDown}
                  placeholder="'resonant industrial snare'"
                  className="w-full bg-input text-foreground px-3 py-2 rounded border border-border focus:border-primary focus:outline-none text-sm flex-shrink-0"
                  disabled={isGenerating}
                />
                <button 
                  onClick={handleAiGenerate}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0"
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
                <p className="text-xs text-muted-foreground flex-shrink-0">
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