# Original User Request

## 2026-09-05T03:57:00Z

Overhaul and optimize the Zepp OS watchface converter web application to ensure that all converted watchfaces reliably produce Full Always-On Display (FAOD) with active second-hand rendering, hardened AST transformation, robust power profiling, and production-grade reliability across all supported Zepp OS device generations.

Working directory: /Users/darrieta/Downloads/Zepp OS
Integrity mode: development

## Verification Resources
- **Working Reference Fixture**: `reference_watchfaces/tissot_prx.amazfit_balance-283395-2d7b413023 (1).zip` (demonstrates functioning FAOD 1Hz rotation, `WIDGET_DELEGATE`, asset mirroring in `idle/assets/`, `configVersion: "v2"`, and `hightCost: 0`).
- **Failing Reference Fixture**: `reference_watchfaces/jaeger_polaris_gtr3pro-415474-bce860200c (1).zip` (contains frozen second-hand in native `TIME_POINTER`, missing `idle/assets/`, legacy `v1` configuration).
- Built-in TypeScript compiler check (`bun run lint` / `tsc --noEmit`) and Vite production build (`bun run build`).

## Requirements

### R1. Full Always-On Display (FAOD) & Active Second-Hand Engine Overhaul
Enhance the conversion pipeline so that every converted watchface displays the complete active dial in Always-On Display mode, with active second-hand ticking (1Hz). Resolve the 60-second standby display freeze on Zepp OS by transforming or polyfilling frozen time pointers into active delegates/intervals while mirroring dial assets into `idle/assets/`.

### R2. Package Manifest & Multi-Device Compatibility Modernization
Modernize `app.json` generation and AST transformations to ensure compatibility with Zepp OS 1.0, 2.0, 3.0, and 4.0 devices (including Balance, Active, Cheetah, T-Rex series, GTR/GTS). Ensure `configVersion: "v2"` migration, correct `deviceSource` identifiers, and `hightCost: 0` flags are applied.

### R3. Converter Web Application & Battery Profiler Optimization
Refactor and optimize `src/utils/converter.ts`, ZIP archiving routines, error recovery on edge-case packages, and fine-tune the battery drain estimator for accurate standby OLED and CPU load calculations.

### R4. Automated Test Suite & Reference Verification
Build an automated verification suite that runs conversions on both `jaeger` and `tissot` fixtures, objectively checking AST mutations, asset placement, manifest schema validity, and verifying zero build regressions.

## Acceptance Criteria

### FAOD & Second Hand Capabilities
- [ ] Converted watchface packages contain working 1Hz second hand logic in AOD mode without freezing on standby.
- [ ] All dial assets are mirrored across `idle/assets/` and `watchface/assets/` so textures, needles, and complications never fail to render in AOD.
- [ ] Non-working reference fixture (`jaeger_polaris_gtr3pro`) successfully converts into a fully compliant FAOD package matching the quality and runtime behavior of the working reference fixture (`tissot_prx`).

### Production Reliability & Code Health
- [ ] TypeScript strict type check passes with 0 errors (`bun run lint`).
- [ ] Production build succeeds without errors or warnings (`bun run build`).
- [ ] Automated test suite verifies transformed AST output, file structure, and zip packages against Zepp OS standards.
