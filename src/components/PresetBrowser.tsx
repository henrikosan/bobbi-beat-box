import React from 'react';
import { Preset } from './BobbiCussion';

interface PresetBrowserProps {
  presets: Preset[];
  selectedPreset: Preset;
  onSelectPreset: (preset: Preset) => void;
  onExportPreset?: (preset: Preset) => Promise<void>;
  isExporting?: boolean;
}

export const PresetBrowser: React.FC<PresetBrowserProps> = ({
  presets,
  selectedPreset,
  onSelectPreset,
  onExportPreset,
  isExporting = false,
}) => {
  const drumPresets = presets.filter(p => p.category === 'drums');
  const soundPresets = presets.filter(p => p.category === 'sounds');

  const PresetItem: React.FC<{ preset: Preset }> = ({ preset }) => (
    <div
      className={`w-full rounded border transition-all duration-200 ${
        selectedPreset.id === preset.id
          ? 'bg-primary/20 border-primary shadow-lg'
          : 'bg-panel-medium hover:bg-panel-light border-border'
      }`}
    >
      <button
        onClick={() => onSelectPreset(preset)}
        className="w-full p-3 text-left"
      >
        <div className="font-semibold text-sm text-foreground">{preset.name}</div>
        <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {preset.description}
        </div>
      </button>
      
      {/* Export Button */}
      {onExportPreset && (
        <div className="px-3 pb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExportPreset(preset);
            }}
            disabled={isExporting}
            className="w-full px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export → PT-WAV (8-bit @ 22,168 Hz, F-3)"
          >
            {isExporting ? 'Exporting...' : 'Export PT-WAV'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
        <div className="w-2 h-2 bg-neon-cyan rounded-full mr-2"></div>
        Preset Browser
      </h3>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Drums Section */}
        <div>
          <h4 className="text-sm font-semibold text-neon-magenta mb-2 uppercase tracking-wide">
            Drums
          </h4>
          <div className="space-y-2">
            {drumPresets.map(preset => (
              <PresetItem key={preset.id} preset={preset} />
            ))}
          </div>
        </div>

        {/* Sounds Section */}
        <div>
          <h4 className="text-sm font-semibold text-neon-yellow mb-2 uppercase tracking-wide">
            Sounds
          </h4>
          <div className="space-y-2">
            {soundPresets.map(preset => (
              <PresetItem key={preset.id} preset={preset} />
            ))}
          </div>
        </div>
      </div>

      {/* Category Stats */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Drums:</span>
            <span className="text-neon-magenta">{drumPresets.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Sounds:</span>
            <span className="text-neon-yellow">{soundPresets.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};