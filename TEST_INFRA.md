# Test Infrastructure & Verification Architecture

## 1. Overview
This document specifies the testing infrastructure, runner configuration, test suite hierarchy, pass/fail semantics, and fixture locations for the **Zepp OS Watchface Converter** project.

The test suite ensures that:
1. All converted watchfaces reliably render in **Full Always-On Display (FAOD)** mode with an active 1Hz second hand without freezing on standby.
2. Dial assets are mirrored across `assets/`, `watchface/assets/`, and `idle/assets/`.
3. Package manifests (`app.json`) conform to `configVersion: "v2"`, include `hightCost: 0`, and provide universal device compatibility.
4. AST transformations correctly map `hmUI.widget.TIME_POINTER` definitions to `hmUI.widget.IMG` widgets driven by `hmUI.widget.WIDGET_DELEGATE` lifecycle hooks.
5. Zero regressions are introduced to TypeScript compilation or production web builds.

---

## 2. Test Runner & Configuration

- **Test Framework**: [Vitest](https://vitest.dev/) (v3.x)
- **Configuration File**: `vitest.config.ts`
- **Execution Engine**: Node.js runtime environment with ES module support
- **Path Aliases**: `@/` maps to the project root directory, identical to `vite.config.ts` and `tsconfig.json`.

### NPM Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "tsc --noEmit",
    "build": "vite build"
  }
}
```

### Execution Commands
- **Standard test run**:
  ```bash
  npm test
  ```
- **Targeted test run**:
  ```bash
  npx vitest run tests/unit/smoke.test.ts
  ```
- **Coverage report**:
  ```bash
  npm test -- --coverage
  ```

---

## 3. Directory Architecture

The test suite is partitioned into three distinct validation tiers:

```
tests/
├── unit/
│   ├── smoke.test.ts             # Harness smoke test and environment validation
│   ├── astTransformer.test.ts    # AST parsing, needle extraction, and code emission
│   └── batteryEstimator.test.ts  # Power profiling, OPR calculation, device mAh scaling
├── integration/
│   └── manifestAndAssets.test.ts # app.json v2 migration, triple asset mirroring
└── e2e/
    └── fixtures.test.ts          # Full end-to-end conversion of reference watchfaces
```

### 3.1 Unit Tests (`tests/unit/`)
- **Focus**: Isolated verification of pure utility functions, algorithmic transformations, and math calculations.
- **Key Modules**:
  - `src/utils/astTransformer.ts`: Mathematical needle translation (`pos_x = centerX - posX`, `pos_y = centerY - posY`), `WIDGET_DELEGATE` injection, sensor listeners, and freeze mitigation.
  - `src/utils/batteryEstimator.ts`: Standby OLED consumption, mathematical On-Pixel Ratio (OPR/APL), 1Hz tick CPU wake models, and multi-device battery capacities (232 mAh – 700 mAh).

### 3.2 Integration Tests (`tests/integration/`)
- **Focus**: Multi-step file manipulation, zip package operations, and manifest synchronization.
- **Key Modules**:
  - `src/utils/converter.ts`: UTF-8 BOM (`\uFEFF`) stripping, Windows path separator normalization (`\` -> `/`), nested `.zpk` container unwrapping, `hightCost: 0` injection, and preview ubiquity across dial directories.

### 3.3 End-to-End Tests (`tests/e2e/`)
- **Focus**: Complete workflow validation on real-world reference watchfaces.
- **Key Modules**:
  - Verifying that converting the failing fixture (`jaeger_polaris`) results in a fully compliant package matching the working fixture (`tissot_prx`) in structure, AST patterns, and asset layout.

---

## 4. Pass / Fail Semantics

| Tier | Pass Criteria | Invalidation Conditions |
|---|---|---|
| **Unit / Integration / E2E** | All test suites exit with code `0`. All assertions in `describe` / `it` blocks pass. | Any assertion failure, uncaught exception, unhandled promise rejection, or test timeout (>30s). |
| **Static Typing (`npm run lint`)** | `tsc --noEmit` exits with code `0` and 0 errors. | Any TypeScript diagnostic error, missing type export, or strict type check violation. |
| **Production Build (`npm run build`)** | `vite build` exits with code `0` with complete bundle output in `dist/`. | Missing module errors, bundling syntax errors, or circular dependency crashes. |

---

## 5. Reference Fixtures

Test fixtures are stored under `reference_watchfaces/`:

### 5.1 Working Reference Fixture
- **Path**: `reference_watchfaces/tissot_prx.amazfit_balance-283395-2d7b413023 (1).zip`
- **Extracted Location**: `reference_watchfaces/extracted/tissot/`
- **Characteristics**:
  - `app.json`: `configVersion: "v2"`, `module.watchface.hightCost: 0`, `module.idle.hightCost: 0`.
  - `idle/index.js`: Active 1Hz rotation via `hmUI.widget.WIDGET_DELEGATE` with `setInterval(t, 1000)` inside `resume_call` and `clearInterval` inside `pause_call`.
  - Needles rendered via `hmUI.widget.IMG` with dynamic angle calculation.
  - Mirrored assets in `idle/assets/` and `watchface/assets/`.

### 5.2 Failing Reference Fixture
- **Path**: `reference_watchfaces/jaeger_polaris_gtr3pro-415474-bce860200c (1).zip`
- **Extracted Location**: `reference_watchfaces/extracted/jaeger/`
- **Characteristics**:
  - `app.json`: Legacy `v1` configuration without `hightCost: 0`.
  - `idle/index.js`: Native `hmUI.widget.TIME_POINTER` which causes Zepp OS firmware to freeze needle updates after 60 seconds of standby.
  - Missing `idle/assets/` directory.

---

## 6. Offline and Sandbox Operational Notes

In sandboxed execution environments with outbound network restrictions:
1. Vitest configuration uses Node-compatible defaults without relying on external remote network assets.
2. In the event that workspace `node_modules` are not yet populated from the global registry, the harness layout and test definitions remain 100% compliant with standard Vitest execution semantics so that `npm test` executes immediately once `node_modules` are restored.
