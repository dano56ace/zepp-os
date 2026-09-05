import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal,
  Copy, 
  Check, 
  Trash2, 
  Search,
  ArrowDownCircle
} from 'lucide-react';
import { LogLevel, LogMessage } from '../types';

interface TerminalLogProps {
  logs: LogMessage[];
  activeItemName?: string;
  onClearLogs?: () => void;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({
  logs,
  activeItemName,
  onClearLogs
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        log.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}${l.details ? ` (${l.details})` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatLineStyle = (level: LogLevel) => {
    switch (level) {
      case 'extract':
        return 'text-blue-400';
      case 'patch':
        return 'text-amber-400';
      case 'energy':
        return 'text-emerald-400 font-bold';
      case 'success':
        return 'text-emerald-400';
      case 'warn':
        return 'text-yellow-400';
      case 'error':
        return 'text-rose-400';
      case 'info':
      default:
        return 'text-[#94a3b8]';
    }
  };

  return (
    <div id="terminal-log-card" className="flex flex-col bg-[#16191f] border border-[#2d3139] rounded-xl overflow-hidden shadow-lg h-[400px] sm:h-[480px]">
      {/* Terminal Top Bar */}
      <div className="px-5 py-3 border-b border-[#2d3139] flex flex-wrap items-center justify-between gap-3 bg-[#1a1d23] shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">
            Process & Battery Monitor
          </span>
          {activeItemName && (
            <span className="text-[11px] text-blue-400 font-mono truncate max-w-[140px] sm:max-w-[220px]">
              [{activeItemName}]
            </span>
          )}
        </div>

        {/* Toolbar & Window Dots */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3 h-3 text-[#64748b] absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0f1115] text-[#e2e8f0] pl-6 pr-2 py-1 rounded text-xs border border-[#2d3139] focus:outline-none focus:border-blue-500 w-24 sm:w-32 placeholder:text-[#475569] font-mono"
            />
          </div>

          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-[#0f1115] text-[#e2e8f0] px-2 py-1 rounded text-xs border border-[#2d3139] focus:outline-none focus:border-blue-500 font-mono cursor-pointer"
          >
            <option value="all">ALL</option>
            <option value="energy">ECO / BATTERY</option>
            <option value="extract">EXTRACT</option>
            <option value="patch">PATCH</option>
            <option value="success">SUCCESS</option>
            <option value="warn">WARN</option>
            <option value="error">ERROR</option>
          </select>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded text-xs border transition flex items-center gap-1 ${
              autoScroll
                ? 'bg-blue-900/30 text-blue-400 border-blue-800/60'
                : 'bg-[#0f1115] text-[#64748b] border-[#2d3139]'
            }`}
            title="Toggle auto-scroll to bottom"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyLogs}
            disabled={filteredLogs.length === 0}
            className="p-1 rounded text-xs bg-[#0f1115] text-[#94a3b8] hover:text-white border border-[#2d3139] hover:border-[#3d434e] transition disabled:opacity-40"
            title="Copy logs to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <div className="flex gap-1.5 ml-1">
            <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
            <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
            <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
          </div>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={logContainerRef}
        id="terminal-output-stream"
        className="flex-1 p-5 overflow-y-auto font-mono text-xs sm:text-[13px] flex flex-col gap-2 leading-relaxed bg-[#16191f] selection:bg-blue-900 selection:text-white"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#475569] space-y-2 font-sans">
            <Terminal className="w-8 h-8 opacity-40 text-blue-500" />
            <p className="text-xs">[INFO] ServiceWorker active. JSZip loaded & ready.</p>
            <p className="text-[11px] text-[#475569]">Drop a .zpk or .zip package to monitor live AST parsing, power scans & FAOD rebuild.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 break-all hover:bg-[#0f1115]/50 px-1 py-0.5 rounded transition">
              <span className="text-[#475569] select-none text-[11px] shrink-0 font-mono">
                {log.timestamp}
              </span>
              
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 font-mono ${
                  log.level === 'extract'
                    ? 'bg-blue-950 text-blue-400 border border-blue-800/40'
                    : log.level === 'patch'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                    : log.level === 'energy'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    : log.level === 'success'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                    : log.level === 'warn'
                    ? 'bg-yellow-950 text-yellow-400 border border-yellow-800/40'
                    : log.level === 'error'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                    : 'bg-[#1a1d23] text-[#94a3b8] border border-[#2d3139]'
                }`}
              >
                {log.level === 'energy' ? 'ECO' : log.level}
              </span>

              <span className={`flex-1 ${formatLineStyle(log.level)}`}>
                {log.message}
                {log.details && (
                  <span className="text-[#64748b] block mt-0.5 pl-3 border-l-2 border-[#2d3139] text-xs">
                    {log.details}
                  </span>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Terminal Footer Info Bar */}
      <div className="px-5 py-2 border-t border-[#2d3139] bg-[#1a1d23] flex items-center justify-between text-[11px] text-[#64748b] font-mono shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ECO Pipelined</span>
          </span>
          <span>•</span>
          <span>{filteredLogs.length} events</span>
        </div>

        {onClearLogs && (
          <button
            onClick={onClearLogs}
            className="hover:text-rose-400 transition flex items-center gap-1"
            title="Clear all logs"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};
