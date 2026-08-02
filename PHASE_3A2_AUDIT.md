# Phase 3A2 — training-relative meal placement audit

Status: architecture, product, safety and evidence audit only. No production behavior is implemented.

## 1. Executive summary

Current `selections[5]` is not sufficient to place meals before or after training. Production UI exposes only three index values (`0`, `1`, `2`) labelled `Утром`, `Днём`, `Вечером`; the answer is preselected, shown to every profile, submitted, then discarded by the questionnaire adapter. It never reaches Phase 2D1, Phase 3A, session storage, or `/meal-structure`. The similarly named JSON field is schema-only and athlete-only.

The safest useful MVP is Model C: on `/meal-structure`, after the existing three required Phase 3A1 choices and plan creation, offer an optional, unselected training-boundary control for a single-training day. The user chooses before the first eating occasion, between any two adjacent occasions, or after the last. The UI then adds order-only labels; it does not assign clock times, intervals, physiological windows, foods, snacks, or macro changes. Keep the selection in React state, do not create or extend a result/session schema, and leave Phase 3A1 fully usable when timing is absent, invalid, cancelled, or inapplicable. Exclude rest, ordinary `typical_day`, and `double_training` from the MVP.

## 2. Repository confirmation

| Check | Observed at audit start |
|---|---|
| Repository root | `C:/Projects/nutrimind` |
| Branch | `main` |
| HEAD | `dac0b36ac887c05eb41d069e677ae815700435ef` (exact required commit) |
| `origin/main...main` | `0 0` |
| Primary worktree | `C:/Projects/nutrimind` |
| Other worktree | `C:/Projects/nutrimind-original`, detached and not used |
| Merge/rebase/cherry-pick | None |
| Initial working tree | Clean |

The requested `PHASE_2D2A_REPORT.md` and `core/calculation/phase2c1.ts` do not exist at this HEAD. Their actual counterparts are `PHASE_2D2_REPORT.md` and `core/calculation/phase2c.ts`; both were reviewed. This is naming drift, not permission to rename files.

## 3. First-pass factual inventory

This section records facts only.

1. `selections[5]` production literals are integer indexes `0`, `1`, `2`, displayed as `Утром`, `Днём`, `Вечером` under `Когда проходит тренировка?` / `Обычное время`.
2. It appears required (`*`), but `answers` starts as `Array(9).fill(0)`, so the UI cannot distinguish explicit choice from untouched default `0`.
3. The step is unconditional and is shown to athlete and general-user branches.
4. Ordinary profiles can submit it.
5. `fitness_2_4_week` is an ordinary activity, so it can submit it.
6. Athletes can submit it.
7. Submit includes the full `selections` array, so the raw answer is passed to `runQuestionnairePipeline`.
8. `adaptQuestionnaireAnswers` does not map index 5; it is discarded.
9. Phase 3A receives only the Phase2D1 parent and normalized `selections[4]`; timing does not reach it.
10. Neither `nutrimind.phase2d1.result` nor `nutrimind.phase3a.result` contains `selections[5]`.
11. Schema-only `trainingTime` uses `morning | day | evening` and is visible only for `athlete`; production index 1 corresponds in meaning to schema `day`, not `daytime`. Demo data has `evening`, but demo data is not production input. There is no implemented timing legacy vocabulary.
12. Missing/empty/unknown values currently have no timing-specific behavior because the adapter ignores all of them. A missing array slot is unavailable; empty or unknown non-empty values are likewise silently discarded and do not invalidate the current numeric result.
13. The labels describe a coarse typical part of day. They are not exact time; they do not identify the first versus only session; they cannot safely identify either session of a double day.

Exact schema-only section 6 also declares `preTrainingMeal: yes | sometimes | no` and `postTrainingMealTiming: within_60 | 60_90 | later_than_90`, but production UI neither renders nor submits them. General-user schema fields are instead `hardestDayPeriod` and `unplannedSnacks`, confirming that production's universal training wording does not faithfully implement the schema branches.

## 4. Exact selections[5] values

| Production index | Exact UI label | Schema-like interpretation | Production caveat |
|---:|---|---|---|
| `0` | `Утром` | `morning` | Preselected by initialization; not proof of confirmation |
| `1` | `Днём` | `day` | No normalized production enum exists |
| `2` | `Вечером` | `evening` | No normalized production enum exists |

The fieldset legend is `Обычное время *`; title is `Когда проходит тренировка?`; intro is `Это помогает понять доступность питания до и после нагрузки.` The intro overstates current capability because availability is not collected.

## 5. Current data-flow map

```text
questionnaire UI selections[5]
  -- passed raw --> submit payload / runQuestionnairePipeline
  -- discarded --> questionnaire adapter
  -- unavailable --> Phase2D1
  -- unavailable --> Phase3A
  -- unavailable --> sessionStorage
  -- unavailable --> /meal-structure
```

No normalization occurs. By contrast, `selections[4]` is separately normalized by `normalizeCurrentMealPattern` and stored inside Phase3A. That path must not be mistaken for timing support.

## 6. Capability matrix

| Question | Status | Reason |
|---|---|---|
| Which existing meal is before training? | Unsupported | Part of day and meal order are not linked |
| Which existing meal is after training? | Unsupported | Same |
| Was training fasted? | Unsupported | Production does not collect it |
| Full meal before training exists? | Unsupported | No boundary or meal-time input |
| Full meal after training exists? | Unsupported | No boundary or food-availability input |
| Time from meal to training | Unsupported | No clocks or interval |
| Time from training to next meal | Unsupported | No clocks or interval |
| Value refers to session 1 or 2 | Unsupported | One ambiguous part-of-day value |
| Interval between two sessions | Unsupported | Not collected |
| Food available after training | Unsupported | Not collected |
| Individual pre-exercise tolerance | Unsupported | Not collected; GI journal is separate and prohibited |
| Coarse part-of-day context exists in raw UI | Partially supported | Collected but defaulted, branch-ambiguous, and discarded |
| User-selected boundary in future local UI | Supported by existing meal order | Only after an explicit new interaction; not derivable from `selections[5]` |

## 7. Central sufficiency finding

No. Current `selections[5]` deterministically supports none of the eleven requested placement, fasting, interval, availability, or tolerance conclusions. Its only partial capability is a coarse contextual hint after strict branch-aware normalization and explicit confirmation. `Утром`, `Днём`, and `Вечером` must never be converted into invented clock times or automatic meal boundaries.

## 8. Architecture-model comparison

Scale: good / mixed / poor. “Deterministic” means deterministic from available confirmed inputs.

| Model | Factual support | False-assumption risk | Burden / mobile / a11y | Determinism | Ordinary / athlete / day parts | Double | Compatibility / fail-closed / 3B |
|---|---|---|---|---|---|---|---|
| A. Auto-map part of day | Poor | Very high | Low / easy / easy | False determinism | Poor for all; meal schedules vary | Unsafe | Regression-prone; cannot fail closed; weak base |
| B. Suggest then confirm | Mixed | Medium: suggestion anchors user | Medium / acceptable / native select possible | Yes only after confirmation | Usable, but universal ordinary wording is misleading | Still under-specified | Compatible if optional; more policy/tests |
| C. User selects boundary | Strong from rendered meal order | Low | Medium / good / native select or radio group | Yes | Suitable for explicit single training regardless of morning/day/evening | Exclude in MVP | Backward compatible, fail-closed, reusable by 3B |
| D. Context only | Strong | Low | Low / best / simple text | Does not produce relations | Safe for all as text after valid normalization | Safe but minimally useful | Best compatibility; no placement capability |
| E. New questionnaire input | Potentially strong after implementation | Low | Higher / longer questionnaire / manageable | Yes | Can model branches correctly | Requires two-session design | Good future option, but outside present boundary |

Model C is recommended. Model D alone is safe but does not accomplish placement. B adds an unjustified machine suggestion; A is rejected. E is unnecessary for the narrow MVP and would change the questionnaire.

## 9. Meal-structure compatibility

For any ordered structure with `N` occasions, valid boundaries are `before first`, each of the `N-1` adjacent gaps, and `after last`.

| Structure | Exact order and boundaries | Resulting relation semantics |
|---|---|---|
| `three_meals` | before `meal_1`; `meal_1|meal_2`; `meal_2|meal_3`; after `meal_3` | Interior: preceding meal `До тренировки`, following meal `После тренировки`; edge: only following or preceding relation exists |
| `three_meals_plus_snack` | before `main_1`; `main_1|main_2`; `main_2|snack`; `snack|main_3`; after `main_3` | Treat `snack` as an ordinary existing occasion in order; never auto-label it as training food |
| `four_occasions` | before `meal_1`; three adjacent gaps; after `meal_4` | Same generic rule |

Training before the first occasion legitimately yields only a following meal; training after the last yields only a preceding meal. No missing counterpart is invented and no additional meal/snack is created. Phase 3A1 weights and allocations remain unchanged.

## 10. Event-relative label semantics

Preferred order-only language:

- `Тренировка до первого приёма` and `Тренировка после последнего приёма` describe edge order.
- `Тренировка проходит между этими приёмами` describes an interior boundary.
- `Приём пищи перед тренировкой` and `Следующий приём после тренировки` are acceptable only for the immediately adjacent existing occasions and with the order-only explanation.
- Short `До тренировки` / `После тренировки` tags are acceptable beside those adjacent occasions.
- `Обычный приём пищи` is unnecessary and may imply other meals are special; leave unrelated cards unlabelled.

All labels must be accompanied by: `Это показывает последовательность событий, а не точные часы и не обязательное окно питания.` Avoid `предтренировочный`, `восстановительный`, `анаболическое окно`, `оптимальное время`, `обязательный приём`, minute targets, and judgments such as “поздно” or “слишком рано”.

## 11. Morning/daytime/evening analysis

All three real values have the same policy: they may be a contextual hint only after future strict, branch-aware normalization; they must not filter or preselect boundaries. Contradictions (`утром` + after meal 2; `вечером` + before meal 1; `днём` + after last) are possible because meal cards have no clock semantics. Therefore use no hard restriction and no warning based solely on apparent contradiction. After explicit boundary choice, that choice governs labels; the coarse/stale context may remain visibly separate or be ignored. A changed routine must be handled by changing/cancelling the local choice, never by a hidden default.

## 12. Double-training analysis

Current system knows athlete `doubleTrainingDays: boolean`, one `typicalSessionMinutes`, and (raw, discarded) one part of day. It lacks session 1 time, session 2 time, separate durations, recovery interval, and meal availability between sessions. Automatic two-boundary placement is prohibited.

| MVP option | Wrong-plan risk | UX complexity | Decision |
|---|---|---|---|
| A. Exclude timing for double day | Lowest | Lowest | Safe now |
| B. Mark one unnamed training | High ambiguity | Medium | Reject |
| C. Ask for two boundaries | Low if fully validated | High; collision/order policy needed | Future phase |
| D. Number-free limitation only | Lowest | Low | Use explanatory state |
| E. Defer double support | Lowest | Lowest | Recommended product decision |

MVP combines A/D/E: no selector or labels for `double_training`; explain that two separately placed sessions are not supported. Never duplicate the single value or any meal.

## 13. Missing and unknown input policy

| State | Timing capability | Phase 3A1 |
|---|---|---|
| Missing / empty timing context | Unavailable; no labels | Remains calculated and usable |
| Known `0/1/2` | Context only; no boundary | Remains usable |
| Unknown non-empty / unsupported legacy | Timing invalid with proposed stable code `QUESTIONNAIRE_UNSUPPORTED_TRAINING_TIME_VALUE`; no labels | Must remain usable if parent is otherwise valid |
| Stale context | Ignore after explicit local choice; no automatic inference | Unchanged |
| Malformed/stale Phase3A parent | Existing neutral “complete questionnaire again” behavior; no timing UI | No bypass or best effort |

This is partial capability: timing failure must not convert a valid adult Phase3A1 result to whole-result `invalid_input`. The proposed error belongs to a future timing capability boundary, not necessarily the numeric parent schema.

## 14. Schema options

| Option | Migration / old sessions | Regressions and safety | Testability / Phase 3B | Assessment |
|---|---|---|---|---|
| 1. Extend `nutrimind.phase3a.result.v1` | Changing v1 shape breaks strict reader or silently changes contract | Risks `/result`, `/meal-structure`, non-calculated union | Testable but coupled | Reject |
| 2. New `nutrimind.phase3a2.result.v1` key | Explicit version but new lifecycle, parent binding, stale-session and privacy policy | Larger surface; unnecessary for presentation-only metadata | Strong future reuse | Defer |
| 3. React state only | No migration; reload clears selection | Narrowest, cannot bypass parent safety, no URL/server data | Deterministic UI tests; later persistence can be versioned | Recommend MVP |
| 4. Timing context in Phase3A, relation in state | Requires changing current Phase3A schema/session | Couples optional discarded input to valid numeric payload | Moderate | Reject now |

No new numeric schema is justified because no numbers change. Metadata without a valid calculated parent must never create timing UI. Persistence is not required for an optional annotation; reload intentionally returns to no selection.

## 15. UI-flow options

| Flow | Assessment |
|---|---|
| A. Fourth selector on `/meal-structure` | Viable, but calling it “4” can imply it is required alongside three Phase3A1 inputs |
| B. Optional step after plan exists | Recommended; preserves existing build action and makes independence clear |
| C. Toggle “show relative” | A boolean cannot capture a boundary and invites hidden default |
| D. Separate route | Unnecessary navigation and direct-route safety surface |
| E. Automatic labels | Rejected; unsupported inference |

Recommended copy: `Расположить тренировку относительно приёмов`; `Укажите, между какими приёмами обычно проходит тренировка`; `Это показывает последовательность событий, а не точные часы и не обязательное окно питания`; `Суточные и meal-level КБЖУ не изменены`. Use a native labelled select or radio group, an explicit empty option, and a clear cancel action. No auto-selection.

## 16. Evidence review

| Source | Population/context | Supports | Does not support / applicability limits |
|---|---|---|---|
| [Academy/DC/ACSM joint position, 2016](https://pubmed.ncbi.nlm.nih.gov/26891166/), DOI `10.1249/MSS.0000000000000852` | Athletes across training/competition contexts; position statement | Nutrition type, amount and timing can matter and should match event/training context | No universal mapping from part of day to a meal boundary; no evidence for this UI algorithm or ordinary-user benefit |
| [ISSN nutrient timing position, 2017](https://pubmed.ncbi.nlm.nih.gov/28919842/), DOI `10.1186/s12970-017-0189-4` | Healthy exercising adults, especially trained people; position stand | Daily protein is primary; rapid recovery and prior-meal context can alter timing relevance | Does not justify a mandatory “anabolic window”; size/timing of the pre-exercise meal changes post-exercise need; simple ordering cannot prescribe intake |
| [Burke et al., carbohydrates for training and competition, 2011](https://pubmed.ncbi.nlm.nih.gov/21660838/), DOI `10.1080/02640414.2011.585473` | Athletes, especially performance and high-intensity/endurance settings; review/consensus-oriented guidance | Carbohydrate availability and refuelling depend on exercise cost and recovery context | No one-size-fits-all meal boundary, no transfer from morning/day/evening to exact intervals, no automatic snack |
| [Craven et al. systematic review/meta-analysis, 2021](https://pubmed.ncbi.nlm.nih.gov/33507402/), DOI `10.1186/s40798-020-00297-0` | 29 trials/246 participants, short recovery up to 8 h | Short recovery between strenuous sessions is a distinct carbohydrate-refuelling scenario | Does not support treating every session or double day alike; does not establish a generic UI boundary; protein co-ingestion did not outperform adequate carbohydrate in the reviewed comparison |
| [SDA/Ultra Sports Science Foundation joint statement, 2025](https://doi.org/10.1007/s40279-025-02186-6) | Exercising populations with exercise-associated GI perturbations; practitioner statement | GI tolerance is individualized and context-dependent | A single part-of-day answer cannot establish tolerance, diagnosis, safe food, or timing window; simple ordering is at most organizational context |

Evidence conclusion: adequate total daily intake remains the foundation. Timing depends on the exercise, prior intake, recovery interval, and individual tolerance. Duration is not clock placement; part of day is not a pre/post interval. Evidence does not establish one universal meal boundary or guarantee improved performance/recovery. An event-order UI is defensible only as user-authored organization, not as a nutrition recommendation.

## 17. Safety and privacy

- Only a structurally valid calculated adult Phase3A parent may show the optional control. Minor, `blocked`, `specialist_review`, `minor_suppressed`, and `invalid_input` receive no timing plan.
- Direct `/meal-structure` access retains the existing strict session validation; no timing state exists without it.
- Allergies/celiac rules are unchanged; no products, menus, journal input, exact clocks, medical context, analytics, server request, or URL serialization is introduced.
- Phase2D1, Phase3A, hydration and all meal-level/daily totals remain byte-for-byte inputs to display; timing code must not call allocation or mutate plan values.
- React-only metadata avoids copying the parent numeric payload or sensitive answers. Non-calculated results need no new numeric schema.

## 18. Adversarial review questions

| # | Finding |
|---:|---|
| 1 | No exact schedule is inferred; user selects order only. |
| 2 | Edge boundary before first meal explicitly permits no pre-training meal. |
| 3 | Edge after last and order-only wording avoid assuming immediate food. |
| 4 | Snack is never automatically selected or specially treated. |
| 5 | Phase3A1 grams and allocation helper are untouched. |
| 6 | Prohibited “window/optimal” language is excluded. |
| 7 | Rest day has no timing control. |
| 8 | Only actual athlete single-training day is eligible; ordinary `typical_day` is not relabelled. |
| 9 | Double day is excluded; one value is never duplicated. |
| 10 | Optional timing failure never invalidates valid Phase3A1. |
| 11 | Empty initial state and explicit selection/cancel prevent hidden defaults. |
| 12 | React state adds no durable sensitive data. |
| 13 | Choice does not depend on goal or athlete level. |
| 14 | Copy makes no medical/performance guarantee. |
| 15 | Exact totals remain equal because timing is annotation-only. |
| 16 | User explanation fits the four approved short sentences. |
| 17 | Boundaries, labels, exclusions, and invariants are deterministic and testable. |
| 18 | Context-only display is narrower but not sufficiently useful; React-only explicit boundary is the narrowest useful placement. |

## 19. Adversarial review outcome

The preliminary recommendation considered preserving normalized timing context in the Phase3A session and offering timing for any displayed training-like context. The review removed both: persistence creates needless schema/staleness coupling, and an ordinary `typical_day` is not a production training event. Final MVP uses local state only, supports only the existing athlete `training` day, and excludes double/rest/typical days. It also changed apparent context contradictions from warnings to no restriction because meal cards lack clock semantics.

## 20. Final contradiction check

Checked pairs and resolution:

- UI versus inputs: boundary is explicitly collected in the proposed UI; it is not inferred from missing pipeline data.
- Contract versus pipeline: React state stores only the boundary the UI just collected; no unavailable timing field is claimed.
- Double-day policy versus data: absence of two times/intervals results in exclusion.
- Unknown-value fail-closed versus independence: timing labels fail closed while valid Phase3A1 remains available.
- Timing failure versus numeric parent: no whole-result invalidation.
- Old sessions versus schema proposal: no schema change, so current strict production session remains compatible.
- MVP versus macro boundary: no allocation call, redistribution, coefficient, added meal, or numeric change.
- Context versus explicit choice: coarse context neither filters nor overrides the user's boundary.

No unresolved internal contradiction remains after the changes recorded in section 19.

## 21. Test matrix

| Case(s) | Deterministic expected result |
|---|---|
| Morning, daytime, evening context | No preselection/filter; optional context only if strictly normalized later |
| Missing/empty context | Phase3A1 works; timing still available only through explicit boundary, or capability may be hidden by chosen policy |
| Unknown/legacy context | Timing context invalid/code emitted at capability boundary; no labels from context; Phase3A1 unchanged |
| Stale context / explicit contradiction | Explicit boundary wins; no automatic warning or rewrite |
| Ordinary typical day / ordinary fitness training habit | No Phase3A2 selector because parent exposes only `typical_day` |
| Athlete rest day | No selector |
| Athlete single-training day | Optional empty selector enabled after plan |
| Athlete double-training day | No selector; number-free unsupported explanation |
| Three structures | Exactly `N+1` boundaries, in meal order |
| Before first / each adjacent / after last | Correct edge/interior labels; no extra occasion |
| Cancel | All timing labels removed; plan/totals remain |
| Change | Labels move deterministically; allocation object/totals unchanged |
| Reload | No persisted selection and no default |
| Energy/P/F/C totals | Exact Phase3A1 totals unchanged for every boundary |
| Products/additional meal/training snack | None generated |
| Minor/blocked/specialist_review/invalid_input | No numeric plan or timing control |
| Malformed parent/missing session/old schema | Existing neutral unavailable state; no timing bypass |
| URL/server/analytics | No serialization, request, or payload |
| Mobile `390×844` | No horizontal overflow; selector and labels remain readable/tappable |
| Keyboard | Label association, focus, select/radio operation, cancel, and live label update work |
| Phase2D2A calibration | IndexedDB journal and route behavior unchanged |

Also assert no automatic boundary, no use of duration as clock time, no Phase3A result mutation, no call that reallocates grams on timing change, and correct snack adjacency for `main_2|snack` and `snack|main_3`. Do not test macro-timing coefficients because the MVP has none.

## 22. Recommended MVP

Phase 3A2 is useful only as optional event-order annotation; context-only UI is safe but does not achieve placement. Use an explicit user-selected boundary after the Phase3A1 plan, for athlete single-training days only. Do not add a questionnaire input in this phase, do not support double training, do not create/extend a session schema, and do not persist the selection. Phase3A1 must remain fully available without Phase3A2. The feature changes labels only and can be ignored completely.

## 23. Required policy decisions

Before implementation, owner approval is required for:

1. Confirm single-training-athlete-only eligibility (excluding ordinary `fitness_2_4_week`).
2. Confirm React-only non-persistence and reset-on-reload behavior.
3. Confirm the exact preferred adjacent labels and whether unrelated cards receive no label.
4. Confirm whether valid part-of-day context is displayed at all; it must never filter/preselect.
5. Confirm the stable timing error code and its UI visibility if normalization is later added.
6. Confirm double-session deferral and explanatory copy.

## 24. Expected future file scope

This is a proposal only.

**New files:** preferably none. If pure relation derivation is separated for testability, one non-numeric helper such as `core/meal-relation.ts` and its focused test may be added only after approval; it must not become a calculation/result schema.

**Modified files:** `app/meal-structure/meal-structure-client.tsx` for optional local selection and labels; `app/globals.css` for accessible responsive presentation; `tests/meal-allocation.test.mjs` or a new focused UI/helper test for boundaries and numeric invariants. `PHASE_3A2_REPORT.md` could be a later implementation report only if separately authorized.

**Must remain untouched:** questionnaire UI and nine-section schema; `core/questionnaire-adapter.ts`; `core/calculation/phase3a.ts`; `core/calculation/types.ts`; `core/calculation/result-schema.ts`; `core/calculation/meal-allocation.ts`; `core/calculation/meal-policy.ts` and Phase3A1 weights; all Phase2C2 macro formulas; hydration policy; calibration IndexedDB; `nutrimind.phase3a.result.v1`; Vercel/deployment configuration.

## 25. Explicit exclusions

No production code in this audit; no questionnaire or pipeline change; no new session schema; no clocks, intervals, fasting inference, meal availability inference, GI/tolerance inference, two-session placement, duration-to-time conversion, macro redistribution, protein floor, carbohydrate emphasis, fat shifting, during-training nutrition, automatic snack/meal, product/menu, journal use, analytics, server persistence, URL state, medical/performance/recovery promise, commit, push, or deployment.
