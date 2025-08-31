import React, { useEffect, useState } from 'react';

interface TriggerButtonProps {
  onTrigger: () => void;
  isPlaying: boolean;
  presetName: string;
}

export const TriggerButton: React.FC<TriggerButtonProps> = ({
  onTrigger,
  isPlaying,
  presetName,
}) => {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !keyPressed) {
        e.preventDefault();
        setKeyPressed(true);
        onTrigger();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyPressed, onTrigger]);

  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <h3 className="text-lg font-semibold text-primary mb-6 flex items-center">
        <div className="w-2 h-2 bg-neon-cyan rounded-full mr-2 animate-pulse-glow"></div>
        Trigger
      </h3>
      
      {/* Main trigger button */}
      <button
        onMouseDown={onTrigger}
        className={`w-32 h-32 rounded-full border-4 transition-all duration-150 font-bold text-2xl select-none ${
          isPlaying || keyPressed
            ? 'bg-primary border-primary text-primary-foreground glow-cyan scale-95'
            : 'bg-panel-medium border-primary text-primary hover:bg-panel-light hover:border-primary/80 hover:scale-105'
        }`}
      >
        {isPlaying ? '●' : '▶'}
      </button>
      
      {/* Current preset info */}
      <div className="mt-6 space-y-2 text-center max-w-48">
        <div className="text-sm font-semibold text-foreground">
          {presetName}
        </div>
        <div className="text-xs text-muted-foreground">
          Click or press <kbd className="px-1 py-0.5 bg-panel-medium rounded text-neon-cyan">SPACE</kbd> to trigger
        </div>
      </div>
      
      {/* Performance indicators */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono w-32">
          <span className="text-muted-foreground">VELOCITY:</span>
          <span className="text-neon-magenta">127</span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono w-32">
          <span className="text-muted-foreground">OUTPUT:</span>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={`w-1 h-2 rounded-sm transition-colors duration-150 ${
                  isPlaying && i <= 4 
                    ? 'bg-neon-yellow' 
                    : 'bg-panel-medium'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Connection status */}
      <div className="mt-4 text-xs text-muted-foreground">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isPlaying ? 'bg-neon-cyan animate-pulse' : 'bg-panel-medium'
          }`} />
          Audio Engine Ready
        </div>
      </div>
    </div>
  );
};