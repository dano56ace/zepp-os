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

export interface AstTransformResult {
  code: string;
  secondHandTransformed: boolean;
  needlesExtracted: ExtractedNeedle[];
  delegateInjected: boolean;
  digitalClockDetected?: boolean;
  digitalSecondsDetected?: boolean;
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
 * Locates the optimal injection point for the WIDGET_DELEGATE lifecycle engine.
 */
function findLifecycleInjectionPoint(src: string): { type: 'method_end' | 'fallback'; index: number } {
  const methodMatch = src.match(/(?:init_view|initView|build)\s*\([^)]*\)\s*\{/);
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
 * Injects timer cleanup into onDestroy() or onDestory().
 */
function injectDestroyCleanup(src: string): string {
  const match = src.match(/(?:onDestroy|onDestory)\s*\([^)]*\)\s*\{/);
  if (match && match.index !== undefined) {
    const insertPos = match.index + match[0].length;
    const cleanupCode = `\n    try { if (typeof __faodSecondTimer__ !== 'undefined' && __faodSecondTimer__) { clearInterval(__faodSecondTimer__); __faodSecondTimer__ = null; } } catch(e){}`;
    return src.slice(0, insertPos) + cleanupCode + src.slice(insertPos);
  }
  return src;
}

/**
 * Core transformation routine conforming to PROJECT.md interface contract.
 */
export function transformWatchfaceScript(
  scriptContent: string,
  options: AstTransformOptions = {}
): AstTransformResult {
  const bypass = options.bypassIdleRefreshRate !== false;
  const freezeInAod = options.freezeSecondHandsInAod === true;
  const designWidth = options.designWidth || 480;
  const designHeight = options.designHeight || 480;
  const defaultCenterX = Math.round(designWidth / 2);
  const defaultCenterY = Math.round(designHeight / 2);

  const needlesExtracted: ExtractedNeedle[] = [];
  let secondHandTransformed = false;
  let delegateInjected = false;

  if (!bypass) {
    return {
      code: scriptContent,
      secondHandTransformed: false,
      needlesExtracted: [],
      delegateInjected: false,
    };
  }

  // If already contains WIDGET_DELEGATE or FAOD engine, don't re-inject delegate
  const alreadyHasDelegate = scriptContent.includes('WIDGET_DELEGATE');
  const alreadyHasFaodEngine = scriptContent.includes('__faodUpdateSecondHand__');

  // Match all TIME_POINTER widget creations
  const timePointerPattern = /(?:(?:(?:const|let|var)\s+)?([a-zA-Z0-9_$.]+)\s*=\s*)?(?:(hmUI\.)?createWidget\s*\(\s*(?:hmUI\.widget\.|widget\.)?TIME_POINTER\s*,\s*)/g;

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
    const prefixHmUi = match[2] ? 'hmUI.' : '';

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

        let replacement = `${assignedVar ? `${assignedVar} = ` : `var ${targetVar} = `}${prefixHmUi}createWidget(${prefixHmUi}widget.IMG, {
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
          replacement += `\n${prefixHmUi}createWidget(${prefixHmUi}widget.IMG, {
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

        let replacement = `${strippedCall}\nvar ${synthVar} = ${prefixHmUi}createWidget(${prefixHmUi}widget.IMG, {
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
          replacement += `\n${prefixHmUi}createWidget(${prefixHmUi}widget.IMG, {
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

  // Match digital clock widget creations: IMG_TIME and TEXT_TIME
  const digitalClockPattern = /(?:(?:(?:const|let|var)\s+)?([a-zA-Z0-9_$.]+)\s*=\s*)?(?:(hmUI\.)?createWidget\s*\(\s*(?:hmUI\.widget\.|widget\.)?(IMG_TIME|TEXT_TIME)\s*,\s*)/g;
  // Match discrete digital second widget creations: IMG_NUMBER or TEXT assigned to sec/second variables
  const digitalSecWidgetPattern = /(?:(?:(?:const|let|var)\s+)?([a-zA-Z0-9_$.]*sec[a-zA-Z0-9_$.]*|[a-zA-Z0-9_$.]*second[a-zA-Z0-9_$.]*)\s*=\s*)(?:(hmUI\.)?createWidget\s*\(\s*(?:hmUI\.widget\.|widget\.)?(IMG_NUMBER|TEXT)\s*,\s*)/gi;

  const targetDigitalTimeVars: string[] = [];
  const targetDigitalSecVars: string[] = [];
  let digitalClockDetected = false;
  let digitalSecondsDetected = false;

  let digMatch: RegExpExecArray | null;
  while ((digMatch = digitalClockPattern.exec(scriptContent)) !== null) {
    const fullMatchStart = digMatch.index;
    const assignedVar = digMatch[1];
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
        /(?:hmUI\.)?(?:show_level\.)?ONLY_NORMAL/g,
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
        /(?:hmUI\.)?(?:show_level\.)?ONLY_NORMAL/g,
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
          `    if (typeof ${v} !== 'undefined' && ${v} && ${v}.setProperty) { ${v}.setProperty(hmUI.prop.ANGLE, __angle__); }`
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
  if (typeof hmUI !== 'undefined' && hmUI && hmUI.widget && hmUI.widget.WIDGET_DELEGATE) {
    hmUI.createWidget(hmUI.widget.WIDGET_DELEGATE, {
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

  return {
    code: mutatedCode,
    secondHandTransformed: secondHandTransformed || digitalSecondsDetected,
    needlesExtracted,
    delegateInjected,
    digitalClockDetected,
    digitalSecondsDetected,
  };
}
