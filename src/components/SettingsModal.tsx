import React from 'react';
import { 
  X, 
  Sliders, 
  RotateCcw, 
  ShieldCheck, 
  FileText,
  FolderSync,
  DownloadCloud,
  Layers,
  RefreshCw,
  BatteryCharging,
  Zap,
  Leaf,
  Timer,
  Activity,
  Clock
} from 'lucide-react';
import { ConversionOptions, DEFAULT_CONVERSION_OPTIONS, PowerProfileMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ConversionOptions;
  onChange: (options: ConversionOptions) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  options = DEFAULT_CONVERSION_OPTIONS,
  onChange
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    onChange({ ...DEFAULT_CONVERSION_OPTIONS });
  };

  const handleProfileSelect = (profile: PowerProfileMode) => {
    onChange({
      ...options,
      batteryOptimizations: {
        ...options.batteryOptimizations,
        profile,
        freezeSecondHandsInAod: false, // Default to keeping second hand active as desired
        throttleTimersTo1Min: profile !== 'raw',
        pauseContinuousSensorsInAod: profile !== 'raw',
        freezeAnimationsInAod: profile !== 'raw',
        darkenBackgroundInAod: profile === 'ultra'
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f1115]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="settings-modal-container"
        className="w-full max-w-lg max-h-[85vh] rounded-xl bg-[#16191f] border border-[#2d3139] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#2d3139] flex items-center justify-between bg-[#1a1d23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0f1115] border border-[#2d3139] text-blue-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Conversion & Battery Settings
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Configure AST rules, energy preservation profile & AmazFaces options
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#2d3139] transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#e2e8f0]">
          {/* Battery Efficiency Profile Selector */}
          <div className="p-4 rounded-xl bg-[#0f1115] border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-emerald-400 flex items-center gap-2">
                <BatteryCharging className="w-4 h-4" />
                <span>v2 Battery Optimization Profile</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold uppercase border border-emerald-800">
                ACTIVE
              </span>
            </div>

            <p className="text-[#94a3b8] text-[11px] leading-relaxed">
              Full AOD can increase standby OLED & CPU draw. Select an intelligent battery profile:
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleProfileSelect('balanced')}
                className={`p-2.5 rounded-lg border flex flex-col items-center text-center transition ${
                  options.batteryOptimizations?.profile === 'balanced'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-[#16191f] border-[#2d3139] text-[#94a3b8] hover:text-white'
                }`}
              >
                <Leaf className="w-4 h-4 mb-1 text-emerald-400" />
                <span className="font-bold text-xs">Balanced</span>
                <span className="text-[9px] text-[#94a3b8] mt-0.5">~48% Savings</span>
              </button>

              <button
                type="button"
                onClick={() => handleProfileSelect('ultra')}
                className={`p-2.5 rounded-lg border flex flex-col items-center text-center transition ${
                  options.batteryOptimizations?.profile === 'ultra'
                    ? 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-md'
                    : 'bg-[#16191f] border-[#2d3139] text-[#94a3b8] hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4 mb-1 text-blue-400" />
                <span className="font-bold text-xs">Ultra Eco</span>
                <span className="text-[9px] text-[#94a3b8] mt-0.5">~65% Savings</span>
              </button>

              <button
                type="button"
                onClick={() => handleProfileSelect('raw')}
                className={`p-2.5 rounded-lg border flex flex-col items-center text-center transition ${
                  options.batteryOptimizations?.profile === 'raw'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-[#16191f] border-[#2d3139] text-[#94a3b8] hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4 mb-1 text-amber-400" />
                <span className="font-bold text-xs">Raw Max</span>
                <span className="text-[9px] text-[#94a3b8] mt-0.5">Pure 1:1 Mirror</span>
              </button>
            </div>

            {/* Sub-toggles for Energy */}
            <div className="pt-2 border-t border-[#2d3139] space-y-2 text-[11px]">
              <label className="flex items-center justify-between cursor-pointer text-[#cbd5e1] hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Throttle sub-second loops to 1-min in AOD</span>
                </span>
                <input
                  type="checkbox"
                  checked={options.batteryOptimizations?.throttleTimersTo1Min}
                  onChange={(e) => onChange({
                    ...options,
                    batteryOptimizations: {
                      ...options.batteryOptimizations,
                      throttleTimersTo1Min: e.target.checked
                    }
                  })}
                  className="rounded border-[#2d3139] text-emerald-500 bg-[#16191f]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-[#cbd5e1] hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pause/freeze second hand in AOD (Uncheck to keep ticking in AOD)</span>
                </span>
                <input
                  type="checkbox"
                  checked={!!options.batteryOptimizations?.freezeSecondHandsInAod}
                  onChange={(e) => onChange({
                    ...options,
                    batteryOptimizations: {
                      ...options.batteryOptimizations,
                      freezeSecondHandsInAod: e.target.checked
                    }
                  })}
                  className="rounded border-[#2d3139] text-blue-500 bg-[#16191f]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-[#cbd5e1] hover:text-white">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pause continuous PPG heart-rate in standby</span>
                </span>
                <input
                  type="checkbox"
                  checked={options.batteryOptimizations?.pauseContinuousSensorsInAod}
                  onChange={(e) => onChange({
                    ...options,
                    batteryOptimizations: {
                      ...options.batteryOptimizations,
                      pauseContinuousSensorsInAod: e.target.checked
                    }
                  })}
                  className="rounded border-[#2d3139] text-emerald-500 bg-[#16191f]"
                />
              </label>
            </div>
          </div>

          {/* AmazFaces Replacement Mode */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-[#0f1115] border border-blue-500/40">
            <div className="space-y-1">
              <div className="font-semibold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <span>AmazFaces Replacement Mode</span>
              </div>
              <p className="text-[#94a3b8] leading-relaxed">
                Preserves exact input filename and archive type (<code className="text-blue-300 font-mono">.zip</code> or <code className="text-blue-300 font-mono">.zpk</code>) so you can directly replace files in the AmazFaces cache without manual renaming.
              </p>
            </div>
            <input
              type="checkbox"
              checked={options.amazfacesReplaceMode}
              onChange={(e) => onChange({ 
                ...options, 
                amazfacesReplaceMode: e.target.checked,
                outputNaming: e.target.checked ? 'original' : 'suffix'
              })}
              className="mt-1 rounded border-[#2d3139] text-blue-600 focus:ring-blue-500 bg-[#16191f] w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Setting 0: Bypass 60-Second Refresh / Force Second Hand in AOD */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-[#0f1115] border border-emerald-500/40">
            <div className="space-y-1">
              <div className="font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Bypass 60-Second AOD Refresh (Keep Second Hand)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold uppercase">
                  Active
                </span>
              </div>
              <p className="text-[#94a3b8] leading-relaxed">
                Overrides Zepp OS firmware rules that auto-hide the second hand during standby, keeping second pointers visible and sweeping across Always-On Display.
              </p>
            </div>
            <input
              type="checkbox"
              checked={options.bypassIdleRefreshRate ?? true}
              onChange={(e) => onChange({ ...options, bypassIdleRefreshRate: e.target.checked })}
              className="mt-1 rounded border-[#2d3139] text-emerald-500 focus:ring-emerald-500 bg-[#16191f] w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Setting 1: Manifest target sync */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-[#0f1115] border border-[#2d3139]">
            <div className="space-y-1">
              <div className="font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Synchronize Manifest Targets</span>
              </div>
              <p className="text-[#94a3b8] leading-relaxed">
                Rewrites <code className="text-blue-300 font-mono">targets.idle</code> to point to <code className="text-blue-300 font-mono">targets.watchface</code> and aligns <code className="text-blue-300 font-mono">app.idle</code>.
              </p>
            </div>
            <input
              type="checkbox"
              checked={options.syncManifestTargets}
              onChange={(e) => onChange({ ...options, syncManifestTargets: e.target.checked })}
              className="mt-1 rounded border-[#2d3139] text-blue-600 focus:ring-blue-500 bg-[#16191f] w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Setting 2: Override Simple AOD / Idle directory overwrite */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-[#0f1115] border border-emerald-500/40">
            <div className="space-y-1">
              <div className="font-semibold text-white flex items-center gap-2">
                <FolderSync className="w-4 h-4 text-emerald-400" />
                <span>Override Simple AOD (Force Full Active Dial)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-bold uppercase">
                  Active
                </span>
              </div>
              <p className="text-[#94a3b8] leading-relaxed">
                Purges stripped-down manufacturer AOD screens (plain stick hands or blacked-out dials) and clones your entire active dial—background textures, subdials, complications, second hands, and colors—directly into Always-On Display. Also neutralizes runtime checks that hide widgets in standby.
              </p>
            </div>
            <input
              type="checkbox"
              checked={options.overrideSimpleAod ?? options.overwriteIdleDir}
              onChange={(e) => onChange({ 
                ...options, 
                overrideSimpleAod: e.target.checked,
                overwriteIdleDir: e.target.checked 
              })}
              className="mt-1 rounded border-[#2d3139] text-emerald-500 focus:ring-emerald-500 bg-[#16191f] w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Setting 3: Script visibility patch */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-[#0f1115] border border-[#2d3139]">
            <div className="space-y-1">
              <div className="font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Patch Script Visibility Constants</span>
              </div>
              <p className="text-[#94a3b8] leading-relaxed">
                Replaces <code className="text-amber-300 font-mono">ONLY_NORMAL -&gt; ALL</code> and <code className="text-amber-300 font-mono">showInAod: false -&gt; true</code> in JS files.
              </p>
            </div>
            <input
              type="checkbox"
              checked={options.patchScriptVisibility}
              onChange={(e) => onChange({ ...options, patchScriptVisibility: e.target.checked })}
              className="mt-1 rounded border-[#2d3139] text-blue-600 focus:ring-blue-500 bg-[#16191f] w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Setting 4: Deep widget visibility patch */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-[#0f1115] border border-[#2d3139]">
            <div className="space-y-1">
              <div className="font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Deep AOD Property Patching</span>
              </div>
              <p className="text-[#94a3b8] leading-relaxed">
                Unlocks numeric <code className="text-white font-mono">vis_mode: 1 -&gt; 0</code> and <code className="text-white font-mono">hideOnAod: true -&gt; false</code> flags.
              </p>
            </div>
            <input
              type="checkbox"
              checked={options.deepWidgetVisibilityPatch}
              onChange={(e) => onChange({ ...options, deepWidgetVisibilityPatch: e.target.checked })}
              className="mt-1 rounded border-[#2d3139] text-blue-600 focus:ring-blue-500 bg-[#16191f] w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Setting 5: Auto download */}
          <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg bg-[#0f1115] border border-[#2d3139]">
            <div className="space-y-1">
              <div className="font-semibold text-white flex items-center gap-2">
                <DownloadCloud className="w-4 h-4 text-indigo-400" />
                <span>Auto-Download on Finish</span>
              </div>
              <p className="text-[#94a3b8] leading-relaxed">
                Automatically prompt the browser download once single-item conversion completes.
              </p>
            </div>
            <input
              type="checkbox"
              checked={options.autoDownload}
              onChange={(e) => onChange({ ...options, autoDownload: e.target.checked })}
              className="mt-1 rounded border-[#2d3139] text-blue-600 focus:ring-blue-500 bg-[#16191f] w-4 h-4 cursor-pointer"
            />
          </div>

          {/* Setting 6: Compression Level */}
          <div className="p-3.5 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">ZIP Deflate Compression Level</span>
              <span className="font-mono text-blue-400 font-bold">{options.compressionLevel} (Max: 9)</span>
            </div>
            <input
              type="range"
              min="1"
              max="9"
              value={options.compressionLevel}
              onChange={(e) => onChange({ ...options, compressionLevel: parseInt(e.target.value, 10) })}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#64748b]">
              <span>1 (Fastest)</span>
              <span>6 (Balanced)</span>
              <span>9 (Smallest File Size)</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#2d3139] bg-[#1a1d23] flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[#94a3b8] hover:text-white text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
