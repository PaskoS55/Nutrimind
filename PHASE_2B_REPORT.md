# Phase 2B report

Date: 2026-07-31. Specification: `0.1.1-draft`.

## Implemented scope

Phase 2B implements the adult Mifflin–St Jeor REE stage only. Policy selects `mifflin_st_jeor_adult_male` or `mifflin_st_jeor_adult_female` from the admitted normalized sex category. Formula functions contain arithmetic only. Internal kcal/day is retained unrounded; display uses `nearest_5_kcal`. Inputs are the Phase 1 normalized age in years, height in centimetres, and weight in kilograms. Adults are age 18–120 under the existing Phase 1 contract. No minor formula is implemented.

The questionnaire adapter preserves its raw answer object, constructs the existing Phase 1 contract, invokes `validateSurveyInput`, and then invokes Phase 2B through the real Phase 2A safety/admission path. For REE scope only, survey activity and goal values are retained with `REE_STAGE_MAPPING_DEFERRED`; they are not converted to PAL or a canonical goal. This is safe because neither value participates in Mifflin–St Jeor. Full Phase 2A requests retain their fail-closed mapping behavior.

`Phase2BResult` distinguishes `calculated`, `blocked`, `specialist_review`, `minor_suppressed`, and `invalid_input`. Only `calculated` has a `ree` property. Other variants contain structured issues and a next-step code, with no numeric energy, calorie, or macro placeholder.

## UI integration

`/questionnaire` calls `runQuestionnairePipeline` in the browser, shows validation errors in-place, stores valid terminal results under `nutrimind.phase2b.result` in `sessionStorage`, and navigates without placing answers in the URL. `/result` reads only that session result. It never imports `data/demo-report.json`; `/report-demo` remains separate and unchanged. The result copy explicitly says that PAL, total daily need, calorie targets, and macros are not calculated. No request is sent to a server and no account persistence is used.

## Tests and verification

- `npm.cmd test`: 43 passed, 0 failed, 0 skipped.
- `npm.cmd run typecheck`: passed.
- `npx.cmd next build`: passed; static routes `/`, `/questionnaire`, `/result`, and `/report-demo` generated.
- `git diff --check`: passed (Git emitted only line-ending conversion notices).
- Browser QA: allowed adult displayed REE 1905 kcal/day for the specification example; minor and celiac specialist-review states displayed no nutrition numbers; direct `/result` showed the neutral empty state. Invalid, blocked, specialist, and minor contracts are also production-code unit tested for absence of numeric fields. A blocked pregnancy/eating-disorder browser path is unavailable because that safety screen remains explicitly unapproved and is not present in the survey schema; it was not silently added to the UI.

## Changed files

- `core/calculation/types.ts`, `normalization.ts`, `index.ts`
- `core/calculation/ree-formula.ts`, `ree-policy.ts`, `phase2b.ts`
- `core/questionnaire-adapter.ts`, `core/index.ts`
- `app/questionnaire/page.tsx`, `app/result/page.tsx`, `app/globals.css`
- `tests/nutrimind-core.test.mjs`
- `PHASE_2B_REPORT.md`

## Deferred and unresolved

PAL, activity mapping, canonical goal mapping, EnergyStart, calorie targets, goal multipliers, macros, hydration, calibration arithmetic, food ranking, menus, and recommendations remain deferred. Safety-screen approval remains unresolved; automatic energy reduction remains disabled. No demo values are calculation fallbacks.
