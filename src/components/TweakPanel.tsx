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
          {/* Knob indicator line */}
          <div 
            className="absolute w-0.5 h-6 bg-current transform -translate-y-1"
            style={{ transform: `rotate(${rotation}deg) translateY(-50%)` }}
          />
          
          {/* Center dot */}
          <div className="w-2 h-2 bg-current rounded-full" />
        </div>
        
        {/* Value indicator */}
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="text-xs text-muted-foreground font-mono">
            {Math.round(value * 100)}
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {min && max && (
          <div className="text-xs text-muted-foreground flex justify-between w-16">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const TweakPanel: React.FC<TweakPanelProps> = ({
  parameters,
  onParameterChange,
  experimentalMode,
}) => {
  if (!experimentalMode) {
    // Basic Mode - Simple 8-parameter layout
    return (
      <div className="h-full">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
          <div className="w-2 h-2 bg-neon-cyan rounded-full mr-2"></div>
          Basic Controls
        </h3>

        <div className="grid grid-cols-4 gap-3 justify-items-center">
          <Knob
            label="Attack"
            value={parameters.envelopeShape}
            onChange={(value) => onParameterChange('envelopeShape', value)}
            color="cyan"
            min="Fast"
            max="Slow"
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
            label="FM"
            value={parameters.fmAmount}
            onChange={(value) => onParameterChange('fmAmount', value)}
            color="yellow"
            min="Soft"
            max="Harsh"
          />
          
          <Knob
            label="Filter"
            value={parameters.resonance}
            onChange={(value) => onParameterChange('resonance', value)}
            color="cyan"
            min="Soft"
            max="Sharp"
          />
          
          <Knob
            label="Drive"
            value={parameters.driveColor}
            onChange={(value) => onParameterChange('driveColor', value)}
            color="magenta"
            min="Clean"
            max="Warm"
          />
          
          <Knob
            label="Cross-Mod"
            value={parameters.crossMod}
            onChange={(value) => onParameterChange('crossMod', value)}
            color="yellow"
            min="None"
            max="Wild"
          />
          
          <Knob
            label="Ring Mod"
            value={parameters.ringMod}
            onChange={(value) => onParameterChange('ringMod', value)}
            color="cyan"
            min="Off"
            max="Bell"
          />
          
          <Knob
            label="LFO"
            value={parameters.lfoRate}
            onChange={(value) => onParameterChange('lfoRate', value)}
            color="magenta"
            min="Slow"
            max="Fast"
          />
        </div>

        {/* Simple parameter display */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="grid grid-cols-4 gap-1 text-xs font-mono">
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-xs">ATK</span>
              <span className="text-neon-cyan text-sm">{Math.round(parameters.envelopeShape * 100)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-xs">NOISE</span>
              <span className="text-neon-magenta text-sm">{Math.round(parameters.noiseLayer * 100)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-xs">FM</span>
              <span className="text-neon-yellow text-sm">{Math.round(parameters.fmAmount * 100)}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-xs">RES</span>
              <span className="text-neon-cyan text-sm">{Math.round(parameters.resonance * 100)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Experimental Mode - Tabbed interface with all parameters
  return (
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
          <div className="grid grid-cols-4 gap-2 justify-items-center">
            <Knob
              label="Envelope"
              value={parameters.envelopeShape}
              onChange={(value) => onParameterChange('envelopeShape', value)}
              color="cyan"
              min="Short"
              max="Long"
            />
            
            <Knob
              label="Cross-Mod"
              value={parameters.crossMod}
              onChange={(value) => onParameterChange('crossMod', value)}
              color="magenta"
              min="None"
              max="Wild"
            />
            
            <Knob
              label="Ring Mod"
              value={parameters.ringMod}
              onChange={(value) => onParameterChange('ringMod', value)}
              color="yellow"
              min="Off"
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
              max="Complex"
            />
            
            <Knob
              label="FM Amount"
              value={parameters.fmAmount}
              onChange={(value) => onParameterChange('fmAmount', value)}
              color="yellow"
              min="Subtle"
              max="Harsh"
            />
            
            <Knob
              label="S&H Rate"
              value={parameters.sampleHold}
              onChange={(value) => onParameterChange('sampleHold', value)}
              color="cyan"
              min="Smooth"
              max="Stepped"
            />
            
            <Knob
              label="Resonance"
              value={parameters.resonance}
              onChange={(value) => onParameterChange('resonance', value)}
              color="magenta"
              min="Soft"
              max="Sharp"
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
              min="Small"
              max="Cathedral"
            />
            
            <Knob
              label="Delay Time"
              value={parameters.delayTime}
              onChange={(value) => onParameterChange('delayTime', value)}
              color="yellow"
              min="Fast"
              max="Slow"
            />
            
            <Knob
              label="Delay FB"
              value={parameters.delayFeedback}
              onChange={(value) => onParameterChange('delayFeedback', value)}
              color="cyan"
              min="Single"
              max="Infinite"
            />
            
            <Knob
              label="Drive Color"
              value={parameters.driveColor}
              onChange={(value) => onParameterChange('driveColor', value)}
              color="magenta"
              min="Clean"
              max="Saturated"
            />
            
            <Knob
              label="Bit Crusher"
              value={parameters.bitCrusher}
              onChange={(value) => onParameterChange('bitCrusher', value)}
              color="yellow"
              min="16-bit"
              max="1-bit"
            />
            
            <Knob
              label="Freq Shifter"
              value={parameters.freqShifter}
              onChange={(value) => onParameterChange('freqShifter', value)}
              color="cyan"
              min="Normal"
              max="Shifted"
            />
            
            <Knob
              label="Formant"
              value={parameters.formantFilter}
              onChange={(value) => onParameterChange('formantFilter', value)}
              color="magenta"
              min="Natural"
              max="Vocal"
            />
          </div>
        </TabsContent>

        <TabsContent value="experimental" className="space-y-4">
          <div className="grid grid-cols-4 gap-2 justify-items-center">
            <Knob
              label="Grain Size"
              value={parameters.grainSize}
              onChange={(value) => onParameterChange('grainSize', value)}
              color="cyan"
              min="Tiny"
              max="Large"
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
              label="Grain Pos"
              value={parameters.grainPosition}
              onChange={(value) => onParameterChange('grainPosition', value)}
              color="cyan"
              min="Start"
              max="End"
            />
            
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
              max="Unstable"
            />
            
            <Knob
              label="CV Sequencer"
              value={parameters.cvSequencer}
              onChange={(value) => onParameterChange('cvSequencer', value)}
              color="cyan"
              min="Static"
              max="Motion"
            />
            
            <Knob
              label="Mod Wheel"
              value={parameters.modWheel}
              onChange={(value) => onParameterChange('modWheel', value)}
              color="magenta"
              min="None"
              max="Full"
            />
            
            <Knob
              label="Waveshaper"
              value={parameters.waveshaperDrive}
              onChange={(value) => onParameterChange('waveshaperDrive', value)}
              color="yellow"
              min="Linear"
              max="Extreme"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Enhanced Parameter Display */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="grid grid-cols-6 gap-1 text-xs font-mono">
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs">ENV</span>
            <span className="text-neon-cyan text-sm">{Math.round(parameters.envelopeShape * 100)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs">X-MOD</span>
            <span className="text-neon-magenta text-sm">{Math.round(parameters.crossMod * 100)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs">RING</span>
            <span className="text-neon-yellow text-sm">{Math.round(parameters.ringMod * 100)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs">GRAIN</span>
            <span className="text-neon-cyan text-sm">{Math.round(parameters.grainSize * 100)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs">MATRIX</span>
            <span className="text-neon-magenta text-sm">{Math.round(parameters.matrixDepth * 100)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-muted-foreground text-xs">CHAOS</span>
            <span className="text-neon-yellow text-sm">{Math.round(parameters.chaosLevel * 100)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};