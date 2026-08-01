# Phase 2D2A implementation report

## Scope

Implemented the authorized 14-day device-local observation journal. Phase 1 through Phase 2D1 contracts, formulae, questionnaire sections, safety admission, nutrition values, hydration values, and demo data remain unchanged. Phase 2D2B and every automatic adjustment remain excluded.

## Contract and privacy

- Journal schema: `nutrimind.phase2d2a.journal.v1`.
- Entry schema: `nutrimind.phase2d2a.entry.v1`.
- Derived summary schema: `nutrimind.phase2d2a.summary.v1`.
- Consent: `nutrimind.phase2d2a.consent.v1`, unchecked by default.
- Storage: IndexedDB `nutrimind-calibration`, version 1, one record keyed as `active`.
- No localStorage, cookies, request payload, analytics event, server write, export, or import.
- The persisted source is minimal: source version/status, profile class, goal, and available day types. The complete D1 result, nutrition numbers, hydration numbers, and initial body weight are excluded.

## Lifecycle

The start date is the local calendar date of consent. The observation window contains start plus 13 calendar days; expiry is start plus 30 calendar days. Local calendar operations avoid fixed-millisecond day arithmetic. Entries cannot be future-dated or outside the window. Saving an existing date replaces that entry. After expiry, the record is inaccessible except for deletion. Corrupt and unsupported records fail closed and can only be reset.

## Observation semantics

Date, day type, and adherence are required. Actual training, body weight (finite 10–500 kg), measurement condition, hunger, energy, sleep, recovery, training quality, overall wellbeing, and atypical context are optional enumerations/numbers. There is no free text.

The derived summary is deterministic and neutral. Before day 14 it is `collecting`; on or after day 14 zero entries yield `insufficient_data`, while one or more entries yield `observation_complete`. Missing dates are not imputed. Weight observations remain dated values without trend analysis. No energy, macro, hydration, diagnosis, deficit, surplus, or recommendation output is produced.

## Safety

The explicit health/safety-context action requires confirmation and writes `safety_context_changed`. Editing then remains frozen. The UI states that observation stopped and directs the user to an appropriate specialist if necessary; it does not diagnose or infer a condition.

## UI integration

- `/calibration`: no-journal, active, completed-summary, expired, corrupt, unavailable, and safety-frozen states.
- `/result`: start/continue entry point after a calculated Phase 2D1 result.
- `/`: continuation link only when a non-expired usable journal exists.
- Responsive two-column desktop and single-column mobile journal layout, retaining the approved dark visual language.

## Verification

The Phase 2D2A suite adds 55 tests covering calendar boundaries, DST-adjacent dates, schemas, strict rejection, weight bounds, lifecycle states, missing dates, same-date replacement, neutral summary, and safety/expiry. Together with the preserved 74 prior tests, the suite reports 129 passed, 0 failed, 0 skipped. TypeScript core checking and the verified production build pass.
