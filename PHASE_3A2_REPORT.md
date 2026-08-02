# Phase 3A2 — optional training-relative meal placement implementation report

## Scope and factual input limit

Production section 6 exposes only raw `selections[5]` values `0 / 1 / 2`, labelled `Утром / Днём / Вечером`. They describe a coarse part of day, not a clock time, interval, fasting state, meal availability, tolerance, or either session of a double-training day. Phase 3A2 never derives a boundary from them.

Phase 3A2 is an optional event-order annotation over an already built Phase 3A1 plan. It adds no nutrition calculation, food, menu, extra occasion, performance claim, recovery claim, or Phase 3B behavior.

## Context transport

Questionnaire submit writes a separate non-nutrition context under `nutrimind.phase3a2.context`. Exact schema `nutrimind.phase3a2.context.v1` is a strict union:

- `available`: `trainingTimeContext` is `morning | daytime | evening` and paired with exact display label `утром | днём | вечером`;
- `not_provided`: no context fields;
- `unsupported`: only `QUESTIONNAIRE_UNSUPPORTED_TRAINING_TIME_VALUE`.

Mapping is `0 -> morning`, `1 -> daytime`, `2 -> evening`; missing/null/empty becomes `not_provided`; other non-empty input becomes `unsupported`. Extra fields, old versions, malformed JSON and mismatched enum/label pairs fail closed only for timing. The object contains no energy, macros, hydration, REE, PAL, parent payload, medical context, allergy data, analyses, or selected boundary. `nutrimind.phase3a.result.v1` is unchanged.

## Eligibility and user flow

Controls require all of: compatible calculated Phase3A, an already built Phase3A1 plan, selected `training` day, `available` timing context, and an approved Phase3A1 structure. `typical_day`, `rest`, `double_training`, missing/unsupported/malformed timing context, missing/malformed/old Phase3A, and all non-calculated states are ineligible.

The block is opt-in. Its first button only opens an initially empty semantic radio fieldset. `Показать расположение` stays disabled until an explicit boundary choice. Reset removes only relation presentation. Changing day, scenario, structure, rebuilding the plan, or reloading resets the opt-in and boundary.

## Boundary and relation model

For `N` existing ordered occasions the pure boundary builder returns `N+1` choices: before first, every adjacent gap, and after last. The three structures therefore expose 4, 5, and 5 boundaries. The snack remains an ordinary existing occasion and is neither selected nor resized automatically.

The relation view model preserves original meal IDs, order, headings and numeric fields. Before-first marks the first meal as `Следующий приём после тренировки`; an interior boundary marks the preceding meal `Приём пищи перед тренировкой` and following meal `Следующий приём после тренировки`; after-last marks only the last meal as preceding. Other cards receive `Обычный приём пищи`. A separate text marker describes the training event. Copy explicitly states that markers describe order, not an exact interval, food composition, or mandatory meal time.

## React-only selection and immutability

The selected boundary and applied relation are React state only. They are absent from Phase3A, the context object, sessionStorage, localStorage, IndexedDB, URL, history state, server requests, and analytics. Reload restores the existing Phase3A session behavior but not timing state.

Relation functions consume only meal IDs/labels. They do not accept nutrition totals and never call `allocateDailyMacros`. Tests serialize the complete allocation before projecting every boundary and prove byte-for-byte equality afterward across all structures and lower/central/upper fixtures. `core/calculation/meal-allocation.ts`, `meal-policy.ts`, `phase3a.ts`, result schema, Phase2C2, hydration, and calibration storage are unchanged.

## Missing, unknown, double and safety behavior

Missing context shows a number-free unavailable explanation; unsupported or malformed context asks for questionnaire completion while preserving Phase3A1. Double-training shows a number-free insufficient-data explanation and has no mapping. Rest and ordinary days have no timing controls. Timing context alone can never unlock a plan: existing strict Phase3A session validation and calculated-status checks remain authoritative. Minor, blocked, specialist-review, minor-suppressed and invalid-input states show no timing plan or numeric plan.

## Policy IDs

The implementation follows: `MEAL.TIMING.EXPLICIT_BOUNDARY_REQUIRED.001`, `MEAL.TIMING.CONTEXT_ONLY.001`, `MEAL.TIMING.EVENT_ORDER_ONLY.001`, `MEAL.TIMING.NO_NUMERIC_REALLOCATION.001`, `MEAL.TIMING.SINGLE_SESSION_ONLY.001`, `MEAL.TIMING.DOUBLE_SESSION_UNSUPPORTED.001`, `MEAL.TIMING.SELECTION_NOT_PERSISTED.001`, and `MEAL.TIMING.PHASE3A1_REMAINS_AVAILABLE.001`. They are documentation/UI policy identifiers and are not added to Phase3A1 calculation trace.

## Automated verification

The suite covers exact raw mapping, missing/empty/unknown context, strict current schema and old/malformed rejection, nutrition-free context, all boundaries for all structures, before/adjacent/after relations, unaffected meals, snack neutrality, invalid boundary, allocation immutability, all scenario/structure numeric invariants, eligibility, no default, and prohibited persistence/math dependencies. Existing Phase 1–3A1 and calibration suites remain in the same command.

First verification: `158 passed / 0 failed / 0 skipped`; TypeScript typecheck passed; `git diff --check` passed. Next.js 16.2.6 production build compiled, typechecked and statically generated all routes successfully.

## Second independent verification

The post-build diff review answered all twelve adversarial questions:

1. No numeric meal-plan field changed; complete plans remained byte-identical after every relation projection.
2. Meal IDs, headings and order are unchanged.
3. Reconciliation file, meal and residuals are unchanged.
4. Initial relation is null and the apply action is disabled before explicit selection.
5. Boundary is not written anywhere; only the coarse context has a separate session key.
6. Context cannot unlock missing, malformed, old or non-calculated Phase3A.
7. Unknown/malformed context disables timing only; Phase3A1 remains calculated.
8. Double day has an explanation but no selector or mapping.
9. No exact hours or intervals appear.
10. No products or eating occasions were added.
11. Eligibility and mapping do not inspect goal or athlete level.
12. Phase3A1 works with missing/unsupported timing context and all ineligible day types.

Protected-file review confirmed zero diff in allocation, meal policy, Phase3A, calculation types/result schema, Phase2C2, hydration policy and package dependencies. Static scans found no boundary persistence, URL state, localStorage, IndexedDB change, fetch, analytics or timing-based nutrition math.

## Third contradiction check

Audit, implementation, report, diff, automated output and browser evidence were reread together. Production `0/1/2` mapping matches context normalization; UI asks only for event order; all options come from the selected structure; single-training eligibility matches the audit; context errors are capability-local; double/rest/ordinary remain excluded; boundary is React-only; and tests exercise actual pure functions used by UI. No contradiction remained before staging.

## Local browser QA

Current production build route smoke returned HTTP 200 for `/`, `/questionnaire`, `/result`, `/meal-structure`, `/calibration`, and `/report-demo`.

A synthetic adult professional athlete flow displayed known context `По анкете: вечером`. Before opt-in there were zero relation labels/markers. First opt-in opened four unselected three-meal boundaries and left apply disabled. Before-first, both adjacent boundaries and after-last produced the specified markers and labels. Meal cards stayed exactly `1267/54.5/28.7/197.7`, `1267/54.5/28.7/197.7`, and `1266/54.4/28.6/197.7`; total stayed `3800/163.4/86.0/593.1`. Reset removed all markers/relations while preserving the plan; structure changes cleared the plan/timing state; reload restored neither plan selectors nor timing selection.

`three_meals_plus_snack` exposed all five real choices including both snack-adjacent gaps. `four_occasions` exposed five choices. Rest and ordinary fitness plans remained available with no timing controls. A double-training plan remained available and showed only the insufficient-two-session-data explanation. Calibration opened its unchanged local-consent entry state.

Responsive checks at `1440×900`, `1024×768`, and `390×844` found `scrollWidth === clientWidth`. At mobile width cards/timing controls were one column, select width stayed within the timing container, and action heights were at least 44 px. Native radios/fieldset were keyboard-focusable and relation meaning remained textual rather than color-only.

## Production QA

Pending authorized commit, push, Vercel deployment and canonical-domain verification. Results will be appended after deployment without changing implementation behavior.

## Limitations and exclusions

No exact time or interval; no ordinary/rest/double placement; no two-session logic; no fasting, availability, or tolerance inference; no nutrition redistribution; no pre/post nutrition rule; no products, brands, additional snack, during-training intake, medical advice, outcome promise, or persistence. Phase 3B is not started.
