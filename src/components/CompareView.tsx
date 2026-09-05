import React, { useState } from 'react';
import { 
  GitCompare, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Cpu, 
  Maximize2, 
  Clock, 
  Sparkles
} from 'lucide-react';
import JSZip from 'jszip';
import { extractWatchfaceMedia } from '../utils/converter';

interface WatchfaceSummary {
  fileName: string;
  fileSize: number;
  appName: string;
  appId?: string;
  version?: string;
  deviceTargets: string[];
  hasWatchfaceFolder: boolean;
  hasIdleFolder: boolean;
  totalImages: number;
  hasCode: boolean;
  manifestRaw?: any;
  idleModuleMapped: boolean;
  previewUrl?: string;
}

export const CompareView: React.FC = () => {
  const [fileA, setFileA] = useState<WatchfaceSummary | null>(null);
  const [fileB, setFileB] = useState<WatchfaceSummary | null>(null);
  const [isAnalyzingA, setIsAnalyzingA] = useState(false);
  const [isAnalyzingB, setIsAnalyzingB] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const analyzeZip = async (file: File): Promise<WatchfaceSummary> => {
    const zip = await JSZip.loadAsync(file);
    let appName = file.name.replace(/\.(zip|zpk)$/i, '');
    let appId: string | undefined;
    let version: string | undefined;
    const deviceTargets: string[] = [];
    let hasWatchfaceFolder = false;
    let hasIdleFolder = false;
    let totalImages = 0;
    let hasCode = false;
    let manifestRaw: any = null;
    let idleModuleMapped = false;
    let previewUrl: string | undefined = undefined;

    // Check files
    const fileKeys = Object.keys(zip.files);
    fileKeys.forEach(f => {
      const lower = f.toLowerCase();
      if (lower.startsWith('watchface/') || lower.includes('/watchface/')) hasWatchfaceFolder = true;
      if (lower.startsWith('idle/') || lower.includes('/idle/')) hasIdleFolder = true;
      if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.tga') || lower.endsWith('.webp')) totalImages++;
      if (lower.endsWith('.js') || lower.endsWith('.bin')) hasCode = true;
    });

    // Extract Preview Image using robust extractor
    const media = await extractWatchfaceMedia([zip]);
    previewUrl = media.previewUrl;

    // Check app.json
    const manifestFile = zip.file('app.json') || zip.file('app.bin');
    if (manifestFile) {
      try {
        const text = await manifestFile.async('text');
        const json = JSON.parse(text);
        manifestRaw = json;
        if (json.app?.appName) appName = json.app.appName;
        if (json.appName) appName = json.appName;
        if (json.app?.appId) appId = json.app.appId;
        if (json.appId) appId = String(json.appId);
        if (json.app?.version?.name) version = json.app.version.name;
        if (json.version?.name) version = json.version.name;

        if (json.targets && typeof json.targets === 'object') {
          Object.keys(json.targets).forEach(k => {
            const target = json.targets[k];
            if (target && target.platforms && Array.isArray(target.platforms)) {
              target.platforms.forEach((p: any) => {
                if (p.name) deviceTargets.push(p.name);
              });
            } else if (typeof target === 'string') {
              deviceTargets.push(k);
            }
          });
        }

        if (json.module?.idle || (json.targets && Object.values(json.targets).some((t: any) => t?.module?.idle))) {
          idleModuleMapped = true;
        }
      } catch {
        // Ignored
      }
    }

    return {
      fileName: file.name,
      fileSize: file.size,
      appName,
      appId,
      version,
      deviceTargets: Array.from(new Set(deviceTargets)),
      hasWatchfaceFolder,
      hasIdleFolder,
      totalImages,
      hasCode,
      manifestRaw,
      idleModuleMapped
    };
  };

  const handleDropA = async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    let file: File | null = null;
    if ('dataTransfer' in e && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if ('target' in e && e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    }
    if (!file) return;

    setIsAnalyzingA(true);
    setErrorMsg(null);
    try {
      const summary = await analyzeZip(file);
      setFileA(summary);
    } catch (err: any) {
      setErrorMsg(`Failed to analyze Watchface A: ${err.message || err}`);
    } finally {
      setIsAnalyzingA(false);
    }
  };

  const handleDropB = async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    let file: File | null = null;
    if ('dataTransfer' in e && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if ('target' in e && e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    }
    if (!file) return;

    setIsAnalyzingB(true);
    setErrorMsg(null);
    try {
      const summary = await analyzeZip(file);
      setFileB(summary);
    } catch (err: any) {
      setErrorMsg(`Failed to analyze Watchface B: ${err.message || err}`);
    } finally {
      setIsAnalyzingB(false);
    }
  };

  return (
    <div id="compare-view-container" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-400">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Side-by-Side Watchface Comparator
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Diagnostic
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Upload two watchface packages to instantly spot differences in target devices, AOD structures, and script configurations.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Dual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Watchface A */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              Watchface A (Reference)
            </span>
            {fileA && (
              <button 
                onClick={() => setFileA(null)} 
                className="text-xs text-rose-400 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {!fileA ? (
            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40 min-h-[220px]">
              <UploadCloud className="w-10 h-10 text-indigo-400 mb-3" />
              <span className="text-sm font-semibold text-slate-200 text-center">
                {isAnalyzingA ? 'Analyzing...' : 'Drop First Watchface (.zip / .zpk)'}
              </span>
              <span className="text-xs text-slate-400 mt-1">or click to browse</span>
              <input 
                type="file" 
                accept=".zip,.zpk" 
                className="hidden" 
                onChange={handleDropA} 
                disabled={isAnalyzingA}
              />
            </label>
          ) : (
            <div className="space-y-3 flex-1 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-start gap-3">
                {fileA.previewUrl && (
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-indigo-500/40 shrink-0 bg-black shadow-md">
                    <img
                      src={fileA.previewUrl}
                      alt={fileA.appName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-100 text-base truncate">{fileA.appName}</h4>
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{fileA.fileName}</p>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded shrink-0">
                      {(fileA.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Devices:</span>
                  <span className="text-indigo-300 font-medium">{fileA.deviceTargets.join(', ') || 'Generic / None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AOD (idle/) Directory:</span>
                  <span className={fileA.hasIdleFolder ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                    {fileA.hasIdleFolder ? 'Present ✓' : 'Missing ✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Images Count:</span>
                  <span className="text-slate-200">{fileA.totalImages} images</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Watchface B */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700">
              Watchface B (Comparison)
            </span>
            {fileB && (
              <button 
                onClick={() => setFileB(null)} 
                className="text-xs text-rose-400 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {!fileB ? (
            <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40 min-h-[220px]">
              <UploadCloud className="w-10 h-10 text-cyan-400 mb-3" />
              <span className="text-sm font-semibold text-slate-200 text-center">
                {isAnalyzingB ? 'Analyzing...' : 'Drop Second Watchface (.zip / .zpk)'}
              </span>
              <span className="text-xs text-slate-400 mt-1">or click to browse</span>
              <input 
                type="file" 
                accept=".zip,.zpk" 
                className="hidden" 
                onChange={handleDropB} 
                disabled={isAnalyzingB}
              />
            </label>
          ) : (
            <div className="space-y-3 flex-1 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-start gap-3">
                {fileB.previewUrl && (
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-500/40 shrink-0 bg-black shadow-md">
                    <img
                      src={fileB.previewUrl}
                      alt={fileB.appName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-100 text-base truncate">{fileB.appName}</h4>
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{fileB.fileName}</p>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded shrink-0">
                      {(fileB.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Devices:</span>
                  <span className="text-cyan-300 font-medium">{fileB.deviceTargets.join(', ') || 'Generic / None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">AOD (idle/) Directory:</span>
                  <span className={fileB.hasIdleFolder ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                    {fileB.hasIdleFolder ? 'Present ✓' : 'Missing ✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Images Count:</span>
                  <span className="text-slate-200">{fileB.totalImages} images</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Analysis Table */}
      {fileA && fileB && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">Differential Diagnostic Breakdown</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Feature / Metric</th>
                  <th className="py-3 px-4 text-indigo-300">{fileA.appName}</th>
                  <th className="py-3 px-4 text-cyan-300">{fileB.appName}</th>
                  <th className="py-3 px-4 text-right">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {/* AOD Idle State */}
                <tr>
                  <td className="py-3 px-4 font-medium flex items-center gap-2 text-slate-200">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Always-On Display (AOD)
                  </td>
                  <td className="py-3 px-4">
                    {fileA.hasIdleFolder ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                      </span>
                    ) : (
                      <span className="text-amber-400">Missing</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {fileB.hasIdleFolder ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                      </span>
                    ) : (
                      <span className="text-amber-400">Missing</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {fileA.hasIdleFolder === fileB.hasIdleFolder ? (
                      <span className="text-slate-400 text-xs">Identical</span>
                    ) : (
                      <span className="text-amber-300 text-xs font-semibold">Different</span>
                    )}
                  </td>
                </tr>

                {/* Target Hardware */}
                <tr>
                  <td className="py-3 px-4 font-medium flex items-center gap-2 text-slate-200">
                    <Cpu className="w-4 h-4 text-slate-400" />
                    Target Platforms
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-indigo-200">
                    {fileA.deviceTargets.join(', ') || 'Universal'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-cyan-200">
                    {fileB.deviceTargets.join(', ') || 'Universal'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {JSON.stringify(fileA.deviceTargets) === JSON.stringify(fileB.deviceTargets) ? (
                      <span className="text-slate-400 text-xs">Identical</span>
                    ) : (
                      <span className="text-indigo-300 text-xs font-semibold">Targets Differ</span>
                    )}
                  </td>
                </tr>

                {/* Asset Images */}
                <tr>
                  <td className="py-3 px-4 font-medium flex items-center gap-2 text-slate-200">
                    <Layers className="w-4 h-4 text-slate-400" />
                    Image Elements
                  </td>
                  <td className="py-3 px-4 text-xs">{fileA.totalImages} resources</td>
                  <td className="py-3 px-4 text-xs">{fileB.totalImages} resources</td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-slate-400 text-xs">
                      {Math.abs(fileA.totalImages - fileB.totalImages)} img difference
                    </span>
                  </td>
                </tr>

                {/* Package Size */}
                <tr>
                  <td className="py-3 px-4 font-medium flex items-center gap-2 text-slate-200">
                    <Maximize2 className="w-4 h-4 text-slate-400" />
                    Archive File Size
                  </td>
                  <td className="py-3 px-4 text-xs">{(fileA.fileSize / 1024).toFixed(1)} KB</td>
                  <td className="py-3 px-4 text-xs">{(fileB.fileSize / 1024).toFixed(1)} KB</td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-slate-400 text-xs">
                      {((fileB.fileSize - fileA.fileSize) / 1024).toFixed(1)} KB delta
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
