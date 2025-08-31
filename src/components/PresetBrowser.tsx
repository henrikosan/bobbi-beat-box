import React from 'react';
import { Preset } from './BobbiCussion';

interface PresetBrowserProps {
  presets: Preset[];
  selectedPreset: Preset;
  onSelectPreset: (preset: Preset) => void;
  onExportPTWav?: (preset: Preset) => Promise<void>;
  onExportStandardWav?: (preset: Preset) => Promise<void>;
  isExporting?: boolean;
}

export const PresetBrowser: React.FC<PresetBrowserProps> = ({
  presets,
  selectedPreset,
  onSelectPreset,
  onExportPTWav,
  onExportStandardWav,
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
      
      {/* Export Buttons */}
      {(onExportPTWav || onExportStandardWav) && (
        <div className="px-3 pb-3 space-y-1">
          {onExportPTWav && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExportPTWav(preset);
              }}
              disabled={isExporting}
              className="w-full px-2 py-1 text-xs bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded hover:bg-neon-cyan/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export → PT-WAV (8-bit @ 22,168 Hz, F-3)"
            >
              {isExporting ? 'Exporting...' : 'PT-WAV (8-bit)'}
            </button>
          )}
          {onExportStandardWav && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExportStandardWav(preset);
              }}
              disabled={isExporting}
              className="w-full px-2 py-1 text-xs bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30 rounded hover:bg-neon-yellow/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export → Standard WAV (16-bit @ 44.1 kHz)"
            >
              {isExporting ? 'Exporting...' : 'Standard WAV (16-bit)'}
            </button>
          )}
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