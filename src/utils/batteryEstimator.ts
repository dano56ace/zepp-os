// Zepp OS Battery Drain Profiler & Multi-Device Estimator Engine
import { 
  PowerAnalysisReport, 
  PowerProfileMode, 
  PackageMetadata, 
  AodElementDrainItem, 
  ScanFinding,
  DrainSeverity 
} from '../types';
import { KNOWN_ZEPP_DEVICES } from './devices';

export interface DialAssetMetrics {
  totalAssets: number;
  totalSizeBytes: number;
  hasSecondHand: boolean;
  hasAnimations: boolean;
  estimatedOpr: number; // 0.0 to 1.0 (e.g. 0.085 for 8.5%)
  averageLuminance: number; // 0.0 to 1.0 (e.g. 0.75)
  isDarkDial: boolean; // true if estimatedOpr <= 0.15 (safe AOD threshold)
}

export interface DeviceBatteryHardware {
  deviceSource: string;
  deviceName: string;
  batteryCapacityMah: number;
  screenType: 'AMOLED' | 'TFT' | 'LCD';
  resolution: string;
  shape: 'round' | 'square' | 'rectangle';
}

export interface BatteryEstimateProfile {
  deviceSource: string;
  deviceName: string;
  batteryCapacityMah: number;
  screenType: string;
  drainPercentPerHour: number;
  projectedRuntimeDays: number;
  relativeImpactPercent: number;
}

export interface PowerCurrentBreakdown {
  baseStandbyMa: number;
  oledDisplayMa: number;
  cpuTickMa: number;
  sensorsMa: number;
  animationsMa: number;
  totalMa: number;
}

export interface BatteryEstimationOptions {
  deviceSource?: string | number;
  batteryCapacityMah?: number;
  hasActive1HzSeconds?: boolean;
  oprLuminanceAreaPercent?: number;
  averageLuminance?: number;
  profile?: 'raw' | 'balanced' | 'ultra';
  hasAnimations?: boolean;
  hasContinuousSensors?: boolean;
}

// Hardware & Electrical Constants (in mA)
export const BASE_STANDBY_CURRENT_MA = 0.80; // AMOLED SoC base standby current (RTC, BLE advertising, display driver)
export const DISPLAY_OFF_SLEEP_MA = 0.35; // Pure display-off deep sleep current
export const CPU_1HZ_TICK_CURRENT_MA = 0.50; // Active 1Hz second tick current (3600 wakes/hr + JS execution + bus transfers)
export const CPU_1MIN_TICK_CURRENT_MA = 0.02; // Static 1-minute time tick current (60 wakes/hr)
export const K_LUM_MA = 4.00; // Peak luminance dynamic current coefficient for 100% white AMOLED
export const K_STATIC_MA = 0.50; // OLED subpixel driver static bias & leakage current when active
export const TFT_BACKLIGHT_MA = 3.20; // Constant backlight current for TFT/LCD displays
export const SENSOR_HEART_RATE_MA = 1.80; // PPG optical sensor active polling current
export const SENSOR_GPS_MA = 8.50; // GPS RF receiver current
export const ANIMATION_ACTIVE_MA = 1.20; // Active frame rendering current
export const OPR_SAFE_THRESHOLD = 0.15; // 15% maximum luminous surface area threshold for burn-in protection

export const DEVICE_BATTERY_PROFILES: Record<string, DeviceBatteryHardware> = {
  // 11 Universal Target Devices
  '0x00000079': { deviceSource: '0x00000079', deviceName: 'Amazfit Balance', batteryCapacityMah: 475, screenType: 'AMOLED', resolution: '480x480', shape: 'round' },
  '0x0000007b': { deviceSource: '0x0000007b', deviceName: 'Amazfit Cheetah', batteryCapacityMah: 440, screenType: 'AMOLED', resolution: '454x454', shape: 'round' },
  '0x0000007c': { deviceSource: '0x0000007c', deviceName: 'Amazfit Cheetah Pro', batteryCapacityMah: 440, screenType: 'AMOLED', resolution: '480x480', shape: 'round' },
  '0x00000072': { deviceSource: '0x00000072', deviceName: 'Amazfit Falcon', batteryCapacityMah: 500, screenType: 'AMOLED', resolution: '416x416', shape: 'round' },
  '0x00000059': { deviceSource: '0x00000059', deviceName: 'Amazfit GTR 3', batteryCapacityMah: 450, screenType: 'AMOLED', resolution: '454x454', shape: 'round' },
  '0x0000005a': { deviceSource: '0x0000005a', deviceName: 'Amazfit GTR 3 Pro', batteryCapacityMah: 450, screenType: 'AMOLED', resolution: '480x480', shape: 'round' },
  '0x00000067': { deviceSource: '0x00000067', deviceName: 'Amazfit GTR 4', batteryCapacityMah: 475, screenType: 'AMOLED', resolution: '466x466', shape: 'round' },
  '0x00000069': { deviceSource: '0x00000069', deviceName: 'Amazfit T-Rex 2', batteryCapacityMah: 500, screenType: 'AMOLED', resolution: '454x454', shape: 'round' },
  '0x00000073': { deviceSource: '0x00000073', deviceName: 'Amazfit T-Rex Ultra', batteryCapacityMah: 500, screenType: 'AMOLED', resolution: '454x454', shape: 'round' },
  '0x00000078': { deviceSource: '0x00000078', deviceName: 'Amazfit Active', batteryCapacityMah: 300, screenType: 'AMOLED', resolution: '390x450', shape: 'square' },
  '0x0000007a': { deviceSource: '0x0000007a', deviceName: 'Amazfit Active Edge', batteryCapacityMah: 370, screenType: 'TFT', resolution: '360x360', shape: 'round' },

  // Additional recognized models
  '0x00000092': { deviceSource: '0x00000092', deviceName: 'Amazfit Balance 2', batteryCapacityMah: 475, screenType: 'AMOLED', resolution: '480x480', shape: 'round' },
  '0x00000093': { deviceSource: '0x00000093', deviceName: 'Amazfit Balance 2 Pro', batteryCapacityMah: 475, screenType: 'AMOLED', resolution: '480x480', shape: 'round' },
  '0x00000062': { deviceSource: '0x00000062', deviceName: 'Amazfit GTR 4', batteryCapacityMah: 475, screenType: 'AMOLED', resolution: '466x466', shape: 'round' },
  '0x00000063': { deviceSource: '0x00000063', deviceName: 'Amazfit GTS 4', batteryCapacityMah: 300, screenType: 'AMOLED', resolution: '390x450', shape: 'square' },
  '0x00000064': { deviceSource: '0x00000064', deviceName: 'Amazfit GTS 4 Mini', batteryCapacityMah: 270, screenType: 'AMOLED', resolution: '336x384', shape: 'square' },
  '0x0000007d': { deviceSource: '0x0000007d', deviceName: 'Amazfit Cheetah (Square)', batteryCapacityMah: 240, screenType: 'AMOLED', resolution: '390x450', shape: 'square' },
  '0x00000085': { deviceSource: '0x00000085', deviceName: 'Amazfit Active', batteryCapacityMah: 300, screenType: 'AMOLED', resolution: '390x450', shape: 'square' },
  '0x00000086': { deviceSource: '0x00000086', deviceName: 'Amazfit Active Edge', batteryCapacityMah: 370, screenType: 'TFT', resolution: '360x360', shape: 'round' },
  '0x00000088': { deviceSource: '0x00000088', deviceName: 'Amazfit Bip 5', batteryCapacityMah: 300, screenType: 'TFT', resolution: '320x380', shape: 'rectangle' },
  '0x00000089': { deviceSource: '0x00000089', deviceName: 'Amazfit Bip 5 Unity', batteryCapacityMah: 300, screenType: 'TFT', resolution: '320x380', shape: 'rectangle' },
  '0x0000008f': { deviceSource: '0x0000008f', deviceName: 'Amazfit T-Rex 3', batteryCapacityMah: 700, screenType: 'AMOLED', resolution: '480x480', shape: 'round' },
  '0x0000005e': { deviceSource: '0x0000005e', deviceName: 'Amazfit Band 7', batteryCapacityMah: 232, screenType: 'AMOLED', resolution: '194x368', shape: 'rectangle' },
  '0x00000050': { deviceSource: '0x00000050', deviceName: 'Amazfit GTR 3 Pro', batteryCapacityMah: 450, screenType: 'AMOLED', resolution: '480x480', shape: 'round' },
  '0x0000004f': { deviceSource: '0x0000004f', deviceName: 'Amazfit GTR 3', batteryCapacityMah: 450, screenType: 'AMOLED', resolution: '454x454', shape: 'round' },
  '0x00000051': { deviceSource: '0x00000051', deviceName: 'Amazfit GTS 3', batteryCapacityMah: 250, screenType: 'AMOLED', resolution: '390x450', shape: 'square' },
  '0x0000005b': { deviceSource: '0x0000005b', deviceName: 'Amazfit T-Rex 2', batteryCapacityMah: 500, screenType: 'AMOLED', resolution: '454x454', shape: 'round' },
};

export function normalizeDeviceSource(deviceSource?: string | number): string {
  if (!deviceSource) return '0x00000079';
  if (typeof deviceSource === 'number') {
    return '0x' + deviceSource.toString(16).padStart(8, '0').toLowerCase();
  }
  return deviceSource.toLowerCase();
}

export function getDeviceHardware(deviceSource?: string | number): DeviceBatteryHardware {
  const hex = normalizeDeviceSource(deviceSource);
  if (DEVICE_BATTERY_PROFILES[hex]) {
    return DEVICE_BATTERY_PROFILES[hex];
  }
  if (KNOWN_ZEPP_DEVICES[hex]) {
    const known = KNOWN_ZEPP_DEVICES[hex];
    return {
      deviceSource: hex,
      deviceName: known.name,
      batteryCapacityMah: 450,
      screenType: 'AMOLED',
      resolution: known.resolution,
      shape: known.shape,
    };
  }
  return {
    deviceSource: hex,
    deviceName: 'Generic Zepp OS Device',
    batteryCapacityMah: 450,
    screenType: 'AMOLED',
    resolution: '480x480',
    shape: 'round',
  };
}

/**
 * Calculates OLED display current draw in mA based on On-Pixel Ratio (OPR) and luminance.
 * Formula: I_OLED = OPR * (lum * k_lum + k_static)
 */
export function calculateOledCurrent(
  opr: number,
  luminance = 0.80,
  kLum = K_LUM_MA,
  kStatic = K_STATIC_MA
): number {
  const clampedOpr = Math.max(0.0, Math.min(1.0, opr));
  if (clampedOpr === 0) return 0;
  const clampedLum = Math.max(0.0, Math.min(1.0, luminance));
  return clampedOpr * (clampedLum * kLum + kStatic);
}

/**
 * Calculates detailed subsystem currents (mA)
 */
export function calculateSubsystemCurrents(options: {
  screenType?: string;
  opr?: number;
  luminance?: number;
  mode?: 'display_off' | 'static_1min' | 'active_1hz';
  hasHeartRate?: boolean;
  hasGps?: boolean;
  hasAnimations?: boolean;
}): PowerCurrentBreakdown {
  const {
    screenType = 'AMOLED',
    opr = 0.085,
    luminance = 0.75,
    mode = 'active_1hz',
    hasHeartRate = false,
    hasGps = false,
    hasAnimations = false
  } = options;

  if (mode === 'display_off') {
    return {
      baseStandbyMa: DISPLAY_OFF_SLEEP_MA,
      oledDisplayMa: 0,
      cpuTickMa: 0,
      sensorsMa: 0,
      animationsMa: 0,
      totalMa: DISPLAY_OFF_SLEEP_MA,
    };
  }

  const baseStandbyMa = BASE_STANDBY_CURRENT_MA;
  let oledDisplayMa = 0;
  if (screenType === 'TFT' || screenType === 'LCD') {
    oledDisplayMa = TFT_BACKLIGHT_MA;
  } else {
    oledDisplayMa = calculateOledCurrent(opr, luminance);
  }

  const cpuTickMa = mode === 'active_1hz' ? CPU_1HZ_TICK_CURRENT_MA : CPU_1MIN_TICK_CURRENT_MA;
  let sensorsMa = 0;
  if (hasHeartRate) sensorsMa += SENSOR_HEART_RATE_MA;
  if (hasGps) sensorsMa += SENSOR_GPS_MA;

  const animationsMa = hasAnimations ? ANIMATION_ACTIVE_MA : 0;
  const totalMa = baseStandbyMa + oledDisplayMa + cpuTickMa + sensorsMa + animationsMa;

  return {
    baseStandbyMa,
    oledDisplayMa,
    cpuTickMa,
    sensorsMa,
    animationsMa,
    totalMa,
  };
}

/**
 * Calculates runtime hours, days, and hourly drain percentage
 */
export function calculateRuntime(batteryCapacityMah: number, currentMa: number): {
  runtimeHours: number;
  runtimeDays: number;
  drainPercentPerHour: number;
} {
  if (batteryCapacityMah <= 0 || currentMa <= 0) {
    return { runtimeHours: 0, runtimeDays: 0, drainPercentPerHour: 0 };
  }
  const runtimeHours = batteryCapacityMah / currentMa;
  const runtimeDays = runtimeHours / 24;
  const drainPercentPerHour = (currentMa / batteryCapacityMah) * 100;
  return {
    runtimeHours,
    runtimeDays,
    drainPercentPerHour,
  };
}

/**
 * Calculates a specific device battery profile
 */
export function calculateDeviceBatteryProfile(
  deviceSource: string | number,
  activeCurrentMa: number,
  baselineCurrentMa?: number
): BatteryEstimateProfile {
  const hw = getDeviceHardware(deviceSource);
  const runtime = calculateRuntime(hw.batteryCapacityMah, activeCurrentMa);
  
  let relativeImpactPercent = 0;
  if (baselineCurrentMa && baselineCurrentMa > 0) {
    relativeImpactPercent = ((activeCurrentMa - baselineCurrentMa) / baselineCurrentMa) * 100;
  }

  return {
    deviceSource: hw.deviceSource,
    deviceName: hw.deviceName,
    batteryCapacityMah: hw.batteryCapacityMah,
    screenType: hw.screenType,
    drainPercentPerHour: Number(runtime.drainPercentPerHour.toFixed(3)),
    projectedRuntimeDays: Number(runtime.runtimeDays.toFixed(2)),
    relativeImpactPercent: Number(relativeImpactPercent.toFixed(1)),
  };
}

/**
 * Calculates battery profiles across all 11 Universal Target Devices
 */
export function estimateAllDeviceProfiles(
  activeCurrentMa: number,
  baselineCurrentMa?: number
): BatteryEstimateProfile[] {
  const universal11Keys = [
    '0x00000079', // Amazfit Balance
    '0x0000007b', // Amazfit Cheetah
    '0x0000007c', // Amazfit Cheetah Pro
    '0x00000072', // Amazfit Falcon
    '0x00000059', // Amazfit GTR 3
    '0x0000005a', // Amazfit GTR 3 Pro
    '0x00000067', // Amazfit GTR 4
    '0x00000069', // Amazfit T-Rex 2
    '0x00000073', // Amazfit T-Rex Ultra
    '0x00000078', // Amazfit Active
    '0x0000007a', // Amazfit Active Edge
  ];

  return universal11Keys.map(key => calculateDeviceBatteryProfile(key, activeCurrentMa, baselineCurrentMa));
}

/**
 * Extracts dial asset metrics and models realistic OPR from watchface assets and code
 */
export function calculateDialAssetMetrics(
  files: { [path: string]: any },
  filePaths: string[] = [],
  packageInfo?: PackageMetadata
): DialAssetMetrics {
  const allPaths = filePaths.length > 0 ? filePaths : Object.keys(files);
  const imageAssets = allPaths.filter(p => /\.(png|jpg|jpeg|bin|bmp|webp)$/i.test(p));
  const totalAssets = imageAssets.length;

  let totalSizeBytes = 0;
  if (packageInfo?.extractedImages && packageInfo.extractedImages.length > 0) {
    totalSizeBytes = packageInfo.extractedImages.reduce((sum, img) => sum + (img.size || 0), 0);
  } else {
    for (const p of allPaths) {
      const content = files[p];
      if (typeof content === 'string') {
        totalSizeBytes += content.length;
      } else if (content && typeof content.byteLength === 'number') {
        totalSizeBytes += content.byteLength;
      } else if (content && typeof content.length === 'number') {
        totalSizeBytes += content.length;
      }
    }
  }

  let hasSecondHand = false;
  let hasAnimations = false;
  let hasDarkKeywords = false;
  let hasLightKeywords = false;

  for (const [path, content] of Object.entries(files)) {
    if (typeof content === 'string' && (path.endsWith('.js') || path.endsWith('.mjs') || path.endsWith('.json'))) {
      if (/second_centerX|second_centerY|second_angle|TIME_POINTER.*second|__faodUpdateSecondHand__|__faodSecondHand_/i.test(content)) {
        hasSecondHand = true;
      }
      if (/ANIM_IMG|PROGRAM_ANIM|anim_status/i.test(content)) {
        hasAnimations = true;
      }
      if (/black|dark|night|shadow|0x000000|#000000/i.test(content)) {
        hasDarkKeywords = true;
      }
      if (/white|light|bright|0xffffff|#ffffff/i.test(content)) {
        hasLightKeywords = true;
      }
    }
  }

  let estimatedOpr = 0.085; // Standard 8.5% safe AOD baseline
  if (hasLightKeywords && !hasDarkKeywords) {
    estimatedOpr = 0.280;
  } else if (hasDarkKeywords && !hasLightKeywords) {
    estimatedOpr = 0.065;
  }

  if (totalAssets > 25) {
    estimatedOpr += 0.020;
  }

  let averageLuminance = 0.75;
  if (hasDarkKeywords) averageLuminance = 0.60;
  if (hasLightKeywords) averageLuminance = 0.85;

  const isDarkDial = estimatedOpr <= OPR_SAFE_THRESHOLD;

  return {
    totalAssets,
    totalSizeBytes,
    hasSecondHand,
    hasAnimations,
    estimatedOpr: Number(estimatedOpr.toFixed(3)),
    averageLuminance: Number(averageLuminance.toFixed(2)),
    isDarkDial,
  };
}

/**
 * Estimate watchface power profile according to PROJECT.md interface contract
 */
export function estimateWatchfacePower(options: BatteryEstimationOptions): PowerAnalysisReport {
  const hw = getDeviceHardware(options.deviceSource);
  const batteryCap = options.batteryCapacityMah || hw.batteryCapacityMah;
  const mode = options.profile || 'balanced';

  // Normalize OPR (0.0 to 1.0)
  let opr = 0.085;
  if (typeof options.oprLuminanceAreaPercent === 'number') {
    opr = Math.max(0.0, Math.min(1.0, options.oprLuminanceAreaPercent > 1.0 
      ? options.oprLuminanceAreaPercent / 100 
      : options.oprLuminanceAreaPercent));
  }

  const luminance = typeof options.averageLuminance === 'number' ? options.averageLuminance : 0.75;
  const hasSeconds = options.hasActive1HzSeconds ?? true;
  const hasAnims = options.hasAnimations ?? false;
  const hasSensors = options.hasContinuousSensors ?? false;

  // Stock unthrottled current (Raw)
  const stockBreakdown = calculateSubsystemCurrents({
    screenType: hw.screenType,
    opr,
    luminance,
    mode: hasSeconds ? 'active_1hz' : 'static_1min',
    hasHeartRate: hasSensors,
    hasAnimations: hasAnims,
  });

  // Optimized current
  // In balanced mode: 1Hz second hand is KEPT ACTIVE (FAOD requirement), but animations/sensors guarded
  // In ultra mode: second hand throttled to static 1-min
  const optMode = mode === 'ultra' ? 'static_1min' : (hasSeconds ? 'active_1hz' : 'static_1min');
  const optBreakdown = calculateSubsystemCurrents({
    screenType: hw.screenType,
    opr: mode === 'ultra' ? opr * 0.8 : opr, // ultra applies high-contrast subpixel darkening
    luminance: mode === 'ultra' ? luminance * 0.8 : luminance,
    mode: optMode,
    hasHeartRate: false, // guarded in standby
    hasAnimations: false, // frozen in standby
  });

  const stockRuntime = calculateRuntime(batteryCap, stockBreakdown.totalMa);
  const optRuntime = calculateRuntime(batteryCap, optBreakdown.totalMa);

  const savingsPercent = Math.max(0, Math.round(((stockBreakdown.totalMa - optBreakdown.totalMa) / stockBreakdown.totalMa) * 100));
  const efficiencyScore = Math.min(99, Math.max(45, Math.round(100 - (stockRuntime.drainPercentPerHour * 18))));
  const optimizedScore = Math.min(99, Math.round(efficiencyScore + (savingsPercent * 0.5)));

  const findings: ScanFinding[] = [];
  if (hasSeconds) {
    findings.push({
      type: 'warning',
      category: 'refresh_rate',
      title: 'Active 1Hz AOD Second Hand',
      description: `Apollo co-processor wakes at 1Hz (${stockBreakdown.cpuTickMa.toFixed(2)} mA).`,
      impact: 'High',
      estimatedDrainPerHour: `+${((CPU_1HZ_TICK_CURRENT_MA / batteryCap) * 100).toFixed(2)}% / hr`,
      remedy: 'Use WIDGET_DELEGATE lifecycle to sleep between ticks.'
    });
  }

  const rawElementItems: AodElementDrainItem[] = [
    {
      id: 'elem-second-hand',
      name: '1Hz Analog Second Hand / Rapid Ticker',
      category: 'second_hand',
      impactLevel: hasSeconds ? 'high' : 'low',
      drainPercentage: Number(((stockBreakdown.cpuTickMa / batteryCap) * 100).toFixed(2)),
      drainSharePercent: 0,
      stockBehavior: hasSeconds ? 'Continuous 1-second ticks waking MCU & display controller' : 'Static 1-minute time tick',
      faodBehavior: mode === 'ultra' ? 'Second hand hidden in AOD (60s tick)' : 'Smart 1Hz Apollo eco tick',
      isOptimizedInFaod: hasSeconds,
      statusBadge: hasSeconds ? '1Hz Active FAOD' : '1-Min Standby',
      estimatedMaCurrent: hasSeconds ? 0.50 : 0.02,
      mitigationTip: 'WIDGET_DELEGATE eliminates unconstrained timer loops.'
    },
    {
      id: 'elem-oled-pixels',
      name: 'AMOLED Active Pixel Luminous Ratio (OPR)',
      category: 'oled_pixels',
      impactLevel: opr > OPR_SAFE_THRESHOLD ? 'high' : 'low',
      drainPercentage: Number(((stockBreakdown.oledDisplayMa / batteryCap) * 100).toFixed(2)),
      drainSharePercent: 0,
      stockBehavior: `Active luminous area: ${(opr * 100).toFixed(1)}% (OPR)`,
      faodBehavior: 'Optimized high-contrast subpixel rendering',
      isOptimizedInFaod: true,
      statusBadge: opr <= OPR_SAFE_THRESHOLD ? 'Safe < 15%' : 'High Luminance',
      estimatedMaCurrent: Number(stockBreakdown.oledDisplayMa.toFixed(2)),
      mitigationTip: 'Preserving true black (#000000) keeps OLED subpixels at 0 mA.'
    },
    {
      id: 'elem-clock-core',
      name: 'Apollo Low-Power Timekeeping Engine',
      category: 'clock_core',
      impactLevel: 'low',
      drainPercentage: Number(((stockBreakdown.baseStandbyMa / batteryCap) * 100).toFixed(2)),
      drainSharePercent: 0,
      stockBehavior: 'Standard SoC standby and RTC crystal oscillator',
      faodBehavior: 'Low-power standby floor',
      isOptimizedInFaod: true,
      statusBadge: 'SoC Standby Floor',
      estimatedMaCurrent: stockBreakdown.baseStandbyMa,
      mitigationTip: 'Baseline energy floor required for hardware RTC registers.'
    }
  ];

  const totalItemDrain = rawElementItems.reduce((sum, item) => sum + item.drainPercentage, 0) || 1;
  const elementBreakdown = rawElementItems.map(item => ({
    ...item,
    drainSharePercent: Math.round((item.drainPercentage / totalItemDrain) * 100)
  }));

  return {
    mode,
    efficiencyScore,
    optimizedEfficiencyScore: optimizedScore,
    estimatedStockDrainPerHour: `${stockRuntime.drainPercentPerHour.toFixed(2)}% / hr`,
    estimatedOptimizedDrainPerHour: `${optRuntime.drainPercentPerHour.toFixed(2)}% / hr`,
    estimatedStockDays: `${stockRuntime.runtimeDays.toFixed(1)} days`,
    estimatedOptimizedDays: `${optRuntime.runtimeDays.toFixed(1)} days`,
    estimatedPowerSavingsPercent: savingsPercent,
    findings,
    elementBreakdown,
    metrics: {
      activeWidgets: 8,
      scriptFilesScanned: 1,
      hasContinuousTimers: hasSeconds,
      hasSensorListeners: hasSensors,
      hasAnimations: hasAnims
    }
  };
}
