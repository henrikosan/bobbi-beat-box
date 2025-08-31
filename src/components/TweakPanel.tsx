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
    cyan: 'border-neon-cyan glow-cyan',
    magenta: 'border-neon-magenta glow-magenta', 
    yellow: 'border-neon-yellow glow-yellow'
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
      <h3 className="text-lg font-semibold text-primary mb-6 flex items-center">
        <div className="w-2 h-2 bg-neon-magenta rounded-full mr-2"></div>
        Tweak Panel
      </h3>

      <div className="grid grid-cols-2 gap-8 justify-items-center">
        <Knob
          label="Envelope"
          value={parameters.envelopeShape}
          onChange={(value) => onParameterChange('envelopeShape', value)}
          color="cyan"
          min="Short"
          max="Long"
        />
        
        <Knob
          label="Noise Layer"
          value={parameters.noiseLayer}
          onChange={(value) => onParameterChange('noiseLayer', value)}
          color="magenta"
          min="Clean"
          max="Dirty"
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
          label="Resonance"
          value={parameters.resonance}
          onChange={(value) => onParameterChange('resonance', value)}
          color="cyan"
          min="Soft"
          max="Sharp"
        />
        
        <div className="col-span-2">
          <Knob
            label="Drive/Color"
            value={parameters.driveColor}
            onChange={(value) => onParameterChange('driveColor', value)}
            color="magenta"
            min="Warm"
            max="Crunchy"
          />
        </div>
      </div>

      {/* Parameter Display */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ENV:</span>
            <span className="text-neon-cyan">{Math.round(parameters.envelopeShape * 100)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">NOISE:</span>
            <span className="text-neon-magenta">{Math.round(parameters.noiseLayer * 100)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">FM:</span>
            <span className="text-neon-yellow">{Math.round(parameters.fmAmount * 100)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RES:</span>
            <span className="text-neon-cyan">{Math.round(parameters.resonance * 100)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};