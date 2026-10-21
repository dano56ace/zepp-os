import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import {
  transformWatchfaceScript,
  calculateNeedlePivot,
  findMatchingBrace,
  extractObjectProperties,
} from '../../src/utils/astTransformer.ts';

describe('Milestone 3: AST Transformation & 1Hz FAOD Engine', () => {
  const cwd = process.cwd();
  const jaegerPath = path.join(cwd, 'reference_watchfaces/extracted/jaeger/watchface/index.js');
  const tissotPath = path.join(cwd, 'reference_watchfaces/extracted/tissot/watchface/index.js');

  it('Feature 2: Mathematical pivot calculation pos_x = centerX - posX and pos_y = centerY - posY', () => {
    // Jaeger values: centerX 240, centerY 240, posX 31, posY 223
    const jaegerPivot = calculateNeedlePivot(240, 240, 31, 223);
    expect(jaegerPivot.pos_x).toBe(209);
    expect(jaegerPivot.pos_y).toBe(17);
    expect(jaegerPivot.center_x).toBe(240);
    expect(jaegerPivot.center_y).toBe(240);

    // Tissot values: centerX 240, centerY 240, posX 13, posY 228
    const tissotPivot = calculateNeedlePivot(240, 240, 13, 228);
    expect(tissotPivot.pos_x).toBe(227);
    expect(tissotPivot.pos_y).toBe(12);
  });

  it('Feature 1: Discrete TIME_POINTER AST Detection and Transformation', () => {
    const inputScript = `
      let sec = '';
      WatchFace({
        init_view() {
          sec = hmUI.createWidget(hmUI.widget.TIME_POINTER, {
            second_path: '0006.png',
            second_centerX: 240,
            second_centerY: 240,
            second_posX: 31,
            second_posY: 223,
            show_level: hmUI.show_level.ALL,
          });
        }
      });
    `;

    const result = transformWatchfaceScript(inputScript);
    expect(result.secondHandTransformed).toBe(true);
    expect(result.delegateInjected).toBe(true);
    expect(result.needlesExtracted).toHaveLength(1);
    expect(result.needlesExtracted[0]).toEqual({
      type: 'second',
      path: '0006.png',
      centerX: 240,
      centerY: 240,
      posX: 31,
      posY: 223,
      coverPath: undefined,
    });

    // Verification of converted IMG widget
    expect(result.code).toContain('hmUI.createWidget(hmUI.widget.IMG');
    expect(result.code).toContain('pos_x: 209');
    expect(result.code).toContain('pos_y: 17');
    expect(result.code).toContain('center_x: 240');
    expect(result.code).toContain('center_y: 240');
    expect(result.code).toContain("src: '0006.png'");

    // Verification of WIDGET_DELEGATE & Sensor injection
    expect(result.code).toContain('hmUI.widget.WIDGET_DELEGATE');
    expect(result.code).toContain('resume_call: function()');
    expect(result.code).toContain('pause_call: function()');
    expect(result.code).toContain('hmSensor.id.TIME');
    expect(result.code).toContain('setInterval(__faodUpdateSecondHand__, 1000)');
  });

  it('Feature 1 & 2: Unified TIME_POINTER AST Detection, Disconnection & IMG Injection', () => {
    const unifiedScript = `
      WatchFace({
        initView() {
          const hands = hmUI.createWidget(hmUI.widget.TIME_POINTER, {
            hour_path: '0004.png',
            hour_centerX: 240,
            hour_centerY: 240,
            hour_posX: 26,
            hour_posY: 160,
            minute_path: '0005.png',
            minute_centerX: 240,
            minute_centerY: 240,
            minute_posX: 21,
            minute_posY: 228,
            second_path: '0006.png',
            second_centerX: 240,
            second_centerY: 240,
            second_posX: 31,
            second_posY: 223,
            second_cover_path: '0002.png',
            second_cover_posX: 8,
            second_cover_posY: 8,
            show_level: hmUI.show_level.ALL,
          });
        }
      });
    `;

    const result = transformWatchfaceScript(unifiedScript);
    expect(result.secondHandTransformed).toBe(true);
    expect(result.needlesExtracted).toHaveLength(3);
    expect(result.needlesExtracted.map((n) => n.type)).toEqual(['hour', 'minute', 'second']);

    // Unified pointer must retain hour and minute
    expect(result.code).toContain('hour_path: \'0004.png\'');
    expect(result.code).toContain('minute_path: \'0005.png\'');

    // Unified pointer must have second_* stripped
    expect(result.code).not.toContain('second_path: \'0006.png\'');
    expect(result.code).not.toContain('second_centerX: 240');

    // Standalone IMG second hand and cover cap must be injected
    expect(result.code).toContain('var __faodSecondHand_0 = hmUI.createWidget(hmUI.widget.IMG');
    expect(result.code).toContain('pos_x: 209');
    expect(result.code).toContain('pos_y: 17');
    expect(result.code).toContain("src: '0002.png'");
    expect(result.code).toContain('pos_x: 232'); // 240 - 8
    expect(result.code).toContain('pos_y: 232'); // 240 - 8
  });

  it('Feature 15: Jaeger Polaris Reference Fixture Real Code Transformation', () => {
    expect(fs.existsSync(jaegerPath)).toBe(true);
    const originalJaeger = fs.readFileSync(jaegerPath, 'utf8');

    const result = transformWatchfaceScript(originalJaeger);
    expect(result.secondHandTransformed).toBe(true);
    expect(result.delegateInjected).toBe(true);

    // Both normal and idle discrete pointers must be converted to IMG
    expect(result.code).toContain('normal_analog_clock_time_pointer_second = hmUI.createWidget(hmUI.widget.IMG');
    expect(result.code).toContain('idle_analog_clock_time_pointer_second = hmUI.createWidget(hmUI.widget.IMG');
    expect(result.code).not.toContain('normal_analog_clock_time_pointer_second = hmUI.createWidget(hmUI.widget.TIME_POINTER');
    expect(result.code).not.toContain('idle_analog_clock_time_pointer_second = hmUI.createWidget(hmUI.widget.TIME_POINTER');

    // WIDGET_DELEGATE injected into init_view()
    expect(result.code).toContain('WIDGET_DELEGATE');
    expect(result.code).toContain('resume_call');

    // onDestory cleanup injected
    expect(result.code).toContain('onDestory()');
    expect(result.code).toContain('clearInterval(__faodSecondTimer__)');
  });

  it('Tissot PRX Working Fixture Idempotence: No redundant transformation or delegate duplication', () => {
    expect(fs.existsSync(tissotPath)).toBe(true);
    const originalTissot = fs.readFileSync(tissotPath, 'utf8');

    const result = transformWatchfaceScript(originalTissot);
    // Tissot already uses IMG + WIDGET_DELEGATE, should not transform or re-inject
    expect(result.secondHandTransformed).toBe(false);
    expect(result.delegateInjected).toBe(false);
    expect(result.code).toBe(originalTissot);
  });

  it('Power Profile: freezeSecondHandsInAod sets ONLY_NORMAL and guards AOD execution', () => {
    const script = `
      WatchFace({
        initView() {
          let s = hmUI.createWidget(hmUI.widget.TIME_POINTER, {
            second_path: 'sec.png',
            second_centerX: 240,
            second_centerY: 240,
            second_posX: 10,
            second_posY: 100,
          });
        }
      });
    `;

    const result = transformWatchfaceScript(script, { freezeSecondHandsInAod: true });
    expect(result.secondHandTransformed).toBe(true);
    expect(result.code).toContain('show_level.ONLY_NORMAL');
    expect(result.code).toContain('if (__st__ === 1) return;');
  });

  it('Runtime Simulation in Node VM: Asserts 1Hz tick, angle accuracy (second * 6), and delegate lifecycle', () => {
    const testScript = `
      var normal_sec = '';
      WatchFace({
        init_view() {
          normal_sec = hmUI.createWidget(hmUI.widget.TIME_POINTER, {
            second_path: '0006.png',
            second_centerX: 240,
            second_centerY: 240,
            second_posX: 31,
            second_posY: 223,
          });
        }
      });
    `;

    const transformed = transformWatchfaceScript(testScript);

    let lastAngle = -1;
    let delegateInstance: any = null;
    let timerCleared = false;

    const mockSandbox = {
      console,
      setInterval: (_fn: any, _ms: number) => 999,
      clearInterval: (_id: any) => { timerCleared = true; },
      hmUI: {
        widget: { IMG: 'IMG', TIME_POINTER: 'TIME_POINTER', WIDGET_DELEGATE: 'WIDGET_DELEGATE' },
        show_level: { ALL: 1, ONLY_NORMAL: 2, ONLY_AOD: 3 },
        prop: { ANGLE: 'ANGLE' },
        createWidget: (type: string, opts: any) => {
          if (type === 'WIDGET_DELEGATE') {
            delegateInstance = opts;
          }
          return {
            type,
            opts,
            setProperty: (prop: string, val: number) => {
              if (prop === 'ANGLE') lastAngle = val;
            },
          };
        },
      },
      hmSensor: {
        id: { TIME: 1 },
        event: { CHANGE: 'CHANGE' },
        createSensor: () => ({
          second: 42,
          addEventListener: (_evt: string, _cb: any) => {},
        }),
      },
      WatchFace: (def: any) => {
        def.init_view();
        return def;
      },
    };

    vm.createContext(mockSandbox);
    vm.runInContext(transformed.code, mockSandbox);

    expect(delegateInstance).toBeDefined();
    expect(typeof delegateInstance.resume_call).toBe('function');
    expect(typeof delegateInstance.pause_call).toBe('function');

    // Trigger resume_call: second is 42, expected angle = 42 * 6 = 252 degrees
    delegateInstance.resume_call();
    expect(lastAngle).toBe(252);

    // Trigger pause_call: timer must be cleared
    delegateInstance.pause_call();
    expect(timerCleared).toBe(true);
  });

  it('Feature: Digital Watchface with IMG_TIME and second_array transforms show_level and injects 1Hz FAOD engine', () => {
    const digitalScript = `
      var digitalTime = null;
      WatchFace({
        init_view() {
          digitalTime = hmUI.createWidget(hmUI.widget.IMG_TIME, {
            hour_zero: true,
            hour_startX: 80,
            hour_startY: 180,
            hour_array: ['0.png', '1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '9.png'],
            minute_zero: true,
            minute_startX: 200,
            minute_startY: 180,
            minute_array: ['0.png', '1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png', '9.png'],
            second_zero: true,
            second_startX: 320,
            second_startY: 180,
            second_array: ['s0.png', 's1.png', 's2.png', 's3.png', 's4.png', 's5.png', 's6.png', 's7.png', 's8.png', 's9.png'],
            show_level: hmUI.show_level.ONLY_NORMAL
          });
        }
      });
    `;

    const result = transformWatchfaceScript(digitalScript);
    expect(result.digitalClockDetected).toBe(true);
    expect(result.digitalSecondsDetected).toBe(true);
    expect(result.secondHandTransformed).toBe(true);
    expect(result.delegateInjected).toBe(true);
    expect(result.code).toContain('show_level.ALL');
    expect(result.code).toContain('WIDGET_DELEGATE');
    expect(result.code).toContain('__faodUpdateSecondHand__');
    expect(result.code).toContain('digitalTime.setProperty');
  });

  it('Feature: Digital Watchface with discrete digital second text/number widget updates value at 1Hz', () => {
    const digitalTextScript = `
      var secText = null;
      WatchFace({
        init_view() {
          secText = hmUI.createWidget(hmUI.widget.TEXT, {
            x: 350,
            y: 240,
            w: 80,
            h: 40,
            text: '00',
            show_level: hmUI.show_level.ONLY_NORMAL
          });
        }
      });
    `;

    const result = transformWatchfaceScript(digitalTextScript);
    expect(result.digitalSecondsDetected).toBe(true);
    expect(result.delegateInjected).toBe(true);
    expect(result.code).toContain('show_level.ALL');
    expect(result.code).toContain('secText.setProperty(hmUI.prop.TEXT, __secStr__)');
    expect(result.code).toContain('setInterval(__faodUpdateSecondHand__, 1000)');
  });

  it('Compatibility: Zepp OS 3.x (@zos/ui & @zos/sensor) watchface injects polyfill after imports and transforms TIME_POINTER', () => {
    const zos3Script = `import { createWidget, widget, show_level, prop } from '@zos/ui';
import { Time } from '@zos/sensor';

WatchFace({
  build() {
    const secHand = createWidget(widget.TIME_POINTER, {
      second_path: 'sec_zos3.png',
      second_centerX: 233,
      second_centerY: 233,
      second_posX: 15,
      second_posY: 200,
      show_level: show_level.ONLY_NORMAL
    });
  }
});`;

    const result = transformWatchfaceScript(zos3Script, { designWidth: 466, designHeight: 466 });
    expect(result.sdkVersionDetected).toBe('3.x');
    expect(result.polyfillsInjected).toBe(true);
    expect(result.secondHandTransformed).toBe(true);
    expect(result.delegateInjected).toBe(true);
    // Ensure ES imports stay at the very top of the file before the polyfill shim
    expect(result.code.trim().startsWith("import { createWidget")).toBe(true);
    expect(result.code).toContain('__ZOS_UNIVERSAL_COMPAT_SHIM__');
    expect(result.code).toContain('createWidget(widget.IMG');
    expect(result.code).toContain('w: 466');
    expect(result.code).toContain('h: 466');
  });

  it('Compatibility: Minified / Webpack-bundled watchface with aliased _ui namespace transforms second pointer accurately', () => {
    const minifiedScript = `!function(e){var _ui=hmUI;WatchFace({init_view:function(){var s=_ui.createWidget(_ui.widget.TIME_POINTER,{second_path:"s.png",second_centerX:195,second_centerY:225,second_posX:10,second_posY:180,show_level:_ui.show_level.ONLY_NORMAL})}})}();`;

    const result = transformWatchfaceScript(minifiedScript, { designWidth: 390, designHeight: 450 });
    expect(result.bundlerType).toBe('minified');
    expect(result.aliasedWidgetsResolved).toBeGreaterThanOrEqual(1);
    expect(result.secondHandTransformed).toBe(true);
    expect(result.delegateInjected).toBe(true);
    expect(result.code).toContain('_ui.createWidget(_ui.widget.IMG');
    expect(result.code).toContain('pos_x: 185');
    expect(result.code).toContain('pos_y: 45');
  });
});


