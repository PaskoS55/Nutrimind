# Phase 2C2 implementation report

## Boundary and production flow

Phase 2C2 is a pure TypeScript enrichment of an eligible real Phase 2C1 `calculated` result. The questionnaire still passes Phase 1 validation/safety, Phase 2A admission, Phase 2B REE, and Phase 2C1 PAL/EnergyStart before `runPhase2C2` attaches macros. REE, PAL, duration modifiers, day order, raw trace, and rounded `energyStartKcal` are preserved rather than recreated. Non-calculated variants bypass macro calculation and remain number-free.

Each Phase 2C1 day owns exactly three ordered nested scenarios: `lower`, `central`, `upper`. Energy uses the already rounded EnergyStart: nearest-50 ties-to-even of `EnergyStart × 0.94`, unchanged EnergyStart, and nearest-50 ties-to-even of `EnergyStart × 1.06`. The existing Phase 2C1 nearest-50 helper is reused.

## Coefficient and arithmetic policy

Protein coefficients (lower/central/upper) are:

| Profile | Lower | Central | Upper |
|---|---:|---:|---:|
| Ordinary adult, including `fitness_2_4_week` | 1.20 | 1.40 | 1.60 |
| Amateur athlete | 1.60 | 1.70 | 1.80 |
| Competitive athlete | 1.70 | 1.85 | 2.00 |
| Professional athlete | 1.80 | 1.90 | 2.00 |

Fat coefficients are 0.90/1.00/1.10 g/kg. Selected fat is the greater of the weight-based value and 20% of scenario energy divided by 9; trace records `weight_based` or `energy_20_percent`. This is a planning rule, not a medical minimum. Carbohydrate fills energy remaining after rounded protein and fat.

All grams use one shared decimal-safe one-decimal ties-to-even function. MacroEnergy is rebuilt from displayed rounded grams. A calculated scenario must be finite, non-negative, have non-negative carbohydrate, and remain within 0.5 kcal of scenario energy. Failure yields `needs_review` with `macro_scenario_needs_review`, scenario id and energy only; public macro targets and diagnostic intermediates are absent.

## Contract, goals, UI, and safety

The schema is `nutrimind.phase2c2.result.v1`, stored locally under `nutrimind.phase2c2.result`. `/result` accepts only a structurally complete current payload; absent, malformed, old, or incomplete data produces a neutral questionnaire link. The page preserves REE, day energy/PAL, goal, and energy basis, and adds compact responsive three-scenario comparisons with semantic headings, text identification of the central scenario, keyboard-native details, units, consistency text, and calculation trace. Mobile layout stacks scenarios and prevents page overflow.

All goals retain multiplier 1.00 and cannot affect energy or coefficients. Weight loss keeps its disabled status and receives no deficit; muscle gain receives no surplus. No hydration, sweat-rate, calibration, fibre, micronutrient, supplement, menu, product, substitution, or recommendation logic was added. No demo-report import, network call, server persistence, or account storage exists.

## Approved professional fixture

For male, 28 years, 189 cm, 86 kg, professional, 90 minutes, and Phase 2C1 EnergyStart 3800 kcal:

| Scenario | Energy | Protein coefficient / g | Fat coefficient / g | Carbohydrate | MacroEnergy | Deviation |
|---|---:|---:|---:|---:|---:|---:|
| Lower | 3550 | 1.80 / 154.8 | 0.90 / 78.9 | 555.2 | 3550.1 | 0.1 |
| Central | 3800 | 1.90 / 163.4 | 1.00 / 86.0 | 593.1 | 3800.0 | 0.0 |
| Upper | 4050 | 2.00 / 172.0 | 1.10 / 94.6 | 627.7 | 4050.2 | 0.2 |

## Changed files and verification

Created: `core/calculation/macro-policy.ts`, `core/calculation/macro-scenarios.ts`, `core/calculation/phase2c2.ts`, `core/calculation/result-schema.ts`, `PHASE_2C2_REPORT.md`.

Modified: `core/calculation/types.ts`, `core/calculation/index.ts`, `core/questionnaire-adapter.ts`, `app/questionnaire/page.tsx`, `app/result/page.tsx`, `app/globals.css`, `tests/nutrimind-core.test.mjs`, `PHASE_2_ARCHITECTURE.md`.

Tests cover the production Phase 2C1 handoff, preservation and ordering, all coefficient tables, fitness classification, energy factors, decimal boundaries, both fat sources, carbohydrate remainder, consistency, negative-carbohydrate review, goal neutrality, strict non-calculated serialization, deterministic output, and the exact fixture. Final command and browser-QA results are recorded after verification below.

- `npm.cmd test`: 65 passed, 0 failed, 0 skipped.
- `npm.cmd run typecheck`: passed with no diagnostics.
- `npx.cmd next build`: passed; static routes `/`, `/questionnaire`, `/result`, and `/report-demo` generated.
- `git diff --check`: passed; Git emitted line-ending conversion warnings only.

Production route smoke test returned HTTP 200 for `/`, `/questionnaire`, `/result`, and `/report-demo`. Source inspection confirms macro formulas occur only in calculation-core modules, no production questionnaire/result module imports demo-report data, the responsive macro grid changes from three columns to stacked rows below 700 px, and the result shell prevents horizontal overflow. Full interactive viewport/browser screenshots could not be captured because the in-app browser runtime was unavailable in this session; this is the sole QA limitation and no visual pass is claimed beyond the route, build, markup, and CSS checks.

Unresolved ambiguities: none within the owner-approved Phase 2C2 scope. Deferred: hydration, sweat rate, fourteen-day calibration, automatic deficit/surplus, goal multipliers, menus, products, substitutions, fibre, micronutrients, supplements, and food recommendations.
