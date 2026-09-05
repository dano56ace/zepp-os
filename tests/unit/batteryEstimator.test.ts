import { describe, it, expect } from 'vitest';
import {
  calculateOledCurrent,
  calculateSubsystemCurrents,
  calculateRuntime,
  calculateDeviceBatteryProfile,
  estimateAllDeviceProfiles,
  calculateDialAssetMetrics,
  estimateWatchfacePower,
  getDeviceHardware,
  DEVICE_BATTERY_PROFILES,
  BASE_STANDBY_CURRENT_MA,
  CPU_1HZ_TICK_CURRENT_MA,
  CPU_1MIN_TICK_CURRENT_MA,
  K_LUM_MA,
  K_STATIC_MA,
  OPR_SAFE_THRESHOLD,
} from '../../src/utils/batteryEstimator';
import { analyzeWatchfacePower } from '../../src/utils/powerAnalyzer';

describe('Milestone 4: Battery Drain Profiler & Estimator', () => {
  describe('Feature 12: Standby OLED & OPR Mathematical Calculations', () => {
    it('calculates OLED display current draw accurately across standard OPR and luminance values', () => {
      // Standard 10% OPR dial with 75% luminance
      // I_OLED = 0.10 * (0.75 * 4.0 + 0.5) = 0.10 * (3.0 + 0.5) = 0.35 mA
      const current = calculateOledCurrent(0.10, 0.75);
      expect(current).toBeCloseTo(0.35, 4);
    });

    it('asserts 0 mA OLED current when OPR is 0.0 (pure unlit black diodes)', () => {
      // When screen is all black (#000000), OLED subpixels draw exactly 0 mA
      const current = calculateOledCurrent(0.0, 0.85);
      expect(current).toBe(0.0);
    });

    it('calculates peak OLED current when OPR is 1.0 and luminance is 1.0 (100% white screen)', () => {
      // I_OLED = 1.0 * (1.0 * 4.0 + 0.5) = 4.5 mA
      const current = calculateOledCurrent(1.0, 1.0);
      expect(current).toBeCloseTo(4.5, 4);
    });

    it('handles extreme luminance edge cases: zero luminance and over-unity luminance', () => {
      // lum = 0.0: I_OLED = 0.10 * (0.0 * 4.0 + 0.5) = 0.05 mA (driver static bias only)
      const zeroLum = calculateOledCurrent(0.10, 0.0);
      expect(zeroLum).toBeCloseTo(0.05, 4);

      // lum = 1.5 (clamped to 1.0): I_OLED = 0.10 * (1.0 * 4.0 + 0.5) = 0.45 mA
      const overLum = calculateOledCurrent(0.10, 1.5);
      expect(overLum).toBeCloseTo(0.45, 4);
    });

    it('clamps negative OPR and negative luminance to 0.0', () => {
      const negativeOpr = calculateOledCurrent(-0.25, 0.80);
      expect(negativeOpr).toBe(0.0);

      const negativeLum = calculateOledCurrent(0.10, -0.50);
      expect(negativeLum).toBeCloseTo(0.05, 4); // lum clamped to 0.0 -> 0.10 * 0.5
    });

    it('correctly models subsystem currents for display off, static 1-min, and active 1Hz', () => {
      const off = calculateSubsystemCurrents({ mode: 'display_off' });
      expect(off.totalMa).toBe(0.35);
      expect(off.oledDisplayMa).toBe(0);
      expect(off.cpuTickMa).toBe(0);

      const static1Min = calculateSubsystemCurrents({
        opr: 0.10,
        luminance: 0.75,
        mode: 'static_1min',
      });
      // 0.80 (base) + 0.35 (oled) + 0.02 (cpu) = 1.17 mA
      expect(static1Min.totalMa).toBeCloseTo(1.17, 4);
      expect(static1Min.cpuTickMa).toBe(0.02);

      const active1Hz = calculateSubsystemCurrents({
        opr: 0.10,
        luminance: 0.75,
        mode: 'active_1hz',
      });
      // 0.80 (base) + 0.35 (oled) + 0.50 (cpu) = 1.65 mA
      expect(active1Hz.totalMa).toBeCloseTo(1.65, 4);
      expect(active1Hz.cpuTickMa).toBe(0.50);

      // Active 1Hz draws exactly 0.48 mA more than 1-minute static tick
      expect(active1Hz.totalMa - static1Min.totalMa).toBeCloseTo(0.48, 4);
    });

    it('applies constant backlight current for TFT/LCD screen types regardless of OPR', () => {
      const tftResult = calculateSubsystemCurrents({
        screenType: 'TFT',
        opr: 0.05,
        mode: 'static_1min',
      });
      expect(tftResult.oledDisplayMa).toBe(3.20);
      expect(tftResult.totalMa).toBeCloseTo(0.80 + 3.20 + 0.02, 4);
    });
  });

  describe('Feature 12: Dial Asset Metrics & Dark Dial Classification', () => {
    it('classifies a dark dial with OPR <= 0.15 as isDarkDial = true', () => {
      const files = {
        'watchface/index.js': `
          const bg = hmUI.createWidget(hmUI.widget.FILL_RECT, { color: 0x000000 });
          const sec = hmUI.createWidget(hmUI.widget.TIME_POINTER, { second_centerX: 240, second_centerY: 240 });
        `,
        'assets/0001.png': 'texture_data',
        'assets/0002.png': 'texture_data',
      };
      const metrics = calculateDialAssetMetrics(files, Object.keys(files));
      expect(metrics.hasSecondHand).toBe(true);
      expect(metrics.isDarkDial).toBe(true);
      expect(metrics.estimatedOpr).toBeLessThanOrEqual(OPR_SAFE_THRESHOLD);
      expect(metrics.totalAssets).toBe(2);
    });

    it('classifies a light dial with OPR > 0.15 as isDarkDial = false', () => {
      const files = {
        'watchface/index.js': `
          const bg = hmUI.createWidget(hmUI.widget.FILL_RECT, { color: 0xffffff });
          // bright light background theme
        `,
        'assets/bg_white.png': 'large_texture',
      };
      const metrics = calculateDialAssetMetrics(files, Object.keys(files));
      expect(metrics.isDarkDial).toBe(false);
      expect(metrics.estimatedOpr).toBeGreaterThan(OPR_SAFE_THRESHOLD);
    });

    it('detects animations in watchface scripts', () => {
      const files = {
        'watchface/index.js': `
          const anim = hmUI.createWidget(hmUI.widget.ANIM_IMG, { anim_status: 1 });
        `,
      };
      const metrics = calculateDialAssetMetrics(files);
      expect(metrics.hasAnimations).toBe(true);
    });
  });

  describe('Feature 13: Multi-Device Battery Modeling Across All 11 Universal Devices', () => {
    it('contains all 11 universal devices in DEVICE_BATTERY_PROFILES with accurate mAh capacities', () => {
      const universal11Codes = [
        '0x00000079', // Balance: 475 mAh
        '0x0000007b', // Cheetah: 440 mAh
        '0x0000007c', // Cheetah Pro: 440 mAh
        '0x00000072', // Falcon: 500 mAh
        '0x00000059', // GTR 3: 450 mAh
        '0x0000005a', // GTR 3 Pro: 450 mAh
        '0x00000067', // GTR 4: 475 mAh
        '0x00000069', // T-Rex 2: 500 mAh
        '0x00000073', // T-Rex Ultra: 500 mAh
        '0x00000078', // Active: 300 mAh
        '0x0000007a', // Active Edge: 370 mAh
      ];

      for (const code of universal11Codes) {
        const hw = getDeviceHardware(code);
        expect(hw).toBeDefined();
        expect(hw.deviceSource.toLowerCase()).toBe(code);
        expect(hw.batteryCapacityMah).toBeGreaterThanOrEqual(300);
      }

      // Explicit capacity verification
      expect(getDeviceHardware('0x00000079').batteryCapacityMah).toBe(475); // Balance
      expect(getDeviceHardware('0x0000007b').batteryCapacityMah).toBe(440); // Cheetah
      expect(getDeviceHardware('0x00000078').batteryCapacityMah).toBe(300); // Active
      expect(getDeviceHardware('0x00000072').batteryCapacityMah).toBe(500); // Falcon
      expect(getDeviceHardware('0x00000067').batteryCapacityMah).toBe(475); // GTR 4
      expect(getDeviceHardware('0x0000007a').screenType).toBe('TFT'); // Active Edge TFT
    });

    it('calculates runtime hours, runtime days, and drain%/hr following exact formulas', () => {
      // Capacity = 475 mAh, Current = 1.65 mA
      // T = 475 / 1.65 = 287.8787 hours
      // D = T / 24 = 11.9949 days
      // Drain = (1.65 / 475) * 100 = 0.34736 %/hr
      const runtime = calculateRuntime(475, 1.65);
      expect(runtime.runtimeHours).toBeCloseTo(287.88, 1);
      expect(runtime.runtimeDays).toBeCloseTo(11.99, 1);
      expect(runtime.drainPercentPerHour).toBeCloseTo(0.347, 2);

      // Verify energy conservation: drain%/hr * 24 * days = 100%
      const totalPercent = runtime.drainPercentPerHour * 24 * runtime.runtimeDays;
      expect(totalPercent).toBeCloseTo(100.0, 1);
    });

    it('demonstrates capacity scaling: larger batteries provide longer runtime and lower drain%/hr', () => {
      const balance = calculateDeviceBatteryProfile('0x00000079', 1.65); // 475 mAh
      const active = calculateDeviceBatteryProfile('0x00000078', 1.65);  // 300 mAh
      const falcon = calculateDeviceBatteryProfile('0x00000072', 1.65);  // 500 mAh

      // Falcon (500 mAh) > Balance (475 mAh) > Active (300 mAh)
      expect(falcon.projectedRuntimeDays).toBeGreaterThan(balance.projectedRuntimeDays);
      expect(balance.projectedRuntimeDays).toBeGreaterThan(active.projectedRuntimeDays);

      // Hourly drain %: Active > Balance > Falcon
      expect(active.drainPercentPerHour).toBeGreaterThan(balance.drainPercentPerHour);
      expect(balance.drainPercentPerHour).toBeGreaterThan(falcon.drainPercentPerHour);
    });

    it('generates profiles for all 11 Universal Target Devices simultaneously', () => {
      const profiles = estimateAllDeviceProfiles(1.65, 1.17);
      expect(profiles).toHaveLength(11);
      const names = profiles.map(p => p.deviceName);
      expect(names).toContain('Amazfit Balance');
      expect(names).toContain('Amazfit Active');
      expect(names).toContain('Amazfit Cheetah');
      expect(names).toContain('Amazfit Falcon');
      expect(names).toContain('Amazfit GTR 4');
      expect(names).toContain('Amazfit Active Edge');

      // Relative impact of 1Hz active vs static (1.65 vs 1.17 mA = +41.0%)
      for (const p of profiles) {
        expect(p.relativeImpactPercent).toBeCloseTo(41.0, 1);
      }
    });
  });

  describe('Feature 11: PROJECT.md Interface Contract (estimateWatchfacePower)', () => {
    it('implements estimateWatchfacePower with default options and generates complete PowerAnalysisReport', () => {
      const report = estimateWatchfacePower({
        deviceSource: '0x00000079',
        profile: 'balanced',
        oprLuminanceAreaPercent: 9.4,
      });

      expect(report).toBeDefined();
      expect(report.mode).toBe('balanced');
      expect(report.estimatedStockDrainPerHour).toMatch(/% \/ hr/);
      expect(report.estimatedOptimizedDrainPerHour).toMatch(/% \/ hr/);
      expect(report.estimatedStockDays).toMatch(/days/);
      expect(report.estimatedOptimizedDays).toMatch(/days/);
      expect(report.elementBreakdown).toBeDefined();
      expect(report.elementBreakdown!.length).toBeGreaterThanOrEqual(3);

      // Ensure element drain share sums to 100%
      const sumShare = report.elementBreakdown!.reduce((acc, el) => acc + el.drainSharePercent, 0);
      expect(sumShare).toBeGreaterThanOrEqual(98);
      expect(sumShare).toBeLessThanOrEqual(102);
    });

    it('supports numeric deviceSource (hex conversion)', () => {
      const report = estimateWatchfacePower({
        deviceSource: 0x79, // Balance
      });
      expect(report).toBeDefined();
    });

    it('maintains active 1Hz second hand in balanced mode while optimizing ultra mode', () => {
      const balancedReport = estimateWatchfacePower({ profile: 'balanced', hasActive1HzSeconds: true });
      const ultraReport = estimateWatchfacePower({ profile: 'ultra', hasActive1HzSeconds: true });

      // Ultra mode achieves higher savings by throttling the second hand
      expect(ultraReport.estimatedPowerSavingsPercent).toBeGreaterThan(balancedReport.estimatedPowerSavingsPercent);
    });
  });

  describe('Feature 11 / powerAnalyzer: Watchface Script Power Analysis & Energy Conservation', () => {
    it('satisfies energy conservation for baseline watchface script: drain%/hr * 24 * stockDays ≈ 100%', () => {
      const files = {
        'watchface/index.js': `
          const bg = hmUI.createWidget(hmUI.widget.FILL_RECT, { color: 0x000000 });
        `,
      };
      const report = analyzeWatchfacePower(files, Object.keys(files), {
        deviceSource: ['0x00000079'], // Amazfit Balance (475 mAh)
      });

      const stockDrain = parseFloat(report.estimatedStockDrainPerHour);
      const stockDays = parseFloat(report.estimatedStockDays);
      const stockEnergy = stockDrain * 24 * stockDays;

      expect(stockDrain).toBeGreaterThan(0);
      expect(stockDays).toBeGreaterThan(0);
      expect(stockEnergy).toBeGreaterThanOrEqual(90.0);
      expect(stockEnergy).toBeLessThanOrEqual(110.0);

      const optDrain = parseFloat(report.estimatedOptimizedDrainPerHour);
      const optDays = parseFloat(report.estimatedOptimizedDays);
      const optEnergy = optDrain * 24 * optDays;

      expect(optEnergy).toBeGreaterThanOrEqual(90.0);
      expect(optEnergy).toBeLessThanOrEqual(110.0);
    });

    it('satisfies energy conservation for active 1Hz second hand watchface: drain%/hr * 24 * stockDays ≈ 100%', () => {
      const files = {
        'watchface/index.js': `
          const sec = hmUI.createWidget(hmUI.widget.TIME_POINTER, {
            second_centerX: 240,
            second_centerY: 240,
          });
        `,
      };
      const report = analyzeWatchfacePower(files, Object.keys(files), {
        deviceSource: ['0x00000079'],
      });

      expect(report.metrics.hasContinuousTimers).toBe(true);

      const stockDrain = parseFloat(report.estimatedStockDrainPerHour);
      const stockDays = parseFloat(report.estimatedStockDays);
      const stockEnergy = stockDrain * 24 * stockDays;

      // Assert realistic days (~1.6 days on Balance, NOT 7.6 days from flawed formula)
      expect(stockDays).toBeCloseTo(1.6, 0);
      expect(stockEnergy).toBeGreaterThanOrEqual(90.0);
      expect(stockEnergy).toBeLessThanOrEqual(110.0);

      const optDrain = parseFloat(report.estimatedOptimizedDrainPerHour);
      const optDays = parseFloat(report.estimatedOptimizedDays);
      const optEnergy = optDrain * 24 * optDays;

      expect(optEnergy).toBeGreaterThanOrEqual(90.0);
      expect(optEnergy).toBeLessThanOrEqual(110.0);
    });

    it('satisfies energy conservation for heavy sensor, animation, and high widget count watchfaces', () => {
      const complexScript = `
        const hr = hmSensor.createSensor(hmSensor.id.HEART);
        const gps = hmSensor.createSensor(hmSensor.id.LOCATION);
        const anim = hmUI.createWidget(hmUI.widget.ANIM_IMG, { anim_status: 1 });
        const timer = setInterval(() => {}, 1000);
        ${Array.from({ length: 22 }, (_, i) => `const w${i} = hmUI.createWidget(hmUI.widget.TEXT, { text: "${i}" });`).join('\n')}
      `;
      const files = { 'watchface/index.js': complexScript };
      const report = analyzeWatchfacePower(files, Object.keys(files), {
        deviceSource: ['0x00000079'],
      });

      expect(report.metrics.hasContinuousTimers).toBe(true);
      expect(report.metrics.hasSensorListeners).toBe(true);
      expect(report.metrics.hasAnimations).toBe(true);
      expect(report.metrics.activeWidgets).toBeGreaterThan(20);

      const stockDrain = parseFloat(report.estimatedStockDrainPerHour);
      const stockDays = parseFloat(report.estimatedStockDays);
      const stockEnergy = stockDrain * 24 * stockDays;

      expect(stockEnergy).toBeGreaterThanOrEqual(90.0);
      expect(stockEnergy).toBeLessThanOrEqual(110.0);

      const optDrain = parseFloat(report.estimatedOptimizedDrainPerHour);
      const optDays = parseFloat(report.estimatedOptimizedDays);
      const optEnergy = optDrain * 24 * optDays;

      expect(optEnergy).toBeGreaterThanOrEqual(90.0);
      expect(optEnergy).toBeLessThanOrEqual(110.0);
    });

    it('satisfies energy conservation across all power profiles (raw, balanced, ultra)', () => {
      const files = {
        'watchface/index.js': `
          const sec = hmUI.createWidget(hmUI.widget.TIME_POINTER, { second_centerX: 240, second_centerY: 240 });
        `,
      };
      const profiles: ('raw' | 'balanced' | 'ultra')[] = ['raw', 'balanced', 'ultra'];

      for (const mode of profiles) {
        const report = analyzeWatchfacePower(files, Object.keys(files), { deviceSource: ['0x00000079'] }, mode);
        const stockDrain = parseFloat(report.estimatedStockDrainPerHour);
        const stockDays = parseFloat(report.estimatedStockDays);
        const stockEnergy = stockDrain * 24 * stockDays;

        expect(stockEnergy).toBeGreaterThanOrEqual(90.0);
        expect(stockEnergy).toBeLessThanOrEqual(110.0);

        const optDrain = parseFloat(report.estimatedOptimizedDrainPerHour);
        const optDays = parseFloat(report.estimatedOptimizedDays);
        const optEnergy = optDrain * 24 * optDays;

        expect(optEnergy).toBeGreaterThanOrEqual(90.0);
        expect(optEnergy).toBeLessThanOrEqual(110.0);
      }
    });

    it('satisfies energy conservation across diverse Universal Target Devices', () => {
      const devices = [
        '0x00000079', // Balance (475 mAh)
        '0x00000078', // Active (300 mAh)
        '0x00000073', // T-Rex Ultra (500 mAh)
        '0x0000007a', // Active Edge (370 mAh, TFT)
      ];
      const files = {
        'watchface/index.js': `
          const sec = hmUI.createWidget(hmUI.widget.TIME_POINTER, { second_centerX: 240, second_centerY: 240 });
        `,
      };

      for (const dev of devices) {
        const report = analyzeWatchfacePower(files, Object.keys(files), { deviceSource: [dev] }, 'balanced');
        const stockDrain = parseFloat(report.estimatedStockDrainPerHour);
        const stockDays = parseFloat(report.estimatedStockDays);
        const stockEnergy = stockDrain * 24 * stockDays;

        expect(stockEnergy).toBeGreaterThanOrEqual(90.0);
        expect(stockEnergy).toBeLessThanOrEqual(110.0);

        const optDrain = parseFloat(report.estimatedOptimizedDrainPerHour);
        const optDays = parseFloat(report.estimatedOptimizedDays);
        const optEnergy = optDrain * 24 * optDays;

        expect(optEnergy).toBeGreaterThanOrEqual(90.0);
        expect(optEnergy).toBeLessThanOrEqual(110.0);
      }
    });
  });
});
