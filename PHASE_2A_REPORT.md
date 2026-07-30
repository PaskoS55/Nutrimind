# Phase 2A implementation report

## Scope

Phase 2A implements calculation admission, conservative input normalization, deterministic trace infrastructure, and non-numeric result scaffolding. It does not implement REE, PAL values or multipliers, EnergyStart, calorie targets, macros, hydration, fourteen-day adjustments, menus, products, or recommendations.

## Implemented modules

- `core/calculation/types.ts` — public request, normalized-input, issue, trace, admission, and result contracts.
- `core/calculation/normalization.ts` — structural validation, exact canonical enum acceptance, source-value preservation, and explicit ambiguity rejection.
- `core/calculation/admission.ts` — fail-closed Phase 1 admission and medical/minor routing.
- `core/calculation/trace.ts` — deterministic trace entry construction with stable step identifiers.
- `core/calculation/pipeline.ts` — pure Phase 2A orchestration and result assembly.
- `core/calculation/index.ts` and `core/index.ts` — package export surface.

## Public API

The primary runtime entry point is:

```ts
runPhase2A(input: Phase2AInput): Phase2AResult
```

The calculation package also exports `normalizeCalculationInput`, `admitCalculation`, `createTraceEntry`, `CALCULATION_CORE_VERSION`, `TRACE_STEP_IDS`, and their public TypeScript contracts.

`Phase2AResult.status` is exactly one of `admitted`, `blocked`, `specialist_review`, or `invalid_input`. No Phase 2A result type contains REE, PAL, energy, calorie-target, macro, hydration, or calibration result fields.

## Admission rules

1. A valid Phase 1 `ValidationResult` with a normalized profile is mandatory.
2. Phase 1 safety is evaluated by the pipeline; callers do not supply or override the medical gateway.
3. `medicalGateway=blocked` returns `blocked`.
4. `medicalGateway=specialist_review` returns `specialist_review` and does not continue as admitted.
5. A minor returns `blocked`, with numeric output disallowed.
6. Any other `numericKbju=false` capability returns `blocked`.
7. Structurally missing, unsupported, version-mismatched, or ambiguous calculation input returns `invalid_input`.
8. All decisions use machine-readable issue codes, fixed severity, rule IDs, and field paths where applicable.

Phase 1 validation issues and safety flags are retained in admission metadata. No missing safety answer is converted to a safe answer or otherwise inferred.

## Normalization rules

- Phase 1 canonical anthropometry is projected without conversion: years, centimetres, and kilograms remain in their validated units.
- Supported Phase 2 canonical activity, day-type, sport-level, daily-activity, and goal enum values are accepted only as exact values.
- Canonical activity must use the same athlete/general-user branch as the validated profile.
- Each explicitly canonical activity and goal must carry a JSON-compatible caller-supplied source value. That value is preserved verbatim.
- Survey-vocabulary `dailyActivity` is rejected with `ACTIVITY_MAPPING_AMBIGUOUS`; no PAL-category mapping is invented.
- Survey-vocabulary goals are rejected with `GOAL_MAPPING_AMBIGUOUS`; no canonical-goal mapping is invented.
- Unsupported, non-finite, branch-conflicting, or non-traceable values are rejected rather than coerced.

## Trace behavior

Trace steps use stable identifiers:

1. `phase2a.normalization.v1`
2. `phase2a.admission.v1`
3. `phase2a.result.v1`

Each entry records its sequence, stage, versioned rule, input/output paths and values, applied rules, warning codes, and blocked-decision codes. The implementation does not read clocks, randomness, environment variables, files, databases, or network state. It does not hash inputs. A timestamp is copied only when supplied by the caller and is omitted otherwise; it does not alter trace construction.

## Test coverage

Production-import tests cover:

- allowed adult admission;
- blocked medical state;
- specialist-review routing;
- minor suppression;
- structurally missing request fields;
- ambiguous ordinary activity mapping;
- ambiguous survey goal mapping;
- deep equality for repeated runs and stable trace order;
- omitted and caller-supplied timestamps;
- absence of numeric KBJU result fields across all four statuses.

Existing Phase 1 tests remain intact and continue to exercise validation and safety behavior.

## Unresolved ambiguities

Phase 2A deliberately leaves unresolved:

1. `dailyActivity=low/moderate/high` to the four ordinary-user PAL table categories.
2. Athlete and general-user survey goal labels to `maintenance`, `weight_loss`, `weight_gain`, and `recomposition`.
3. Whether the muscle-gain `1.05` demonstration multiplier applies to generic `weight_gain`.
4. Survey `±100 kcal` versus calculation-core `0.94/1.00/1.06` sensitivity scenarios.
5. Approval and completeness of the safety screen; its presence never enables automatic energy reduction.
6. Medical protein-suppression flags beyond kidney disease.
7. Fourteen-day observation/window, sufficiency, stability, adjustment, and approval semantics.
8. Hydration's eventual relationship to the Phase 2 result.
9. Canonical serialization/hashing and persistence timestamps.
10. Clinical interpretation of numeric laboratory results.

## Verification results

Executed from `C:\Projects\nutrimind` on 2026-07-30:

- `npm.cmd test` — passed: `39`; failed: `0`; skipped: `0`; cancelled: `0`; todo: `0`.
- `npm.cmd run typecheck` — exit code `0`; TypeScript reported no errors.
- `git diff --check` — exit code `0`; no whitespace errors. Git emitted only existing line-ending notices that LF will be replaced by CRLF for `core/index.ts` and `tests/nutrimind-core.test.mjs` when Git next touches them.
