# Phase 2D2 — 14-day calibration audit

Status: preparatory architecture, product, privacy, and safety audit only. It does not authorize a journal, persistence change, trend algorithm, energy adjustment, UI change, or medical screening.

Implementation note (2026-08-01): the repository owner subsequently authorized the bounded Phase 2D2A implementation described by the approved task: device-local IndexedDB persistence, journal-specific consent, enumerated daily observations, neutral deterministic coverage summary, retention/expiry, and safety freeze. This later authorization does not approve Phase 2D2B, trend inference, energy/macronutrient/hydration adjustment, diagnosis, server persistence, export/import, or changes to the nine-section questionnaire.

## 1. Executive summary

NutriMind cannot perform a meaningful 14-day calibration today. Production has a deterministic single questionnaire snapshot and a versioned `Phase2D1Result`, but no longitudinal entries, adherence data, repeated measurements, persistence lifecycle, or calibration contract. The current `sessionStorage` policy is incompatible with a reliable multi-day journal because data do not reliably survive closing the tab or browser.

The safest MVP is **Phase 2D2A: journal and observation only**, separated from any adjustment policy. It should report data coverage and neutral observations, preserve Phase 2D1 unchanged, and never change energy, macros, or hydration. If durable on-device storage is approved, IndexedDB (or a deliberately bounded local-storage implementation) is the recommended near-term persistence class. If the `sessionStorage only` rule cannot change, the feasible fallback is a one-time day-14 summary entry with explicitly lower reliability. **Phase 2D2B: adjustment suggestion** must remain a separate future authorization. Automatic recalculation is high risk and not recommended.

Four blockers precede implementation: persistence/retention policy; daily-field and consent policy; trend/sufficiency/atypical-day policy; and safety routing when context changes. Fourteen days is a product observation window, not a diagnostic interval.

## 2. Repository and current pipeline

Audit baseline:

- repository/worktree: `C:/Projects/nutrimind`;
- branch and HEAD: `main` at `c7e87e4e848027bcd0cd18ff8fce9e54864f61f0`;
- local `main` and `origin/main`: no divergence;
- initial worktree: clean;
- `C:/Projects/nutrimind-original` was not used.

Current production flow:

```text
9-section questionnaire (one in-memory snapshot)
  -> questionnaire adapter
  -> Phase 1 validation and safety
  -> Phase 2A admission
  -> Phase 2B REE
  -> Phase 2C1 PAL + EnergyStart day scenarios
  -> Phase 2C2 macro scenarios
  -> Phase 2D1 hydration guidance
  -> sessionStorage["nutrimind.phase2d1.result"]
  -> /result
```

`core/calculation/phase2c1.ts` does not exist; Phase 2C1 is implemented in `core/calculation/phase2c.ts`. The core is pure and does not own persistence or the clock. `/result` accepts only a structurally compatible `nutrimind.phase2d1.result.v1`. No journal route, calibration module, localStorage/IndexedDB access, clear/export/import control, or production server submission exists. `data/demo-report.json` is not in the production path.

The older architecture document contains illustrative calibration counts, percentage bounds, and outcome names. They are unimplemented design history, not approved Phase 2D2 policy; this audit does not adopt them.

## 3. Current input inventory

“Stored” below means included in the current session result, not durable longitudinal storage.

| Data | Source UI / section | Production field, type, allowed values | Required | Adapter / contract destination | Stored or discarded | Snapshot / safe use | Unsupported inference |
|---|---|---|---|---|---|---|---|
| Initial body mass | Numeric `Масса тела, кг`, section 2 | `weightKg: number`, UI 10–500, step 0.1 | Yes | validation → normalized demographics → `phase2c2.ree.inputs.weightKg`; used by REE/macros | Stored in calculated Phase2D1 parent | Single baseline snapshot; parent context only | No weight trend, fat-mass change, adherence, or current weight |
| Age group / age | Sections 1–2 | `adult|minor`; numeric age | Yes | validation/safety and REE | Stored upstream when calculated; suppressed paths number-free | Eligibility/safety only | No claim that current age/safety remains unchanged after 14 days |
| Goal | Section 3 | `weight_loss|maintenance|muscle_gain|performance_recovery|habits_wellbeing` | Yes (UI default) | canonical goal → Phase2C1/2C2 | Stored as `selectedGoal` | Context label; current multiplier stays 1 | No goal-specific calibration rule or automatic deficit/surplus |
| Ordinary activity | Section 3, general branch | `mostly_sitting|lots_of_walking|physically_active_work|fitness_2_4_week` | Branch-required | canonical activity → PAL day scenarios | Stored in trace/scenarios | Baseline classification and available day types | No actual daily activity, training completion, duration, or adherence |
| Athlete level | Section 3, athlete branch | `amateur|competitive|professional` | Branch-required | canonical activity → PAL and macro profile | Stored upstream | Parent context only | No daily performance, recovery, or adjustment multiplier |
| Training frequency | Section 3, athlete branch | `1_2|3_4|5_6|7_plus` | Branch-required | source context/trace | Stored in scenario trace | Descriptive baseline | No exact session dates or completion count |
| Typical session duration | Section 3, athlete branch | number; production submits `Number(value)` | Branch-required and validated | canonical activity; Phase2D1 single-session range | Stored upstream/hydration trace | Typical-session context | No actual duration by day or second-session duration |
| Double-training flag | Section 3 | boolean | UI explicit | canonical activity → double-day scenario | Stored upstream | Identifies possible day type | No evidence a double day occurred; no second duration |
| Sport type | Section 3 | hockey, volleyball, football, combat, endurance, strength, other | UI value exists | Present in raw answers but not forwarded into calculation request | Discarded | None until contract exists | No sport-specific calibration or risk conclusion |
| Current diet / meal regularity | One coarse `Основные приёмы пищи` option, section 5 | raw `selections[4]`, UI has `1–2`, `3`, `4+`; schema defines a richer, different set | UI selection always defaults | Adapter ignores it | Discarded | None | No intake amount, energy adherence, meal regularity trend, or macro adherence |
| Around-load timing | One `Обычное время` option, section 6 | raw `selections[5]`: morning/day/evening | UI selection defaults | Adapter ignores it | Discarded | None | No pre/post-meal adherence or actual training time |
| Energy / wellbeing | One coarse energy option, section 7 | raw `selections[6]`: stable / sometimes lower / noticeable drops | UI selection defaults | Adapter ignores it | Discarded | None | No longitudinal energy, fatigue, recovery, sleep, hunger, performance, or diagnosis |
| Hydration self-report | Section 8 | raw index → `under_1_5_l|between_1_5_and_2_l|over_2_l|not_provided` | Missing supported by adapter | Phase2D1 `hydrationInputContext` | Stored in session parent | Beverage context only | No adequacy, hydration trend, or calibration of fluid losses |
| Labs/context declaration | Section 9 | raw selection becomes `numeric_results_declared` or `none_recent` | UI selection defaults | validation profile only; no numeric lab values | Not exposed as calibration input | Safety/context declaration only | No deficiency, health confirmation, trend, or medical clearance |
| Informational consent | Checkbox, section 9 | boolean | Yes | validation consent gate | Used during validation; no journal-specific consent record | One-time questionnaire consent | Does not authorize durable sensitive journal storage, export, analytics, or sharing |
| Safety restrictions | Coarse section 4 selection | adapter synthesizes unresolved allergy / intolerance / celiac / none from one index | UI selection defaults | Phase 1 safety gateway | Result issues/status; calculated parent only when admitted | Must remain upstream safety boundary | Does not prove safety remains unchanged during observation |

Schema-only, not production input: sleep hours/quality, digestion symptoms, detailed diet fields, training meals, sweating/training drink, medications, supplements, lab age, doctor instructions, and detailed allergies. Appetite/hunger, fatigue, recovery, training quality/performance, adherence, daily weight, dates, and atypical-day context are absent from both production UI and current calculation input.

## 4. Longitudinal data gap

Current values describe one questionnaire completion. A trend needs time-indexed observations with stable units and measurement semantics. Phase 2D1 supplies only an initial weight embedded deep in a calculated result; it cannot distinguish a real change from fluid/glycogen/gut-content fluctuation or measurement-condition changes.

Missing essentials include entry date, window identity/time zone policy, repeated optional weight, measurement conditions, planned versus actual day type, actual training completion/duration, adherence context, atypical-day markers, and repeated subjective observations. The system also lacks duplicate-date rules, edit history, missed-day semantics, retention/expiry, corruption/quota handling, and a parent-result link.

No absent field may be inferred from sport level, weekly frequency, goal, PAL scenario, typical duration, questionnaire energy response, or demo data.

## 5. Storage-policy conflict

`sessionStorage` is scoped to a browsing context. It can survive a reload in the same tab but is not reliable across tab closure, browser closure, device restart, a different tab, or another device. It therefore cannot support a genuine 14-day journal.

This is a blocking product conflict, not an implementation detail. Phase 2D2 cannot silently change storage class because weight, hydration, wellbeing, adherence, and activity observations are sensitive personal data.

Required storage properties if durable local storage is approved:

- explicit journal-specific consent and privacy notice before the first durable write;
- versioned schema and parent-result identifier/version;
- clear-all control and defined deletion outcome;
- retention/expiry policy and deterministic expiry behavior;
- warning for shared devices and lack of OS/account isolation;
- fail-closed parsing, quota/private-mode error handling, and no partial “saved” claim;
- no URL, analytics, log, or server payload; no cross-device promise.

## 6. Architecture options

| Option | Privacy | Reliability | UX burden | Complexity / compatibility | Failure modes | Recommendation |
|---|---|---|---|---|---|---|
| A. Daily local journal (`localStorage` or IndexedDB) | Data stays on device, but is visible to other users of the same browser profile; sensitive durable footprint | Survives tab/browser/device restart on same profile; not browser clearing, private mode, device loss, or cross-device | Daily entry plus consent, privacy, save confirmation, clear action | Medium with `localStorage`, higher but more robust/transactional with IndexedDB; requires explicit exception to `sessionStorage only` | Quota denial, corruption, eviction/clear, private-mode limits, migration failure, shared-device exposure | **Recommended for Phase 2D2A only if storage policy is approved**; prefer IndexedDB for structured entries, with a small metadata record |
| B. Day-14 summary entry | Session-only remains possible; no retained daily journal | Depends on memory and one return session; cannot verify daily coverage | Low entry frequency, high recall/cognitive burden | Low; most compatible with current architecture | Recall bias, missing original session result, summary fabricated from memory, no defensible trend | **Recommended fallback only if storage policy cannot change**; label as retrospective summary, not calibration |
| C. Export/import local file | User controls file destination; file can be copied/shared/leaked | Survives browser clearing if retained; manual and error-prone | High: download, protect, locate, import, resolve versions | Medium-high; needs strict schema, file validation, safe download/upload UX | Wrong file, stale/duplicate import, disclosure, tampering, loss, unsupported version | Not recommended as primary MVP; optional future portability after journal schema stabilizes |
| D. Server/account persistence | Highest governance burden: personal data leaves device | Best cross-device durability if service is operated correctly | Account/auth/recovery burden | Very high; backend, auth, authorization, encryption, breach handling, deletion/export, audit and governance are absent | Unauthorized access, breach, account mismatch, retention failure, network/offline failure | **Excluded from near-term Phase 2D2** |

LocalStorage is simpler but whole-document rewrites and concurrent-tab races make corruption/lost-update handling harder. IndexedDB provides structured records and transactions but needs more code and explicit fallback/error UX. Neither is “secure storage” merely because it is local.

## 7. Required daily inputs

These are candidate fields, not approved questionnaire additions. The daily journal should be separate from the fixed nine-section baseline questionnaire.

| Candidate | Why / can omit? | Safe response type | False-precision / medical risk | Privacy | Optional? |
|---|---|---|---|---|---|
| Local calendar date | Orders entries and enforces window; cannot omit | ISO local date plus separately approved time-zone/window semantics | Low, but device clock can be wrong | Low | No |
| Body weight measurement | Supports a weight observation trend; summary can exist without it | Decimal value + explicit `kg` (or source unit with deterministic conversion policy) | High if treated as fat change or exact need | High | Yes |
| Measurement conditions | Distinguishes comparable/non-comparable measurements | Categorical: comparable routine / different conditions / unknown; avoid policing exact rituals | Users may overestimate comparability | Medium | Yes |
| Planned day type | Links to existing Phase2C1 scenario | `rest|training|double_training|ordinary|unknown` | Plan is not actual behavior | Medium | Yes |
| Actual training completed | Separates plan from occurrence | none / single / double / other / unknown | Not an expenditure measurement | Medium | Yes |
| Actual training duration | Context for completed training | Optional integer minutes per completed session; second duration separate | Duration is not intensity or energy expenditure | Medium | Yes |
| Unusual context | Marks days unsuitable for ordinary comparison | multi-enum: travel / illness-or-unwell / competition / schedule disruption / other / none; neutral wording | Must not diagnose illness | High | Yes |
| Energy-scenario adherence | Indicates whether a scenario was approximately followed | not selected / broadly followed / partly / not followed / unsure | Self-report is not measured kcal intake | High | Yes |
| Macro-scenario adherence | Context only | same categorical enum, with selected scenario id | Cannot establish actual grams | High | Yes |
| Missed/atypical day | Prevents silent imputation | ordinary / atypical / no usable observation | “Missed” must not imply failure | Medium | Yes, with explicit unknown |
| Hunger | Repeated subjective signal | short categorical enum such as lower/usual/higher/unsure; scale choice requires policy | Can be overmedicalized; no eating-disorder inference | High | Yes |
| Energy | Repeated subjective signal | categorical lower/usual/higher/variable/unsure | No low-energy-availability diagnosis | High | Yes |
| Recovery | Training context | categorical poorer/usual/better/not applicable/unsure | Not a clinical recovery measure | High | Yes |
| Sleep | Context for interpretation | categorical poorer/usual/better/unsure; duration optional only if justified | Consumer estimate, not sleep diagnosis | High | Yes |
| Training quality | Performance context | poorer/usual/better/not applicable/unsure | Not objective performance testing | High | Yes |
| Gastrointestinal tolerance | Flags context for review | no issue / mild impact / meaningful impact / prefer not to answer; wording requires safety review | Symptoms must not become diagnoses | High | Yes |
| Overall wellbeing | Broad context | poorer/usual/better/unsure | No health confirmation from “usual/better” | High | Yes |

Menstrual-cycle, pregnancy, diagnosis, medication, and disease tracking must not be default journal fields. Their absence limits interpretation; relevant cases belong to separately approved specialist context, not inferred screening.

## 8. Supported and unsupported capabilities

| Capability | Assessment | Reason |
|---|---|---|
| 1. Weight trend | Unsupported without new input | Only one initial mass exists |
| 2. Trend versus one measurement | Unsupported without new input | Needs repeated comparable observations and approved sufficiency/method |
| 3. Plan adherence | Unsupported without new input | No intake/adherence journal |
| 4. Hunger change | Unsupported without new input | No production hunger field |
| 5. Energy/recovery change | Unsupported without new input | One coarse energy snapshot is discarded; recovery absent |
| 6. Training performance change | Unsupported without new input | No repeated training-quality/performance data |
| 7. Rest/training/double-day comparison | Partially supported structurally | Parent has possible scenarios; actual daily day types absent |
| 8. Insufficient-data detection | Partially supported as architecture | Deterministic status is feasible, but sufficiency thresholds are unapproved |
| 9. Atypical-day detection | Unsupported without new input | Must be user-declared; must not infer illness/travel |
| 10. Automatic EnergyStart change | Unsafe for automatic implementation | Explicitly disabled; no adjustment policy/safety screen |
| 11. Automatic macro change | Unsafe for automatic implementation | Would propagate unapproved energy adjustment |
| 12. Automatic hydration change | Unsafe and out of scope | No sweat/environment/longitudinal policy; Phase2D1 must remain unchanged |
| 13. Change central scenario only | Unsupported policy | Technically modelable, but semantics/amount/acceptance unresolved |
| 14. New lower/central/upper set | Unsupported policy | Requires approved anchor, factors, rounding, provenance, versioning |
| 15. REDs/LEA screening | Unsafe for automatic implementation | NutriMind lacks clinical assessment and cannot diagnose REDs or calculate energy availability |
| 16. Maintenance calibration | Observation only potentially supportable | No automatic adjustment rule |
| 17. Weight-loss calibration | High-risk; observation only | Reduction remains disabled; body-composition focus risk |
| 18. Muscle-gain calibration | Observation only potentially supportable | No approved surplus/change rule |
| 19. Performance/recovery calibration | Observation only potentially supportable | Subjective/context summary, not performance prescription |
| 20. Habits/wellbeing calibration | Observation only potentially supportable | Neutral summary only; no medical conclusion |

No goal weakens safety. The safest cross-goal behavior is identical observation mechanics with goal displayed as context, not as a trigger for numeric change.

## 9. Trend-method comparison

No method is selected here.

| Method | Observations | Fluid-fluctuation resistance | Missing days | Explainability / deterministic testing | Overreaction risk | 14-day suitability |
|---|---|---|---|---|---|---|
| First-week mean vs second-week mean | Multiple comparable values in both halves; exact minimum unresolved | Moderate; means remain outlier-sensitive | Tolerates unequal counts poorly unless policy defines coverage | Very easy / excellent | Moderate-high with one outlier or biased measurement days | Plausible, but coverage and outlier policy required |
| Median first half vs median second half | Multiple values in both halves | Better resistance to a single outlier | Reasonably robust, but sparse halves can be misleading | Easy / excellent | Lower than means; can hide gradual movement | Strong candidate for observation, not approved |
| Linear-regression slope | Multiple dated observations spread across window | Sensitive to outliers, but uses actual dates | Can handle irregular dates mathematically | Medium complexity / excellent | High with sparse endpoints/outlier | Useful exploratory option; risks false precision |
| Exponentially weighted moving average | Repeated ordered measurements and approved decay | Smooths noise depending on coefficient | Handles gaps only with explicit time/decay semantics | Harder to explain / deterministic after parameters | Parameter-dependent and can overweight recent anomaly | Weak MVP fit until coefficient policy exists |
| Median of all available measurements | Any repeated values | Robust summary level | Tolerates missing entries | Very easy / excellent | Low, but it is not a direction/trend | Useful anchor/summary only, not trend |
| No trend when coverage insufficient | Approved sufficiency rule | Avoids false signal | Safest response to sparse/non-comparable data | Very clear / excellent | Lowest | Mandatory fail-closed branch; threshold unresolved |

Edge-case behavior requiring policy:

- no weight: subjective/context summary only, no weight trend;
- one weight: display one observation and `insufficient_data`, never a trend;
- two weights: difference is not automatically a trend; sufficiency decision required;
- identical repeated values: report observed stability only after coverage/precision validation, not proof of maintenance or health;
- single sharp outlier: retain/audit original entry, mark review/exclusion only by explicit deterministic rule or user correction;
- missing days: never impute silently; distinguish no entry from explicit unknown;
- units: choose canonical kg or store source unit plus explicit conversion/version; reject mixed/unknown units until resolved;
- impossible/non-finite values: reject entry, do not coerce or update summary;
- changed weighing conditions: exclude from comparable subset or label limitation according to approved rule;
- illness/travel/competition: user-declared atypical context; do not diagnose, and do not automatically erase data;
- duplicate date: reject or require explicit replace confirmation; never silently append two “daily” records.

The minimum observation count, half coverage, outlier handling, rounding, date boundary, and comparable-condition rules are blocking policy decisions.

## 10. Calibration-output levels

| Level | Product behavior | Safety/product assessment |
|---|---|---|
| 1 — Observation only | Coverage, entered observations, neutral weight/subjective summary, atypical-day context; no nutrition change | **Recommended MVP.** Still needs privacy/storage and trend-sufficiency policies |
| 2 — Adjustment suggestion | Suggest reviewing a central scenario; user must explicitly accept; original remains immutable | Future Phase 2D2B only. Requires adjustment magnitude, rounding, eligibility, safety recheck, provenance, undo/versioning and consent policies |
| 3 — Automatic recalculation | Directly changes EnergyStart/macros | High risk and **not recommended** without a separately approved clinical/product policy; prohibited for current phase |

Even Level 2 must not claim the observed weight trend represents fat change, energy deficiency/excess, or a measured energy requirement.

## 11. Proposed Phase 2D2A / 2D2B split

### Phase 2D2A — journal and observation

- create/edit/delete daily entries under a versioned local schema;
- link immutably to the originating Phase2D1 schema/version and a non-sensitive local parent identifier;
- validate dates, units, duplicates, and enums;
- report coverage, atypical contexts, and only policy-approved descriptive observations;
- statuses: collecting, insufficient data, ready for summary, observation complete, safety/suppression states;
- no EnergyStart, macro, hydration, or parent-result changes.

### Phase 2D2B — adjustment policy

- separate policy module/version and additional safety review;
- suggestion only as initial product level;
- explicit user acceptance, immutable before/after provenance, and ability to decline;
- no automatic application and no implementation until amounts, rounding, goals, sufficiency, contraindications, and specialist routing are approved.

This split is strongly recommended. It prevents storage/UX work from silently authorizing nutrition changes and allows evidence/engagement testing of observation-only UX first.

## 12. Proposed contracts

Illustrative only; names should be aligned with production style during implementation.

```ts
type CalibrationJournalV1 = {
  schemaVersion: "nutrimind.phase2d2a.journal.v1";
  journalId: string;                  // locally generated opaque id; generation policy required
  parent: {
    schemaVersion: "nutrimind.phase2d1.result.v1";
    localReference: string;           // no sensitive URL or server id
  };
  window: { startDate: LocalDate; endDate: LocalDate; timeZonePolicy: string };
  consent: { policyVersion: string; accepted: true };
  entries: CalibrationDayEntryV1[];   // unique, deterministically ordered dates
  storage: { createdDate: LocalDate; expiresDate: LocalDate; retentionPolicyId: string };
};

type CalibrationDayEntryV1 =
  | { status: "observed"; date: LocalDate; weight?: WeightObservation;
      dayContext?: DayContext; adherence?: AdherenceContext;
      subjective?: SubjectiveContext; atypical?: AtypicalContext }
  | { status: "no_observation"; date: LocalDate; reason?: "missed"|"prefer_not_to_answer"|"atypical" };

type CalibrationStatus =
  | "collecting" | "insufficient_data" | "ready_for_summary"
  | "observation_complete" | "adjustment_not_supported"
  | "specialist_review" | "minor_suppressed" | "invalid_input";

type CalibrationSummaryV1 =
  | { schemaVersion: "nutrimind.phase2d2a.summary.v1";
      status: "collecting"|"insufficient_data"|"ready_for_summary"|"observation_complete"|"adjustment_not_supported";
      parentReference: string; coverage: CoverageSummary;
      weightObservation?: NumberFreeOrPolicyApprovedTrend;
      contextSummary: ContextSummary; atypicalDates: LocalDate[];
      warnings: CalibrationWarning[]; appliedPolicy: PolicyDescriptor;
      adjustmentApplied: false }
  | { schemaVersion: "nutrimind.phase2d2a.summary.v1";
      status: "specialist_review"|"minor_suppressed"|"invalid_input";
      issues: Issue[]; nextStepCode: string; adjustmentApplied: false };
```

Suppressed variants must not embed calculated Phase2D1, kcal, macro grams, ml, adjustment amounts, or numeric nutrition traces. A calculated parent can be referenced, not copied into the journal. Summary assembly receives an already validated compatible parent; missing/incompatible parents fail closed.

Migration behavior: unknown major/schema versions are read-only rejected, never guessed. A future explicit migration must be pure, version-to-version, tested, and retain source provenance. Corrupt data are quarantined/ignored with a clear recovery choice, never partially normalized.

Clear/delete: one explicit `Удалить журнал` action with confirmation, deletion of journal plus derived summary, and verifiable empty state; it must not delete unrelated Phase2D1 data unless the user selects a separately worded option. Retention: expiry duration and whether user may extend/export are unresolved; expired data must not silently participate.

Export/import, if later approved: JSON with media type, schema version, checksum for accidental corruption (not authenticity), parent version, and no executable content. Import validates size, schema, dates, enums and duplicates before any write; it never trusts a checksum as proof of origin.

## 13. Safety and fail-closed behavior

- A journal may start only from a compatible adult calculated Phase2D1 result and the existing allowed safety state.
- Journal creation does not re-run or weaken Phase 1, and it does not prove safety for the next 14 days.
- At every resume/summary, verify journal schema, parent availability/version, adult eligibility marker, consent version, and expiry before showing any nutrition-linked observation.
- If the original status was non-calculated, journal-linked numeric observation/calibration is unavailable. Do not turn `blocked`, `specialist_review`, `minor_suppressed`, or `invalid_input` into calculated.
- If safety context changes, pause summary/adjustment. Because no approved longitudinal safety questionnaire exists, offer re-completion of the baseline questionnaire or specialist discussion; do not invent a medical screen.
- A newly entered “concerning” subjective value can produce neutral pause/review wording only if its enums and routing are approved. It cannot diagnose REDs, disordered eating, low energy availability, hormone disturbance, dehydration, or disease.
- “No concerning values entered” must never be presented as confirmation of health.
- Corrupt journal, impossible values, future dates, duplicates, unknown units/enums, unsupported version, or missing parent fail closed to `invalid_input`/recovery without numeric nutrition output.
- If the journal exists but Phase2D1/session data were cleared, do not reconstruct the parent from journal fields. Require a compatible parent/restart or present a standalone number-free export/delete recovery state.
- If an age/date contradiction suggests the parent was invalid or the person may be a minor, suppress all nutrition numbers and route to questionnaire correction; do not calculate age from an unapproved date-of-birth field.
- Allergies and goals never bypass safety. Phase2B–2D1 historical results remain immutable.

## 14. Privacy and data lifecycle

Weight, hydration context, subjective wellbeing, adherence, and training observations are sensitive personal data even without names. Required controls:

1. Journal-specific explicit consent before durable storage, separate from the existing informational questionnaire consent.
2. Plain notice that data stay in this browser profile, may be visible to other device/profile users, do not sync, and can disappear if browser data are cleared.
3. Persistent `Удалить журнал` control and clear confirmation of what is removed.
4. Approved automatic expiry/retention and visible expiry date; implementation is blocked until duration is chosen.
5. Versioned schema, atomic writes where possible, deterministic corruption recovery, quota/write verification, and no false save confirmation.
6. Private/incognito warning: storage may be unavailable or erased when the session closes.
7. No analytics/event payload containing entries, no URL/query/hash data, no logs, no server requests, no demo import, and no hidden sync.
8. Client-only storage boundary and CSP-compatible code; persistence modules must not be imported into server execution paths.
9. Export warning that a downloaded file is outside application control; import is untrusted input.
10. No cross-device availability claim. Shared-device privacy cannot be solved by local storage alone.

Blocking decisions: storage engine; consent copy/version; retention/expiry; shared-device disclosure; clear scope; export availability; corruption/quota behavior; local identifier generation; and whether privacy requirements permit durable browser storage at all.

## 15. Evidence review

Only primary research, position stands, and consensus statements were used.

| Source | What it supports | What it does not support / NutriMind limit |
|---|---|---|
| [IOC REDs consensus, 2023](https://bjsm.bmj.com/content/57/17/1073), DOI `10.1136/bjsports-2023-106994` | REDs is complex, multisystem and requires clinical assessment/risk stratification; athlete health/performance context matters | A consumer 14-day journal cannot diagnose/exclude REDs, calculate energy availability, or replace IOC clinical tools. Primarily sport/athlete context |
| [IOC body-composition best practices, 2023](https://bjsm.bmj.com/content/57/17/1148), DOI `10.1136/bjsports-2023-106812` | Body-composition practices can create health/performance and psychosocial risks; assessment needs purpose, qualified support, privacy and careful communication | Does not validate frequent weight focus or an automatic consumer adjustment algorithm. Athlete-focused; supports no-shame/private design and minimal body-composition emphasis |
| [ISSN diets and body composition position stand, 2017](https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0174-y), DOI `10.1186/s12970-017-0174-y` | Diet approaches vary; body-composition methods have limitations; long-term adherence and context matter | Does not validate a 14-day diagnostic/calibration window, a universal diet, or NutriMind adjustment amounts. Mostly adult body-composition/sport application |
| [NATA safe weight loss/maintenance position statement, 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC3419563/), DOI `10.4085/1062-6050-46.3.322` | Unsafe restriction/dehydration and weight pressure can harm health/performance; goals should be gradual, individualized and professionally supported | Its numeric recommendations are not adopted here. It does not validate automatic app adjustment or generalize every sport recommendation to all users |
| [Garthe et al., elite athletes randomized to two weight-loss rates](https://pubmed.ncbi.nlm.nih.gov/21558571/), DOI `10.1123/ijsnem.21.2.97` | In a small elite-athlete sample under structured restriction/training, different rates produced different body-composition/performance outcomes | Does not establish NutriMind thresholds, a 14-day algorithm, safety for general users, or inference from scale trend alone; small athlete-specific sample |
| [Madigan et al. self-weighing RCT, 2014](https://pubmed.ncbi.nlm.nih.gov/25301251/), DOI `10.1186/s12966-014-0125-9` | Direct evidence that giving adults scales/instructions is feasible to test | Daily self-weighing alone did not significantly improve weight loss; does not support universal benefit or feedback logic. Adults with obesity, short follow-up |
| [Thomas et al. smart-scale randomized pilot, 2017](https://pubmed.ncbi.nlm.nih.gov/29259794/), DOI `10.1002/osp4.132` | Smart scale plus tailored feedback increased weighing frequency and one interim responder proportion | Mean weight-loss differences were not significant; bundled commercial program/feedback prevents attribution to a NutriMind algorithm. Adults with overweight/obesity |
| [SMARTER randomized trial, 2022](https://pubmed.ncbi.nlm.nih.gov/34898011/) | Digital self-monitoring can be implemented at scale; provides direct comparison of tailored daily feedback versus monitoring | Tailored feedback did not improve mean weight change versus monitoring at six months. Does not validate a universal feedback algorithm or athlete calibration |
| [NULevel RCT, 2019](https://pubmed.ncbi.nlm.nih.gov/31063507/), DOI `10.1371/journal.pmed.1002793` | Connected weighing and behavioral self-monitoring can affect engagement/process outcomes | No weight-maintenance difference at 12 months; cannot justify automatic recalculation. Adults after prior weight loss, not athletes/general wellness |

Evidence conclusions:

- Fourteen days is a NutriMind product observation window, not a recognized diagnostic period.
- Body-weight trend is not body-fat change; short-term weight reflects water, glycogen, gut contents, conditions, and measurement error.
- NutriMind cannot diagnose or exclude REDs/low energy availability.
- Evidence that self-monitoring can change engagement does not prove one feedback algorithm for all users; randomized results are mixed.
- Body-composition overfocus and frequent weighing can be harmful or inappropriate for some athletes/users; weight entry must be optional, private, neutrally framed, and suppressible.
- None of these sources approves an automatic kcal amount, threshold, smoothing method, minimum count, goal rate, or specialist-referral cutoff for this product.

## 16. Proposed UX

Recommended structure, not implementation:

- entry point after an eligible `/result`: separate route such as `/calibration`, not a tenth section of the baseline questionnaire;
- consent/privacy screen before durable storage;
- day counter showing window position and completed entries without a punitive streak;
- one short daily form with optional sensitive fields and explicit `Не знаю / Не хочу отвечать`;
- save confirmation only after verified persistence;
- missing-day state without shame or retroactive fabrication;
- visible clear-journal action;
- summary separated from current Phase2D1 report and containing no red/green weight judgement or automatic success/failure label;
- keyboard-native controls, semantic labels/errors, mobile cards at `390×844`, normal word wrapping and no horizontal overflow.

Suggested Russian wording:

- Start: `Начать 14-дневное наблюдение` / `Записи помогут увидеть контекст двух недель. Они не являются диагностикой и не меняют рекомендации автоматически.`
- Privacy: `Записи сохраняются только в этом браузере на этом устройстве. Другие пользователи этого профиля браузера могут получить к ним доступ. Данные не синхронизируются и могут исчезнуть при очистке браузера.`
- Insufficient data: `Пока недостаточно сопоставимых записей для нейтрального итога. Можно продолжить наблюдение без попытки угадать пропущенные значения.`
- Neutral trend: `За период виден описательный тренд измерений. Он не означает изменение жировой массы и не является медицинским выводом.`
- Atypical days: `Некоторые дни отмечены как нетипичные. Они показаны отдельно и не интерпретируются автоматически.`
- Completion: `Наблюдение завершено. Итог описывает введённые данные и не меняет расчётный план автоматически.`
- No automatic correction: `Автоматическая коррекция энергии и КБЖУ для этих данных не поддерживается.`
- Specialist: `Если изменения самочувствия или питания вызывают беспокойство, стоит обсудить их с квалифицированным специалистом. NutriMind не устанавливает причину и не ставит диагноз.`
- Save: `Запись сохранена на этом устройстве.` / failure: `Не удалось сохранить запись. Данные не были отмечены как сохранённые.`
- Clear: `Удалить весь журнал наблюдения на этом устройстве? Это действие нельзя отменить.`

## 17. Test matrix

| Case | Expected deterministic assertion |
|---|---|
| Adult ordinary | Eligible D2A journal only from calculated parent; observation-only |
| `fitness_2_4_week` | Remains ordinary; actual training requires daily entry, not inference |
| Amateur / competitive / professional | Same journal mechanics; level does not change trend method |
| Every goal | Same observation algorithm; no goal-triggered adjustment |
| Minor | `minor_suppressed`; no kcal, grams, ml or calculated parent embedded |
| Blocked / specialist_review / invalid | Journal-linked nutrition summary suppressed; stable next-step code |
| Missing parent Phase2D1 | Fail closed; no reconstruction from journal |
| Unsupported old parent/journal schema | Reject without migration guess |
| Malformed journal | Quarantine/recovery state; no partial summary |
| No entries | `collecting` or `insufficient_data` by approved date policy; no trend |
| One entry | Observation shown, no trend |
| Sparse entries | Explicit insufficient coverage; no imputation |
| Complete entries | Deterministic coverage and policy-selected observation method |
| Subjective entries without weight | Number-free subjective/context summary; no weight trend |
| Weight only | Weight observation summary only; no adherence/wellbeing claim |
| Duplicate date | Reject or explicit replace flow; no silent duplicate |
| Dates outside window / future | Invalid entry; no summary mutation |
| Impossible/non-finite weight | Reject; preserve prior valid journal atomically |
| Unit mismatch | Reject or explicit approved conversion; never silently mix |
| Repeated equal weights | No health/success conclusion; method deterministic |
| Single outlier | Approved rule applied with provenance; no silent deletion |
| Missing dates | No implicit zero/normal value |
| Changed measurement conditions | Limitation or excluded comparable subset per policy |
| Atypical illness/travel/competition | User-declared marker retained; no diagnosis or automatic adjustment |
| Planned vs actual day type | Compared only when both supplied; no inference from parent |
| Browser storage failure/quota/private mode | Save fails visibly; no success state or in-memory-only deception |
| Clear journal | Journal and derived summary removed; unrelated parent retained unless separately selected |
| Expiry | Expired journal excluded deterministically; export/delete/restart UX per policy |
| Corrupted local data | Fail closed; no crash or numeric output |
| Export/import | Size/schema/checksum/enums/dates validated before atomic write; untrusted file rejected |
| Parent cleared after journal start | Pause; standalone delete/export recovery only |
| Safety context changed | Pause and re-route; no invented medical screening |
| Phase2D1 immutability | Deep-equal parent before/after all D2A operations |
| Hydration/macros unchanged | No modified/combined kcal, grams, or ml fields |
| No automatic adjustment | Contract lacks applied adjustment; `adjustmentApplied=false` |
| Suppressed serialization | Recursive assertion: no kcal, macro grams, ml, numeric nutrition trace or calculated parent |
| Determinism | Same validated journal + parent + policy version → deep-equal summary |
| Clear/existing-tab concurrency | No lost update; conflict behavior deterministic |
| Mobile/accessibility | 390×844 no overflow; labels, errors, focus and keyboard controls work |

## 18. Expected implementation files

No files are changed by this audit except this document.

### Phase 2D2A expected scope

New modules/routes (illustrative names):

- `core/calculation/calibration-observation.ts` — pure coverage/observation summary only;
- `core/calculation/calibration-types.ts` — journal/entry/summary contracts;
- `core/calculation/calibration-result-schema.ts` — strict runtime validator;
- `core/calculation/calibration-policy.ts` — approved window/sufficiency/trend policy metadata;
- `core/storage/calibration-journal.ts` — client-only persistence interface;
- `core/storage/indexeddb-calibration-journal.ts` or selected storage adapter;
- `app/calibration/page.tsx` — journal/summary route;
- `app/calibration/CalibrationClient.tsx` — client-only interaction boundary;
- `tests/nutrimind-calibration.test.mjs` — pure contract/policy matrix;
- `tests/nutrimind-calibration-storage.test.mjs` — persistence/migration/corruption/quota tests;
- `PHASE_2D2A_REPORT.md`.

Expected existing changes after authorization:

- `core/calculation/index.ts`, `core/index.ts` — public exports;
- `core/calculation/types.ts` only if shared base types are intentionally reused;
- `app/result/page.tsx` — eligible entry point only;
- `app/globals.css` — matching responsive styles;
- `PHASE_2_ARCHITECTURE.md` — implemented boundary;
- possibly a dedicated privacy text/policy resource and CSP configuration only if required and separately reviewed.

The nine-section questionnaire and Phase2B–2D1 calculation modules should not change merely to add D2A.

### Phase 2D2B expected scope

- `core/calculation/calibration-adjustment-policy.ts` — separately approved eligibility/amount/rounding rules;
- `core/calculation/phase2d2b.ts` — suggestion assembly, not direct mutation;
- `core/calculation/phase2d2b-result-schema.ts`;
- explicit acceptance/decline UI, provenance display and tests;
- additional safety-review module/specification;
- `PHASE_2D2B_REPORT.md` and architecture update.

Phase2D2B must be a later task. It must not rewrite historical Phase2D1 or silently replace central/lower/upper scenarios.

## 19. Blocking policy decisions

1. Storage option and whether `sessionStorage only` may change; IndexedDB versus localStorage requirements.
2. Journal-specific consent text/version and shared-device/private-mode disclosure.
3. Retention duration, expiry semantics, clear scope, and export/import availability.
4. Window start/end, local-date/time-zone and device-clock behavior.
5. Exact daily fields, enums, optionality, `unknown`/missing semantics and edit rules.
6. Weight units, precision, acceptable range, comparable conditions and conversion behavior.
7. Minimum observation/coverage policy—no count is approved by this audit.
8. Trend method, outlier policy, missing-day behavior and rounding/presentation.
9. Atypical-day categories and whether/how they affect a comparable subset.
10. Subjective signal scales and non-medical pause/review routing; no thresholds are approved.
11. Parent identifier/hash/canonical serialization without exposing sensitive data.
12. Corruption, quota, concurrency, migration, backup and recovery behavior.
13. Whether D2A may show any numeric weight-derived trend or only descriptive coverage in the first MVP.
14. Phase2D2B eligibility, suggestion amount, maximum change, goal behavior, central/scenario semantics, explicit acceptance and undo/versioning.
15. Specialist-referral wording and routing, without diagnostic thresholds or a new medical screen.
16. Governance for body-composition focus and users for whom weight tracking should be hidden/disabled.

## 20. Explicit exclusions

- Implementation of any journal, persistence, route, UI, calculation, migration, export/import, or adjustment.
- Changes to the nine-section questionnaire or its approved specification.
- Automatic EnergyStart, calorie, macro, hydration, deficit, surplus, or scenario changes.
- Any kcal adjustment amount, weight-change threshold/target rate, minimum weighing count, smoothing coefficient, hunger/fatigue/performance threshold, or referral cutoff.
- REDs/low-energy-availability score, diagnosis, exclusion of disease, energy-availability or fat-free-mass formula.
- Menstrual-cycle, pregnancy, diagnosis, medication, hormone, or disease tracking.
- Inference of body-fat change from scale weight; body-composition success/failure labels.
- Server/account persistence, authentication, analytics, tracking, network submission, or cross-device sync.
- Demo report as production input; sensitive URL parameters; hidden requests.
- Rewriting or mutating historical Phase2B, Phase2C1, Phase2C2, or Phase2D1 results.
- Commit, push, deployment, or commencement of Phase 2D2A/2D2B.

## 21. Recommended MVP

**Preferred, conditional MVP:** Phase 2D2A with an approved on-device IndexedDB journal, explicit consent, short defined retention, clear-all, optional weight, categorical context signals, strict parent/schema validation, and **Level 1 observation only**. First release should favor coverage and transparent missing/atypical-day context; a numeric trend should appear only if a later policy selects a method and sufficiency rule. Energy, macros, hydration and Phase2D1 remain byte-for-byte unchanged.

**Fallback if storage policy remains session-only:** a single retrospective day-14 summary entry. It must be labelled as recall-based, cannot claim daily coverage, and should not produce an automatic weight trend or nutrition adjustment.

Do not implement Phase 2D2B alongside the journal. Use D2A to validate privacy, persistence reliability, burden, accessibility, and neutral observation language before separately considering an explicit adjustment suggestion. Level 3 automatic recalculation is not recommended.
