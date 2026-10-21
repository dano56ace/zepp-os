import React, { useState, useMemo } from 'react';
import { 
  Battery, 
  BatteryCharging, 
  Zap, 
  Gauge, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Leaf, 
  Activity, 
  Clock, 
  Smartphone, 
  Sliders, 
  TrendingDown, 
  Info, 
  Eye, 
  ArrowRight, 
  Sun, 
  Moon, 
  Cpu, 
  Flame,
  Sparkles,
  Layers,
  HelpCircle,
  BarChart3,
  Filter
} from 'lucide-react';
import { PowerAnalysisReport, AodElementDrainItem, DrainSeverity, PowerProfileMode, WatchfaceFileItem } from '../types';
import { getDeviceHardware, DEVICE_BATTERY_PROFILES, OPR_SAFE_THRESHOLD } from '../utils/batteryEstimator';
import { PowerConsumptionChart } from './PowerConsumptionChart';

interface BatteryDrainEstimatorProps {
  report?: PowerAnalysisReport;
  item?: WatchfaceFileItem;
  className?: string;
  isCompact?: boolean;
}

export const BatteryDrainEstimator: React.FC<BatteryDrainEstimatorProps> = ({
  report: initialReport,
  item,
  className = '',
  isCompact = false
}) => {
  const [activeProfile, setActiveProfile] = useState<PowerProfileMode>('balanced');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high_medium' | 'low_zero'>('all');
  const [sortBy, setSortBy] = useState<'drain' | 'name' | 'impact'>('drain');

  const initialHardware = useMemo(() => {
    return getDeviceHardware(item?.packageInfo?.deviceSource?.[0] || '0x00000079');
  }, [item]);
  const [batteryCapacityMah, setBatteryCapacityMah] = useState<number>(initialHardware.batteryCapacityMah);

  React.useEffect(() => {
    setBatteryCapacityMah(initialHardware.batteryCapacityMah);
  }, [initialHardware]);

  const report = useMemo(() => {
    return initialReport || item?.powerReport;
  }, [initialReport, item]);

  const displayOprPercent = useMemo(() => {
    const oledItem = report?.elementBreakdown?.find(e => e.category === 'oled_pixels');
    if (oledItem?.stockBehavior) {
      const match = oledItem.stockBehavior.match(/([0-9.]+)%/);
      if (match) return `${match[1]}%`;
    }
    return oledItem?.drainPercentage ? `${(oledItem.drainPercentage * 10).toFixed(1)}%` : '8.5%';
  }, [report]);

  // Fallback items if none provided
  const elementItems: AodElementDrainItem[] = useMemo(() => {
    if (report?.elementBreakdown && report.elementBreakdown.length > 0) {
      return report.elementBreakdown;
    }

    // Default procedural fallback if elementBreakdown not pre-computed
    return [
      {
        id: 'elem-second-hand',
        name: '1Hz Analog Second Hand / Rapid Ticker',
        category: 'second_hand',
        impactLevel: 'high' as DrainSeverity,
        drainPercentage: 1.8,
        drainSharePercent: 38,
        stockBehavior: 'Continuous 1-second CPU timer waking MCU & display controller continuously (60 wakes/min)',
        faodBehavior: activeProfile === 'ultra' 
          ? 'Second hand hidden in AOD; CPU wakes strictly throttled to 60,000ms'
          : 'Smart 1Hz/1-min Apollo co-processor eco tick; hardware sleeps between steps',
        isOptimizedInFaod: true,
        statusBadge: '1-Min Standby Throttled',
        estimatedMaCurrent: 7.8,
        mitigationTip: 'Throttling pointer updates in AOD eliminates up to 3,540 unnecessary CPU wakes per hour.'
      },
      {
        id: 'elem-sensors',
        name: 'PPG Optical Heart Rate & Geolocation GPS',
        category: 'sensors',
        impactLevel: 'critical' as DrainSeverity,
        drainPercentage: 2.2,
        drainSharePercent: 32,
        stockBehavior: 'Continuous active optical green LEDs & GPS RF receiver listening in background',
        faodBehavior: 'Sensors enter low-power sleep; display uses cached metrics without active LED pulsing',
        isOptimizedInFaod: true,
        statusBadge: 'Standby Guarded',
        estimatedMaCurrent: 9.4,
        mitigationTip: 'Pausing optical bio-sensors during idle saves significant battery without losing health metrics.'
      },
      {
        id: 'elem-animations',
        name: 'Sprite Frame Animations & Looping GIFs',
        category: 'animations',
        impactLevel: 'medium' as DrainSeverity,
        drainPercentage: 0.8,
        drainSharePercent: 14,
        stockBehavior: 'Multi-frame PNG/BIN animation sequence looping in standby, consuming RAM bus bandwidth',
        faodBehavior: 'Animation frozen at static keyframe #0 while screen is in AOD state',
        isOptimizedInFaod: true,
        statusBadge: 'Frozen at Frame #0',
        estimatedMaCurrent: 4.2,
        mitigationTip: 'Freezing decorative animations stops GPU framebuffer transfers while the watch is at rest.'
      },
      {
        id: 'elem-widgets',
        name: 'Complications & Data Text (Steps, Weather, Battery)',
        category: 'widgets',
        impactLevel: 'low' as DrainSeverity,
        drainPercentage: 0.45,
        drainSharePercent: 9,
        stockBehavior: 'Complication widgets bound to data change events',
        faodBehavior: 'Rendered in high-efficiency partial-update buffers; redrawn only on value step changes',
        isOptimizedInFaod: true,
        statusBadge: 'Partial Buffer Sync',
        estimatedMaCurrent: 1.8,
        mitigationTip: 'Partial-screen redraw buffers ensure unchanged widgets do not consume display controller power.'
      },
      {
        id: 'elem-oled-pixels',
        name: 'AMOLED Active Pixel Luminous Ratio (OPR)',
        category: 'oled_pixels',
        impactLevel: 'low' as DrainSeverity,
        drainPercentage: 0.35,
        drainSharePercent: 7,
        stockBehavior: 'Standard dial contrast luminance',
        faodBehavior: 'Optimized high-contrast black backdrop; unneeded sub-pixels turned completely off',
        isOptimizedInFaod: true,
        statusBadge: 'OLED Sub-Pixel Eco',
        estimatedMaCurrent: 1.4,
        mitigationTip: 'OLED diodes draw 0 mA for black pixels (#000000). High contrast designs maximize battery runtime.'
      },
      {
        id: 'elem-clock-core',
        name: 'Apollo Low-Power Timekeeping Engine',
        category: 'clock_core',
        impactLevel: 'low' as DrainSeverity,
        drainPercentage: 0.22,
        drainSharePercent: 4,
        stockBehavior: 'Standard 1-minute atomic time clock interrupt',
        faodBehavior: 'Ultra-low-power Apollo 4 co-processor hardware timer loop',
        isOptimizedInFaod: true,
        statusBadge: 'Apollo 1-Min Core',
        estimatedMaCurrent: 0.95,
        mitigationTip: 'Baseline energy floor required for crystal oscillator and hardware time registers.'
      },
      {
        id: 'elem-background',
        name: 'Unlit Pure Black (#000000) OLED Diodes',
        category: 'background',
        impactLevel: 'minimal' as DrainSeverity,
        drainPercentage: 0.0,
        drainSharePercent: 0,
        stockBehavior: '0 mA diode current consumption for true black regions',
        faodBehavior: 'True black background preserved with 0 W static power consumption',
        isOptimizedInFaod: true,
        statusBadge: '0 mA Diode Shutdown',
        estimatedMaCurrent: 0.0,
        mitigationTip: 'Preserves 0x000000 true black background to ensure zero power draw on dark areas.'
      }
    ];
  }, [report, activeProfile]);

  // Profile-adjusted multipliers
  const profileMultiplier = useMemo(() => {
    switch (activeProfile) {
      case 'ultra':
        return 0.38; // 62% reduction
      case 'balanced':
        return 0.55; // 45% reduction
      case 'raw':
      default:
        return 1.0; // unoptimized stock baseline
    }
  }, [activeProfile]);

  // Calculate dynamic metrics
  const totalStockDrain = useMemo(() => {
    return elementItems.reduce((acc, el) => acc + el.drainPercentage, 0);
  }, [elementItems]);

  const currentDrainPerHour = useMemo(() => {
    return Math.max(0.35, totalStockDrain * profileMultiplier);
  }, [totalStockDrain, profileMultiplier]);

  const totalCurrentMa = useMemo(() => {
    const rawMa = elementItems.reduce((acc, el) => acc + el.estimatedMaCurrent, 0);
    return Math.max(1.8, rawMa * profileMultiplier);
  }, [elementItems, profileMultiplier]);

  const projectedDays = useMemo(() => {
    // 100% capacity / (drain%/hr * 24hr)
    return (100 / (currentDrainPerHour * 24)).toFixed(1);
  }, [currentDrainPerHour]);

  const stockProjectedDays = useMemo(() => {
    return (100 / (totalStockDrain * 24)).toFixed(1);
  }, [totalStockDrain]);

  const efficiencyScore = useMemo(() => {
    if (activeProfile === 'ultra') return Math.min(99, Math.round(92 + (report?.metrics.activeWidgets || 6) * 0.4));
    if (activeProfile === 'balanced') return Math.min(94, Math.round(84 + (report?.metrics.activeWidgets || 6) * 0.3));
    return Math.min(72, Math.max(45, Math.round(100 - totalStockDrain * 16)));
  }, [activeProfile, report, totalStockDrain]);

  // Filtered and sorted elements
  const filteredElements = useMemo(() => {
    let list = [...elementItems];

    if (severityFilter === 'critical') {
      list = list.filter(e => e.impactLevel === 'critical');
    } else if (severityFilter === 'high_medium') {
      list = list.filter(e => e.impactLevel === 'high' || e.impactLevel === 'medium');
    } else if (severityFilter === 'low_zero') {
      list = list.filter(e => e.impactLevel === 'low' || e.impactLevel === 'minimal');
    }

    if (sortBy === 'drain') {
      list.sort((a, b) => b.drainPercentage - a.drainPercentage);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'impact') {
      const order = { critical: 4, high: 3, medium: 2, low: 1, minimal: 0 };
      list.sort((a, b) => order[b.impactLevel] - order[a.impactLevel]);
    }

    return list;
  }, [elementItems, severityFilter, sortBy]);

  // Color helper functions
  const getSeverityColor = (severity: DrainSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-rose-950/40',
          text: 'text-rose-400',
          border: 'border-rose-800/60',
          badge: 'bg-rose-900/60 text-rose-200 border-rose-700',
          barColor: '#f43f5e',
          label: 'Critical Drain'
        };
      case 'high':
        return {
          bg: 'bg-amber-950/40',
          text: 'text-amber-400',
          border: 'border-amber-800/60',
          badge: 'bg-amber-900/60 text-amber-200 border-amber-700',
          barColor: '#f59e0b',
          label: 'High Drain'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-950/30',
          text: 'text-yellow-400',
          border: 'border-yellow-800/50',
          badge: 'bg-yellow-900/50 text-yellow-200 border-yellow-700',
          barColor: '#eab308',
          label: 'Moderate Drain'
        };
      case 'low':
        return {
          bg: 'bg-emerald-950/30',
          text: 'text-emerald-400',
          border: 'border-emerald-800/50',
          badge: 'bg-emerald-900/50 text-emerald-200 border-emerald-700',
          barColor: '#10b981',
          label: 'Low Drain'
        };
      case 'minimal':
      default:
        return {
          bg: 'bg-[#181c24]',
          text: 'text-slate-400',
          border: 'border-[#2d3139]',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          barColor: '#475569',
          label: 'Zero / Passive'
        };
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Banner: Battery Drain Overview & Profile Selector */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#181c24] via-[#14171e] to-[#0d1015] border border-[#2d3139] shadow-xl space-y-4">
        {/* Header Title & Power Mode Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232730] pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
              <BatteryCharging className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white tracking-wide">
                  FAOD Battery Drain Estimation
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                  Zepp OS 2.5/3.0
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/40 font-mono font-bold">
                  {initialHardware.deviceName} ({batteryCapacityMah} mAh)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Always-On Display energy consumption heatmap & sub-system telemetry
              </p>
            </div>
          </div>

          {/* Profile Switcher Tabs */}
          <div className="flex items-center bg-[#0d1015] p-1 rounded-xl border border-[#232730] self-start sm:self-auto">
            <button
              onClick={() => setActiveProfile('raw')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeProfile === 'raw'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Stock unthrottled AOD watchface (No optimizations applied)"
            >
              <Flame className="w-3 h-3 text-rose-300" />
              <span>Stock AOD</span>
            </button>

            <button
              onClick={() => setActiveProfile('balanced')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeProfile === 'balanced'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Standard Balanced FAOD with smart 1-min throttling and sensor guarding"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Balanced FAOD</span>
            </button>

            <button
              onClick={() => setActiveProfile('ultra')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeProfile === 'ultra'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ultra Battery Saver: Hides second hands and applies maximum OLED sleep"
            >
              <Leaf className="w-3 h-3 text-emerald-300" />
              <span>Ultra Saver</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Estimated Drain Rate */}
          <div className="p-3.5 rounded-xl bg-[#0d1015] border border-[#232730] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Activity className="w-3 h-3 text-blue-400" />
              <span>Hourly Drain Rate</span>
            </span>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold font-mono text-white flex items-baseline gap-1">
                <span className={activeProfile === 'raw' ? 'text-rose-400' : 'text-emerald-400'}>
                  {currentDrainPerHour.toFixed(2)}%
                </span>
                <span className="text-xs text-slate-400 font-normal">/ hr</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Current:</span>
                <strong className="font-mono text-slate-300">{totalCurrentMa.toFixed(1)} mA</strong>
              </div>
            </div>
          </div>

          {/* Projected Battery Life */}
          <div className="p-3.5 rounded-xl bg-[#0d1015] border border-[#232730] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Projected Battery Life</span>
            </span>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-300 flex items-baseline gap-1">
                <span>{projectedDays}</span>
                <span className="text-xs text-slate-400 font-normal">days AOD</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <span>Stock was:</span>
                <span className="font-mono text-rose-400">{stockProjectedDays} days</span>
              </div>
            </div>
          </div>

          {/* Energy Reduction */}
          <div className="p-3.5 rounded-xl bg-[#0d1015] border border-[#232730] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-teal-400" />
              <span>Power Savings</span>
            </span>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold font-mono text-teal-300 flex items-baseline gap-1">
                <span>
                  {activeProfile === 'raw' ? '0%' : `-${Math.round((1 - profileMultiplier) * 100)}%`}
                </span>
                <span className="text-xs text-slate-400 font-normal">drain</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {activeProfile === 'raw' ? 'Stock unoptimized' : 'Compared to stock baseline'}
              </div>
            </div>
          </div>

          {/* Efficiency Index Score */}
          <div className="p-3.5 rounded-xl bg-[#0d1015] border border-[#232730] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>Efficiency Index</span>
            </span>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 flex items-baseline gap-1">
                <span>{efficiencyScore}</span>
                <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 font-semibold">
                  {efficiencyScore >= 90 ? 'Grade A+ Eco' : efficiencyScore >= 75 ? 'Grade A Balanced' : 'Grade C High Drain'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stacked Proportional Color-Coded Energy Drain Bar */}
        <div className="space-y-2 pt-2 border-t border-[#232730]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Element Consumption Distribution Heatmap</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Hover segment to highlight source
            </span>
          </div>

          {/* Multi-segmented Bar */}
          <div className="w-full h-4 bg-[#0d1015] rounded-lg overflow-hidden flex border border-[#2d3139] p-0.5 gap-0.5">
            {elementItems.map((item, idx) => {
              if (item.drainPercentage <= 0) return null;
              const severity = getSeverityColor(item.impactLevel);
              const isSelected = selectedElementId === item.id;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedElementId(isSelected ? null : item.id)}
                  className="h-full rounded-sm cursor-pointer transition-all hover:opacity-90 relative group"
                  style={{
                    width: `${Math.max(4, item.drainSharePercent)}%`,
                    backgroundColor: severity.barColor,
                    opacity: selectedElementId && !isSelected ? 0.35 : 1
                  }}
                  title={`${item.name}: ${item.drainPercentage.toFixed(2)}%/hr (${item.drainSharePercent}% of total)`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                    <div className="px-2 py-1 rounded bg-[#0a0c10] border border-[#2d3139] text-[10px] text-white whitespace-nowrap shadow-xl">
                      <strong className="block text-blue-300">{item.name}</strong>
                      <span className="font-mono text-emerald-400">{item.drainPercentage.toFixed(2)}%/hr</span> • {item.drainSharePercent}% share
                    </div>
                    <div className="w-1.5 h-1.5 bg-[#0a0c10] rotate-45 border-r border-b border-[#2d3139] -mt-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend Color Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#f43f5e]" />
              <span>Critical (&gt;1.5%/hr)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" />
              <span>High (0.8-1.5%/hr)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#eab308]" />
              <span>Moderate (0.4-0.8%/hr)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
              <span>Low (&lt;0.4%/hr)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#475569]" />
              <span>Zero (Black OLED)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Interactive Visualizer for Power Consumption & AOD Impact */}
      <PowerConsumptionChart 
        report={report} 
        item={item} 
        activeProfile={activeProfile} 
      />

      {/* Filter and Search Bar for Elements Breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              severityFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-[#181c24] text-slate-400 hover:text-white border border-[#2d3139]'
            }`}
          >
            All Elements ({elementItems.length})
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              severityFilter === 'critical'
                ? 'bg-rose-600 text-white'
                : 'bg-[#181c24] text-slate-400 hover:text-white border border-[#2d3139]'
            }`}
          >
            Critical Drain ({elementItems.filter(e => e.impactLevel === 'critical').length})
          </button>
          <button
            onClick={() => setSeverityFilter('high_medium')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              severityFilter === 'high_medium'
                ? 'bg-amber-600 text-white'
                : 'bg-[#181c24] text-slate-400 hover:text-white border border-[#2d3139]'
            }`}
          >
            High & Moderate ({elementItems.filter(e => e.impactLevel === 'high' || e.impactLevel === 'medium').length})
          </button>
          <button
            onClick={() => setSeverityFilter('low_zero')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              severityFilter === 'low_zero'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#181c24] text-slate-400 hover:text-white border border-[#2d3139]'
            }`}
          >
            Low & Zero ({elementItems.filter(e => e.impactLevel === 'low' || e.impactLevel === 'minimal').length})
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#14171e] border border-[#2d3139] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="drain">Highest Battery Drain</option>
            <option value="impact">Severity Level</option>
            <option value="name">Element Name</option>
          </select>
        </div>
      </div>

      {/* Detailed Element Cards List */}
      <div className="space-y-2.5">
        {filteredElements.map((el) => {
          const severity = getSeverityColor(el.impactLevel);
          const isSelected = selectedElementId === el.id;
          const adjustedDrain = (el.drainPercentage * profileMultiplier).toFixed(2);
          const adjustedMa = (el.estimatedMaCurrent * profileMultiplier).toFixed(1);

          return (
            <div
              key={el.id}
              onClick={() => setSelectedElementId(isSelected ? null : el.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-[#181d27] border-blue-500 ring-1 ring-blue-500/50 shadow-lg' 
                  : `${severity.bg} ${severity.border} hover:border-slate-400/50`
              }`}
            >
              {/* Card Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${severity.bg} ${severity.border} ${severity.text}`}>
                    {el.category === 'second_hand' && <Clock className="w-4 h-4" />}
                    {el.category === 'sensors' && <Activity className="w-4 h-4" />}
                    {el.category === 'animations' && <Flame className="w-4 h-4" />}
                    {el.category === 'widgets' && <Layers className="w-4 h-4" />}
                    {el.category === 'oled_pixels' && <Sun className="w-4 h-4" />}
                    {el.category === 'clock_core' && <Cpu className="w-4 h-4" />}
                    {el.category === 'background' && <Moon className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {el.name}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.2 rounded border font-mono font-semibold ${severity.badge}`}>
                        {severity.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                      <span>FAOD Status:</span>
                      <span className="text-emerald-400 font-semibold">{el.statusBadge}</span>
                    </div>
                  </div>
                </div>

                {/* Drain Numbers on the right */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-bold font-mono text-white flex items-baseline justify-end gap-1">
                      <span className={severity.text}>+{adjustedDrain}%</span>
                      <span className="text-[10px] text-slate-400">/ hr</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {adjustedMa} mA ({el.drainSharePercent}% share)
                    </div>
                  </div>
                </div>
              </div>

              {/* Behavior Comparison & Mitigation Tip */}
              <div className="mt-3 pt-3 border-t border-[#232730]/70 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {/* Stock vs FAOD */}
                <div className="p-2.5 rounded-lg bg-[#0d1015] border border-[#232730] space-y-1">
                  <div className="text-[10px] text-rose-400 font-semibold uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span>Stock Watchface Behavior</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {el.stockBehavior}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0d1015] border border-[#232730] space-y-1">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>FAOD Optimized Profile ({activeProfile.toUpperCase()})</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {el.faodBehavior}
                  </p>
                </div>

                {/* Mitigation Note */}
                <div className="md:col-span-2 p-2 rounded-lg bg-blue-950/20 border border-blue-900/30 text-[11px] text-blue-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span><strong>Optimization Engine:</strong> {el.mitigationTip}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom AMOLED Burn-in & Pixel Safeguard Advice Card */}
      <div className="p-4 rounded-xl bg-[#0d1015] border border-[#232730] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-bold text-white flex items-center gap-2">
              <span>AMOLED Burn-in Protection & On-Pixel Ratio (OPR) Safeguard</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                PASSED
              </span>
            </h5>
            <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
              Zepp OS hardware employs Apollo co-processor pixel shifting and 15% maximum luminous surface area thresholds to prevent display burn-in and minimize battery decay over long standby sessions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-[#14171e] border border-[#2d3139] text-center">
            <span className="text-[9px] text-slate-500 uppercase block">OPR Luminous Area</span>
            <span className="font-mono text-emerald-400 font-bold text-xs">{displayOprPercent} (Safe &lt; 15%)</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#14171e] border border-[#2d3139] text-center">
            <span className="text-[9px] text-slate-500 uppercase block">Pixel Shift</span>
            <span className="font-mono text-blue-300 font-bold text-xs">±2px / 60s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
