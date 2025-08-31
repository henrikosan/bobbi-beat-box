import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  waveformData: number[];
  isPlaying: boolean;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  waveformData,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      
      // Clear canvas with dark background
      ctx.fillStyle = 'hsl(220, 25%, 10%)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw grid lines
      ctx.strokeStyle = 'hsl(220, 20%, 15%)';
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let i = 0; i <= 8; i++) {
        const x = (i / 8) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Horizontal center line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      
      // Draw waveform if we have data
      if (waveformData.length > 0) {
        const barWidth = width / waveformData.length;
        
        waveformData.forEach((value, index) => {
          const x = index * barWidth;
          const barHeight = value * (height * 0.4);
          const y = (height / 2) - (barHeight / 2);
          
          // Gradient based on playing state
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          if (isPlaying) {
            gradient.addColorStop(0, 'hsl(190, 100%, 50%)'); // Cyan
            gradient.addColorStop(0.5, 'hsl(320, 100%, 60%)'); // Magenta  
            gradient.addColorStop(1, 'hsl(60, 100%, 50%)'); // Yellow
          } else {
            gradient.addColorStop(0, 'hsl(190, 50%, 40%)');
            gradient.addColorStop(1, 'hsl(190, 30%, 25%)');
          }
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth - 1, barHeight);
          
          // Glow effect when playing
          if (isPlaying) {
            ctx.shadowColor = 'hsl(190, 100%, 50%)';
            ctx.shadowBlur = 10;
            ctx.fillRect(x, y, barWidth - 1, barHeight);
            ctx.shadowBlur = 0;
          }
        });
      } else {
        // Default visualization when no waveform data
        const centerY = height / 2;
        ctx.strokeStyle = 'hsl(180, 25%, 30%)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        
        for (let i = 0; i < width; i += 4) {
          const noise = (Math.sin(i * 0.02) + Math.sin(i * 0.05)) * 3;
          ctx.lineTo(i, centerY + noise);
        }
        ctx.stroke();
      }
      
      // Frequency bars on the sides (static when not playing)
      if (isPlaying) {
        const numBars = 12;
        for (let i = 0; i < numBars; i++) {
          const barHeight = Math.random() * (height * 0.3);
          const y = (height / 2) - (barHeight / 2);
          
          // Left side
          ctx.fillStyle = `hsl(190, 100%, ${30 + (i * 3)}%)`;
          ctx.fillRect(5, y, 3, barHeight);
          
          // Right side  
          ctx.fillRect(width - 8, y, 3, barHeight);
        }
      }
    };

    // Resize canvas to container
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      draw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Only animate when playing, otherwise draw once
    let animationId: number | null = null;
    
    if (isPlaying) {
      const animate = () => {
        draw();
        animationId = requestAnimationFrame(animate);
      };
      animate();
    } else {
      draw(); // Single draw when not playing
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [waveformData, isPlaying]);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
        <div className="w-2 h-2 bg-neon-yellow rounded-full mr-2"></div>
        Waveform
      </h3>
      
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className={`w-full h-full rounded border border-border transition-all duration-300 ${
            isPlaying ? 'shadow-lg' : ''
          }`}
        />
        
        {/* Overlay info */}
        <div className="absolute top-2 right-2 text-xs font-mono text-muted-foreground">
          {isPlaying ? (
            <span className="text-neon-cyan">● PLAYING</span>
          ) : (
            <span>● READY</span>
          )}
        </div>
      </div>
    </div>
  );
};