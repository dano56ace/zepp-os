import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ChevronDown,
  ChevronUp,
  Terminal
} from 'lucide-react';

import { 
  ConversionOptions, 
  DEFAULT_CONVERSION_OPTIONS, 
  LogMessage, 
  WatchfaceFileItem 
} from './types';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { QueueList } from './components/QueueList';
import { TerminalLog } from './components/TerminalLog';
import { DiffModal } from './components/DiffModal';
import { GuideModal } from './components/GuideModal';
import { SettingsModal } from './components/SettingsModal';
import { DeviceSelector } from './components/DeviceSelector';
import { CompareView } from './components/CompareView';
import { WatchPreviewModal } from './components/WatchPreviewModal';
import { 
  convertWatchfacePackage, 
  createLog, 
  downloadBatchZip, 
  downloadBlob,
  extractQuickPreview 
} from './utils/converter';
import { createSampleWatchfacePackage } from './utils/sampleWatchface';

export default function App() {
  const [items, setItems] = useState<WatchfaceFileItem[]>([]);
  const [options, setOptions] = useState<ConversionOptions>(DEFAULT_CONVERSION_OPTIONS);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLogItemId, setSelectedLogItemId] = useState<string | undefined>(undefined);
  const [inspectingItem, setInspectingItem] = useState<WatchfaceFileItem | null>(null);
  const [previewingItem, setPreviewingItem] = useState<WatchfaceFileItem | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('universal');
  const [activeTab, setActiveTab] = useState<'converter' | 'compare'>('converter');
  const [showTechnicalLogs, setShowTechnicalLogs] = useState(false);

  const addSystemLog = (level: LogMessage['level'], message: string, details?: string) => {
    const log = createLog(level, message, details);
    setLogs(prev => [...prev, log]);
  };

  useEffect(() => {
    addSystemLog('info', 'Zepp OS Full AOD Engine Initialized for Amazfit Balance & Zepp OS devices.');
  }, []);

  // Handle incoming files
  const handleFilesSelected = (files: File[]) => {
    const newItems: WatchfaceFileItem[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      status: 'idle',
      progress: 0,
      logs: [],
      createdAt: Date.now()
    }));

    setItems(prev => [...prev, ...newItems]);
    addSystemLog('extract', `Added ${newItems.length} watchface package(s) to the conversion queue.`);

    // Asynchronously extract preview images and metadata immediately so thumbnails and details show up
    newItems.forEach(async (item) => {
      try {
        const quickMedia = await extractQuickPreview(item.file);
        if (quickMedia.previewUrl || (quickMedia.extractedImages && quickMedia.extractedImages.length > 0) || quickMedia.packageInfo) {
          setItems(prev => prev.map(i => i.id === item.id ? { 
            ...i, 
            previewUrl: quickMedia.previewUrl,
            aodPreviewUrl: quickMedia.aodPreviewUrl,
            extractedImages: quickMedia.extractedImages,
            packageInfo: quickMedia.packageInfo,
            manifestOriginal: quickMedia.manifestRaw
          } : i));
        }
      } catch {}
    });

    // Automatically trigger conversion for newly dropped items
    runConversionQueue(newItems);
  };

  // Load sample demo watchface
  const handleLoadDemo = async () => {
    try {
      addSystemLog('info', 'Generating synthetic Zepp OS watchface demo...');
      const demoFile = await createSampleWatchfacePackage();
      handleFilesSelected([demoFile]);
    } catch (err) {
      addSystemLog('error', `Failed to load demo watchface: ${err}`);
    }
  };

  // Convert a single item
  const processItem = async (item: WatchfaceFileItem, currentOptions: ConversionOptions) => {
    setSelectedLogItemId(item.id);

    setItems(prev =>
      prev.map(i => (i.id === item.id ? { ...i, status: 'processing', progress: 5 } : i))
    );

    try {
      const result = await convertWatchfacePackage(item, currentOptions, (progress, log) => {
        setItems(prev =>
          prev.map(i => (i.id === item.id ? { ...i, progress } : i))
        );
        if (log) {
          setLogs(prev => [...prev, log]);
        }
      });

      setItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                status: 'completed',
                progress: 100,
                outputBlob: result.outputBlob,
                outputFileName: result.outputFileName,
                outputSize: result.outputSize,
                outputBlobZpk: result.outputBlobZpk,
                outputBlobZip: result.outputBlobZip,
                hasNestedZpk: result.hasNestedZpk,
                nestedZpkName: result.nestedZpkName,
                stats: result.stats,
                powerReport: result.powerReport,
                manifestOriginal: result.manifestOriginal,
                manifestPatched: result.manifestPatched,
                manifestPath: result.manifestPath,
                manifestDiagnostic: result.manifestDiagnostic,
                previewUrl: result.previewUrl || i.previewUrl,
                aodPreviewUrl: result.aodPreviewUrl || i.aodPreviewUrl,
                extractedImages: result.extractedImages || i.extractedImages,
                packageInfo: result.packageInfo,
                logs: result.logs
              }
            : i
        )
      );

      // Trigger Confetti
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#10b981', '#6366f1']
      });

      addSystemLog('success', `✓ File converted successfully: ${item.name}. Click Download to save.`);

      // Auto download ONLY if explicitly enabled by user
      if (currentOptions.autoDownload && result.outputBlob) {
        setTimeout(() => {
          downloadBlob(result.outputBlob!, result.outputFileName!);
        }, 400);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addSystemLog('error', `✗ File conversion failed: ${item.name} - ${errorMsg}`);
      setItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                status: 'error',
                errorMessage: errorMsg
              }
            : i
        )
      );
    }
  };

  // Convert multiple items sequentially
  const runConversionQueue = async (queueToRun?: WatchfaceFileItem[]) => {
    const targetQueue = queueToRun || items.filter(i => i.status === 'idle');
    if (targetQueue.length === 0 || isProcessing) return;

    setIsProcessing(true);
    for (const item of targetQueue) {
      await processItem(item, options);
    }
    setIsProcessing(false);
  };

  const handleStartAll = () => {
    runConversionQueue();
  };

  const handleDownloadAllZip = () => {
    downloadBatchZip(items);
  };

  const handleClearQueue = () => {
    setItems([]);
    setSelectedLogItemId(undefined);
    addSystemLog('info', 'Queue cleared.');
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (selectedLogItemId === id) {
      setSelectedLogItemId(undefined);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#e2e8f0] flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Header */}
      <Header
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'compare' ? (
          <CompareView />
        ) : (
          <>
            {/* Streamlined Target Watch Selector */}
            <DeviceSelector
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              onOpenAdvanced={() => setIsSettingsOpen(true)}
            />

            {/* Drop Zone Area */}
            <DropZone 
              onFilesSelected={handleFilesSelected} 
              onLoadDemo={handleLoadDemo}
              options={options}
              onOptionsChange={setOptions}
              isProcessing={isProcessing} 
              onOpenGuide={() => setIsGuideOpen(true)}
            />

            {/* Conversion Queue List */}
            <QueueList
              items={items}
              isProcessing={isProcessing}
              onStartAll={handleStartAll}
              onDownloadAllZip={handleDownloadAllZip}
              onClearQueue={handleClearQueue}
              onRemoveItem={handleRemoveItem}
              onInspectItem={(item) => setInspectingItem(item)}
              onPreviewItem={(item) => setPreviewingItem(item)}
              onSelectForLog={(item) => {
                setSelectedLogItemId(item.id);
                setShowTechnicalLogs(true);
              }}
              selectedLogItemId={selectedLogItemId}
              onUpdateItems={setItems}
            />

            {/* Collapsible Technical Drawer */}
            <div className="pt-2">
              <button
                onClick={() => setShowTechnicalLogs(!showTechnicalLogs)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#16191f] border border-[#2d3139] text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#1c2028] transition"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span>Technical Conversion Logs & Engine Output</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    {logs.length} events
                  </span>
                </div>
                {showTechnicalLogs ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showTechnicalLogs && (
                <div className="mt-3">
                  <TerminalLog
                    logs={
                      selectedLogItemId
                        ? items.find(i => i.id === selectedLogItemId)?.logs || []
                        : logs
                    }
                    activeItemName={
                      selectedLogItemId
                        ? items.find(i => i.id === selectedLogItemId)?.name
                        : undefined
                    }
                    onClearLogs={handleClearLogs}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Inspection / AST Diff / Battery Audit Modal */}
      <DiffModal
        item={inspectingItem}
        onClose={() => setInspectingItem(null)}
      />

      {/* Interactive Watch Simulator & AOD Preview Modal */}
      <WatchPreviewModal
        item={previewingItem}
        onClose={() => setPreviewingItem(null)}
      />

      {/* AmazFaces Installation Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Options & Power Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        onChange={setOptions}
      />
    </div>
  );
}

