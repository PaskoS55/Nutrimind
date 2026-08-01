# Phase 2C1 implementation report

## Scope

Phase 2C1 adds exact ordinary-user activity answers, deterministic planning-day scenarios, demonstration PAL presets, and a calculated starting energy reference. It does not add KBJU, hydration, calibration, deficits, surpluses, menus, products, or recommendations.

## Questionnaire correction and routing

Section 3 now exposes exactly `mostly_sitting`, `lots_of_walking`, `physically_active_work`, and `fitness_2_4_week`. Legacy `low`, `moderate`, and `high` values are not aliased and fail closed with `QUESTIONNAIRE_UNSUPPORTED_LEGACY_ACTIVITY`. The questionnaire remains nine sections in its approved order.

Users training five or more times per week are directed to the athlete branch; no fifth ordinary PAL was invented. The athlete branch explicitly includes amateur users. Switching requires activation of the accessible action. It preserves shared React-state answers, clears only ordinary activity, selects the athlete profile, opens Section 3, and announces the change. Frequency is retained as trace context and does not choose or increase PAL.

## PAL and scenarios

Ordinary mappings are: mostly sitting 1.40; lots of walking 1.55; physically active work 1.70; fitness typical day 1.50 and training day 1.65. Other ordinary rows produce only `typical_day`; fitness produces `typical_day`, then `training`.

Athlete mappings are: amateur 1.50/1.70/1.90, competitive 1.55/1.85/2.10, and professional 1.60/2.00/2.25 for rest/training/double training. Athletes always receive rest and training; double training is present only for explicit `true`.

The duration modifier applies only to athlete single training: at most 45 minutes −0.05; 46–90 minutes 0.00; above 90 minutes +0.10. Thus 45/46/90/91 map to −0.05/0.00/0.00/+0.10. Double training uses 0.00 and warning `double_duration_unknown`; the single duration is never doubled. PAL is clamped to 1.40–2.40 and serialized to two decimals.

## Energy, goals, and contract

Each scenario computes `EnergyStart_raw = REE_unrounded × PAL_final`. Display energy uses deterministic nearest-50 ties-to-even rounding, so 3812.5 becomes 3800 and 4289.0625 becomes 4300. Exercise calories are not added on top.

All five goals are preserved. Weight loss is `disabled_pending_safety_screen`; muscle gain is `deferred_to_goal_phase`; the other goals are `neutral_in_phase2c1`. Every applied multiplier is 1.00, so no goal changes energy.

The serialized schema is `nutrimind.phase2c1.result.v1`, stored under `nutrimind.phase2c1.result`. Old Phase 2B payloads are not read. Calculated results contain REE, goal policy, ordered scenarios, per-scenario trace/rules/warnings, engine version, and schema version. Blocked, specialist-review, minor, and invalid variants omit every numeric nutrition field. This intentionally preserves the stricter current specialist-review behavior over older planning text.

## Result UI

`/result` retains REE and adds scenario cards, visibly labelled demonstration PAL presets, goal staging, expandable calculation bases, and the deferred KBJU/hydration/calibration notice. Missing, expired, malformed, and old-version session data produces a neutral questionnaire link. No demo report data is used.

## Changed files

- `core/calculation/types.ts`, `normalization.ts`, `index.ts`
- `core/calculation/pal-policy.ts`, `energy-start.ts`, `phase2c.ts`
- `core/types.ts`, `core/validation.ts`, `core/questionnaire-adapter.ts`
- `data/survey-schema.json`
- `app/questionnaire/page.tsx`, `app/result/page.tsx`, `app/globals.css`
- `tests/nutrimind-core.test.mjs`
- `PHASE_2_ARCHITECTURE.md`, `PHASE_2C1_REPORT.md`

## Verification and deferred work

Production tests cover exact mappings, legacy failure, duration boundaries, double-day limitation, unrounded REE, ties-to-even energy rounding, deterministic traces, neutral goals, schema versions, and number-free suppressed results.

- `npm.cmd test`: 56 passed, 0 failed, 0 skipped.
- `npm.cmd run typecheck`: passed.
- `npx.cmd next build`: passed; static `/`, `/questionnaire`, `/result`, and `/report-demo` routes generated.
- `git diff --check`: passed (Git emitted only line-ending conversion notices).
- Browser QA: Section 1 guidance and amateur wording visible; all four ordinary activity cards and explicit 5+ switch visible; switch required a click, opened athlete Section 3, and removed ordinary activity; the production demo result showed REE 1905, professional rest PAL 1.60 / 3050 kcal and training PAL 2.00 / 3800 kcal; the deferred notice and demo-PAL labels were visible. Unit tests cover the requested ordinary, duration, double-day, goal, safety, and legacy combinations. At 1440×900, 1024×768, and 390×844, measured document/card widths showed no horizontal overflow.

There are no unresolved Phase 2C1 mapping ambiguities. Phase 2C2/2D goal multipliers, KBJU, hydration, fourteen-day calibration, food logic, and menus remain deferred. Safety-screen approval remains required before automatic energy reduction.
