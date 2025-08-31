import React from 'react';
import { SynthParams } from './BobbiCussion';

interface TweakPanelProps {
  parameters: SynthParams;
  onParameterChange: (param: keyof SynthParams, value: number) => void;
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
}) => {
  return (
    <div className="h-full">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
        <div className="w-2 h-2 bg-neon-magenta rounded-full mr-2"></div>
        Modular Controls
      </h3>

      {/* Enhanced 4x3 grid for all 12 parameters */}
      <div className="grid grid-cols-4 gap-4 justify-items-center">
        {/* Row 1 */}
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
        
        {/* Row 2 */}
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
        
        {/* Row 3 */}
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

      {/* Enhanced Parameter Display */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="grid grid-cols-4 gap-1 text-xs font-mono">
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
            <span className="text-muted-foreground text-xs">LFO</span>
            <span className="text-neon-cyan text-sm">{Math.round(parameters.lfoRate * 100)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};