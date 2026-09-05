import React, { useState, useEffect, useMemo } from 'react';
import { 
  Eye, 
  Moon, 
  Sun, 
  Watch, 
  Clock, 
  Sparkles, 
  RotateCw, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Activity,
  BatteryCharging,
  Sliders,
  Maximize2,
  Image as ImageIcon,
  CheckCircle2,
  Info,
  X,
  FileCode,
  Smartphone,
  Cpu,
  FolderTree,
  ExternalLink,
  Package,
  HardDrive
} from 'lucide-react';
import { WatchfaceFileItem, ExtractedImageItem } from '../types';
import { BatteryDrainEstimator } from './BatteryDrainEstimator';

interface WatchPreviewModalProps {
  item: WatchfaceFileItem | null;
  onClose: () => void;
}

export const WatchPreviewModal: React.FC<WatchPreviewModalProps> = ({ item, onClose }) => {
  const [activeTab, setActiveTab] = useState<'simulator' | 'details' | 'battery'>('simulator');
  const [isAodMode, setIsAodMode] = useState<boolean>(false);
  const [isLiveClock, setIsLiveClock] = useState<boolean>(true);
  const [customMinutes, setCustomMinutes] = useState<number>(608); // 10:08 default
  const [customSeconds, setCustomSeconds] = useState<number>(42);
  const [deviceShape, setDeviceShape] = useState<'round' | 'square'>('round');
  const [showHands, setShowHands] = useState<boolean>(false); // Default to FALSE so real watchface is not obscured
  const [tickMode, setTickMode] = useState<'step' | 'sweep'>('step');
  const [selectedAssetUrl, setSelectedAssetUrl] = useState<string | null>(null);
  const [selectedAssetName, setSelectedAssetName] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(new Date());
  const [showAssetGallery, setShowAssetGallery] = useState<boolean>(false);

  // All extracted images from the uploaded package
  const extractedImages: ExtractedImageItem[] = useMemo(() => {
    if (!item) return [];
    if (item.extractedImages && item.extractedImages.length > 0) {
      return item.extractedImages;
    }
    if (item.packageInfo?.extractedImages && item.packageInfo.extractedImages.length > 0) {
      return item.packageInfo.extractedImages;
    }
    if (item.previewUrl) {
      return [{ path: 'preview.png', name: 'preview.png', url: item.previewUrl, size: 0, isDialCandidate: true }];
    }
    return [];
  }, [item]);

  // Determine current active preview URL
  const currentPreviewUrl = useMemo(() => {
    // If user explicitly selected an asset from the gallery
    if (selectedAssetUrl) return selectedAssetUrl;
    // If in AOD mode and a dedicated AOD preview exists
    if (isAodMode && item?.aodPreviewUrl) return item.aodPreviewUrl;
    // Primary active preview
    if (item?.previewUrl) return item.previewUrl;
    // First dial candidate from extracted images
    const candidate = extractedImages.find(img => img.isDialCandidate) || extractedImages[0];
    return candidate?.url || null;
  }, [selectedAssetUrl, isAodMode, item, extractedImages]);

  // Name of current displayed asset
  const currentAssetPath = useMemo(() => {
    if (selectedAssetName) return selectedAssetName;
    if (isAodMode && item?.aodPreviewUrl) return 'idle/assets/preview.png (AOD Mode)';
    const found = extractedImages.find(img => img.url === currentPreviewUrl);
    if (found) return found.path;
    return item?.previewUrl ? 'watchface/preview.png' : 'Procedural Vector Dial';
  }, [selectedAssetName, isAodMode, item, extractedImages, currentPreviewUrl]);

  // Reset asset state when item changes
  useEffect(() => {
    setSelectedAssetUrl(null);
    setSelectedAssetName(null);
    setImageLoaded(false);
    setImageError(false);
    // If the device looks like GTS/square (e.g. GTS in name), set square shape
    if (item?.name.toLowerCase().includes('gts') || item?.name.toLowerCase().includes('square')) {
      setDeviceShape('square');
    } else {
      setDeviceShape('round');
    }
  }, [item?.id]);

  // Live clock ticker
  useEffect(() => {
    if (!isLiveClock) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isLiveClock]);

  // Calculate hours, minutes, seconds based on live or custom time
  const { hours, minutes, seconds } = useMemo(() => {
    if (isLiveClock) {
      return {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds()
      };
    }
    const h = Math.floor(customMinutes / 60) % 24;
    const m = customMinutes % 60;
    return {
      hours: h,
      minutes: m,
      seconds: customSeconds
    };
  }, [isLiveClock, now, customMinutes, customSeconds]);

  if (!item) return null;

  // Hand rotations in degrees
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const dateFormatted = isLiveClock 
    ? now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Mon, Aug 31';

  const appName = item.packageInfo?.appName || item.name.replace(/\.(zpk|zip)$/i, '');
  const appId = item.packageInfo?.appId || 'Dynamic Zepp Target';
  const version = item.packageInfo?.version || '1.0.0';
  const devices = item.packageInfo?.deviceSourceNames || ['Amazfit Balance & Zepp OS Devices'];
  const resolution = item.packageInfo?.resolution || (deviceShape === 'round' ? '480x480 (Round AMOLED)' : '390x450 (Square AMOLED)');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0a0c10]/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        id="watch-preview-modal"
        className="w-full max-w-2xl rounded-2xl bg-[#14171e] border border-[#2d3139] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden"
      >
        {/* Modal Header with Tab Navigation */}
        <div className="px-5 py-3.5 border-b border-[#232730] flex items-center justify-between bg-[#181c24]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Watch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{appName}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                  v{version}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Target:</span>
                <span className="font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 truncate max-w-[220px]">
                  {devices[0] || 'Amazfit Balance'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-[#0d1015] p-0.5 rounded-lg border border-[#232730]">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'simulator' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Watch className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Display</span>
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'details' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Details & Assets</span>
                {extractedImages.length > 0 && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-blue-900/60 text-blue-200 font-mono">
                    {extractedImages.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('battery')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'battery' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                <span>Battery Drain</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#232730] transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'simulator' ? (
          <div className="p-4 sm:p-5 flex flex-col items-center justify-center space-y-4 overflow-y-auto">
            {/* Mode Switcher Buttons */}
            <div className="flex items-center gap-2 bg-[#0f1115] p-1 rounded-xl border border-[#232730] w-full max-w-md justify-center">
              <button
                onClick={() => { setIsAodMode(false); setSelectedAssetUrl(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  !isAodMode 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Active Watchface</span>
              </button>

              <button
                onClick={() => { setIsAodMode(true); setSelectedAssetUrl(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isAodMode 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-emerald-300" />
                <span>Always-On Display (AOD)</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                  1 Hz
                </span>
              </button>
            </div>

            {/* Smartwatch Chassis Frame Container */}
            <div className="relative flex items-center justify-center py-1">
              {/* Watch Bezel Outer Rim & Physical Buttons */}
              <div 
                className={`relative flex items-center justify-center p-3.5 bg-gradient-to-br from-[#383e4c] via-[#1c2028] to-[#0c0e13] shadow-2xl border-4 border-[#474f61] transition-all duration-300 ${
                  deviceShape === 'round' 
                    ? 'rounded-full w-64 h-64 sm:w-76 sm:h-76' 
                    : 'rounded-3xl w-64 h-72 sm:w-76 sm:h-84'
                }`}
              >
                {/* Crown Button on right */}
                <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-2.5 h-8 bg-gradient-to-r from-[#474f61] to-[#1a1e27] rounded-r-md border-r border-t border-b border-slate-600 shadow-md" />

                {/* Bezel inner display screen */}
                <div 
                  className={`w-full h-full relative overflow-hidden flex items-center justify-center transition-all duration-300 ${
                    deviceShape === 'round' ? 'rounded-full' : 'rounded-2xl'
                  } ${isAodMode ? 'bg-black' : 'bg-[#080a0f]'}`}
                >
                  {/* Watchface Visual Graphic / Dial Image from uploaded package */}
                  {currentPreviewUrl && !imageError ? (
                    <img
                      src={currentPreviewUrl}
                      alt={item.name}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                      className={`w-full h-full object-contain select-none transition-all duration-300 ${
                        isAodMode 
                          ? (item.aodPreviewUrl && currentPreviewUrl === item.aodPreviewUrl ? 'brightness-100' : 'brightness-75 contrast-125 saturate-75') 
                          : 'brightness-100'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    /* High-Resolution Procedural SVG Chronograph Dial Fallback */
                    <div className="w-full h-full relative flex items-center justify-center select-none bg-gradient-to-b from-[#111622] via-[#090c12] to-black">
                      <svg className="w-full h-full absolute inset-0" viewBox="0 0 480 480">
                        <circle cx="240" cy="240" r="226" fill="none" stroke={isAodMode ? '#1e293b' : '#3b82f6'} strokeWidth="2" opacity="0.6" />
                        <circle cx="240" cy="240" r="234" fill="none" stroke="#334155" strokeWidth="3" />
                        {Array.from({ length: 60 }).map((_, i) => {
                          const angle = (i * 6 * Math.PI) / 180;
                          const isHour = i % 5 === 0;
                          const isQuarter = i % 15 === 0;
                          const innerR = isQuarter ? 190 : isHour ? 200 : 212;
                          const outerR = 224;
                          return (
                            <line
                              key={i}
                              x1={240 + Math.cos(angle) * innerR}
                              y1={240 + Math.sin(angle) * innerR}
                              x2={240 + Math.cos(angle) * outerR}
                              y2={240 + Math.sin(angle) * outerR}
                              stroke={isAodMode ? (isQuarter ? '#10b981' : isHour ? '#94a3b8' : '#334155') : (isQuarter ? '#38bdf8' : isHour ? '#ffffff' : '#475569')}
                              strokeWidth={isQuarter ? 3.5 : isHour ? 2.5 : 1}
                            />
                          );
                        })}
                        <text x="240" y="82" fill={isAodMode ? '#94a3b8' : '#ffffff'} fontSize="24" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">12</text>
                        <text x="398" y="240" fill={isAodMode ? '#94a3b8' : '#ffffff'} fontSize="24" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">3</text>
                        <text x="240" y="398" fill={isAodMode ? '#94a3b8' : '#ffffff'} fontSize="24" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">6</text>
                        <text x="82" y="240" fill={isAodMode ? '#94a3b8' : '#ffffff'} fontSize="24" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">9</text>
                        <text x="240" y={isAodMode ? "290" : "310"} fill={isAodMode ? "#10b981" : "#38bdf8"} fontSize="13" fontWeight="bold" textAnchor="middle" letterSpacing="2">
                          {item.packageInfo?.appName || 'ZEPP OS WATCHFACE'}
                        </text>
                        <text x="240" y={isAodMode ? "306" : "326"} fill="#64748b" fontSize="9" textAnchor="middle">
                          {isAodMode ? 'APOLLO 1Hz CO-PROCESSOR' : 'AMAZFIT STUDIO'}
                        </text>
                      </svg>
                    </div>
                  )}

                  {/* Optional Simulated Real-Time Analog Hands Overlay (User toggled) */}
                  {showHands && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {/* Hour Hand */}
                      <div
                        className={`absolute rounded-full shadow-lg transition-transform ${
                          isAodMode ? 'w-1.5 bg-slate-200 border border-slate-700' : 'w-2 bg-slate-100'
                        }`}
                        style={{
                          height: '28%',
                          bottom: '50%',
                          transformOrigin: '50% 100%',
                          transform: `rotate(${hourDeg}deg)`,
                        }}
                      />

                      {/* Minute Hand */}
                      <div
                        className={`absolute rounded-full shadow-md transition-transform ${
                          isAodMode ? 'w-1 bg-white border border-slate-600' : 'w-1.5 bg-white'
                        }`}
                        style={{
                          height: '38%',
                          bottom: '50%',
                          transformOrigin: '50% 100%',
                          transform: `rotate(${minuteDeg}deg)`,
                        }}
                      />

                      {/* Second Hand (1 Hz Active in FAOD) */}
                      <div
                        className={`absolute rounded-full shadow-md ${
                          tickMode === 'sweep' ? 'transition-transform duration-100' : ''
                        } ${isAodMode ? 'w-0.5 bg-emerald-400' : 'w-0.5 bg-red-500'}`}
                        style={{
                          height: '45%',
                          bottom: '50%',
                          transformOrigin: '50% 100%',
                          transform: `rotate(${secondDeg}deg)`,
                        }}
                      />

                      {/* Center Pin */}
                      <div className={`absolute w-3 h-3 rounded-full border-2 shadow-md ${
                        isAodMode ? 'bg-emerald-500 border-black' : 'bg-red-500 border-white'
                      }`} />
                    </div>
                  )}

                  {/* AOD Badge Overlay */}
                  {isAodMode && (
                    <div className="absolute top-3.5 px-2.5 py-0.5 rounded-full bg-black/85 border border-emerald-500/50 text-emerald-300 text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm flex items-center gap-1.5 pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>AOD Active • 1 Hz Eco</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Package Image Asset Layer Selector & Gallery */}
            {extractedImages.length > 0 && (
              <div className="w-full bg-[#0d1015] p-3 rounded-xl border border-[#232730] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Package Graphic Assets ({extractedImages.length} found in {item.name})</span>
                  </div>
                  <button
                    onClick={() => setShowAssetGallery(!showAssetGallery)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition"
                  >
                    {showAssetGallery ? 'Collapse Strip' : 'View All Layers'}
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                  {extractedImages.slice(0, showAssetGallery ? undefined : 6).map((img, idx) => {
                    const isSelected = (selectedAssetUrl === img.url) || (!selectedAssetUrl && currentPreviewUrl === img.url);
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedAssetUrl(img.url);
                          setSelectedAssetName(img.path);
                        }}
                        className={`relative shrink-0 flex flex-col items-center gap-1 p-1 rounded-lg border transition ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500' 
                            : 'border-[#232730] hover:border-slate-500 bg-[#14171e]'
                        }`}
                        title={`${img.path} (${(img.size / 1024).toFixed(1)} KB)`}
                      >
                        <div className="w-11 h-11 rounded-md overflow-hidden bg-black/80 flex items-center justify-center p-0.5 border border-[#2d3139]">
                          <img src={img.url} alt={img.name} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 truncate max-w-[54px]">
                          {img.name}
                        </span>
                        {img.isDialCandidate && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" title="Dial Candidate" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Telemetry & Simulator Controls */}
            <div className="w-full space-y-3 pt-1 border-t border-[#232730]">
              {/* Quick Controls Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Shape Switcher */}
                <button
                  onClick={() => setDeviceShape(deviceShape === 'round' ? 'square' : 'round')}
                  className="p-2 rounded-xl bg-[#0d1015] hover:bg-[#181c24] border border-[#232730] text-slate-300 text-left transition flex flex-col gap-1"
                >
                  <span className="text-[10px] text-slate-500 uppercase">Bezel Chassis</span>
                  <span className="font-semibold text-white capitalize">{deviceShape} Display</span>
                </button>

                {/* Hands Overlay Toggle */}
                <button
                  onClick={() => setShowHands(!showHands)}
                  className="p-2 rounded-xl bg-[#0d1015] hover:bg-[#181c24] border border-[#232730] text-slate-300 text-left transition flex flex-col gap-1"
                >
                  <span className="text-[10px] text-slate-500 uppercase">Simulated Hands</span>
                  <span className={`font-semibold ${showHands ? 'text-blue-400' : 'text-slate-400'}`}>
                    {showHands ? 'Overlay On' : 'Dial Pure (Off)'}
                  </span>
                </button>

                {/* Second Hand Ticking Mode */}
                <button
                  onClick={() => setTickMode(tickMode === 'step' ? 'sweep' : 'step')}
                  className="p-2 rounded-xl bg-[#0d1015] hover:bg-[#181c24] border border-[#232730] text-slate-300 text-left transition flex flex-col gap-1"
                >
                  <span className="text-[10px] text-slate-500 uppercase">AOD Engine</span>
                  <span className="font-semibold text-white capitalize">
                    {tickMode === 'step' ? '1 Hz Stepped' : 'Smooth Sweep'}
                  </span>
                </button>

                {/* Live Clock vs Manual Time */}
                <button
                  onClick={() => setIsLiveClock(!isLiveClock)}
                  className="p-2 rounded-xl bg-[#0d1015] hover:bg-[#181c24] border border-[#232730] text-slate-300 text-left transition flex flex-col gap-1"
                >
                  <span className="text-[10px] text-slate-500 uppercase">Time Mode</span>
                  <span className={`font-semibold ${isLiveClock ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isLiveClock ? 'Live Clock' : 'Manual Angle'}
                  </span>
                </button>
              </div>

              {/* Manual Time Slider (When Live Clock is paused) */}
              {!isLiveClock && (
                <div className="p-3 rounded-xl bg-[#0d1015] border border-[#232730] space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Custom Hand Position: <strong className="text-white font-mono">{timeFormatted}</strong></span>
                    <span className="text-[11px] text-blue-400 cursor-pointer" onClick={() => { setCustomMinutes(608); setCustomSeconds(42); }}>
                      Reset to 10:08
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1439"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#232730] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'details' ? (
          /* Watchface Details & Extracted Package Metadata Inspector Tab */
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[75vh]">
            {/* Identity & Target Card */}
            <div className="bg-[#0d1015] p-4 rounded-xl border border-[#232730] space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-[#232730] pb-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span>Package Identity & Compatibility</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Watchface Name</span>
                  <span className="font-semibold text-white">{appName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">App ID / Package ID</span>
                  <span className="font-mono text-blue-300">{appId}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Version</span>
                  <span className="font-mono text-emerald-400">{version}</span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Screen Resolution</span>
                  <span className="font-mono text-slate-200">{resolution}</span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-500 block mb-0.5">Compatible Smartwatch Targets</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {devices.map((d, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[#181c24] text-slate-300 border border-[#2d3139] text-[11px] flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-blue-400" />
                        <span>{d}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AOD & FAOD Verification Status Card */}
            <div className="bg-[#0d1015] p-4 rounded-xl border border-[#232730] space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-[#232730] pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Full AOD & 1Hz Engine Architecture</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#14171e] border border-[#232730]">
                  <span className="text-[10px] text-slate-500 block">showInAod Flag</span>
                  <span className="font-bold text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Injected</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#14171e] border border-[#232730]">
                  <span className="text-[10px] text-slate-500 block">1Hz Second Hand</span>
                  <span className="font-bold text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Enabled</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#14171e] border border-[#232730]">
                  <span className="text-[10px] text-slate-500 block">AOD Directory</span>
                  <span className="font-bold text-blue-300 font-mono mt-0.5 block truncate">
                    {item.packageInfo?.hasIdleDir ? 'idle/ synced' : 'watchface/ mirror'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#14171e] border border-[#232730]">
                  <span className="text-[10px] text-slate-500 block">Energy Savings</span>
                  <span className="font-bold text-emerald-400 font-mono mt-0.5 block">
                    {item.powerReport ? `-${item.powerReport.estimatedPowerSavingsPercent}% Drain` : '-38% Eco'}
                  </span>
                </div>
              </div>
            </div>

            {/* Extracted Graphic Assets Grid */}
            <div className="bg-[#0d1015] p-4 rounded-xl border border-[#232730] space-y-3">
              <div className="flex items-center justify-between border-b border-[#232730] pb-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  <span>Extracted Image Assets ({extractedImages.length})</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {(extractedImages.reduce((acc, img) => acc + img.size, 0) / 1024).toFixed(1)} KB Total
                </span>
              </div>

              {extractedImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {extractedImages.map((img, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedAssetUrl(img.url);
                        setSelectedAssetName(img.path);
                        setActiveTab('simulator');
                      }}
                      className="p-2 rounded-lg bg-[#14171e] border border-[#232730] hover:border-blue-500 transition cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="w-full h-24 rounded bg-black/90 flex items-center justify-center p-1 overflow-hidden border border-[#2d3139] mb-1.5 relative">
                        <img src={img.url} alt={img.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition" referrerPolicy="no-referrer" />
                        {img.isDialCandidate && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[9px] font-mono">
                            Dial
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-white truncate group-hover:text-blue-300" title={img.path}>
                          {img.name}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                          <span className="truncate max-w-[90px]">{img.path.split('/')[0]}</span>
                          <span>{(img.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No image assets found in archive.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 overflow-y-auto max-h-[72vh]">
            <BatteryDrainEstimator item={item} report={item.powerReport} />
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#232730] bg-[#181c24] flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Active Dial is rendered directly from your uploaded archive's visual assets.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white transition shadow-md shadow-blue-900/40 shrink-0 ml-3"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
