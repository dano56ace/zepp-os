export type ConversionStatus = 'idle' | 'processing' | 'completed' | 'error';

export type LogLevel = 'info' | 'extract' | 'patch' | 'success' | 'warn' | 'error' | 'energy';

export interface LogMessage {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: string;
}

export type PowerProfileMode = 'balanced' | 'ultra' | 'raw';

export interface EnergyOptimizationSettings {
  enabled: boolean;
  profile: PowerProfileMode;
  freezeSecondHandsInAod: boolean;
  throttleTimersTo1Min: boolean;
  pauseContinuousSensorsInAod: boolean;
  freezeAnimationsInAod: boolean;
  darkenBackgroundInAod: boolean;
  limitWidgetRefreshRate: boolean;
}

export interface EnergyOptimizationStats {
  secondHandsThrottled: number;
  timersThrottled: number;
  sensorsGuarded: number;
  animationsFrozen: number;
  powerReductionEstimatePercent: number;
}

export type DrainSeverity = 'critical' | 'high' | 'medium' | 'low' | 'minimal';

export interface AodElementDrainItem {
  id: string;
  name: string;
  category: 'second_hand' | 'sensors' | 'animations' | 'widgets' | 'oled_pixels' | 'clock_core' | 'background';
  impactLevel: DrainSeverity;
  drainPercentage: number; // Drain in % per hour (e.g. 1.8% / hr)
  drainSharePercent: number; // Share of total power consumed (0 - 100%)
  stockBehavior: string;
  faodBehavior: string;
  isOptimizedInFaod: boolean;
  statusBadge: string;
  estimatedMaCurrent: number; // In mA, e.g. 8.2 mA
  mitigationTip: string;
}

export interface ScanFinding {
  type: 'critical' | 'warning' | 'info' | 'optimized';
  category: 'refresh_rate' | 'heavy_sensor' | 'pixel_ratio' | 'fps' | 'timer' | 'render';
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  estimatedDrainPerHour: string;
  remedy: string;
}

export interface PowerAnalysisReport {
  mode: PowerProfileMode;
  efficiencyScore: number;
  optimizedEfficiencyScore: number;
  estimatedStockDrainPerHour: string;
  estimatedOptimizedDrainPerHour: string;
  estimatedStockDays: string;
  estimatedOptimizedDays: string;
  estimatedPowerSavingsPercent: number;
  findings: ScanFinding[];
  elementBreakdown?: AodElementDrainItem[];
  metrics: {
    activeWidgets: number;
    scriptFilesScanned: number;
    hasContinuousTimers: boolean;
    hasSensorListeners: boolean;
    hasAnimations: boolean;
  };
}

export interface ConversionStats {
  manifestPatched: boolean;
  idleFilesReplaced: number;
  scriptFilesModified: number;
  tokensReplaced: {
    onlyNormalToAll: number;
    showInAodToTrue: number;
    otherAodPatches: number;
  };
  energyStats?: EnergyOptimizationStats;
  totalFiles: number;
  durationMs: number;
  originalSize: number;
  outputSize: number;
}

export interface ExtractedImageItem {
  path: string;
  name: string;
  url: string;
  size: number;
  width?: number;
  height?: number;
  isDialCandidate?: boolean;
}

export interface PackageMetadata {
  appId?: string;
  appName?: string;
  version?: string;
  targetWatchface?: string;
  targetIdle?: string;
  deviceSource?: string[];
  deviceSourceNames?: string[];
  hasIdleDir: boolean;
  hasWatchfaceDir: boolean;
  filesList: string[];
  extractedImages?: ExtractedImageItem[];
  resolution?: string;
  author?: string;
  description?: string;
}

export interface ManifestDiagnosticItem {
  key: string;
  path: string;
  originalValue: any;
  patchedValue: any;
  status: 'injected' | 'modified' | 'verified_true' | 'preserved' | 'missing';
  category: 'showInAod' | 'secondHand' | 'target_sync' | 'module_mapping' | 'general';
  description: string;
}

export interface ManifestDiagnosticResult {
  hasManifest: boolean;
  manifestPath: string;
  showInAodStatus: {
    verified: boolean;
    injectedCount: number;
    locations: string[];
    details: string;
  };
  secondHandStatus: {
    verified: boolean;
    injectedCount: number;
    locations: string[];
    details: string;
  };
  idleSyncStatus: {
    verified: boolean;
    locations: string[];
    details: string;
  };
  attributesList: ManifestDiagnosticItem[];
  originalJson?: any;
  patchedJson?: any;
  scriptDiagnostics?: {
    timePointerFound: boolean;
    secondHandUnfrozen: boolean;
    visModePatchedCount: number;
    showInAodScriptCount: number;
  };
  overallHealth: 'passed' | 'warning' | 'error';
}

export interface WatchfaceFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: ConversionStatus;
  progress: number;
  outputBlob?: Blob;
  outputFileName?: string;
  outputSize?: number;
  outputBlobZpk?: Blob;
  outputBlobZip?: Blob;
  hasNestedZpk?: boolean;
  nestedZpkName?: string;
  errorMessage?: string;
  logs: LogMessage[];
  stats?: ConversionStats;
  powerReport?: PowerAnalysisReport;
  manifestOriginal?: string;
  manifestPatched?: string;
  manifestPath?: string;
  manifestDiagnostic?: ManifestDiagnosticResult;
  previewUrl?: string;
  aodPreviewUrl?: string;
  extractedImages?: ExtractedImageItem[];
  packageInfo?: PackageMetadata;
  createdAt: number;
}

export type OutputNamingMode = 'original' | 'suffix';
export type OutputFormatMode = 'original' | 'zpk' | 'zip';

export interface ConversionOptions {
  syncManifestTargets: boolean;
  overwriteIdleDir: boolean;
  overrideSimpleAod: boolean; // Overrides and purges stripped-down simple AOD with complete active dial
  patchScriptVisibility: boolean;
  deepWidgetVisibilityPatch: boolean;
  bypassIdleRefreshRate: boolean; // Overrides Zepp OS second hand & AOD timer suppression
  autoDownload: boolean;
  compressionLevel: number;
  outputNaming: OutputNamingMode;
  outputFormat: OutputFormatMode;
  amazfacesReplaceMode: boolean;
  batteryOptimizations: EnergyOptimizationSettings;
}

export const DEFAULT_ENERGY_SETTINGS: EnergyOptimizationSettings = {
  enabled: true, // Optimized by default to protect battery and prevent OS firmware rejection
  profile: 'balanced',
  freezeSecondHandsInAod: false, // Keep second hand active and sweeping/ticking in AOD as requested
  throttleTimersTo1Min: true,
  pauseContinuousSensorsInAod: true,
  freezeAnimationsInAod: true,
  darkenBackgroundInAod: false, // Keep full vibrant background
  limitWidgetRefreshRate: true
};

export const DEFAULT_CONVERSION_OPTIONS: ConversionOptions = {
  syncManifestTargets: true,
  overwriteIdleDir: true,
  overrideSimpleAod: true,
  patchScriptVisibility: true,
  deepWidgetVisibilityPatch: true,
  bypassIdleRefreshRate: true, // Default to true so all optimized watchfaces bypass 60s second-hand suppression
  autoDownload: false, // Do not download automatically; user clicks download button
  compressionLevel: 9,
  outputNaming: 'original',
  outputFormat: 'original',
  amazfacesReplaceMode: true,
  batteryOptimizations: DEFAULT_ENERGY_SETTINGS
};

export interface DeviceProfile {
  id: string;
  name: string;
  resolution: string;
  screenType: string;
  osVersion: string;
}
