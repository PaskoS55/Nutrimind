# Phase 2D1 — Hydration preparatory audit

This document records the preparatory audit performed before implementation. Repository reviewed: `C:/Projects/nutrimind` at `ba80c4e` with a clean worktree before the audit. The later Phase 2D1 implementation authorization resolved the policy decisions listed here: adult EFSA references are sex-based (`2000/2500 ml`), not weight-based; the one-session range is `400–800 ml/hour`; the production three-band beverage UI is canonical for this phase; missing intake is non-blocking; and subjective sweating/training-drink schema fields remain disconnected.

## 1. Current hydration inputs

There are three different realities that must not be conflated: the rendered questionnaire, the adapter contract, and the canonical survey schema.

| Field / source | Type and allowed values | Required / visibility | Current UI text | Adapter transformation | Reaches calculation input now? |
|---|---|---|---|---|---|
| `selections[7]` in `app/questionnaire/page.tsx` | Required-by-UI zero-based option index; current options are `0..2`: `До 1,5 л`, `1,5–2 л`, `Более 2 л` | A selection always exists because the nine-element state is initialized with zero; section 8 is shown to both branches | Title: `Сколько напитков вы обычно пьёте?`; intro explicitly excludes water from food; question: `Напитки в день` | Ignored. `adaptQuestionnaireAnswers` does not read index 7 | **No** |
| `dailyBeveragesLiters` in `data/survey-schema.json` | `single`: `under_1_5`, `1_5_2`, `2_3`, `over_3` | No `visibleWhen`; canonical schema therefore treats it as common to both branches. The schema does not encode requiredness explicitly | Survey spec: liquid `<1.5`, `1.5–2`, `2–3`, `>3 L` | No field exists in `QuestionnaireAnswers`; no mapping exists | **No** |
| `sweating` in `data/survey-schema.json` | `single`: `low`, `moderate`, `high` | Athlete only; requiredness is not encoded | Survey spec: athlete sweating. No rendered control or UI wording exists in the production questionnaire | No field exists in `QuestionnaireAnswers`; no mapping exists | **No** |
| `trainingDrink` in `data/survey-schema.json` | `single`: `none`, `water`, `electrolyte`, `carbohydrate_electrolyte` | Athlete only; requiredness is not encoded | Survey spec: type of drink during load. No rendered control or UI wording exists in the production questionnaire | No field exists in `QuestionnaireAnswers`; no mapping exists | **No** |

The UI and canonical schema are not equivalent: the UI merges canonical `2_3` and `over_3` into `Более 2 л`. An adapter must not invent which canonical bucket the user meant. The current default index also cannot safely be treated as an affirmative answer without a separately approved required/untouched-answer policy.

Existing non-section-8 inputs relevant to hydration are:

- `weightKg`: required numeric UI input, validated and normalized, and present in the calculated Phase 2C2 `ree.inputs`; sufficient as an input to a future approved weight-based formula, but it does not itself approve one.
- Athlete `typicalSessionMinutes`: required numeric single-session duration, passed in canonical activity and used by Phase 2C1. It supports a one-session duration-based scenario only.
- Athlete `doubleTrainingDays`: explicit boolean. When true, the questionnaire still supplies only one duration; it is forbidden to double it.
- `sessionsPerWeek`, `sportLevel`, `sportType`, `dailyActivity`, and goal are contextual. They are not substitutes for fluid consumption, environmental conditions, or sweat-rate measurements. `sportType` is currently not forwarded into the calculation request, and goal must remain hydration-neutral.

## 2. Data-flow map

```text
Rendered section 8
  answers[7]: 0 | 1 | 2
        |
        v
runQuestionnairePipeline({ selections, ... })
        |
        v
adaptQuestionnaireAnswers
  reads selections[0], [3], [8]
  DOES NOT read selections[7]
        |
        +--> validateSurveyInput (no hydration fields in its input)
        |
        v
Phase2ACalculationRequest
  canonical activity + goal only
  no beverage/sweating/trainingDrink context
        |
        v
runPhase2C2 -> runPhase2C1 (implemented in phase2c.ts) -> Phase2B
        |
        v
Phase2C2Result / nutrimind.phase2c2.result.v1
  no hydration result
        |
        v
sessionStorage["nutrimind.phase2c2.result"] -> /result
  strict compatibility check; hydration notice only
```

`core/calculation/phase2c1.ts` named in the audit request does not exist; the Phase 2C1 implementation is `core/calculation/phase2c.ts`. No server request, URL data, account persistence, or demo-report import participates in this flow.

## 3. Supported / unsupported calculations

| Capability | Status from data currently collected | Audit finding |
|---|---|---|
| Baseline fluid / total-water starting reference | **Partially supported** | Adult `weightKg` is collected and reaches calculated output, so the documented weight-based formula is technically computable after policy approval. Beverage intake is not total water and cannot be subtracted without food-water data. Minors and non-eligible states must receive no number. |
| Training-day adjustment | **Partially supported** | A single-session adult athlete has `typicalSessionMinutes`. General users, including `fitness_2_4_week`, have no session duration. Double-training days lack two session durations and must return an explicit insufficient-data state rather than double one value. Coefficients still require approval for Phase 2D1. |
| Adjustment by workout duration | **Partially supported** | Supported only for the declared single typical athlete session. Unsupported for two-session decomposition and ordinary-user fitness activity. |
| Individual sweat rate | **Unsupported** | Missing pre-exercise weight, post-exercise weight, fluid consumed during the measured session, urine produced, and session-specific measurement context. `sweating: low/moderate/high`, even if wired later, is subjective context and cannot produce sweat rate. |
| Assessment of actual drinking pattern | **Partially supported** | The UI collects a coarse beverage-only bucket, but it is discarded before validation/calculation and its bucket vocabulary conflicts with the canonical schema. It cannot assess total water or exact liters. |
| Low/high drinking warnings | **Partially supported** | A qualitative, carefully labelled comparison could become possible after preserving the beverage bucket and approving thresholds/context. Current pipeline has no hydration input, approved thresholds, food-water estimate, heat/illness/pregnancy policy, or overconsumption timing; therefore it cannot currently issue a reliable warning. |

Phase 2D1 must never infer an unentered measurement. In particular, weekly frequency is not workout duration, subjective sweating is not sweat rate, and `Более 2 л` is neither `2_3` nor `over_3` without a new user answer.

## 4. Safety constraints

- Reuse the existing validation and safety gateway before hydration computation. Allergies and goals must not weaken it.
- `minor_suppressed`, `blocked`, `specialist_review`, and `invalid_input` results must omit all numeric hydration fields, day-scenario numeric fluid ranges, formula intermediates, and numeric trace values. The same fail-closed rule applies to an unsupported legacy activity, missing required hydration input, malformed request, non-finite arithmetic, and incompatible session payload.
- Hydration status must be subordinate to the upstream result: Phase 2D1 may enrich only an eligible `status: calculated` Phase 2C2 result. It must not recalculate or change REE, PAL, EnergyStart, energy scenarios, macro scenarios, or goal multipliers.
- Do not turn beverage self-report, subjective sweating, symptoms, or a drink type into a diagnosis, a confirmed deficiency, dehydration/overhydration diagnosis, or a medical prescription.
- Do not add sodium, electrolytes, sports-drink, caffeine, heat, pregnancy, or disease formulas without separately approved policies and necessary inputs.
- Do not calculate sweat rate without all measured inputs. Do not double a single duration for double-training days.
- Keep the core deterministic and pure. Storage remains `sessionStorage` only; no sensitive values in URLs and no server calls. `data/demo-report.json` remains demonstration material only.

## 5. Proposed Phase2D1 contract

Phase 2D1 should consume `Phase2C2Result`, not independently rerun earlier phases. This preserves the exact upstream scenarios and makes the enrichment boundary testable. The input should also receive an explicit, canonical hydration context produced by the adapter; it must not inspect raw option indices.

Create a new versioned outer result and session schema: `nutrimind.phase2d1.result.v1`, stored under `nutrimind.phase2d1.result`. Reusing the Phase 2C2 schema/key would make old and new payloads ambiguous. `/result` should accept only the new structurally complete payload after implementation; absent, legacy, malformed, or incomplete payloads fail closed to the neutral questionnaire link.

Proposed discriminated shape (names are architectural proposals; coefficients and numeric policy values remain undecided):

```ts
type Phase2D1Status = Phase2BStatus;

type HydrationInputContext = {
  dailyBeverages: "under_1_5" | "1_5_2" | "2_3" | "over_3";
  athlete?: {
    typicalSessionMinutes: number;
    doubleTrainingDays: boolean;
    sweating?: "low" | "moderate" | "high";       // context only
    trainingDrink?: "none" | "water" | "electrolyte" | "carbohydrate_electrolyte"; // context only
  };
};

type Phase2D1CalculatedResult = Phase2C2CalculatedResult & {
  status: "calculated";
  resultSchemaVersion: "nutrimind.phase2d1.result.v1";
  hydration: {
    inputContext: HydrationInputContext;
    baseline: { status: "calculated" | "policy_pending"; /* numeric fields only when calculated */ };
    dayScenarios: Array<
      | { id: ScenarioId; status: "calculated"; /* approved numeric range + units */ }
      | { id: ScenarioId; status: "not_applicable" | "insufficient_data"; reasonCode: string }
    >;
    sweatRate: { status: "not_measured" | "insufficient_data" }; // no numeric estimate
    warnings: Array<{ code: string; severity: "info" | "warning" }>;
    appliedPolicy: { policyId: string; policyVersion: string; coefficientSetId?: string };
    calculationTrace: Array<{ step: number; ruleIds: string[]; inputs: unknown; outputs: unknown }>;
  };
};

type Phase2D1Result =
  | Phase2D1CalculatedResult
  | (Phase2C2NonCalculatedResult & {
      resultSchemaVersion: "nutrimind.phase2d1.result.v1";
      // no hydration object and no numeric nutrition fields
    });
```

The real TypeScript should reuse existing base/status/issue/trace types rather than duplicate them. Validators must reject extra or incomplete calculated hydration structures where safety depends on their absence/presence. Trace ordering, warning ordering, scenario ordering, units, rounding, and reason codes must be fixed by policy for byte-stable deterministic output. `policy_pending` is useful during design but should not coexist with public numeric fields.

## 6. Proposed UI

On `/result`, add a separate top-level card after the day energy/macro scenario section and before the existing future-stage notice. Do not place fluid values inside energy/KБЖУ definition lists and do not visually present them as a fourth macro.

The card should be titled `Гидратация — расчётный стартовый ориентир`. It should:

- distinguish `Общее поступление воды` from the user's `Напитки по самооценке` and explain that food water is not measured;
- show an eligible baseline and separately labelled training-day addition only when policy and inputs support them;
- show `Для двойного тренировочного дня недостаточно длительности каждой сессии` rather than doubling one duration;
- state `Персональная sweat-rate калибровка не выполнена` and list the measurements needed, without displaying an estimated rate;
- use `ориентир`, `диапазон` and `самооценка`, never `назначение`, `норма для лечения`, or diagnostic language;
- render number-free safety/status copy for minors and all non-calculated states, consistent with the existing neutral result behavior.

The production questionnaire currently cannot support this UI faithfully until its canonical section-8 controls and adapter mapping are separately authorized. Phase 2D1 implementation must not silently reinterpret the current three-option UI.

## 7. Required policy decisions

Implementation resolution: all items below were open at audit time. They are retained as an audit trail; the approved Phase 2D1 answers are documented in `PHASE_2D1_REPORT.md`. In particular, the preliminary `35 ml/kg` direction was rejected for Phase 2D1.

The following must be approved before numeric implementation:

1. Whether Phase 2D1 adopts the draft `35 ml/kg` total-water coefficient, for which eligible adult populations, with what bounds, rounding, units, evidence/version identifier, and wording.
2. Whether it adopts the draft `0.4–0.8 L/hour` training range, its eligible activities/populations, bounds and rounding, and whether it is additional fluid or merely a scenario range.
3. Exact canonical section-8 UI options: restore four beverage buckets or version the three-bucket vocabulary; requiredness and untouched/default behavior must be explicit.
4. Whether `sweating` and `trainingDrink` are required for athletes, and confirmation that they remain context-only in 2D1 rather than numeric multipliers.
5. Missing-input behavior for general users, `fitness_2_4_week`, single-session athletes, and double-session athletes; in particular, reason codes and whether partial baseline output may coexist with a non-numeric training scenario.
6. Approved non-diagnostic comparison/warning thresholds for beverage self-report, including whether no low/high warning is safer until food-water and timing data exist.
7. Whether hydration numeric output follows the existing `numericKbju` safety capability or requires a separately named numeric-hydration capability. Until approved, follow the stricter existing suppression boundary.
8. Exact schema key/version migration behavior and whether `/result` temporarily accepts Phase 2C2 only to show its current neutral hydration notice. It must never merge two session payloads by assumption.
9. Stable policy IDs, issue/warning/reason codes, deterministic order, and result-validator strictness.
10. Whether implementing the canonical hydration controls requires a separately approved questionnaire change, since `docs/NUTRIMIND_SURVEY_SPEC.md` must not be modified silently.

## 8. Test matrix

| Case | Minimum fixture | Expected Phase 2D1 behavior |
|---|---|---|
| Ordinary adult | Adult, allowed safety, canonical activity, valid weight and canonical beverage bucket | Calculated upstream preserved; baseline only if policy approved; training scenario `not_applicable`; no sweat-rate number |
| Ordinary `fitness_2_4_week` | Same plus `dailyActivity=fitness_2_4_week`, no duration | Baseline may be eligible; workout-duration addition `insufficient_data`; must not infer duration |
| Amateur athlete | Adult amateur, one session duration, canonical beverage context | Eligible single-training scenario only under approved policy; subjective sweating never becomes sweat rate |
| Competitive athlete | Adult competitive, one session duration | Same structural rules; level must not introduce an unapproved multiplier |
| Professional athlete | Adult professional, one session duration | Same; reproduce deterministic policy/trace and preserve Phase 2C2 numbers unchanged |
| Minor | Valid minor with guardian | `minor_suppressed`; no hydration, REE, PAL, energy, or KБЖУ numeric fields |
| Blocked | Upstream blocked safety fixture | Preserve `blocked`; no numeric nutrition/hydration fields |
| Specialist review | Upstream medical restriction fixture | Preserve `specialist_review`; no numeric nutrition/hydration fields |
| Invalid input | Missing/invalid demographic or canonical calculation input | `invalid_input`; no numeric nutrition/hydration fields; stable correction code |
| Unsupported legacy payload | Legacy `low/moderate/high` activity or Phase 2B/2C1/2C2 session schema | Reject/fail closed; do not upgrade or infer hydration; neutral questionnaire link in UI |
| Missing hydration input | Otherwise eligible calculated Phase 2C2 input, hydration context absent | Explicit hydration input error or `insufficient_data` according to approved policy; never default to `<1.5 L` |
| Malformed session payload | Invalid JSON, wrong schema version, NaN/non-finite, missing scenario, wrong enum, or partial hydration object | Compatibility validator returns false; UI shows neutral questionnaire link and no stale numbers |
| Double-training day, one duration | Athlete with `doubleTrainingDays=true`, only `typicalSessionMinutes` | `double_training_fluid_insufficient_data`; duration is not doubled |
| Goal variants | Same eligible fixture across all goals | Hydration output identical; REE/PAL/EnergyStart/KБЖУ unchanged; multiplier remains 1.00 |
| Determinism | Deep-cloned identical inputs run repeatedly | Deep-equal output, fixed array/trace order, no clock/environment/network dependence |

Every non-calculated serialization test should assert absence, not `null`, for `hydration`, baseline liters, training low/high liters, sweat loss/rate, REE, scenarios, PAL, EnergyStart, and macro grams. Calculated tests should also assert that the embedded Phase 2C2 values are exactly unchanged.

## 9. Exact files expected to change during implementation

Expected new files:

- `core/calculation/hydration-policy.ts` — approved coefficients, eligibility, stable rule/reason codes.
- `core/calculation/phase2d1.ts` — pure enrichment of an eligible Phase 2C2 result.
- `core/calculation/phase2d1-result-schema.ts` — strict session/result compatibility validator.
- `PHASE_2D1_REPORT.md` — implementation and verification record.

Expected existing-file changes:

- `core/questionnaire-adapter.ts` — typed canonical hydration context and explicit mapping; no raw indices in core.
- `core/calculation/types.ts` — Phase 2D1 input/result discriminated unions and schema constant.
- `core/calculation/index.ts` — exports.
- `core/index.ts` — only if its current re-export chain does not already expose the new exports.
- `app/questionnaire/page.tsx` — only under separately approved questionnaire authorization, to align section 8 with the canonical four beverage buckets and add existing athlete-only schema fields.
- `app/result/page.tsx` — read the new session key/schema and render the separate hydration card.
- `tests/nutrimind-core.test.mjs` — policy, mapping, safety absence, compatibility, determinism, and matrix coverage.
- `PHASE_2_ARCHITECTURE.md` — document the implemented Phase 2D1 boundary after implementation.

Potentially affected only if validation is intentionally extended to own hydration input validation: `core/types.ts`, `core/validation.ts`, and their validation tests. `docs/NUTRIMIND_SURVEY_SPEC.md` and `data/survey-schema.json` are sources of truth and are not expected to change merely to implement their existing fields; any change to the approved survey requires separate authorization.

## 10. Explicit list of things excluded from Phase 2D1

- Any change to the questionnaire, UI, calculation code, schemas, tests, or existing documentation during this audit.
- REE, PAL, EnergyStart, KБЖУ, goal multipliers, automatic deficit/surplus, or automatic energy reduction changes.
- Individual sweat-rate calculation until all required measured inputs exist; no inference from subjective sweating.
- Doubling one typical duration for a double-training day.
- Electrolyte, sodium, sports-drink, carbohydrate-drink, caffeine, heat, pregnancy, breastfeeding, illness, or disease-specific formulas or recommendations.
- Diagnosis, dehydration/overhydration claims, confirmed deficiencies without numeric labs, or medical-prescription language.
- Food-water estimation, exact actual total-water intake, wearable-derived hydration, urine-colour inference, and environmental adjustment.
- Fourteen-day calibration or automatic application of any correction.
- Product ranking, menus, supplements, substitutions, or using `data/demo-report.json` as production input.
- Server persistence, network requests, credentials, sensitive URL parameters, deployment, publication, commit, or push.
