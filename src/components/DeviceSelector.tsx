import React from 'react';
import { Watch, Check, SlidersHorizontal } from 'lucide-react';

export interface WatchModelPreset {
  id: string;
  name: string;
  resolution: string;
  shape: string;
  category: string;
}

export const WATCH_PRESETS: WatchModelPreset[] = [
  { id: 'universal', name: 'Universal Zepp OS (17+ Models)', resolution: 'Native Auto', shape: 'Round & Square', category: 'Universal' },
  { id: 'balance-2', name: 'Amazfit Balance / 2 / GTR 3 Pro', resolution: '480×480', shape: 'Round', category: 'Popular' },
  { id: 'gtr-4', name: 'Amazfit GTR 4 / Active 2', resolution: '466×466', shape: 'Round', category: 'Popular' },
  { id: 'trex-3', name: 'Amazfit T-Rex 3 / Ultra / GTR 3', resolution: '480 / 454', shape: 'Round', category: 'Rugged' },
  { id: 'gts-4', name: 'Amazfit GTS 4 / Active / Bip 5', resolution: '390×450 / Sq', shape: 'Square', category: 'Square' },
];

interface DeviceSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onOpenAdvanced: () => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  selectedModel,
  onSelectModel,
  onOpenAdvanced
}) => {
  return (
    <div className="bg-[#16191f] border border-[#2d3139] rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Watch className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Target Smartwatch
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Auto-Optimized
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Preconfigures target resolution, platform tokens, and Zepp OS AOD runtime.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAdvanced}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-[#1f242d] hover:bg-[#2b323e] border border-[#2d3139] transition self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span>Advanced Tuning</span>
        </button>
      </div>

      {/* Preset Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1">
        {WATCH_PRESETS.map((preset) => {
          const isSelected = selectedModel === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectModel(preset.id)}
              className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-950/40 ring-1 ring-blue-500/50'
                  : 'bg-[#0f1115] border-[#2d3139] text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="font-semibold text-xs text-slate-200 leading-tight">
                  {preset.name}
                </span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="px-1.5 py-0.2 rounded bg-[#16191f] border border-[#2d3139] font-mono text-slate-300">
                  {preset.resolution}
                </span>
                <span>{preset.shape}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
