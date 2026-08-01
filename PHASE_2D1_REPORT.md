# Phase 2D1 — Hydration guidance implementation report

## Approved policy

Phase 2D1 provides transparent planning context, not a medical prescription or measured individual need. For eligible calculated adults, the baseline is an EFSA total-water reference: `2000 ml/day` for the female formula category and `2500 ml/day` for the male formula category. It includes water from all beverages and food. It is not weight-based and does not vary with adult age, height, weight, REE, PAL, energy, macros, goal, athlete level, training frequency, or beverage self-report.

For an athlete with a valid production duration for one session, the separate label is `Общий стартовый диапазон жидкости во время одной тренировки`. The range is general and non-personalized. It is never summed with the total-water reference.

Policy references:

- EFSA NDA Panel, *Scientific Opinion on Dietary Reference Values for water*, EFSA Journal 2010;8(3):1459.
- ACSM, *Exercise and Fluid Replacement*, Medicine & Science in Sports & Exercise, 2007, DOI `10.1249/mss.0b013e31802ca597`.
- NATA, *Fluid Replacement for the Physically Active*, Journal of Athletic Training, 2017, DOI `10.4085/1062-6050-52.9.02`.

These sources support a transparent general orientation only.

## Architecture and exact result contract

`runQuestionnairePipeline` performs the existing validation/safety and Phase 2A–2C2 path once, then calls `runPhase2D1(phase2c2, hydrationInput)`. Phase 2D1 does not recalculate or alter the upstream result.

Calculated `nutrimind.phase2d1.result.v1` contains:

- `status`, versions, issues, next-step code, and existing trace metadata;
- `phase2c2`: the unchanged calculated `nutrimind.phase2c2.result.v1` payload;
- `hydrationInputContext`: canonical beverage band, safe display label, and `directlyComparableToBaseline: false`;
- `baselineTotalWater`: source, sex basis, `totalWaterMl`, total-water scope, `includesFoodWater: true`, and `isIndividualRequirement: false`;
- `exerciseFluidGuidance`: discriminated `range_calculated`, `duration_unavailable`, or `not_applicable`; numeric duration/range fields exist only for `range_calculated`;
- `doubleSessionGuidance`: number-free marker; no double-day total;
- ordered warnings, applied stable policy/rule IDs, and deterministic calculation trace.

Non-calculated results preserve only number-free upstream status metadata. They do not embed Phase 2C2, baseline, exercise guidance, REE, PAL, kcal, macros, or millilitres. The strict result reader rejects old, malformed, and incomplete payloads.

The session key is `nutrimind.phase2d1.result`. Questionnaire/result data remain in `sessionStorage`; no URL or server transport was added.

## Questionnaire mapping

The existing section 8 option index is mapped explicitly:

| UI | Canonical value |
|---|---|
| `До 1,5 л` | `under_1_5_l` |
| `1,5–2 л` | `between_1_5_and_2_l` |
| `Более 2 л` | `over_2_l` |
| absent | `not_provided` |

Unknown non-empty values return `invalid_input` with `QUESTIONNAIRE_UNSUPPORTED_HYDRATION_VALUE` and no numeric nutrition fields. The answer is displayed only as `Самооценка напитков за обычный день`; it is not mathematically compared with total water. `sweating` and `trainingDrink` were not connected because production UI does not collect them. The questionnaire still contains exactly nine ordered sections.

## Formula and rounding

```text
rawLowerMl = trainingDurationMinutes × 400 / 60
rawUpperMl = trainingDurationMinutes × 800 / 60
display = nearest 50 ml, ties to even
```

The implementation handles half ties explicitly rather than relying on `Math.round`. Raw values remain in trace; UI shows only finite rounded results. Fixtures are `45 → 300–600 ml`, `90 → 600–1200 ml`, and `100 → raw 666.666…–1333.333…, displayed 650–1350 ml`. Direct rounding fixtures are `625 → 600` and `675 → 700`.

## Safety behavior and warnings

Goals, weight, and athlete level do not change hydration. Allergies and the existing safety gateway remain upstream. A double day uses only the entered session range and emits `double_session_duration_missing`; it never doubles the duration. A missing beverage answer is non-medical and non-blocking, produces `hydration_intake_not_provided`, and leaves the adult baseline available.

Stable warnings are: `hydration_intake_not_provided`, `beverage_intake_not_comparable_to_total_water`, `exercise_range_not_personalized`, `sweat_rate_not_available`, `training_duration_unavailable`, and `double_session_duration_missing`. No low/high intake warning or diagnosis exists.

Stable rule IDs include `HYDRATION.BASELINE.EFSA.ADULT_TOTAL_WATER.001`, `HYDRATION.INPUT.BEVERAGE_CONTEXT_ONLY.001`, `HYDRATION.EXERCISE.GENERAL_RANGE.001`, `HYDRATION.EXERCISE.NO_AUTOMATIC_SUM.001`, `HYDRATION.EXERCISE.DOUBLE_DURATION_REQUIRED.001`, `ROUND.FIFTY_ML.TIES_EVEN.001`, and `HYDRATION.SAFETY.NON_CALCULATED_NO_NUMBERS.001`.

## UI

`/result` renders hydration after KБЖУ and before the selected goal. Separate responsive cards show baseline total water, beverage self-report, and single-session guidance. Missing duration and second-session duration use non-numeric text. The details/summary element exposes readable bases and wrapping rule IDs. No combined target is rendered.

## Test fixtures and verification

Automated coverage includes female/male ordinary profiles, ordinary fitness, all athlete levels, 45/90/100-minute fixtures, level/goal/weight invariance, all beverage bands and missing input, unknown input fail-closed, double days, minor/blocked/specialist/invalid variants, old/malformed/incomplete schemas, ties-to-even boundaries, non-summation, and unchanged Phase 2C2 fixtures.

Final local verification and browser/production evidence are recorded after completion below.

## Excluded capabilities

No electrolyte, sodium, potassium, sports-drink, caffeine, alcohol, heat, humidity, altitude, pregnancy, lactation, disease-specific, post-exercise replacement, pre-exercise loading, sweat-rate, sweat-sodium, urine-colour, dehydration/overhydration classification, intake adequacy, combined daily target, automatic correction, or calibration capability was added. Demo report data are not a production input.

## Production verification

Local verification before commit: `74 passed / 0 failed / 0 skipped`; TypeScript typecheck passed; Next production build passed; `git diff --check` passed. Local route smoke returned HTTP 200 for `/`, `/questionnaire`, `/result`, and `/report-demo`.

The in-app browser could load the local server HTML and assets, but its local Next session did not execute the client bundle, so interactive local questionnaire fixtures and screenshots could not be represented honestly. Structural responsive QA confirmed the hydration cards use three `minmax(0,1fr)` columns at desktop sizes, stack to one column at `max-width:700px` (covering `390×844`), keep `min-width:0`, preserve normal word breaking, wrap rule IDs, retain keyboard-native `details/summary`, and keep the result shell `overflow-x:hidden` on mobile. Automated result fixtures cover all requested UI values and non-calculated suppression. Full interactive fixture and viewport QA is deferred to the deployed production runtime.

Commit, push, deployment, and production verification are pending.
