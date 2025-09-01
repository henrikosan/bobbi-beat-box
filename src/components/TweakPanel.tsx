import React from 'react';
import { SynthParams } from './BobbiCussion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface TweakPanelProps {
  parameters: SynthParams;
  onParameterChange: (param: keyof SynthParams, value: number) => void;
  experimentalMode: boolean;
}

interface KnobProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: 'cyan' | 'magenta' | 'yellow';
  min?: string;
  max?: string;
}

const Knob: React.FC<KnobProps> = ({ label, value, onChange, color, min = '', max = '' }) => {
  const rotation = (value * 270) - 135; // -135° to +135°
  const colorClasses = {
    cyan: 'border-neon-cyan',
    magenta: 'border-neon-magenta', 
    yellow: 'border-neon-yellow'
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative">
        <div 
          className={`modular-knob w-16 h-16 flex items-center justify-center cursor-pointer select-none ${
            colorClasses[color]
          }`}
          onMouseDown={(e) => {
            const startY = e.clientY;
            const startValue = value;
            
            const handleMouseMove = (e: MouseEvent) => {
              const deltaY = startY - e.clientY;
              const sensitivity = 0.005;
              const newValue = Math.max(0, Math.min(1, startValue + (deltaY * sensitivity)));
              onChange(newValue);
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <div 
            className="w-1 h-6 bg-primary rounded-full pointer-events-none"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-medium text-foreground mb-1">
          {label}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground w-16">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
};

export const TweakPanel: React.FC<TweakPanelProps> = ({ 
  parameters, 
  onParameterChange, 
  experimentalMode 
}) => {
  // Display current parameter values for debugging
  const parameterDisplay = () => {
    const relevantParams = experimentalMode 
      ? Object.entries(parameters).slice(0, 12) 
      : [
          ['envelopeDecay', parameters.envelopeDecay],
          ['noiseLayer', parameters.noiseLayer],
          ['fmAmount', parameters.fmAmount],
          ['resonance', parameters.resonance],
          ['driveColor', parameters.driveColor],
          ['crossMod', parameters.crossMod],
          ['ringMod', parameters.ringMod],
          ['lfoRate', parameters.lfoRate]
        ];
        
    return (
      <div className="mt-4 p-3 bg-background/50 rounded border">
        <div className="text-xs text-muted-foreground mb-2">Current Values:</div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {relevantParams.map(([key, value]) => (
            <div key={key} className="text-center">
              <div className="font-medium text-primary">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className="text-muted-foreground">{typeof value === 'number' ? value.toFixed(2) : 'N/A'}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!experimentalMode) {
    // Basic mode - 8 essential knobs with new Decay control
    return (
      <div className="rack-panel p-6">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
          <div className="w-2 h-2 bg-neon-cyan rounded-full mr-2"></div>
          Basic Controls
        </h3>
        
        <div className="flex flex-col items-center space-y-6">
          {/* 8-knob basic interface */}
          <div className="grid grid-cols-4 gap-3">
            <Knob
              label="Decay"
              value={parameters.envelopeDecay}
              onChange={(value) => onParameterChange('envelopeDecay', value)}
              color="magenta"
              min="Short"
              max="Long"
            />
            <Knob
              label="Noise"
              value={parameters.noiseLayer}
              onChange={(value) => onParameterChange('noiseLayer', value)}
              color="cyan"
              min="Clean"
              max="Harsh"
            />
            <Knob
              label="FM"
              value={parameters.fmAmount}
              onChange={(value) => onParameterChange('fmAmount', value)}
              color="yellow"
              min="Soft"
              max="Chirp"
            />
            <Knob
              label="Filter"
              value={parameters.resonance}
              onChange={(value) => onParameterChange('resonance', value)}
              color="magenta"
              min="Dull"
              max="Sharp"
            />
            <Knob
              label="Drive"
              value={parameters.driveColor}
              onChange={(value) => onParameterChange('driveColor', value)}
              color="cyan"
              min="Clean"
              max="Warm"
            />
            <Knob
              label="Cross"
              value={parameters.crossMod}
              onChange={(value) => onParameterChange('crossMod', value)}
              color="yellow"
              min="Stable"
              max="Wild"
            />
            <Knob
              label="Ring"
              value={parameters.ringMod}
              onChange={(value) => onParameterChange('ringMod', value)}
              color="magenta"
              min="Off"
              max="Metal"
            />
            <Knob
              label="LFO"
              value={parameters.lfoRate}
              onChange={(value) => onParameterChange('lfoRate', value)}
              color="cyan"
              min="Slow"
              max="Fast"
            />
          </div>
          
          {parameterDisplay()}
        </div>
      </div>
    );
  }

  // Experimental mode - Full tabbed interface with ADSR controls
  return (
    <div className="rack-panel p-6">
    <div className="h-full">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
        <div className="w-2 h-2 bg-neon-magenta rounded-full mr-2"></div>
        Experimental Controls
      </h3>

      <Tabs defaultValue="synthesis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="synthesis">Core</TabsTrigger>
          <TabsTrigger value="effects">Effects</TabsTrigger>
          <TabsTrigger value="experimental">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="synthesis" className="space-y-4">
          {/* Envelope Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground text-center">Envelope (ADSR)</h4>
            <div className="grid grid-cols-4 gap-2 justify-items-center">
              <Knob
                label="Attack"
                value={parameters.envelopeAttack}
                onChange={(value) => onParameterChange('envelopeAttack', value)}
                color="magenta"
                min="1ms"
                max="100ms"
              />
              <Knob
                label="Decay"
                value={parameters.envelopeDecay}
                onChange={(value) => onParameterChange('envelopeDecay', value)}
                color="magenta"
                min="10ms"
                max="2s"
              />
              <Knob
                label="Sustain"
                value={parameters.envelopeSustain}
                onChange={(value) => onParameterChange('envelopeSustain', value)}
                color="magenta"
                min="0%"
                max="80%"
              />
              <Knob
                label="Release"
                value={parameters.envelopeRelease}
                onChange={(value) => onParameterChange('envelopeRelease', value)}
                color="magenta"
                min="10ms"
                max="3s"
              />
            </div>
          </div>

          {/* Core Synthesis Parameters */}
          <div className="grid grid-cols-4 gap-2 justify-items-center">
            <Knob
              label="FM Amount"
              value={parameters.fmAmount}
              onChange={(value) => onParameterChange('fmAmount', value)}
              color="yellow"
              min="Pure"
              max="Bell"
            />
            
            <Knob
              label="LFO Rate"
              value={parameters.lfoRate}
              onChange={(value) => onParameterChange('lfoRate', value)}
              color="cyan"
              min="Slow"
              max="Fast"
            />
            
            <Knob
              label="Noise"
              value={parameters.noiseLayer}
              onChange={(value) => onParameterChange('noiseLayer', value)}
              color="magenta"
              min="Clean"
              max="Dirty"
            />
            
            <Knob
              label="Wave Morph"
              value={parameters.waveMorph}
              onChange={(value) => onParameterChange('waveMorph', value)}
              color="yellow"
              min="Sine"
              max="Square"
            />
            
            <Knob
              label="Feedback"
              value={parameters.feedback}
              onChange={(value) => onParameterChange('feedback', value)}
              color="cyan"
              min="None"
              max="Chaos"
            />
            
            <Knob
              label="Filter Route"
              value={parameters.filterRoute}
              onChange={(value) => onParameterChange('filterRoute', value)}
              color="magenta"
              min="Series"
              max="Parallel"
            />
            
            <Knob
              label="Resonance"
              value={parameters.resonance}
              onChange={(value) => onParameterChange('resonance', value)}
              color="yellow"
              min="Soft"
              max="Sharp"
            />
            
            <Knob
              label="Drive Color"
              value={parameters.driveColor}
              onChange={(value) => onParameterChange('driveColor', value)}
              color="cyan"
              min="Clean"
              max="Warm"
            />
            
            <Knob
              label="Cross Mod"
              value={parameters.crossMod}
              onChange={(value) => onParameterChange('crossMod', value)}
              color="magenta"
              min="Off"
              max="Wild"
            />
            
            <Knob
              label="Ring Mod"
              value={parameters.ringMod}
              onChange={(value) => onParameterChange('ringMod', value)}
              color="yellow"
              min="Off"
              max="Metal"
            />
            
            <Knob
              label="Sample Hold"
              value={parameters.sampleHold}
              onChange={(value) => onParameterChange('sampleHold', value)}
              color="cyan"
              min="Smooth"
              max="Step"
            />
            
            <Knob
              label="Chaos Level"
              value={parameters.chaosLevel}
              onChange={(value) => onParameterChange('chaosLevel', value)}
              color="yellow"
              min="Order"
              max="Madness"
            />
          </div>
        </TabsContent>

        <TabsContent value="effects" className="space-y-4">
          <div className="grid grid-cols-4 gap-2 justify-items-center">
            <Knob
              label="Reverb"
              value={parameters.reverbAmount}
              onChange={(value) => onParameterChange('reverbAmount', value)}
              color="cyan"
              min="Dry"
              max="Hall"
            />
            
            <Knob
              label="Room Size"
              value={parameters.reverbSize}
              onChange={(value) => onParameterChange('reverbSize', value)}
              color="magenta"
              min="Closet"
              max="Cathedral"
            />
            
            <Knob
              label="Delay Time"
              value={parameters.delayTime}
              onChange={(value) => onParameterChange('delayTime', value)}
              color="yellow"
              min="Tight"
              max="Spacious"
            />
            
            <Knob
              label="Delay Feedback"
              value={parameters.delayFeedback}
              onChange={(value) => onParameterChange('delayFeedback', value)}
              color="cyan"
              min="Single"
              max="Infinite"
            />
            
            <Knob
              label="Bit Crusher"
              value={parameters.bitCrusher}
              onChange={(value) => onParameterChange('bitCrusher', value)}
              color="magenta"
              min="Clean"
              max="Lo-Fi"
            />
            
            <Knob
              label="Freq Shift"
              value={parameters.freqShifter}
              onChange={(value) => onParameterChange('freqShifter', value)}
              color="yellow"
              min="Down"
              max="Up"
            />
            
            <Knob
              label="Formant"
              value={parameters.formantFilter}
              onChange={(value) => onParameterChange('formantFilter', value)}
              color="cyan"
              min="Neutral"
              max="Vocal"
            />
            
            <Knob
              label="Waveshaper"
              value={parameters.waveshaperDrive}
              onChange={(value) => onParameterChange('waveshaperDrive', value)}
              color="magenta"
              min="Soft"
              max="Extreme"
            />
          </div>
        </TabsContent>

        <TabsContent value="experimental" className="space-y-4">
          {/* Granular Synthesis */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground text-center">Granular Synthesis</h4>
            <div className="grid grid-cols-4 gap-2 justify-items-center">
              <Knob
                label="Grain Size"
                value={parameters.grainSize}
                onChange={(value) => onParameterChange('grainSize', value)}
                color="cyan"
                min="Micro"
                max="Macro"
              />
              
              <Knob
                label="Grain Density"
                value={parameters.grainDensity}
                onChange={(value) => onParameterChange('grainDensity', value)}
                color="magenta"
                min="Sparse"
                max="Dense"
              />
              
              <Knob
                label="Grain Pitch"
                value={parameters.grainPitch}
                onChange={(value) => onParameterChange('grainPitch', value)}
                color="yellow"
                min="Down"
                max="Up"
              />
              
              <Knob
                label="Grain Position"
                value={parameters.grainPosition}
                onChange={(value) => onParameterChange('grainPosition', value)}
                color="cyan"
                min="Start"
                max="End"
              />
            </div>
          </div>

          {/* Advanced Modulation */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground text-center">Advanced Modulation</h4>
            <div className="grid grid-cols-4 gap-2 justify-items-center">
              <Knob
                label="Matrix Depth"
                value={parameters.matrixDepth}
                onChange={(value) => onParameterChange('matrixDepth', value)}
                color="magenta"
                min="Simple"
                max="Complex"
              />
              
              <Knob
                label="Voltage Drift"
                value={parameters.voltageDrift}
                onChange={(value) => onParameterChange('voltageDrift', value)}
                color="yellow"
                min="Stable"
                max="Analog"
              />
              
              <Knob
                label="CV Sequencer"
                value={parameters.cvSequencer}
                onChange={(value) => onParameterChange('cvSequencer', value)}
                color="cyan"
                min="Off"
                max="Active"
              />
              
              <Knob
                label="Mod Wheel"
                value={parameters.modWheel}
                onChange={(value) => onParameterChange('modWheel', value)}
                color="magenta"
                min="None"
                max="Extreme"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {parameterDisplay()}
    </div>
    </div>
  );
};