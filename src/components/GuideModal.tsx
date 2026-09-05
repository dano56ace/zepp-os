import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Zap, 
  RefreshCw, 
  ShieldCheck,
  BatteryCharging,
  Leaf,
  Clock,
  Timer
} from 'lucide-react';
import { KNOWN_ZEPP_DEVICES } from '../utils/devices';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'amazfaces' | 'battery' | 'faod' | 'devices'>('amazfaces');

  if (!isOpen) return null;

  const devicesList = Object.values(KNOWN_ZEPP_DEVICES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f1115]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="guide-modal-container"
        className="w-full max-w-3xl max-h-[85vh] rounded-xl bg-[#16191f] border border-[#2d3139] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#2d3139] flex items-center justify-between bg-[#1a1d23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0f1115] border border-[#2d3139] text-blue-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Zepp OS Full AOD & Battery Efficiency Guide
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Understand AmazFaces replacement, battery throttling & OLED power savings
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2d3139] bg-[#0f1115] px-6 gap-2 sm:gap-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('amazfaces')}
            className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'amazfaces'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>AmazFaces Replace</span>
          </button>

          <button
            onClick={() => setActiveTab('battery')}
            className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'battery'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <BatteryCharging className="w-4 h-4" />
            <span>v2 Battery Preservation</span>
          </button>

          <button
            onClick={() => setActiveTab('faod')}
            className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'faod'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>How FAOD Works</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'devices'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Supported Devices</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-[#e2e8f0]">
          {/* Tab 1: AmazFaces Direct Replacement */}
          {activeTab === 'amazfaces' && (
            <div className="space-y-5">
              <div className="p-4 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  How to Replace the Watchface in the AmazFaces App
                </h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  When you download a watchface from AmazFaces (as a <code className="text-blue-400 font-mono">.zip</code> or <code className="text-blue-400 font-mono">.zpk</code>), AmazFaces stores it on your phone so it can sync it to your watch. This tool patches the file to Full AOD and keeps the <strong>exact original filename and format</strong> so you can easily replace the downloaded original!
                </p>
              </div>

              {/* Troubleshooting Transfer Failures */}
              <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-2.5">
                <h5 className="font-bold text-amber-400 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <Zap className="w-3.5 h-3.5" />
                  AmazFaces "Transfer Failed" Troubleshooting
                </h5>
                <ul className="text-[11px] text-[#cbd5e1] space-y-1.5 list-disc list-inside leading-relaxed">
                  <li><strong>Nested .zpk inside .zip:</strong> AmazFaces downloads sometimes wrap a inner <code className="text-blue-300 font-mono">.zpk</code> inside a <code className="text-white font-mono">.zip</code>. If AmazFaces fails to push the .zip, use the dropdown on the download button to export the <strong>Direct .ZPK</strong> and sync via Zepp Developer Mode or QR Faces.</li>
                  <li><strong>Zepp App Developer Mode:</strong> Open Zepp App &gt; Profile &gt; Settings &gt; About &gt; Tap the Zepp logo 7 times &gt; Go to Device &gt; Developer Mode &gt; Scan / Sideload.</li>
                  <li><strong>App ID &amp; Target Sync:</strong> The converter retains the exact original <code className="text-blue-300 font-mono">appId</code> and directory structure so the watch does not flag signature mismatches.</li>
                </ul>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-2">
                  <div className="font-bold text-blue-400 flex items-center justify-between">
                    <span>Step 1: Download from AmazFaces</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-bold uppercase">Step 1</span>
                  </div>
                  <p className="text-[#94a3b8] leading-relaxed">
                    In the <strong>AmazFaces app</strong> or website, download your desired watchface to your device. It will be saved in your Downloads or AmazFaces folder (named like <code className="text-white font-mono">12345_watchface.zip</code> or <code className="text-white font-mono">watchface.zpk</code>).
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-2">
                  <div className="font-bold text-blue-400 flex items-center justify-between">
                    <span>Step 2: Drop into this Converter</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-bold uppercase">Step 2</span>
                  </div>
                  <p className="text-[#94a3b8] leading-relaxed">
                    Drop the downloaded file into this converter. The tool automatically unlocks all restricted AOD widgets and applies smart battery optimizations.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-2">
                  <div className="font-bold text-blue-400 flex items-center justify-between">
                    <span>Step 3: Replace File & Install in AmazFaces</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300 font-bold uppercase">Step 3</span>
                  </div>
                  <p className="text-[#94a3b8] leading-relaxed">
                    Click <strong>Download</strong> to get the converted file. Move/replace the converted file into your phone's AmazFaces download directory (replacing the original file). Then in AmazFaces, tap <strong>Install / Sync to Watch</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Battery Preservation */}
          {activeTab === 'battery' && (
            <div className="space-y-5">
              <div className="p-4 rounded-lg bg-[#0f1115] border border-emerald-500/40 space-y-2">
                <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  Why Standard Full AOD Drains Battery & How v2 Fixes It
                </h4>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Smartwatches enter a low-power deep sleep state during AOD. Naive FAOD tools that keep 1-second timers, continuous PPG heart rate sensors, or moving second hands force the CPU to wake up 3,600 times every hour, reducing battery life from 7-14 days to just 1-2 days.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Timer className="w-4 h-4 text-emerald-400" />
                    <span>Smart 1-Min Throttle</span>
                  </div>
                  <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                    Throttles interval callbacks from 1000ms (1Hz) down to 60,000ms when standby mode is active.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>Full Second Hand Display</span>
                  </div>
                  <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                    By default, your continuous second hand remains fully active and ticking on both active and AOD screens. You can customize this anytime in Settings.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Bio-Sensor Guarding</span>
                  </div>
                  <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                    Pauses active PPG optical sensor reads during screen standby; restores live reading immediately on wrist raise.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>OLED Black Diode Savings</span>
                  </div>
                  <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                    Maintains pure 0x000000 background textures so AMOLED panels turn off individual background pixels completely.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: FAOD Mechanism */}
          {activeTab === 'faod' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-2">
                <h4 className="font-bold text-white text-sm">The Zepp OS FAOD Pipeline</h4>
                <p className="text-[#94a3b8] leading-relaxed">
                  Zepp OS splits watchfaces into two distinct layouts: <code className="text-blue-300 font-mono">watchface/</code> (active) and <code className="text-emerald-300 font-mono">idle/</code> (standby). By default, creators strip widgets in <code className="text-emerald-300 font-mono">idle/</code>. Our pipeline synchronizes manifest routing and replaces visibility tokens to create a rich, full-information AOD display.
                </p>
              </div>
            </div>
          )}

          {/* Tab 4: Supported Devices */}
          {activeTab === 'devices' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-2">
                <h4 className="font-bold text-white text-sm">Compatible Smartwatches</h4>
                <p className="text-[#94a3b8] leading-relaxed">
                  Compatible with all Zepp OS 1.0, 2.0, 2.5, 3.0, and 3.5 smartwatches:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {devicesList.map((dev) => (
                  <div key={dev.code} className="p-3 rounded-lg bg-[#0f1115] border border-[#2d3139] space-y-1">
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>{dev.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#16191f] text-blue-400 font-mono border border-[#2d3139]">
                        {dev.resolution}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#94a3b8] flex items-center gap-2">
                      <span className="capitalize">{dev.shape}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-mono">{dev.code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#2d3139] bg-[#1a1d23] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
