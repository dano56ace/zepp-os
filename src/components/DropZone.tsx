import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { ConversionOptions, DEFAULT_CONVERSION_OPTIONS } from '../types';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  onLoadDemo?: () => void;
  options?: ConversionOptions;
  onOptionsChange?: (options: ConversionOptions) => void;
  isProcessing: boolean;
  onOpenGuide?: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  onLoadDemo,
  options = DEFAULT_CONVERSION_OPTIONS,
  onOptionsChange,
  isProcessing,
  onOpenGuide
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files) as File[];
      const validFiles = fileList.filter((file: File) => {
        const name = file.name.toLowerCase();
        return name.endsWith('.zpk') || name.endsWith('.zip');
      });

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      } else {
        alert('Please drop valid Zepp OS watchface archives (.zpk or .zip).');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files) as File[];
      const validFiles = fileList.filter((file: File) => {
        const name = file.name.toLowerCase();
        return name.endsWith('.zpk') || name.endsWith('.zip');
      });
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
      e.target.value = '';
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept=".zpk,.zip,application/zip,application/x-zip-compressed"
        className="hidden"
        id="file-upload-input"
      />

      {/* Main Drag & Drop Card */}
      <div
        id="drop-zone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
          isDragOver
            ? 'border-blue-500 bg-[#1a1d23] scale-[1.005]'
            : 'border-[#2d3139] bg-[#16191f]/60 hover:border-blue-500/60 hover:bg-[#1a1d23]'
        }`}
      >
        <div className="relative p-7 sm:p-10 flex flex-col items-center justify-center text-center">
          {/* Animated upload icon circle */}
          <div className="w-16 h-16 bg-[#1a1d23] rounded-2xl flex items-center justify-center mb-4 border border-[#2d3139] group-hover:scale-105 transition-transform shadow-lg">
            <UploadCloud className={`w-8 h-8 transition-colors ${
              isDragOver ? 'text-blue-400 animate-bounce' : 'text-blue-500'
            }`} />
          </div>

          <h2 className="text-xl font-bold text-white mb-1.5">
            Drop your watchface file here
          </h2>
          <p className="text-sm text-slate-400 max-w-md mb-5">
            Automatically converts into a Full Always-On Display (AOD) package compatible with your Amazfit watch.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              id="btn-browse-files"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-7 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40 transition active:scale-95 flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Browse Files (.zip / .zpk)</span>
            </button>

            {onLoadDemo && (
              <button
                id="btn-load-demo"
                type="button"
                onClick={onLoadDemo}
                className="px-5 py-3 rounded-xl font-semibold text-xs text-slate-300 hover:text-white bg-[#1a1d23] hover:bg-[#252a33] border border-[#2d3139] hover:border-slate-600 transition active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Try Sample Watchface</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick-toggle settings footer */}
        <div 
          className="border-t border-[#2d3139] bg-[#16191f] px-4 sm:px-6 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full AOD 1:1 Mirroring & Safe Sideloading enabled</span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label 
                id="toggle-auto-download"
                className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white select-none text-xs"
              >
                <input
                  type="checkbox"
                  checked={options?.autoDownload ?? false}
                  onChange={(e) => onOptionsChange?.({ 
                    ...options, 
                    autoDownload: e.target.checked
                  })}
                  className="rounded border-[#2d3139] text-blue-600 focus:ring-blue-500 bg-[#0f1115]"
                />
                <span className="text-slate-300">Auto-Download</span>
              </label>

              <label 
                id="toggle-amazfaces-name"
                className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white select-none text-xs"
              >
                <input
                  type="checkbox"
                  checked={options?.amazfacesReplaceMode ?? true}
                  onChange={(e) => onOptionsChange?.({ 
                    ...options, 
                    amazfacesReplaceMode: e.target.checked,
                    outputNaming: e.target.checked ? 'original' : 'suffix'
                  })}
                  className="rounded border-[#2d3139] text-blue-600 focus:ring-blue-500 bg-[#0f1115]"
                />
                <span className="text-slate-300">Keep Original Filename</span>
              </label>

              {onOpenGuide && (
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Installation Guide</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
