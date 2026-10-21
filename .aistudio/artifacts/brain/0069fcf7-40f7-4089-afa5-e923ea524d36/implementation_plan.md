# Zepp OS Universal Watchface Compatibility Engine

Expand watchface conversion compatibility across Zepp OS 1.0, 2.0, and 3.x watchfaces, obfuscated or Webpack-bundled scripts, and diverse round/square Amazfit displays while preserving native resolutions and full Always-On Display (FAOD) fidelity.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions incorporate your confirmed preferences from the clarification phase:

- **Confirmed Decision 1 — Multi-Generation SDK Polyfills (`1.0` ↔ `2.0` ↔ `3.x`)**: Automatically detect and inject bidirectional runtime shims bridging legacy globals (`hmUI`, `hmSensor`, `hmSetting`, `hmApp`, `hmFS`) and modern modular Zepp OS 2.0/3.x APIs (`@zos/ui`, `@zos/sensor`, `@zos/settings`, `@zos/display`), ensuring converted scripts run reliably across firmware generations.
- **Confirmed Decision 2 — Minified, Obfuscated & Webpack-Bundled Script Support**: Upgrade the AST and pattern transformation engine to recognize aliased widget factories (e.g., `_hmUI.createWidget`, `createWidget(widget.TIME_POINTER, ...)`), numeric widget/show_level enums (`show_level: 1`, `vis_mode: 1`), and IIFE/Webpack bundle closures so 1Hz active second hands and AOD visibility unlocking succeed even in heavily minified code.
- **Confirmed Decision 3 — Native Resolution Preservation & Expanded Device Registry**: Preserve the watchface's original `designWidth` and native resolution (e.g., `480x480`, `466x466`, `454x454`, `416x416`, `390x450` square, `320x380`) without forced stretching, while registering comprehensive Amazfit device IDs (including T-Rex 3, Balance, GTR/GTS 4, Bip 5, Active, Cheetah, Falcon, and GTR/GTS 3 series).

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades the watchface converter pipeline with a universal compatibility layer that inspects, normalizes, and patches watchface packages from any Zepp OS generation (1.0 through 3.5), build toolchain (Zeus CLI, Watchface Maker, custom Webpack/Rollup bundles), and screen geometry.
- **Target Audience / Persona**: Amazfit smartwatch owners and watchface designers converting community `.zpk`, `.zip`, and `.bin` packages for seamless Always-On Display operation.
- **Key Value**: Eliminates blank AOD screens, missing second hands, broken sensor calls on newer/older Zepp OS firmware, and distorted aspect ratios on non-480x480 or square watches.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Package Inspection & Compatibility Detection**: Upon dropping a `.zpk`, `.zip`, or `.bin` watchface, the inspector automatically identifies the Zepp OS SDK generation (`v1.0` Legacy, `v2.0` Hybrid, or `v3.x` Modular), bundler format (Standard, Minified, or Webpack IIFE), and native screen geometry (`480×480`, `454×454`, `390×450`, etc.).
  2. **Compatibility & Polyfill Controls**: Users can toggle universal SDK polyfill injection, bundler/minified AST unwrapping, and native resolution preservation directly in the conversion configuration panel, with clear badges showing detected compatibility repairs in the diagnostic view.
  3. **Diagnostic & Verification Report**: After conversion, the Manifest & Script Diagnostic view displays a dedicated Compatibility Matrix detailing SDK shims injected, minified widget calls resolved, and target hardware profiles registered.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-craft dark technical utility console with crisp 1px structural borders (`border-slate-800`), zero nested card clutter, and hardware-inspired precision.
  - *Color Palette & Mood*: Deep slate canvas (`#0F172A` / `--background`), elevated dark surface panels (`#1E293B`), emerald nominal indicators (`#16A34A`) for verified compatibility shims, amber warnings (`#D97706`) for obfuscated fallback heuristics, and cyan accents (`#06B6D4`) for active SDK polyfills.
  - *Typography & Hierarchy*: Clean sans-serif structural headers paired with `font-mono` (`tabular-nums`) for all hex device IDs, resolution dimensions, byte sizes, and AST patch counters to prevent layout jitter.
  - *Component Styling & Layout*: Single-elevation diagnostic rows (`36px–44px` compact height) with left-aligned attribute keys and right-aligned tabular status badges.
- **Interactive Feedback & Motion**: Instantaneous compatibility badge updates during package analysis, expandable polyfill inspection drawers, and one-click re-patch triggers.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Bidirectional `hmUI` / `@zos/*` Polyfill Header Injection**
  - *Chosen Approach*: Inject a lightweight, zero-dependency runtime shim at the top of watchface and idle entry scripts that maps global `hmUI`/`hmSensor`/`hmSetting` objects when running on strict Zepp OS 3.x environments and aliases `@zos/*` globals when needed.
  - *Why*: Watchfaces authored for Zepp OS 3.x using `@zos/ui` `createWidget(widget.IMG, ...)` or Zepp OS 1.0 using `hmUI.createWidget(...)` often fail when cross-installed or when the FAOD 1Hz engine invokes `hmUI` or `hmSensor` inside an isolated ES module scope.
  - *Alternatives Considered*: Rewriting all AST imports into ES5 `require()` calls was passed over because Zepp OS QuickJS runtimes handle top-level `import` declarations natively when polyfill globals are bridged safely after imports.
- **Decision 2: Minified & Bundled Script AST Heuristics**
  - *Chosen Approach*: Support both symbolic constants (`hmUI.widget.TIME_POINTER`, `widget.TIME_POINTER`, `hmUI.show_level.ONLY_NORMAL`) and their compiled/aliased equivalents (`createWidget` via aliased namespace identifiers, `WatchFace({...})` / `Page({...})` lifecycle hooks, and minified property keys) while respecting ES module `import` statements at the top of the file.
  - *Why*: Tools like Zeus CLI and third-party watchface builders compile `@zos/ui` into minified variable names (e.g., `e.createWidget(e.widget.TIME_POINTER, ...)` or `createWidget(widget.TIME_POINTER, ...)`), which previously bypassed standard `hmUI.` regex matchers.
  - *Alternatives Considered*: Full third-party JS deobfuscation libraries were avoided to keep client-side browser conversion fast (<150ms) and deterministic.
- **Decision 3: Native `designWidth` Preservation & Multi-Resolution Centering**
  - *Chosen Approach*: Read the existing `designWidth` from the manifest or infer native dimensions from the primary dial background image (`480`, `466`, `454`, `416`, `390`, `360`, etc.), preserving it in `app.json` and dynamically passing the true width/height into the AST needle pivot calculator instead of hardcoding `480x480`.
  - *Why*: Forcing `designWidth: 480` on a `454x454` (GTR 3 Pro) or `390x450` (GTS 4 / Active) watchface causes off-center second-hand pivots and clipped dial textures.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Watchface Archive Unpacker (.zpk / .zip / .bin)          │
│     • Recursive nested archive extraction (multi-level .zip -> .zpk)       │
│     • Case-insensitive path normalization & multi-target folder discovery  │
└───────────────────────────────────────┬────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                 Universal Compatibility Analyzer & Detector                │
│  ┌─────────────────────────┐ ┌──────────────────────┐ ┌─────────────────┐  │
│  │ SDK Version Detector    │ │ Screen & Resolution  │ │ Bundler Format  │  │
│  │ • Zepp OS 1.0 (hmUI)    │ │ Inspector            │ │ Detector        │  │
│  │ • Zepp OS 2.0 (hybrid)  │ │ • Native designWidth │ │ • Standard JS   │  │
│  │ • Zepp OS 3.x (@zos/*)  │ │ • Round vs. Square   │ │ • Webpack/Min   │  │
│  └─────────────────────────┘ └──────────────────────┘ └─────────────────┘  │
└───────────────────────────────────────┬────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   Multi-Pass Transformation & Patch Engine                 │
│  ┌───────────────────────────────────┐ ┌────────────────────────────────┐  │
│  │ Manifest & Device Registry Engine │ │ Polyfill & Minified AST Engine │  │
│  │ • Preserves native designWidth    │ │ • @zos/* <-> hmUI/hmSensor     │  │
│  │ • Registers 25+ Amazfit device    │ │   runtime bridge injection     │  │
│  │   IDs (T-Rex 3, Balance, GTR 4,   │ │ • Aliased createWidget &       │  │
│  │   GTS 4, Bip 5, Active, etc.)     │ │   TIME_POINTER AST extraction  │  │
│  │ • Syncs multi-target idle modules │ │ • Dynamic center pivot math    │  │
│  └───────────────────────────────────┘ └────────────────────────────────┘  │
└───────────────────────────────────────┬────────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                 Interactive UI & Compatibility Diagnostics                 │
│     • Compatibility Matrix badges (SDK version, Bundler type, Resolution)  │
│     • Configurable Compatibility Options in Sidebar                        │
│     • Live Canvas Preview & One-Click Compatibility Re-Patch               │
└────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **Expanded Device Registry**: Extends the hardware lookup table to 25+ Amazfit models across round and rectangular/square form factors (Amazfit Balance, T-Rex 3, T-Rex Ultra, T-Rex 2, Falcon, Cheetah/Pro, GTR 4, GTS 4, GTS 4 Mini, GTR 3/Pro, GTS 3, Active, Active Edge, Bip 5, Bip 5 Unity, Pop 3S/3R), mapping both hexadecimal IDs and decimal `deviceSource` numbers with accurate screen resolutions and shapes.
- **Compatibility Metadata & Diagnostics**:
  - `sdkVersionDetected`: `'1.0' | '2.0' | '3.x'`
  - `bundlerType`: `'standard' | 'minified' | 'webpack'`
  - `polyfillsInjected`: `boolean`
  - `nativeWidth` / `nativeHeight`: `number`
  - `aliasedWidgetsResolved`: `number`
- **Conversion Options State**: Adds `injectZosPolyfills: boolean` (default `true`) and `preserveNativeResolution: boolean` (default `true`) to user-configurable conversion settings.

### Interactive Component & State Mapping

- **Conversion Options Sidebar**: Toggling **Zepp OS 1.0–3.x API Polyfills** or **Preserve Native Resolution** updates the live conversion configuration state and triggers a re-conversion banner if completed files are in the queue.
- **Watchface Card & Diagnostic Modal**: Displays the detected SDK badge (`Zepp OS 1.0`, `2.0`, `3.x`), bundler badge (`Webpack/Minified` or `Standard`), and native display dimensions (`480×480`, `454×454`, `390×450`), plus detailed rows inside the Manifest & Script Diagnostic tab showing exact polyfills and aliased widget transformations applied.
