# Project: Zepp OS Watchface Converter Overhaul & Optimization

## Architecture
The project is a web application and conversion pipeline built with Vite, React 19, TypeScript, JSZip, and TailwindCSS.
The architecture consists of:
1. **Archive Ingestion & Normalization**: JSZip extraction, UTF-8 BOM stripping (`\uFEFF`), Windows path normalization (`\` -> `/`), nested `.zpk` container unwrapping.
2. **Manifest Modernization Engine**: Upgrades `app.json` to `configVersion: "v2"`, injects `hightCost: 0` on `module.watchface` and `module.idle`, adds `designWidth: 480`, configures `cover`, populates universal `deviceSource` (11 hex IDs: Balance, GTR 4, GTS 4, T-Rex 2/3/Ultra, Cheetah, Active, GTR 3 Pro, GTR 3) and modern `device.platforms`.
3. **Triple-Redundant Asset Layout Engine**: Guarantees all graphic assets exist across `assets/`, `watchface/assets/`, and `idle/assets/`. Enforces `preview.png` presence in root, `assets/`, `watchface/`, `idle/`, and `idle/assets/`. Synchronizes in both `convertWatchfacePackage` and `repatchAodManifestErrors`.
4. **AST Transformation & FAOD 1Hz Engine**: Parses watchface JavaScript, identifies `hmUI.widget.TIME_POINTER` containing second pointers (both unified and discrete). Extracts needle coordinates (`centerX, centerY, posX, posY, path, cover`), maps them via pivot formulas:
   - `center_x = centerX`, `center_y = centerY`
   - `pos_x = centerX - posX`, `pos_y = centerY - posY`
   - `w = designWidth`, `h = designHeight`
   Replaces/augments with `hmUI.widget.IMG` needle and second cover. Injects `hmUI.widget.WIDGET_DELEGATE` (`resume_call`: immediate tick + `setInterval(t, 1000)`; `pause_call`: `clearInterval`), `hmSensor.id.TIME` event listener, and `onDestroy` cleanup. Completely eliminates the 60-second standby display freeze.
5. **Battery Drain Profiler & Estimator**: Implemented in `src/utils/batteryEstimator.ts` and `src/utils/powerAnalyzer.ts`. Computes mathematical On-Pixel Ratio (OPR / APL), decouples 1Hz second tick CPU wakeups from profile multipliers, models device battery capacity dynamically from `KNOWN_ZEPP_DEVICES` (232 mAh to 700 mAh), and passes accurate power reports to UI components.
6. **Verification & Automated Test Suite**: Built with Vitest, validating transformed AST output, file structure, zip packages, manifest schema validity, and build/typecheck cleanliness (`npm run lint` / `tsc --noEmit` and `npm run build`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Manifest v2 Schema Migration | `configVersion: "v2"`, `designWidth: 480`, `cover: ["preview.png"]` | M2 | Survey / tissot_prx |
| 2 | High Cost Power Flag Injection | Inject `"hightCost": 0` in `module.watchface` and `module.idle` to bypass 60s OS AOD watchdog | M2 | Survey / tissot_prx |
| 3 | Universal Device Whitelist | Inject 11 hex `deviceSource` IDs and structured `device.platforms` for Zepp OS 1.0-4.0 compatibility | M2 | Survey / tissot_prx |
| 4 | UTF-8 BOM & Path Normalization | Strip `\uFEFF` before `JSON.parse(app.json)`, normalize Windows backslashes | M2 | Survey / explorer_2 & 3 |
| 5 | Triple-Redundant Asset Mirroring | Mirror all dial assets and textures across `assets/`, `watchface/assets/`, and `idle/assets/` in all conversion and repatch routines | M2 | Survey / tissot_prx |
| 6 | Preview Ubiquity | Ensure `preview.png` exists in root, `assets/`, `watchface/`, `idle/`, and `idle/assets/` | M2 | Survey / tissot_prx |
| 7 | AST TIME_POINTER Detection | Detect unified and discrete `TIME_POINTER` widgets with second-hand properties | M3 | Survey / explorer_2 |
| 8 | Mathematical Needle Transformation | Transform second pointers to `hmUI.widget.IMG` using `pos_x = centerX - posX`, `pos_y = centerY - posY` | M3 | Survey / spec_miner_1 |
| 9 | WIDGET_DELEGATE 1Hz Engine | Inject `WIDGET_DELEGATE` lifecycle widget with 1Hz `setInterval`, `resume_call`, `pause_call`, `hmSensor.id.TIME` | M3 | Survey / tissot_prx |
| 10 | Standby Freeze Elimination | Bypass Zepp OS Apollo co-processor 60s second-hand freeze in AOD | M3 | Survey / spec_miner_1 |
| 11 | Battery Drain Estimator Module | Create `src/utils/batteryEstimator.ts`, export mathematical power analysis engine | M4 | Survey / explorer_3 |
| 12 | Standby OLED & OPR Calculation | Replace naive `imageAssets > 25` with luminance / OPR calculation | M4 | Survey / explorer_3 |
| 13 | Multi-Device Battery Modeling | Scale battery life (%/hr and days) using actual mAh from `KNOWN_ZEPP_DEVICES` | M4 | Survey / explorer_3 |
| 14 | Automated Test Harness & Fixtures | Set up Vitest test harness, test runner scripts, and fixture verification | M1 & M5 | ORIGINAL_REQUEST §R4 |
| 15 | Reference Fixture Conversion | Convert `jaeger_polaris` into 100% compliant FAOD package matching `tissot_prx` | M5 | ORIGINAL_REQUEST §R4 |
| 16 | Zero Build Regressions | Verify `npm run lint` (`tsc --noEmit`) passes with 0 errors, `npm run build` succeeds | M5 | ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Harness & Infra Setup | Install dependencies, set up Vitest, configure test runners, publish TEST_INFRA.md | none | DONE |
| 2 | Manifest Modernization & Asset Mirroring | Modernize app.json (configVersion v2, hightCost 0, deviceSource, designWidth), BOM fix, path normalization, triple asset mirroring | M1 | DONE |
| 3 | AST Transformation & 1Hz FAOD Engine | Implement AST needle transformation (pos_x = centerX - posX), WIDGET_DELEGATE, 1Hz interval, sensor change listener, eliminate 60s freeze | M2 | PLANNED |
| 4 | Battery Drain Profiler & Estimator | Create src/utils/batteryEstimator.ts, calibrate OLED OPR, 1Hz tick CPU model, multi-device mAh scaling | M2 | PLANNED |
| 5 | E2E Verification & Final Coverage Hardening | Publish TEST_READY.md, run conversions on jaeger and tissot fixtures, verify 100% test pass, verify lint and build, adversarial coverage hardening | M1, M2, M3, M4 | PLANNED |

## Interface Contracts

### Converter ↔ AST Transformer
- Module: `src/utils/astTransformer.ts` (or `transformWatchfaceScript` in `src/utils/converter.ts`)
- Signature:
  ```typescript
  export interface AstTransformOptions {
    bypassIdleRefreshRate?: boolean;
    freezeSecondHandsInAod?: boolean;
    designWidth?: number;
    designHeight?: number;
  }
  export interface AstTransformResult {
    code: string;
    secondHandTransformed: boolean;
    needlesExtracted: {
      type: 'second' | 'hour' | 'minute';
      path: string;
      centerX: number;
      centerY: number;
      posX: number;
      posY: number;
      coverPath?: string;
    }[];
    delegateInjected: boolean;
  }
  export function transformWatchfaceScript(scriptContent: string, options?: AstTransformOptions): AstTransformResult;
  ```

### Converter ↔ Battery Estimator
- Module: `src/utils/batteryEstimator.ts`
- Signature:
  ```typescript
  export interface BatteryEstimationOptions {
    deviceSource?: string | number;
    batteryCapacityMah?: number;
    hasActive1HzSeconds?: boolean;
    oprLuminanceAreaPercent?: number;
    profile?: 'raw' | 'balanced' | 'ultra';
  }
  export function estimateWatchfacePower(options: BatteryEstimationOptions): PowerAnalysisReport;
  ```

## Code Layout
```
/Users/darrieta/Downloads/Zepp OS/
├── reference_watchfaces/
│   ├── tissot_prx.amazfit_balance-283395-2d7b413023 (1).zip
│   ├── jaeger_polaris_gtr3pro-415474-bce860200c (1).zip
│   └── extracted/
│       ├── tissot/
│       └── jaeger/
├── src/
│   ├── components/
│   │   ├── BatteryDrainEstimator.tsx
│   │   ├── DiffModal.tsx
│   │   └── WatchPreviewModal.tsx
│   ├── utils/
│   │   ├── astTransformer.ts      # Dedicated AST mutation engine
│   │   ├── batteryEstimator.ts    # Power estimation engine
│   │   ├── converter.ts           # Main conversion pipeline
│   │   ├── devices.ts             # Device registry & battery specs
│   │   └── powerAnalyzer.ts       # Script scanner & profiler
│   ├── types.ts                   # Unified type definitions
│   └── App.tsx
├── tests/
│   ├── unit/
│   │   ├── astTransformer.test.ts
│   │   └── batteryEstimator.test.ts
│   ├── integration/
│   │   └── manifestAndAssets.test.ts
│   └── e2e/
│       └── fixtures.test.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```
