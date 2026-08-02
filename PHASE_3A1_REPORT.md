# Phase 3A1 implementation report

## Approved scope

Phase 3A1 distributes one already calculated Phase2C2 daily macro scenario across user-selected eating occasions. It does not calculate or change REE, PAL, EnergyStart, daily energy, daily protein/fat/carbohydrate, hydration, goals, or Phase2D2A observations.

## Structures and explicit selection

The user must explicitly select an available parent day, `lower`/`central`/`upper`, and one of three equal-status structures. Nothing is preselected and no meal plan exists until the user presses `Показать распределение`.

| ID | Label | Ordered weights | Reconciliation meal |
|---|---|---|---|
| `three_meals` | Три приёма пищи | 1 / 1 / 1 | Приём пищи 3 |
| `three_meals_plus_snack` | Три основных приёма и небольшой перекус | 3 / 3 / 1 / 3 | Основной приём 3 |
| `four_occasions` | Четыре приёма пищи | 1 / 1 / 1 / 1 | Приём пищи 4 |

The snack is optional in wording and never receives reconciliation residual.

## Authoritative totals, rounding and reconciliation

The selected calculated Phase2C2 scenario's displayed `energyKcal`, `proteinG`, `fatG`, and `carbohydrateG` are authoritative. No coefficient or earlier trace is changed.

Raw allocation is `dailyDisplayedValue × weight / totalWeight`. Energy uses whole-kcal ties-to-even; macros use one-decimal-gram ties-to-even. The implementation converts daily values to integer display units, performs rational BigInt rounding, replaces the designated meal with `daily units - sum(other rounded units)`, rejects negative output, and records raw values, initially rounded values, residuals, destination and stable rule IDs. Integer-unit assertions avoid unsafe floating equality.

## Current meal context

| UI index / label | Normalized enum |
|---|---|
| `0` / 1–2 раза в день | `one_or_two` |
| `1` / 3 раза в день | `three` |
| `2` / 4 и более | `four_or_more` |
| missing/empty | `not_provided` |

Unknown non-empty values produce `invalid_input` with `QUESTIONNAIRE_UNSUPPORTED_MEAL_PATTERN_VALUE` and no nutrition numbers. Context is display-only. `selections[5]` and `[6]` remain unused.

## Result and session contract

Schema: `nutrimind.phase3a.result.v1`. Key: `nutrimind.phase3a.result`.

Calculated results contain the validated calculated Phase2D1 parent, normalized context, structure descriptors, policy/rule IDs and warnings. UI selections and allocations are not persisted. Non-calculated variants preserve the upstream status and omit calculated parent, kcal, macro grams, ml and meal-level numbers. Runtime validation rejects old and malformed schemas.

The existing `nutrimind.phase2d1.result` key is still written unchanged for `/result` and `/calibration`. No localStorage, URL parameters, IndexedDB changes, server requests or analytics were added.

## UI and safety

`/result` contains a compact entry point after daily macro scenarios. `/meal-structure` owns selectors and cards. Missing, malformed and suppressed states show no nutrition numbers. Calculated output shows cards, exact source totals, required safety language and an expandable trace. Phase 3A1 creates no food, product, dish, brand, supplement or medical claim and does not weaken allergy/celiac exclusions. Future Phase 3B must project canonical hard-exclusion and strict-gluten-free capabilities from validated safety provenance before food selection.

## Tests

Deterministic tests cover all structures, available days and scenarios, ordinary and athlete profiles, invariance, exact closure, odd/decimal/tie cases, residual destination, context normalization, old/malformed schemas, missing/suppressed parents, parent immutability, and exclusions. Existing Phase 1–2D1 and calibration suites remain in the same test command.

## Exclusions

Phase 3A2 training-relative placement and Phase 3B food selection are not implemented. There are no menus, timing windows, performance promises, product examples, nutrient targets, deficit/surplus rules, automatic choices, or durable storage of UI selections.

## Production verification

To be completed after the authorized commit, push and Vercel deployment: canonical route smoke, synthetic adult flow, exact allocation fixtures, calibration regression and 390×844 mobile QA.
