import React from 'react';
import { 
  Watch, 
  HelpCircle, 
  Sliders
} from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
  onOpenSettings: () => void;
  activeTab: 'converter' | 'compare';
  onTabChange: (tab: 'converter' | 'compare') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGuide,
  onOpenSettings,
  activeTab,
  onTabChange
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-30 border-b border-[#2d3139] bg-[#16191f]/95 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-900/30 shrink-0">
            <Watch className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
              Zepp OS AOD Studio
            </h1>
            <span className="text-[10px] text-slate-400 font-medium">Amazfit Watchface Tool</span>
          </div>
        </div>

        {/* Center Tab Selector */}
        <div className="flex items-center bg-[#0f1115] p-1 rounded-xl border border-[#2d3139]">
          <button
            onClick={() => onTabChange('converter')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'converter'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Converter
          </button>
          <button
            onClick={() => onTabChange('compare')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'compare'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Compare Faces
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <button
            id="btn-settings"
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#1a1d23] hover:bg-[#2d3139] border border-[#2d3139] transition"
            aria-label="Settings"
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Guide / Help Button */}
          <button
            id="btn-guide"
            onClick={onOpenGuide}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-[#1a1d23] hover:bg-[#2d3139] border border-[#2d3139] transition"
            aria-label="Installation Guide"
            title="Installation Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

