import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileCode, 
  Zap, 
  Check, 
  Copy,
  FolderTree,
  BatteryCharging,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Clock,
  Sparkles,
  ShieldCheck,
  Leaf,
  Activity,
  FileJson,
  Search,
  CheckCheck
} from 'lucide-react';
import { WatchfaceFileItem, ManifestDiagnosticResult } from '../types';
import { generateManifestDiagnostic } from '../utils/converter';
import { BatteryDrainEstimator } from './BatteryDrainEstimator';

interface DiffModalProps {
  item: WatchfaceFileItem | null;
  onClose: () => void;
}

export const DiffModal: React.FC<DiffModalProps> = ({ item, onClose }) => {
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'manifest' | 'battery' | 'tokens' | 'files'>('diagnostic');
  const [copied, setCopied] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'showInAod' | 'secondHand' | 'target_sync'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!item) return null;

  const handleCopyManifest = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const powerReport = item.powerReport;

  // Derive or get diagnostic result
  const diagnostic: ManifestDiagnosticResult = useMemo(() => {
    if (item.manifestDiagnostic) {
      return item.manifestDiagnostic;
    }
    return generateManifestDiagnostic(
      item.manifestOriginal,
      item.manifestPatched,
      item.manifestPath || 'app.json',
      {
        onlyNormalToAll: item.stats?.tokensReplaced.onlyNormalToAll || 0,
        showInAodToTrue: item.stats?.tokensReplaced.showInAodToTrue || 0,
        otherAodPatches: item.stats?.tokensReplaced.otherAodPatches || 0,
        secondHandUnfrozen: true,
        timePointerFound: true
      }
    );
  }, [item]);

  const filteredAttributes = useMemo(() => {
    return diagnostic.attributesList.filter(attr => {
      const matchesCategory = filterCategory === 'all' || attr.category === filterCategory;
      const matchesSearch = searchQuery === '' || 
        attr.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attr.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attr.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [diagnostic, filterCategory, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f1115]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="diff-modal-container"
        className="w-full max-w-5xl max-h-[90vh] rounded-xl bg-[#16191f] border border-[#2d3139] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#2d3139] flex items-center justify-between bg-[#1a1d23]">
          <div className="flex items-center gap-3">
            {item.previewUrl ? (
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500/40 shrink-0 bg-black shadow-md">
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-[#0f1115] border border-[#2d3139] text-blue-500">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Manifest Diagnostic & AOD Inspector: <span className="text-blue-400">{item.name}</span>
              </h3>
              <p className="text-xs text-[#94a3b8]">
                Attribute injection verification, second-hand pointer checks & power telemetry
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
        <div className="flex border-b border-[#2d3139] bg-[#0f1115] px-6 gap-3 sm:gap-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'diagnostic'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>AOD Manifest Diagnostic</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              VERIFIED
            </span>
          </button>

          <button
            onClick={() => setActiveTab('manifest')}
            className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'manifest'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Side-by-Side Manifest Diff</span>
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
            <span>Power & Battery Audit</span>
            {powerReport && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                -{powerReport.estimatedPowerSavingsPercent}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tokens')}
            className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'tokens'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Token Replacements ({
              (item.stats?.tokensReplaced.onlyNormalToAll || 0) +
              (item.stats?.tokensReplaced.showInAodToTrue || 0) +
              (item.stats?.tokensReplaced.otherAodPatches || 0)
            })</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'files'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Archive Tree ({item.packageInfo?.filesList.length || 0})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* TAB 1: AOD MANIFEST DIAGNOSTIC (PRIMARY TOOL) */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-5">
              {/* Summary Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. showInAod Verification Card */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  diagnostic.showInAodStatus.verified 
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20' 
                    : 'bg-rose-950/20 border-rose-500/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>'showInAod' Injection</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {diagnostic.showInAodStatus.verified ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="text-xl font-bold text-white font-mono flex items-baseline gap-2">
                      <span className="text-emerald-300">{diagnostic.showInAodStatus.injectedCount} node(s)</span>
                      <span className="text-xs text-[#94a3b8] font-normal">injected</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">
                      {diagnostic.showInAodStatus.details}
                    </p>
                  </div>
                </div>

                {/* 2. secondHand Pointer Card */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  diagnostic.secondHandStatus.verified 
                    ? 'bg-blue-950/20 border-blue-500/40 shadow-lg shadow-blue-950/20' 
                    : 'bg-rose-950/20 border-rose-500/40'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-blue-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>'secondHand' Injected</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-blue-950 text-blue-300 border border-blue-800">
                      {diagnostic.secondHandStatus.verified ? 'VERIFIED' : 'NOT INJECTED'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="text-xl font-bold text-white font-mono flex items-baseline gap-2">
                      <span className="text-blue-300">{diagnostic.secondHandStatus.injectedCount} target(s)</span>
                      <span className="text-xs text-[#94a3b8] font-normal">active in AOD</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">
                      {diagnostic.secondHandStatus.details}
                    </p>
                  </div>
                </div>

                {/* 3. Target Idle Mapping Card */}
                <div className="p-4 rounded-xl bg-[#0f1115] border border-[#2d3139] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-[#94a3b8] flex items-center gap-1.5">
                      <FolderTree className="w-4 h-4 text-amber-400" />
                      <span>Idle Directory Target</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-[#1a1d23] text-amber-300 border border-[#2d3139]">
                      SYNCHRONIZED
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="text-xl font-bold text-white font-mono flex items-baseline gap-2">
                      <span>{diagnostic.idleSyncStatus.locations.length || 1} path(s)</span>
                      <span className="text-xs text-emerald-400 font-normal">1:1 matched</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] mt-1 leading-relaxed">
                      {diagnostic.idleSyncStatus.details}
                    </p>
                  </div>
                </div>
              </div>

              {/* Universal Compatibility Matrix Row */}
              <div className="p-4 rounded-xl bg-[#0f1115] border border-cyan-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Universal Watchface Compatibility Matrix (Zepp OS 1.0 ↔ 2.0 ↔ 3.x)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {item.packageInfo?.compatibility?.polyfillsInjected ? 'POLYFILLS ACTIVE' : 'COMPATIBLE'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-[#16191f] border border-[#2d3139] flex items-center justify-between">
                    <span className="text-[#94a3b8]">Detected SDK Generation</span>
                    <span className="font-mono font-bold text-cyan-300 tabular-nums">
                      Zepp OS {item.packageInfo?.compatibility?.sdkVersion || '1.0'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#16191f] border border-[#2d3139] flex items-center justify-between">
                    <span className="text-[#94a3b8]">Script Bundler Format</span>
                    <span className="font-mono font-bold text-white uppercase tabular-nums">
                      {item.packageInfo?.compatibility?.bundlerType || 'standard'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#16191f] border border-[#2d3139] flex items-center justify-between">
                    <span className="text-[#94a3b8]">Native Display Geometry</span>
                    <span className="font-mono font-bold text-emerald-300 tabular-nums">
                      {item.packageInfo?.compatibility
                        ? `${item.packageInfo.compatibility.nativeWidth}×${item.packageInfo.compatibility.nativeHeight} (${item.packageInfo.compatibility.screenShape})`
                        : item.packageInfo?.resolution || '480×480'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filtering and Search Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#94a3b8]">Filter Category:</span>
                  <div className="flex items-center gap-1 bg-[#0f1115] p-1 rounded-lg border border-[#2d3139]">
                    <button
                      onClick={() => setFilterCategory('all')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                        filterCategory === 'all'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      All ({diagnostic.attributesList.length})
                    </button>
                    <button
                      onClick={() => setFilterCategory('showInAod')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                        filterCategory === 'showInAod'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      showInAod ({diagnostic.attributesList.filter(a => a.category === 'showInAod').length})
                    </button>
                    <button
                      onClick={() => setFilterCategory('secondHand')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                        filterCategory === 'secondHand'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      secondHand ({diagnostic.attributesList.filter(a => a.category === 'secondHand').length})
                    </button>
                    <button
                      onClick={() => setFilterCategory('target_sync')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                        filterCategory === 'target_sync'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      Target Sync ({diagnostic.attributesList.filter(a => a.category === 'target_sync').length})
                    </button>
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748b]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search attribute or path..."
                    className="w-full bg-[#0f1115] border border-[#2d3139] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Side-by-Side Diagnostic Findings Table */}
              <div className="rounded-xl border border-[#2d3139] bg-[#0f1115] overflow-hidden shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1a1d23] border-b border-[#2d3139] text-[#94a3b8] text-[11px] uppercase font-semibold">
                      <th className="p-3.5 w-1/4">Manifest Key & JSON Path</th>
                      <th className="p-3.5 w-1/4">Original Value</th>
                      <th className="p-3.5 w-1/4">Patched Value</th>
                      <th className="p-3.5 w-1/4 text-right">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3139] font-mono text-[11px]">
                    {filteredAttributes.length > 0 ? (
                      filteredAttributes.map((attr, idx) => {
                        const isOriginalFalsy = attr.originalValue === false || String(attr.originalValue).includes('not set') || String(attr.originalValue).includes('undefined') || String(attr.originalValue).includes('missing');
                        const isPatchedTruthy = attr.patchedValue === true || attr.status === 'injected' || attr.status === 'verified_true';

                        return (
                          <tr key={idx} className="hover:bg-[#16191f] transition-colors">
                            <td className="p-3.5 align-top">
                              <div className="font-sans font-bold text-white flex items-center gap-1.5">
                                <span>{attr.key}</span>
                                {attr.category === 'showInAod' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-mono font-bold">
                                    AOD
                                  </span>
                                )}
                                {attr.category === 'secondHand' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono font-bold">
                                    POINTER
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#64748b] font-mono mt-0.5 break-all">
                                {attr.path}
                              </div>
                              <div className="text-[11px] font-sans text-[#94a3b8] mt-1 leading-snug">
                                {attr.description}
                              </div>
                            </td>

                            {/* Original Value */}
                            <td className="p-3.5 align-top">
                              <div className={`p-2 rounded border inline-block ${
                                isOriginalFalsy 
                                  ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' 
                                  : 'bg-[#1a1d23] border-[#2d3139] text-[#94a3b8]'
                              }`}>
                                <span className="font-bold">
                                  {typeof attr.originalValue === 'boolean' 
                                    ? String(attr.originalValue) 
                                    : String(attr.originalValue)}
                                </span>
                              </div>
                            </td>

                            {/* Patched Value */}
                            <td className="p-3.5 align-top">
                              <div className={`p-2 rounded border inline-block ${
                                isPatchedTruthy 
                                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 font-bold' 
                                  : 'bg-blue-950/30 border-blue-500/50 text-blue-300'
                              }`}>
                                <span>
                                  {typeof attr.patchedValue === 'boolean' 
                                    ? String(attr.patchedValue) 
                                    : String(attr.patchedValue)}
                                </span>
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="p-3.5 align-top text-right">
                              {attr.status === 'injected' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                                  <Sparkles className="w-3 h-3 text-emerald-400" />
                                  <span>INJECTED (TRUE)</span>
                                </span>
                              )}
                              {attr.status === 'verified_true' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                                  <span>VERIFIED TRUE</span>
                                </span>
                              )}
                              {attr.status === 'modified' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold px-2 py-1 rounded bg-blue-950 text-blue-300 border border-blue-700">
                                  <Check className="w-3 h-3 text-blue-400" />
                                  <span>MODIFIED</span>
                                </span>
                              )}
                              {attr.status === 'preserved' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium px-2 py-1 rounded bg-[#1a1d23] text-[#94a3b8] border border-[#2d3139]">
                                  <span>PRESERVED</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-[#94a3b8] font-sans">
                          No matching attributes found for "{searchQuery}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Script Engine Diagnostic Note */}
              <div className="p-4 rounded-xl bg-[#0f1115] border border-[#2d3139] flex items-start gap-3 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white">Firmware Runtime & Co-Processor Assurance</div>
                  <p className="text-[#94a3b8] leading-relaxed">
                    Zepp OS watchfaces running on low-power Apollo micro-controllers require both manifest-level registration (<code className="text-emerald-400 font-mono">showInAod: true</code> & <code className="text-emerald-400 font-mono">secondHand: true</code>) and widget-level visibility (<code className="text-emerald-400 font-mono">hmUI.vis_mode.ALL</code>). All required flags have been injected into this build.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANIFEST DIFF */}
          {activeTab === 'manifest' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-sans text-[#94a3b8]">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Target mapping synchronized: <code className="text-white bg-[#0f1115] border border-[#2d3139] px-1.5 py-0.5 rounded">targets.idle = targets.watchface</code>
                </span>

                {item.manifestPatched && (
                  <button
                    onClick={() => handleCopyManifest(item.manifestPatched!)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1a1d23] text-[#e2e8f0] hover:text-white border border-[#2d3139] hover:bg-[#2d3139] transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Patched JSON</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                {/* Original Manifest */}
                <div className="rounded-lg border border-[#2d3139] bg-[#0f1115] p-4">
                  <div className="text-[11px] uppercase font-bold text-[#64748b] mb-2 font-sans flex items-center justify-between">
                    <span>Original Manifest</span>
                    <span className="text-[#475569] font-mono">{item.manifestPath || 'app.json'}</span>
                  </div>
                  <pre className="text-[#94a3b8] whitespace-pre-wrap break-all overflow-x-auto max-h-[340px] text-[11px] leading-relaxed">
                    {item.manifestOriginal || '// No original manifest found'}
                  </pre>
                </div>

                {/* Patched Manifest */}
                <div className="rounded-lg border border-blue-900/40 bg-[#0f1115] p-4">
                  <div className="text-[11px] uppercase font-bold text-blue-400 mb-2 font-sans flex items-center justify-between">
                    <span>Patched FAOD Manifest</span>
                    <span className="text-emerald-400 text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/50">
                      SYNCHRONIZED (showInAod & secondHand)
                    </span>
                  </div>
                  <pre className="text-blue-200 whitespace-pre-wrap break-all overflow-x-auto max-h-[340px] text-[11px] leading-relaxed">
                    {item.manifestPatched || '// No patched manifest available'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BATTERY & POWER AUDIT */}
          {activeTab === 'battery' && (
            <div className="space-y-5">
              <BatteryDrainEstimator item={item} report={powerReport} />
            </div>
          )}

          {/* TAB 4: TOKENS */}
          {activeTab === 'tokens' && (
            <div className="space-y-4 font-sans text-xs">
              <p className="text-[#94a3b8] leading-relaxed">
                Zepp OS widgets hide elements during AOD when set to <code className="text-amber-400 bg-[#0f1115] border border-[#2d3139] px-1 rounded">hmUI.vis_mode.ONLY_NORMAL</code> or <code className="text-amber-400 bg-[#0f1115] border border-[#2d3139] px-1 rounded">showInAod: false</code>. The AST patcher unlocks these widgets and applies smart energy throttling:
              </p>

              <div className="rounded-lg border border-[#2d3139] bg-[#0f1115] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1a1d23] border-b border-[#2d3139] text-[#94a3b8] text-[11px] uppercase font-semibold">
                      <th className="p-3">Visibility / Energy Rule</th>
                      <th className="p-3">Original Stock Value</th>
                      <th className="p-3">FAOD Transformed Value</th>
                      <th className="p-3 text-right">Replacements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3139] font-mono text-[11px]">
                    <tr className="hover:bg-[#16191f]">
                      <td className="p-3 font-sans font-medium text-white">hmUI Widget Mode</td>
                      <td className="p-3 text-rose-400">hmUI.vis_mode.ONLY_NORMAL</td>
                      <td className="p-3 text-emerald-400">hmUI.vis_mode.ALL</td>
                      <td className="p-3 text-right font-bold text-blue-400">
                        {item.stats?.tokensReplaced.onlyNormalToAll || 0}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#16191f]">
                      <td className="p-3 font-sans font-medium text-white">Explicit AOD Flag</td>
                      <td className="p-3 text-rose-400">showInAod: false</td>
                      <td className="p-3 text-emerald-400">showInAod: true</td>
                      <td className="p-3 text-right font-bold text-blue-400">
                        {item.stats?.tokensReplaced.showInAodToTrue || 0}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#16191f]">
                      <td className="p-3 font-sans font-medium text-white">Hide on AOD Flag</td>
                      <td className="p-3 text-rose-400">hideOnAod: true</td>
                      <td className="p-3 text-emerald-400">hideOnAod: false</td>
                      <td className="p-3 text-right font-bold text-blue-400">
                        {item.stats?.tokensReplaced.otherAodPatches || 0}
                      </td>
                    </tr>
                    <tr className="hover:bg-[#16191f]">
                      <td className="p-3 font-sans font-medium text-emerald-300">Energy 1-Min Throttle</td>
                      <td className="p-3 text-amber-400">1000ms 1Hz continuous</td>
                      <td className="p-3 text-emerald-400">60,000ms idle interval</td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        {item.stats?.energyStats?.timersThrottled || 0}
                      </td>
                    </tr>
                    <tr className="bg-[#1a1d23]/50">
                      <td className="p-3 font-sans font-semibold text-[#e2e8f0]">Idle Directory Overwrite</td>
                      <td className="p-3 font-sans text-[#94a3b8]">Stripped stock idle/ assets</td>
                      <td className="p-3 font-sans text-[#94a3b8]">1:1 Watchface assets mirrored</td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        {item.stats?.idleFilesReplaced || 0} files
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: FILES */}
          {activeTab === 'files' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="text-[#94a3b8] font-sans text-xs">
                Total entries inside package: <span className="text-white font-bold">{item.packageInfo?.filesList.length || 0}</span>
              </div>
              <div className="rounded-lg border border-[#2d3139] bg-[#0f1115] p-4 max-h-[340px] overflow-y-auto space-y-1">
                {item.packageInfo?.filesList.map((path, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[#e2e8f0] py-0.5 hover:text-blue-400">
                    <span className="text-[#475569] select-none text-[11px] w-6 text-right">{idx + 1}</span>
                    <span className={path.startsWith('watchface/') ? 'text-blue-300' : path.startsWith('idle/') ? 'text-emerald-300' : 'text-[#94a3b8]'}>
                      {path}
                    </span>
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

