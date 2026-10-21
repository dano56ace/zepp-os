import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Cell, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie 
} from 'recharts';
import { 
  BarChart3, 
  TrendingDown, 
  Zap, 
  Clock, 
  Cpu, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { PowerAnalysisReport, AodElementDrainItem, WatchfaceFileItem, PowerProfileMode } from '../types';
import { 
  estimateAllDeviceProfiles, 
  calculateSubsystemCurrents, 
  getDeviceHardware,
  OPR_SAFE_THRESHOLD 
} from '../utils/batteryEstimator';

interface PowerConsumptionChartProps {
  report?: PowerAnalysisReport;
  item?: WatchfaceFileItem;
  activeProfile?: PowerProfileMode;
}

export const PowerConsumptionChart: React.FC<PowerConsumptionChartProps> = ({
  report,
  item,
  activeProfile = 'balanced'
}) => {
  const [chartView, setChartView] = useState<'comparison' | 'breakdown' | 'devices' | 'discharge'>('comparison');

  // Derive active power values based on profile
  const profileMultiplier = useMemo(() => {
    switch (activeProfile) {
      case 'ultra': return 0.38;
      case 'balanced': return 0.55;
      case 'raw': default: return 1.0;
    }
  }, [activeProfile]);

  // Breakdown items
  const elements = useMemo<AodElementDrainItem[]>(() => {
    if (report?.elementBreakdown && report.elementBreakdown.length > 0) {
      return report.elementBreakdown;
    }
    // Fallback if not populated
    return [
      {
        id: 'second_hand',
        name: 'Second Hand (1Hz Tick)',
        category: 'second_hand',
        impactLevel: 'high',
        drainPercentage: 1.8,
        drainSharePercent: 38,
        stockBehavior: 'Continuous 1-second CPU timer waking MCU',
        faodBehavior: 'Apollo 1Hz low-power tick',
        isOptimizedInFaod: true,
        statusBadge: '1Hz Optimized',
        estimatedMaCurrent: 7.8,
        mitigationTip: 'WIDGET_DELEGATE lifecycle integration'
      },
      {
        id: 'sensors',
        name: 'PPG & Sensors',
        category: 'sensors',
        impactLevel: 'critical',
        drainPercentage: 2.2,
        drainSharePercent: 32,
        stockBehavior: 'Active polling in background',
        faodBehavior: 'Standby guarded sleep',
        isOptimizedInFaod: true,
        statusBadge: 'Guarded',
        estimatedMaCurrent: 9.4,
        mitigationTip: 'Sensors paused while idle'
      },
      {
        id: 'animations',
        name: 'Frame Animations',
        category: 'animations',
        impactLevel: 'medium',
        drainPercentage: 0.8,
        drainSharePercent: 14,
        stockBehavior: 'Sprite loops in standby',
        faodBehavior: 'Static keyframe #0',
        isOptimizedInFaod: true,
        statusBadge: 'Frozen',
        estimatedMaCurrent: 4.2,
        mitigationTip: 'Frame buffer transfers paused'
      },
      {
        id: 'oled_pixels',
        name: 'OLED Active Pixels',
        category: 'oled_pixels',
        impactLevel: 'low',
        drainPercentage: 0.5,
        drainSharePercent: 10,
        stockBehavior: 'Standard luminance',
        faodBehavior: 'High contrast subpixel eco',
        isOptimizedInFaod: true,
        statusBadge: 'Eco',
        estimatedMaCurrent: 2.1,
        mitigationTip: 'Subpixels off on true black'
      },
      {
        id: 'clock_core',
        name: 'Apollo SoC Standby',
        category: 'clock_core',
        impactLevel: 'low',
        drainPercentage: 0.3,
        drainSharePercent: 6,
        stockBehavior: 'RTC crystal oscillator',
        faodBehavior: 'Base sleep current',
        isOptimizedInFaod: true,
        statusBadge: 'Base Floor',
        estimatedMaCurrent: 1.2,
        mitigationTip: 'Low power hardware loop'
      }
    ];
  }, [report]);

  // Comparison Data: Stock vs FAOD Optimized
  const comparisonData = useMemo(() => {
    return elements.map(el => {
      const stockDrain = Number(el.drainPercentage.toFixed(2));
      const faodDrain = Number((el.drainPercentage * profileMultiplier).toFixed(2));
      const savings = Number(Math.max(0, stockDrain - faodDrain).toFixed(2));

      return {
        name: el.name.split('(')[0].split('/')[0].trim(),
        fullName: el.name,
        category: el.category,
        Stock: stockDrain,
        FAOD: faodDrain,
        Savings: savings,
        stockMa: Number(el.estimatedMaCurrent.toFixed(1)),
        faodMa: Number((el.estimatedMaCurrent * profileMultiplier).toFixed(1))
      };
    });
  }, [elements, profileMultiplier]);

  // Total Drain Summary
  const totals = useMemo(() => {
    const totalStock = comparisonData.reduce((acc, c) => acc + c.Stock, 0);
    const totalFaod = comparisonData.reduce((acc, c) => acc + c.FAOD, 0);
    const savingsPercent = totalStock > 0 ? Math.round(((totalStock - totalFaod) / totalStock) * 100) : 0;
    return {
      totalStock: Number(totalStock.toFixed(2)),
      totalFaod: Number(totalFaod.toFixed(2)),
      savingsPercent
    };
  }, [comparisonData]);

  // Pie chart element distribution
  const pieData = useMemo(() => {
    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
    return elements.map((el, i) => ({
      name: el.name.split('(')[0].trim(),
      value: Number((el.drainPercentage * profileMultiplier).toFixed(2)),
      color: palette[i % palette.length],
      share: el.drainSharePercent
    }));
  }, [elements, profileMultiplier]);

  // 11 Devices Projected Battery Runtime (Days)
  const deviceProfiles = useMemo(() => {
    const activeCurrent = Math.max(1.8, elements.reduce((acc, el) => acc + el.estimatedMaCurrent, 0) * profileMultiplier);
    const baselineCurrent = Math.max(1.8, elements.reduce((acc, el) => acc + el.estimatedMaCurrent, 0));
    return estimateAllDeviceProfiles(activeCurrent, baselineCurrent);
  }, [elements, profileMultiplier]);

  const deviceChartData = useMemo(() => {
    return deviceProfiles.map(p => ({
      device: p.deviceName.replace('Amazfit ', ''),
      days: p.projectedRuntimeDays,
      capacity: p.batteryCapacityMah,
      screen: p.screenType,
      drainHr: p.drainPercentPerHour
    }));
  }, [deviceProfiles]);

  // 48-Hour Battery Discharge Curve
  const dischargeCurveData = useMemo(() => {
    const hours = [0, 6, 12, 18, 24, 30, 36, 42, 48];
    const stockHourly = totals.totalStock;
    const faodHourly = totals.totalFaod;

    return hours.map(h => ({
      hour: `${h}h`,
      StockBattery: Math.max(0, Math.round(100 - (stockHourly * h))),
      FaodBattery: Math.max(0, Math.round(100 - (faodHourly * h)))
    }));
  }, [totals]);

  // Custom Tooltips
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f1115] border border-[#2d3139] p-2.5 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-bold text-white mb-1">{payload[0]?.payload?.fullName || label}</p>
          <div className="flex items-center justify-between gap-4 text-rose-400">
            <span>Stock AOD:</span>
            <span className="font-mono font-bold">+{payload[0]?.value}%/hr</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span>FAOD Optimized:</span>
            <span className="font-mono font-bold">+{payload[1]?.value}%/hr</span>
          </div>
          {payload[0]?.payload?.Savings > 0 && (
            <div className="flex items-center justify-between gap-4 text-blue-300 pt-1 border-t border-[#232730] font-semibold">
              <span>Energy Saved:</span>
              <span className="font-mono">-{payload[0]?.payload?.Savings}%/hr</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomDischargeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f1115] border border-[#2d3139] p-2.5 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-300 mb-1">Standby Duration: {label}</p>
          <div className="flex items-center justify-between gap-4 text-rose-400">
            <span>Stock Remaining:</span>
            <span className="font-mono font-bold">{payload[0]?.value}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span>FAOD Remaining:</span>
            <span className="font-mono font-bold">{payload[1]?.value}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-teal-300 pt-1 border-t border-[#232730]">
            <span>Net Advantage:</span>
            <span className="font-mono font-bold">+{Number(payload[1]?.value) - Number(payload[0]?.value)}% remaining</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="recharts-power-analysis" className="space-y-4 rounded-xl bg-[#0f1115] border border-[#2d3139] p-4 text-xs">
      {/* Chart Sub-Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232730] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white flex items-center gap-2">
              <span>Power Consumption Telemetry & AOD Impact</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                -{totals.savingsPercent}% DRAIN
              </span>
            </h4>
            <p className="text-[11px] text-[#94a3b8]">
              Interactive visual audit of element-level energy draw and multi-device endurance
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-[#16191f] p-1 rounded-lg border border-[#2d3139] self-start sm:self-auto gap-1">
          <button
            onClick={() => setChartView('comparison')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              chartView === 'comparison'
                ? 'bg-blue-600 text-white shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Stock vs FAOD
          </button>
          <button
            onClick={() => setChartView('discharge')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              chartView === 'discharge'
                ? 'bg-blue-600 text-white shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            48h Discharge
          </button>
          <button
            onClick={() => setChartView('breakdown')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              chartView === 'breakdown'
                ? 'bg-blue-600 text-white shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            Subsystems
          </button>
          <button
            onClick={() => setChartView('devices')}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              chartView === 'devices'
                ? 'bg-blue-600 text-white shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            11 Devices
          </button>
        </div>
      </div>

      {/* VIEW 1: Stock vs FAOD Bar Chart */}
      {chartView === 'comparison' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
            <span>Hourly Drain Rate per Component (% / hour)</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#f43f5e]" />
                <span className="text-rose-400 font-mono">Stock Baseline ({totals.totalStock}%/hr)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
                <span className="text-emerald-400 font-mono">FAOD Optimized ({totals.totalFaod}%/hr)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(val) => `${val}%`}
                  tickLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="Stock" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Stock AOD" maxBarSize={32} />
                <Bar dataKey="FAOD" fill="#10b981" radius={[4, 4, 0, 0]} name="FAOD Profile" maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 2: 48-Hour Battery Discharge Curve */}
      {chartView === 'discharge' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
            <span>Continuous Standby Battery Level (%) Over 48 Hours</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
                <span className="text-rose-400">Stock AOD</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                <span className="text-emerald-400">FAOD Mode</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dischargeCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFaod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickFormatter={(val) => `${val}%`} tickLine={false} />
                <Tooltip content={<CustomDischargeTooltip />} />
                <Area type="monotone" dataKey="StockBattery" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorStock)" name="Stock AOD" />
                <Area type="monotone" dataKey="FaodBattery" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorFaod)" name="FAOD Optimized" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW 3: Subsystem Energy Share Pie */}
      {chartView === 'breakdown' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [`${value}% / hr`, name]}
                  contentStyle={{ backgroundColor: '#0f1115', borderColor: '#2d3139', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <h5 className="font-semibold text-white text-xs mb-2">FAOD Subsystem Consumption Share</h5>
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-[#16191f] border border-[#232730]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-[#e2e8f0] font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-white font-bold">{item.value}%/hr</span>
                  <span className="text-[#94a3b8] text-[10px]">({item.share}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: Multi-Device Endurance (11 Devices) */}
      {chartView === 'devices' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
            <span>Projected AOD Standby Runtime Across 11 Zepp OS Devices (Days)</span>
            <span className="text-emerald-400 font-mono">Balance: {deviceChartData[0]?.days || 8.5} days</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 35 }}>
                <XAxis 
                  dataKey="device" 
                  stroke="#64748b" 
                  fontSize={10} 
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(val) => `${val}d`}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0f1115] border border-[#2d3139] p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.device}</p>
                          <div className="text-emerald-400 font-mono font-bold">
                            Runtime: {data.days} days
                          </div>
                          <div className="text-[#94a3b8]">
                            Battery: {data.capacity} mAh ({data.screen})
                          </div>
                          <div className="text-blue-300 font-mono">
                            Drain: {data.drainHr}% / hr
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="days" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Standby Days" maxBarSize={28}>
                  {deviceChartData.map((entry, index) => (
                    <Cell 
                      key={`device-${index}`} 
                      fill={entry.device.includes('Balance') ? '#10b981' : entry.screen === 'TFT' ? '#f59e0b' : '#3b82f6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
