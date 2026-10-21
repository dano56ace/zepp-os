/**
 * astTransformer.ts - Deterministic AST Transformation & 1Hz FAOD Engine
 * 
 * Implements Milestone 3 Features:
 * - Feature 1: Unified & Discrete TIME_POINTER AST Detection
 * - Feature 2: Coordinate & Pivot Mapping Transformation (pos_x = centerX - posX, pos_y = centerY - posY)
 * - Feature 3: Standby Active Delegate Lifecycle Polyfill (WIDGET_DELEGATE)
 * - Feature 4: 1Hz Hardware Timer & Sensor Synchronization
 * - Feature 15: Standby 60-Second Display Freeze Elimination
 */

export interface AstTransformOptions {
  bypassIdleRefreshRate?: boolean;
  freezeSecondHandsInAod?: boolean;
  designWidth?: number;
  designHeight?: number;
  injectZosPolyfills?: boolean;
}

export interface ExtractedNeedle {
  type: 'second' | 'hour' | 'minute';
  path: string;
  centerX: number;
  centerY: number;
  posX: number;
  posY: number;
  coverPath?: string;
}

export interface ScriptCompatibilityInfo {
  sdkVersion: '1.0' | '2.0' | '3.x';
  bundlerType: 'standard' | 'minified' | 'webpack';
  hasZosImports: boolean;
  aliasedUiNamespace?: string;
}

export interface AstTransformResult {
  code: string;
  secondHandTransformed: boolean;
  needlesExtracted: ExtractedNeedle[];
  delegateInjected: boolean;
  digitalClockDetected?: boolean;
  digitalSecondsDetected?: boolean;
  sdkVersionDetected?: '1.0' | '2.0' | '3.x';
  bundlerType?: 'standard' | 'minified' | 'webpack';
  polyfillsInjected?: boolean;
  aliasedWidgetsResolved?: number;
}

/**
 * Inspects watchface script content to determine Zepp OS SDK generation and bundler format.
 */
export function detectScriptCompatibility(scriptContent: string): ScriptCompatibilityInfo {
  const hasZosImports = /@zos\/(ui|sensor|settings|display|interaction|utils|fs|BLE|ble)/.test(scriptContent);
  const hasZos2Core = /DeviceRuntimeCore|__$$hmAppManager$$__|hmUI\.createWidget/.test(scriptContent);

  let sdkVersion: '1.0' | '2.0' | '3.x' = '1.0';
  if (hasZosImports) {
    sdkVersion = '3.x';
  } else if (/DeviceRuntimeCore|hmApp\.registerGestureEvent|hmFS\.SysProGetInt/.test(scriptContent)) {
    sdkVersion = '2.0';
  } else if (hasZos2Core) {
    sdkVersion = '1.0';
  }

  let bundlerType: 'standard' | 'minified' | 'webpack' = 'standard';
  if (/__webpack_require__|webpackJsonp|__webpack_modules__|__esModule/.test(scriptContent)) {
    bundlerType = 'webpack';
  } else {
    const lines = scriptContent.split('\n').filter((l) => l.trim().length > 0);
    const maxLineLen = lines.reduce((max, l) => Math.max(max, l.length), 0);
    const hasMinifiedIife = /^!function\s*\(|^\(function\s*\([a-z],[a-z]\)/.test(scriptContent.trim());
    const hasAliasedWidget = /\b(?!(?:hmUI)\b)([a-zA-Z0-9_$]{1,6})\.createWidget\s*\(\s*\1\.widget\./.test(scriptContent);
    if (hasMinifiedIife || hasAliasedWidget || (lines.length <= 8 && maxLineLen > 320)) {
      bundlerType = 'minified';
    }
  }

  // Detect if @zos/ui or hmUI is aliased to a custom identifier (e.g. _ui.createWidget)
  const aliasMatch = scriptContent.match(/\b([a-zA-Z0-9_$]+)\.createWidget\s*\(\s*(?:\1\.widget\.|hmUI\.widget\.|widget\.)/);
  const aliasedUiNamespace = aliasMatch && aliasMatch[1] !== 'hmUI' ? aliasMatch[1] : undefined;

  return {
    sdkVersion,
    bundlerType,
    hasZosImports,
    aliasedUiNamespace,
  };
}

/**
 * Injects bidirectional Zepp OS 1.0 <-> 2.0 <-> 3.x API compatibility polyfills
 * safely after any top-level ES module import statements.
 */
export function injectZosCompatibilityPolyfill(scriptContent: string): { code: string; injected: boolean } {
  if (scriptContent.includes('__ZOS_UNIVERSAL_COMPAT_SHIM__')) {
    return { code: scriptContent, injected: false };
  }

  const compatInfo = detectScriptCompatibility(scriptContent);
  // Find the end of any top-level ES `import ...` declarations so we never break ES module syntax
  const importRegex = /^[ \t]*import\s+(?:[\s\S]*?from\s+['"][^'"]+['"]|['"][^'"]+['"])\s*;?[ \t]*$/gm;
  let lastImportEnd = 0;
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(scriptContent)) !== null) {
    lastImportEnd = match.index + match[0].length;
  }

  // Also capture imported identifiers from @zos/ui or @zos/sensor if present
  const hasBareCreateWidget = /import\s*\{[^}]*\bcreateWidget\b[^}]*\}\s*from\s*['"]@zos\/ui['"]/.test(scriptContent);
  const hasBareWidgetEnum = /import\s*\{[^}]*\bwidget\b[^}]*\}\s*from\s*['"]@zos\/ui['"]/.test(scriptContent);
  const hasBareShowLevel = /import\s*\{[^}]*\bshow_level\b[^}]*\}\s*from\s*['"]@zos\/ui['"]/.test(scriptContent);
  const hasBareProp = /import\s*\{[^}]*\bprop\b[^}]*\}\s*from\s*['"]@zos\/ui['"]/.test(scriptContent);
  const hasTimeClassImport = /import\s*\{[^}]*\bTime\b[^}]*\}\s*from\s*['"]@zos\/sensor['"]/.test(scriptContent);

  const zosBridgeLines: string[] = [];
  if (hasBareCreateWidget) {
    zosBridgeLines.push(`  if (typeof createWidget === 'function' && !__g__.hmUI.createWidget) __g__.hmUI.createWidget = createWidget;`);
  }
  if (hasBareWidgetEnum) {
    zosBridgeLines.push(`  if (typeof widget !== 'undefined' && widget) __g__.hmUI.widget = Object.assign(__g__.hmUI.widget || {}, widget);`);
  }
  if (hasBareShowLevel) {
    zosBridgeLines.push(`  if (typeof show_level !== 'undefined' && show_level) __g__.hmUI.show_level = Object.assign(__g__.hmUI.show_level || {}, show_level);`);
  }
  if (hasBareProp) {
    zosBridgeLines.push(`  if (typeof prop !== 'undefined' && prop) __g__.hmUI.prop = Object.assign(__g__.hmUI.prop || {}, prop);`);
  }
  if (hasTimeClassImport) {
    zosBridgeLines.push(`  if (typeof Time === 'function' && (!__g__.hmSensor || !__g__.hmSensor.createSensor)) { __g__.hmSensor = __g__.hmSensor || { id: { TIME: 'TIME' }, event: { CHANGE: 'CHANGE' } }; __g__.hmSensor.createSensor = function(id) { if (id === __g__.hmSensor.id.TIME || id === 'TIME') { var t = new Time(); return { get second() { return typeof t.getSeconds === 'function' ? t.getSeconds() : (new Date()).getSeconds(); }, get minute() { return typeof t.getMinutes === 'function' ? t.getMinutes() : (new Date()).getMinutes(); }, get hour() { return typeof t.getHours === 'function' ? t.getHours() : (new Date()).getHours(); }, addEventListener: function(ev, cb) { if (typeof t.onPerMinute === 'function') t.onPerMinute(cb); } }; } return {}; }; }`);
  }
  if (compatInfo.aliasedUiNamespace) {
    zosBridgeLines.push(`  try { if (typeof ${compatInfo.aliasedUiNamespace} !== 'undefined' && ${compatInfo.aliasedUiNamespace} && ${compatInfo.aliasedUiNamespace}.createWidget && !__g__.hmUI.createWidget) { __g__.hmUI = ${compatInfo.aliasedUiNamespace}; } } catch(_e){}`);
  }

  const shimBlock = `/* __ZOS_UNIVERSAL_COMPAT_SHIM__ (Zepp OS 1.0 / 2.0 / 3.x Bridge) */
(function() {
  try {
    var __g__ = typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : (typeof global !== 'undefined' ? global : Function('return this')()));
    if (!__g__) return;
    __g__.hmUI = __g__.hmUI || {};
    __g__.hmUI.show_level = __g__.hmUI.show_level || { ALL: 1, ONLY_NORMAL: 1, ONLY_AOD: 1, ONAL_NORAML: 1 };
    __g__.hmUI.vis_mode = __g__.hmUI.vis_mode || { ALL: 0, ONLY_NORMAL: 0, ONLY_AOD: 0 };
    __g__.hmUI.widget = __g__.hmUI.widget || { IMG: 1, TEXT: 2, ARC: 3, FILL_RECT: 4, STROKE_RECT: 5, IMG_TIME: 6, TEXT_TIME: 7, IMG_NUMBER: 8, TIME_POINTER: 9, WIDGET_DELEGATE: 10, IMG_LEVEL: 11, IMG_PROGRESS: 12, CIRCLE: 13, IMG_STATUS: 14, IMG_WEEK: 15, IMG_DATE: 16, SPORT_DATA: 17, HISTOGRAM: 18, IMG_ANIM: 19, GROUP: 20 };
    __g__.hmUI.prop = __g__.hmUI.prop || { MORE: 1, ANGLE: 2, POS_X: 3, POS_Y: 4, CENTER_X: 5, CENTER_Y: 6, SRC: 7, TEXT: 8, VISIBLE: 9, ALPHA: 10, CURRENT_TYPE: 11, VALUE: 12 };
    __g__.hmSetting = __g__.hmSetting || { screen_type: { WATCHFACE: 0, AOD: 1, SETTINGS: 2 }, getScreenType: function() { return 0; } };
    __g__.hmSensor = __g__.hmSensor || { id: { TIME: 1, BATTERY: 2, STEP: 3, CALORIE: 4, HEART: 5, PAI: 6, DISTANCE: 7, STAND: 8, WEATHER: 9, SLEEP: 10 }, event: { CHANGE: 1, LAST: 2 }, createSensor: function() { return { get second() { return (new Date()).getSeconds(); }, get minute() { return (new Date()).getMinutes(); }, get hour() { return (new Date()).getHours(); }, addEventListener: function() {} }; } };
${zosBridgeLines.length > 0 ? zosBridgeLines.join('\n') + '\n' : ''}  } catch (__compatErr) {}
})();
`;

  if (lastImportEnd > 0) {
    const before = scriptContent.slice(0, lastImportEnd);
    const after = scriptContent.slice(lastImportEnd);
    return {
      code: `${before}\n${shimBlock}${after}`,
      injected: true,
    };
  }

  return {
    code: `${shimBlock}\n${scriptContent}`,
    injected: true,
  };
}

/**
 * Calculates rotated IMG placement coordinates from TIME_POINTER pivot parameters.
 */
export function calculateNeedlePivot(
  centerX: number,
  centerY: number,
  posX: number,
  posY: number
): { pos_x: number; pos_y: number; center_x: number; center_y: number } {
  return {
    pos_x: centerX - posX,
    pos_y: centerY - posY,
    center_x: centerX,
    center_y: centerY,
  };
}

/**
 * Scans ahead to find matching closing brace `}`, respecting strings, comments, and nested brackets.
 */
export function findMatchingBrace(src: string, startIdx: number): number {
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = startIdx; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === stringChar) {
        inString = false;
      }
      continue;
    }

    if (c === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (c === '\'' || c === '"' || c === '`') {
      inString = true;
      stringChar = c;
      continue;
    }

    if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Extracts key-value property pairs from an object literal string `{ ... }`.
 */
export function extractObjectProperties(objStr: string): Record<string, string> {
  const inner = objStr.trim().slice(1, -1);
  const props: Record<string, string> = {};

  let i = 0;
  while (i < inner.length) {
    // Skip whitespace, commas, and comments
    while (i < inner.length && (/\s/.test(inner[i]) || inner[i] === ',' || inner[i] === '/')) {
      if (inner[i] === '/' && inner[i + 1] === '/') {
        while (i < inner.length && inner[i] !== '\n') i++;
      } else if (inner[i] === '/' && inner[i + 1] === '*') {
        i += 2;
        while (i < inner.length && !(inner[i] === '*' && inner[i + 1] === '/')) i++;
        i += 2;
      } else {
        i++;
      }
    }
    if (i >= inner.length) break;

    // Match property key
    const keyMatch = inner.slice(i).match(/^([a-zA-Z0-9_$'"`]+)\s*:/);
    if (!keyMatch) {
      i++;
      continue;
    }
    const rawKey = keyMatch[1].replace(/['"`]/g, '');
    i += keyMatch[0].length;

    // Extract value up to matching comma or end of object, balancing parens/brackets/braces
    let valStart = i;
    let depthParen = 0;
    let depthBrace = 0;
    let depthBracket = 0;
    let inString = false;
    let stringChar = '';

    while (i < inner.length) {
      const c = inner[i];
      if (inString) {
        if (c === '\\') {
          i += 2;
          continue;
        }
        if (c === stringChar) inString = false;
        i++;
        continue;
      }
      if (c === '\'' || c === '"' || c === '`') {
        inString = true;
        stringChar = c;
        i++;
        continue;
      }

      if (c === '(') depthParen++;
      else if (c === ')') depthParen--;
      else if (c === '{') depthBrace++;
      else if (c === '}') depthBrace--;
      else if (c === '[') depthBracket++;
      else if (c === ']') depthBracket--;
      else if (c === ',' && depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
        break;
      }
      i++;
    }

    const valStr = inner.slice(valStart, i).trim();
    props[rawKey] = valStr;
  }

  return props;
}

/**
 * Removes second_* properties from an object literal string for unified pointer transformation.
 */
function removeSecondHandProperties(configStr: string): string {
  const stripped = configStr.replace(
    /\s*second_[a-zA-Z0-9_]+\s*:\s*([^,}]+|\([^)]*\)|'[^']*'|"[^"]*")\s*,?/g,
    ''
  );
  return stripped.replace(/,\s*,/g, ',').replace(/,\s*(\/\*[\s\S]*?\*\/|\/\/[^\n]*)?\s*\}/g, '\n}');
}

/**
 * Sanitizes numeric or string property values.
 */
function parseCleanNumber(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const match = val.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : fallback;
}

function parseCleanString(val: string | undefined, fallback: string): string {
  if (!val) return fallback;
  const match = val.match(/['"`]([^'"`]+)['"`]/);
  if (match) return match[1].trim();
  return val.replace(/['"`]/g, '').trim();
}

/**
 * Locates the optimal injection point for the WIDGET_DELEGATE lifecycle engine,
 * supporting standard methods, ES5 colon-function methods, and minified arrow functions.
 */
function findLifecycleInjectionPoint(src: string): { type: 'method_end' | 'fallback'; index: number } {
  const methodMatch = src.match(/(?:init_view|initView|build)\s*(?::\s*(?:function\s*)?\([^)]*\)\s*(?:=>\s*)?|\([^)]*\)\s*)\{/);
  if (methodMatch && methodMatch.index !== undefined) {
    const braceStart = methodMatch.index + methodMatch[0].lastIndexOf('{');
    const braceEnd = findMatchingBrace(src, braceStart);
    if (braceEnd !== -1) {
      return { type: 'method_end', index: braceEnd };
    }
  }
  return { type: 'fallback', index: src.length };
}

/**
 * Injects timer cleanup into onDestroy() or onDestory() (both standard and minified ES5 syntax).
 */
function injectDestroyCleanup(src: string): string {
  const match = src.match(/(?:onDestroy|onDestory)\s*(?::\s*(?:function\s*)?\([^)]*\)\s*(?:=>\s*)?|\([^)]*\)\s*)\{/);
  if (match && match.index !== undefined) {
    const insertPos = match.index + match[0].length;
    const cleanupCode = `\n    try { if (typeof __faodSecondTimer__ !== 'undefined' && __faodSecondTimer__) { clearInterval(__faodSecondTimer__); __faodSecondTimer__ = null; } } catch(e){}`;
    return src.slice(0, insertPos) + cleanupCode + src.slice(insertPos);
  }
  return src;
}

/**
 * Core transformation routine conforming to PROJECT.md interface contract.
 * Supports Zepp OS 1.0, 2.0, and 3.x (@zos/*), as well as minified and Webpack-bundled watchfaces.
 */
export function transformWatchfaceScript(
  scriptContent: string,
  options: AstTransformOptions = {}
): AstTransformResult {
  const bypass = options.bypassIdleRefreshRate !== false;
  const freezeInAod = options.freezeSecondHandsInAod === true;
  const designWidth = options.designWidth || 480;
  const designHeight = options.designHeight || designWidth || 480;
  const defaultCenterX = Math.round(designWidth / 2);
  const defaultCenterY = Math.round(designHeight / 2);

  const compatInfo = detectScriptCompatibility(scriptContent);
  const needlesExtracted: ExtractedNeedle[] = [];
  let secondHandTransformed = false;
  let delegateInjected = false;
  let aliasedWidgetsResolved = 0;

  if (!bypass) {
    return {
      code: scriptContent,
      secondHandTransformed: false,
      needlesExtracted: [],
      delegateInjected: false,
      sdkVersionDetected: compatInfo.sdkVersion,
      bundlerType: compatInfo.bundlerType,
      polyfillsInjected: false,
      aliasedWidgetsResolved: 0,
    };
  }

  // If already contains WIDGET_DELEGATE or FAOD engine, don't re-inject delegate
  const alreadyHasDelegate = scriptContent.includes('WIDGET_DELEGATE');
  const alreadyHasFaodEngine = scriptContent.includes('__faodUpdateSecondHand__');

  // Match all TIME_POINTER widget creations:
  // Supports hmUI.createWidget(hmUI.widget.TIME_POINTER, ...), createWidget(widget.TIME_POINTER, ...),
  // and minified/aliased namespaces like _ui.createWidget(_ui.widget.TIME_POINTER, ...)
  const timePointerPattern = /(?:(?:(?:const|let|var)\s+)?([a-zA-Z0-9_$.]+)\s*=\s*)?(?:([a-zA-Z0-9_$]+\.)?createWidget\s*\(\s*(?:([a-zA-Z0-9_$]+)\.widget\.|widget\.)?TIME_POINTER\s*,\s*)/g;

  interface WidgetReplacement {
    start: number;
    end: number;
    replacementText: string;
    targetVar?: string;
  }

  const replacements: WidgetReplacement[] = [];
  const targetNeedleVars: string[] = [];
  let syntheticSecondCount = 0;

  let match: RegExpExecArray | null;
  while ((match = timePointerPattern.exec(scriptContent)) !== null) {
    const fullMatchStart = match.index;
    const assignedVar = match[1];
    const callerPrefix = match[2] || ''; // e.g., 'hmUI.' or '_ui.' or ''
    const widgetNamespace = match[3] ? `${match[3]}.widget.` : callerPrefix ? `${callerPrefix}widget.` : 'widget.';

    if (callerPrefix !== 'hmUI.') {
      aliasedWidgetsResolved++;
    }

    const braceStart = scriptContent.indexOf('{', fullMatchStart + match[0].length - 1);
    if (braceStart === -1) continue;

    const braceEnd = findMatchingBrace(scriptContent, braceStart);
    if (braceEnd === -1) continue;

    // Find the closing paren ')' of createWidget(..., { ... })
    let callEnd = braceEnd + 1;
    while (callEnd < scriptContent.length && (/\s/.test(scriptContent[callEnd]) || scriptContent[callEnd] === ')')) {
      if (scriptContent[callEnd] === ')') {
        callEnd++;
        break;
      }
      callEnd++;
    }
    // Check for trailing semicolon
    let statementEnd = callEnd;
    while (statementEnd < scriptContent.length && /\s/.test(scriptContent[statementEnd])) {
      statementEnd++;
    }
    if (scriptContent[statementEnd] === ';') {
      statementEnd++;
    }

    const configStr = scriptContent.slice(braceStart, braceEnd + 1);
    const props = extractObjectProperties(configStr);

    // Record Hour Needle if present
    if (props.hour_path) {
      needlesExtracted.push({
        type: 'hour',
        path: parseCleanString(props.hour_path, ''),
        centerX: parseCleanNumber(props.hour_centerX, defaultCenterX),
        centerY: parseCleanNumber(props.hour_centerY, defaultCenterY),
        posX: parseCleanNumber(props.hour_posX, 0),
        posY: parseCleanNumber(props.hour_posY, 0),
        coverPath: props.hour_cover_path ? parseCleanString(props.hour_cover_path, '') : undefined,
      });
    }

    // Record Minute Needle if present
    if (props.minute_path) {
      needlesExtracted.push({
        type: 'minute',
        path: parseCleanString(props.minute_path, ''),
        centerX: parseCleanNumber(props.minute_centerX, defaultCenterX),
        centerY: parseCleanNumber(props.minute_centerY, defaultCenterY),
        posX: parseCleanNumber(props.minute_posX, 0),
        posY: parseCleanNumber(props.minute_posY, 0),
        coverPath: props.minute_cover_path ? parseCleanString(props.minute_cover_path, '') : undefined,
      });
    }

    // Process Second Needle
    if (props.second_path) {
      const secondPath = parseCleanString(props.second_path, '');
      const centerX = parseCleanNumber(props.second_centerX, defaultCenterX);
      const centerY = parseCleanNumber(props.second_centerY, defaultCenterY);
      const posX = parseCleanNumber(props.second_posX, 0);
      const posY = parseCleanNumber(props.second_posY, 0);
      const coverPath = props.second_cover_path ? parseCleanString(props.second_cover_path, '') : undefined;
      const coverPosX = parseCleanNumber(props.second_cover_posX, 0);
      const coverPosY = parseCleanNumber(props.second_cover_posY, 0);

      needlesExtracted.push({
        type: 'second',
        path: secondPath,
        centerX,
        centerY,
        posX,
        posY,
        coverPath,
      });

      const pivot = calculateNeedlePivot(centerX, centerY, posX, posY);
      const isDiscrete = !props.hour_path && !props.minute_path;

      const showLevelExpr = freezeInAod
        ? '(typeof hmUI !== "undefined" && hmUI.show_level ? hmUI.show_level.ONLY_NORMAL : 2)'
        : '(typeof hmUI !== "undefined" && hmUI.show_level ? hmUI.show_level.ALL : 1)';

      if (isDiscrete) {
        // Case A: Discrete Second Pointer -> Replace TIME_POINTER with IMG
        const targetVar = assignedVar || `__faodDiscreteSec_${syntheticSecondCount++}`;
        if (!assignedVar) {
          targetNeedleVars.push(targetVar);
        } else {
          targetNeedleVars.push(assignedVar);
        }

        let replacement = `${assignedVar ? `${assignedVar} = ` : `var ${targetVar} = `}${callerPrefix}createWidget(${widgetNamespace}IMG, {
          x: 0,
          y: 0,
          w: ${designWidth},
          h: ${designHeight},
          center_x: ${pivot.center_x},
          center_y: ${pivot.center_y},
          pos_x: ${pivot.pos_x},
          pos_y: ${pivot.pos_y},
          src: '${secondPath}',
          enable: false,
          angle: 0,
          show_level: ${showLevelExpr},
        });`;

        if (coverPath) {
          const coverPivot = calculateNeedlePivot(centerX, centerY, coverPosX, coverPosY);
          replacement += `\n${callerPrefix}createWidget(${widgetNamespace}IMG, {
          x: 0,
          y: 0,
          w: ${designWidth},
          h: ${designHeight},
          center_x: ${coverPivot.center_x},
          center_y: ${coverPivot.center_y},
          pos_x: ${coverPivot.pos_x},
          pos_y: ${coverPivot.pos_y},
          src: '${coverPath}',
          enable: false,
          angle: 0,
          show_level: ${showLevelExpr},
        });`;
        }

        replacements.push({
          start: fullMatchStart,
          end: statementEnd,
          replacementText: replacement,
          targetVar,
        });

        secondHandTransformed = true;
      } else {
        // Case B: Unified Pointer -> Strip second_* and append IMG needle
        const strippedConfig = removeSecondHandProperties(configStr);
        const synthVar = `__faodSecondHand_${syntheticSecondCount++}`;
        targetNeedleVars.push(synthVar);

        const strippedCall = scriptContent.slice(fullMatchStart, braceStart) + strippedConfig + scriptContent.slice(braceEnd + 1, statementEnd);

        let replacement = `${strippedCall}\nvar ${synthVar} = ${callerPrefix}createWidget(${widgetNamespace}IMG, {
          x: 0,
          y: 0,
          w: ${designWidth},
          h: ${designHeight},
          center_x: ${pivot.center_x},
          center_y: ${pivot.center_y},
          pos_x: ${pivot.pos_x},
          pos_y: ${pivot.pos_y},
          src: '${secondPath}',
          enable: false,
          angle: 0,
          show_level: ${showLevelExpr},
        });`;

        if (coverPath) {
          const coverPivot = calculateNeedlePivot(centerX, centerY, coverPosX, coverPosY);
          replacement += `\n${callerPrefix}createWidget(${widgetNamespace}IMG, {
          x: 0,
          y: 0,
          w: ${designWidth},
          h: ${designHeight},
          center_x: ${coverPivot.center_x},
          center_y: ${coverPivot.center_y},
          pos_x: ${coverPivot.pos_x},
          pos_y: ${coverPivot.pos_y},
          src: '${coverPath}',
          enable: false,
          angle: 0,
          show_level: ${showLevelExpr},
        });`;
        }

        replacements.push({
          start: fullMatchStart,
          end: statementEnd,
          replacementText: replacement,
          targetVar: synthVar,
        });

        secondHandTransformed = true;
      }
    }
  }

  // Match digital clock widget creations: IMG_TIME and TEXT_TIME (including aliased namespaces)
  const digitalClockPattern = /(?:(?:(?:const|let|var)\s+)?([a-zA-Z0-9_$.]+)\s*=\s*)?(?:([a-zA-Z0-9_$]+\.)?createWidget\s*\(\s*(?:[a-zA-Z0-9_$]+\.widget\.|widget\.)?(IMG_TIME|TEXT_TIME)\s*,\s*)/g;
  // Match discrete digital second widget creations: IMG_NUMBER or TEXT assigned to sec/second variables
  const digitalSecWidgetPattern = /(?:(?:(?:const|let|var)\s+)?([a-zA-Z0-9_$.]*sec[a-zA-Z0-9_$.]*|[a-zA-Z0-9_$.]*second[a-zA-Z0-9_$.]*)\s*=\s*)(?:([a-zA-Z0-9_$]+\.)?createWidget\s*\(\s*(?:[a-zA-Z0-9_$]+\.widget\.|widget\.)?(IMG_NUMBER|TEXT)\s*,\s*)/gi;

  const targetDigitalTimeVars: string[] = [];
  const targetDigitalSecVars: string[] = [];
  let digitalClockDetected = false;
  let digitalSecondsDetected = false;

  let digMatch: RegExpExecArray | null;
  while ((digMatch = digitalClockPattern.exec(scriptContent)) !== null) {
    const fullMatchStart = digMatch.index;
    const assignedVar = digMatch[1];
    const callerPrefix = digMatch[2] || '';
    if (callerPrefix !== 'hmUI.') {
      aliasedWidgetsResolved++;
    }
    const braceStart = scriptContent.indexOf('{', fullMatchStart + digMatch[0].length - 1);
    if (braceStart === -1) continue;
    const braceEnd = findMatchingBrace(scriptContent, braceStart);
    if (braceEnd === -1) continue;

    digitalClockDetected = true;
    if (assignedVar) {
      targetDigitalTimeVars.push(assignedVar);
    }

    const configStr = scriptContent.slice(braceStart, braceEnd + 1);
    const props = extractObjectProperties(configStr);

    if (props.second_array || props.second_startX || props.second_en_array || props.second_sc_array) {
      digitalSecondsDetected = true;
      secondHandTransformed = true;
    }

    if (configStr.includes('ONLY_NORMAL')) {
      const showLevelExpr = freezeInAod
        ? '(typeof hmUI !== "undefined" && hmUI.show_level ? hmUI.show_level.ONLY_NORMAL : 2)'
        : '(typeof hmUI !== "undefined" && hmUI.show_level ? hmUI.show_level.ALL : 1)';

      const updatedConfig = configStr.replace(
        /(?:[a-zA-Z0-9_$]+\.)?(?:show_level\.)?ONLY_NORMAL/g,
        showLevelExpr
      );

      if (updatedConfig !== configStr) {
        replacements.push({
          start: braceStart,
          end: braceEnd + 1,
          replacementText: updatedConfig,
        });
      }
    }
  }

  let secWidgetMatch: RegExpExecArray | null;
  while ((secWidgetMatch = digitalSecWidgetPattern.exec(scriptContent)) !== null) {
    const fullMatchStart = secWidgetMatch.index;
    const assignedVar = secWidgetMatch[1];
    if (assignedVar) {
      targetDigitalSecVars.push(assignedVar);
      digitalSecondsDetected = true;
      secondHandTransformed = true;
    }
    const braceStart = scriptContent.indexOf('{', fullMatchStart + secWidgetMatch[0].length - 1);
    if (braceStart === -1) continue;
    const braceEnd = findMatchingBrace(scriptContent, braceStart);
    if (braceEnd === -1) continue;

    const configStr = scriptContent.slice(braceStart, braceEnd + 1);
    if (configStr.includes('ONLY_NORMAL')) {
      const showLevelExpr = freezeInAod
        ? '(typeof hmUI !== "undefined" && hmUI.show_level ? hmUI.show_level.ONLY_NORMAL : 2)'
        : '(typeof hmUI !== "undefined" && hmUI.show_level ? hmUI.show_level.ALL : 1)';

      const updatedConfig = configStr.replace(
        /(?:[a-zA-Z0-9_$]+\.)?(?:show_level\.)?ONLY_NORMAL/g,
        showLevelExpr
      );

      if (updatedConfig !== configStr) {
        replacements.push({
          start: braceStart,
          end: braceEnd + 1,
          replacementText: updatedConfig,
        });
      }
    }
  }

  // Apply replacements in REVERSE order by start index to prevent offset corruption
  let mutatedCode = scriptContent;
  replacements.sort((a, b) => b.start - a.start);
  for (const rep of replacements) {
    mutatedCode = mutatedCode.slice(0, rep.start) + rep.replacementText + mutatedCode.slice(rep.end);
  }

  // If second hand was transformed, digital clock or digital seconds detected, and delegate does not exist, synthesize FAOD 1Hz Engine
  const shouldInjectDelegate = (secondHandTransformed || digitalSecondsDetected || digitalClockDetected) && !alreadyHasDelegate && !alreadyHasFaodEngine;
  if (shouldInjectDelegate) {
    const uniqueTargets = Array.from(new Set(targetNeedleVars));
    const needleUpdateLines = uniqueTargets
      .map(
        (v) =>
          `    if (typeof ${v} !== 'undefined' && ${v} && ${v}.setProperty) { ${v}.setProperty(typeof hmUI !== 'undefined' && hmUI.prop ? hmUI.prop.ANGLE : 2, __angle__); }`
      )
      .join('\n');

    const uniqueDigitalSec = Array.from(new Set(targetDigitalSecVars));
    const digitalSecUpdateLines = uniqueDigitalSec
      .map(
        (v) =>
          `    if (typeof ${v} !== 'undefined' && ${v} && ${v}.setProperty) { try { ${v}.setProperty(hmUI.prop.VALUE, __sec__); } catch(e){} try { ${v}.setProperty(hmUI.prop.TEXT, __secStr__); } catch(e){} }`
      )
      .join('\n');

    const uniqueDigitalTime = Array.from(new Set(targetDigitalTimeVars));
    const digitalTimeUpdateLines = uniqueDigitalTime
      .map(
        (v) =>
          `    if (typeof ${v} !== 'undefined' && ${v} && ${v}.setProperty) { try { if (typeof hmUI.prop.MORE !== 'undefined') ${v}.setProperty(hmUI.prop.MORE, {}); } catch(e){} }`
      )
      .join('\n');

    const delegateCreateExpr = compatInfo.aliasedUiNamespace
      ? `(typeof hmUI !== 'undefined' && hmUI.createWidget ? hmUI : ${compatInfo.aliasedUiNamespace}).createWidget((typeof hmUI !== 'undefined' && hmUI.widget ? hmUI.widget.WIDGET_DELEGATE : ${compatInfo.aliasedUiNamespace}.widget.WIDGET_DELEGATE)`
      : `hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE`;

    const faodEngineBlock = `
/* === FAOD 1Hz ACTIVE SECOND HAND & DIGITAL CLOCK ENGINE INJECTED === */
var __faodTimeSensor__ = null;
var __faodSecondTimer__ = null;
try {
  if (typeof hmSensor !== 'undefined' && hmSensor && hmSensor.createSensor && hmSensor.id && hmSensor.id.TIME) {
    __faodTimeSensor__ = hmSensor.createSensor(hmSensor.id.TIME);
  }
} catch (__sensorErr) {}

function __faodUpdateSecondHand__() {
  try {
    var __sec__ = __faodTimeSensor__ ? __faodTimeSensor__.second : (new Date()).getSeconds();
    var __angle__ = (__sec__ % 60) * 6;
    var __secStr__ = (__sec__ < 10 ? '0' : '') + __sec__;
${needleUpdateLines}${digitalSecUpdateLines ? '\n' + digitalSecUpdateLines : ''}${digitalTimeUpdateLines ? '\n' + digitalTimeUpdateLines : ''}
  } catch (__updateErr) {}
}

try {
  if (__faodTimeSensor__ && __faodTimeSensor__.addEventListener && typeof hmSensor !== 'undefined' && hmSensor.event) {
    __faodTimeSensor__.addEventListener(hmSensor.event.CHANGE, function() {
      __faodUpdateSecondHand__();
    });
  }
} catch (__listenerErr) {}

try {
  if ((typeof hmUI !== 'undefined' && hmUI && hmUI.widget && hmUI.widget.WIDGET_DELEGATE)${compatInfo.aliasedUiNamespace ? ` || (typeof ${compatInfo.aliasedUiNamespace} !== 'undefined' && ${compatInfo.aliasedUiNamespace}.widget)` : ''}) {
    ${delegateCreateExpr}, {
      resume_call: function() {
        ${freezeInAod ? 'var __st__ = (typeof hmSetting !== "undefined" && hmSetting.getScreenType) ? hmSetting.getScreenType() : 0; if (__st__ === 1) return;' : ''}
        __faodUpdateSecondHand__();
        if (!__faodSecondTimer__) {
          __faodSecondTimer__ = setInterval(__faodUpdateSecondHand__, 1000);
        }
      },
      pause_call: function() {
        if (__faodSecondTimer__) {
          clearInterval(__faodSecondTimer__);
          __faodSecondTimer__ = null;
        }
      }
    });
  }
} catch (__delegateErr) {}
`;

    const injectLoc = findLifecycleInjectionPoint(mutatedCode);
    if (injectLoc.type === 'method_end') {
      mutatedCode = mutatedCode.slice(0, injectLoc.index) + faodEngineBlock + '\n' + mutatedCode.slice(injectLoc.index);
    } else {
      mutatedCode = mutatedCode + '\n' + faodEngineBlock;
    }

    mutatedCode = injectDestroyCleanup(mutatedCode);
    delegateInjected = true;
  }

  // Inject Zepp OS 1.0 - 3.x polyfills if requested via options OR if @zos/* / aliased namespaces were detected
  let polyfillsInjected = false;
  if (options.injectZosPolyfills === true || compatInfo.hasZosImports || compatInfo.aliasedUiNamespace) {
    const polyResult = injectZosCompatibilityPolyfill(mutatedCode);
    mutatedCode = polyResult.code;
    polyfillsInjected = polyResult.injected;
  }

  return {
    code: mutatedCode,
    secondHandTransformed: secondHandTransformed || digitalSecondsDetected,
    needlesExtracted,
    delegateInjected,
    digitalClockDetected,
    digitalSecondsDetected,
    sdkVersionDetected: compatInfo.sdkVersion,
    bundlerType: compatInfo.bundlerType,
    polyfillsInjected,
    aliasedWidgetsResolved,
  };
}

