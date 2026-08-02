# Phase 3A — meal structure and macro distribution audit

Status: architecture, product and evidence audit only. No production behavior is implemented by this document.

## 1. Executive summary

Phase 3A can be added safely only as a deterministic child of an already calculated adult `Phase2D1Result`. It must redistribute one user-selected, already calculated Phase 2C2 daily macro scenario; it must never recalculate or alter daily energy, protein, fat, carbohydrate, hydration, REE, PAL, `EnergyStart`, goal multiplier, or the Phase 2D2A journal.

The production questionnaire currently renders a coarse number-of-meals answer (`selections[4]`) and a coarse training-time answer (`selections[5]`), but both are discarded by `adaptQuestionnaireAnswers`. The richer fields in `data/survey-schema.json` are not production inputs. Exact training clock time, two-session timing, meal clock time, pre-exercise tolerance, food availability, dietary pattern, preferences and dislikes are unavailable. Therefore the safe MVP is Phase 3A1: let an eligible adult explicitly select one of a small set of neutral structures and one of the existing lower/central/upper scenarios, then allocate the displayed daily macro grams with deterministic reconciliation. Training-relative placement belongs in Phase 3A2 and must remain event-relative until adequate inputs exist.

Recommended structures are: three eating occasions; three main meals plus one optional snack; and four neutral eating occasions. They are equal choices, not a ranking. The UI should default to no macro scenario selection; once selected, show that scenario only, with an explicit control to switch scenario. The central scenario may be visually first but must not be silently selected. Exact percentages, protein floors, carbohydrate/fat emphasis, rounding precision and residual destination remain blocking policy decisions.

## 2. Repository confirmation

Audit start state:

| Check | Observed |
|---|---|
| Repository root | `C:/Projects/nutrimind` |
| Branch | `main` |
| HEAD | `239604d9e8e728dde8791939e51520494d467c6c` |
| HEAD ancestry requirement | Exact required commit |
| `origin/main...main` | `0 0` |
| Primary worktree | `C:/Projects/nutrimind` |
| Other worktree | `C:/Projects/nutrimind-original`, detached; not used |
| Merge/rebase/cherry-pick | None detected |
| Initial working tree | Clean |

The task named `core/calculation/phase2c1.ts` and `PHASE_2D2A_REPORT.md`; the repository instead implements Phase 2C1 in `core/calculation/phase2c.ts` and has `PHASE_2D2_REPORT.md`. Both actual files were reviewed. This mismatch is documentation drift, not permission to rename files.

## 3. Current pipeline

```text
/questionnaire (nine UI sections; answers[] plus typed profile/sport fields)
  -> runQuestionnairePipeline
  -> adaptQuestionnaireAnswers
  -> validateSurveyInput + safety admission
  -> runPhase2C2 (Phase2C1 day energy -> lower/central/upper macros)
  -> runPhase2D1 (unchanged Phase2C2 parent + hydration guidance)
  -> sessionStorage["nutrimind.phase2d1.result"]
  -> /result -> strict isCompatiblePhase2D1Payload -> display

Independent after explicit consent:
/calibration -> minimal Phase2D1-derived source -> IndexedDB observation journal
```

The result chain nests the complete calculated Phase 2C2 result inside Phase 2D1. Non-calculated Phase 2D1 states omit calculated parents and nutrition numbers. `/result` parses only the current exact schema and treats missing, malformed or old payloads as absent. No questionnaire or result data is sent to a server; no sensitive data is placed in a URL. Phase 2D2A uses a separate IndexedDB journal and does not alter Phase 2D1.

Recommended future flow:

```text
questionnaire raw meal answers
  -> strict normalized MealContext (separate adapter projection)
  -> Phase2D1Result + MealContext -> Phase3A request
  -> explicit scenario and structure selection
  -> strict Phase3A result in sessionStorage
  -> /result presentation
```

Phase 3A should consume **A + C**: the immutable `Phase2D1Result` as numeric/safety parent and a separate normalized meal-context input. It is not presentation-only because reconciliation and trace are calculation behavior; it should not consume Phase2C2 directly because that bypasses the current terminal safety/hydration parent.

## 4. Current meal-related input inventory

“Production” below means actually rendered and submitted by `/questionnaire`, not merely declared in JSON.

| UI section / label | Raw field; type; allowed values | Required / production state | Adapter -> destination | Current fate/use | Phase 3A suitability and forbidden inference |
|---|---|---|---|---|---|
| 3, `Тренировок в неделю` | `sessionsPerWeek`; enum `1_2`, `3_4`, `5_6`, `7_plus` | Required for athlete; rendered/submitted | Preserved -> canonical athlete activity -> Phase2C1 PAL | Used | Context/day availability only; cannot infer days, dates, clock time or meal timing |
| 3, `Обычная длительность тренировки, мин` | `typicalSessionMinutes`; finite numeric UI minimum 1 | Required for athlete; rendered/submitted | Preserved -> athlete activity and Phase2D1 hydration | Used | Duration context only; cannot create a clock schedule or infer two durations |
| 3, `Бывают две тренировки в день?` | `doubleTrainingDays`; boolean | Rendered/submitted for athlete | Preserved -> activity/day scenarios and hydration warning | Used | Can expose a double-day capability marker; cannot infer session times, separation or second duration |
| 4, `Ограничения` | `selections[3]`; integer 0..3 = allergy/intolerance/celiac/none | Required by UI convention; defaults to 0 | Synthesizes `allergies`, `intolerances`, `medicalRestrictions` -> validation/safety | Preserved and used, but coarse | Safety gate/capability only in 3A; cannot identify actual allergen or diagnose intolerance/GI disease |
| 5, `Основные приёмы пищи` | `selections[4]`; integer 0..2 = `1–2`, `3`, `4 и более` | Rendered, always has default, submitted | No mapping | Discarded | Useful only after explicit enum normalization; cannot distinguish four from five+, snacks, breakfast, times, regularity or preference |
| 6, `Обычное время` | `selections[5]`; integer 0..2 = morning/day/evening | Rendered for both branches, always defaulted, submitted | No mapping | Discarded | Potential coarse athlete timing after branch validation; cannot infer exact time, food access, pre/post meals, or apply to ordinary users as training time |
| 7, `Уровень энергии` | `selections[6]`; integer 0..2 = stable/sometimes lower/noticeable drops | Rendered, defaulted, submitted | No mapping | Discarded | Context only and not needed for 3A; cannot diagnose, alter macros, or infer hunger/appetite/digestion |
| 8, `Напитки в день` | `selections[7]`; integer 0..2 | Rendered/submitted | Strict band mapping -> Phase2D1 hydration | Preserved/used/displayed | Not a meal-allocation input; must not change hydration or be folded into meal energy |
| Goal | `goal`; five production enums | Rendered/submitted | Canonical goal -> Phase2C2/Phase2D1 | Preserved/used/displayed, multiplier 1 | Display context only; must not select structure or modify allocation totals |
| User type / adult status | typed fields | Required/rendered/submitted | Validation/admission | Used | Eligibility gate; minors get no meal numbers |

### Schema-only inventory (not production input)

| JSON section and field | Declared values | Rendered/submitted/mapped/persisted/displayed | Potential future use; prohibited inference |
|---|---|---|---|
| 4 `dislikedFoods`, `selfExcludedFoods` | lists | No / no / no / no / no | Phase 3B preference context only; not allergy substitutes and not relevant to 3A arithmetic |
| 5 `mainMealsPerDay` | `1_2`, `3`, `4`, `5_plus` | UI has a different, coarser question; schema field itself is not wired | Candidate normalized structure preference after reconciliation with UI; not proof of snack count or timing |
| 5 `breakfast` | `almost_always`, `sometimes`, `skip` | No throughout | Optional context; never make breakfast mandatory or infer fasting/disordered behavior |
| 5 `proteinServingsPerDay` | `1`, `2`, `3`, `4_plus` | No throughout | Describes current pattern, not grams, adequacy, or a safe per-meal target |
| 5 `fruitVegetablePortionsPerDay`, `fishPerWeek`, `eatingOutPerWeek` | declared enums | No throughout | Phase 3B/3C context; no micronutrient or deficiency conclusions |
| 6 `trainingTime` | morning/day/evening | Coarse equivalent exists only as `selections[5]`, currently discarded and wrongly rendered for both branches | Event-label selection only after athlete-only mapping; not exact time |
| 6 `preTrainingMeal` | yes/sometimes/no | No throughout | Future context; not tolerance, quantity or clock time |
| 6 `postTrainingMealTiming` | within 60/60–90/later than 90 | No throughout | Future context; must not become a rigid window or performance promise |
| 6 `hardestDayPeriod`, `unplannedSnacks` | declared general-user enums | No throughout | Context only; no moral judgement, diagnosis or automatic allocation |
| 7 `sleepHours`, `sleepQuality`, `digestionSymptoms` | declared enums | No throughout | Outside 3A; no diagnosis or GI diet prescription |
| 7 `energy` | stable/drops/often_low/varies | Production UI has a different three-option index, discarded | Context only; no automatic nutrition change |

No production fields exist for first/last meal time, snack count, appetite, dietary pattern, vegetarian/vegan status, food availability, pre-training tolerance, exact allergies, exact celiac payload beyond the coarse choice, or preferences beyond schema-only lists.

## 5. UI/schema/adapter data-flow gaps

- `selections[4]`, `[5]`, and `[6]` are collected and passed in `raw`, but the adapter drops them. They are not in `SurveyInput`, calculation types, Phase2D1, session storage payload or `/result`.
- The existing nine sections can remain unchanged if a separate adapter projection normalizes those indices into `MealContext`; no tenth questionnaire section is required. This is an implementation option, not authorization.
- Because every radio step starts at index `0`, the current UI cannot distinguish a deliberate choice from an untouched default. Phase 3A must not treat these answers as confirmed preferences until policy/UI handles explicit selection.
- JSON `mainMealsPerDay` has four values while production UI combines `4` and `5_plus`; JSON `energy` has four values while UI has three different labels. These are not lossless mappings.
- Section 6 is presented to ordinary users although JSON `trainingTime` is athlete-only. Mapping `[5]` without checking the athlete branch would create false training context.
- The safety UI collapses detailed, multi-select restrictions into one index and synthesizes an unresolved placeholder allergen. This is sufficient to preserve the upstream gate, not to power food selection.
- Unknown indices, non-integers, out-of-range values, wrong-branch timing, contradictory structures, legacy strings (`low/moderate/high` and unapproved meal aliases), malformed arrays and missing required discriminators must fail closed. Never clamp or guess.
- Enum normalization is needed for meal-count index, coarse training period, user type, and any later pre/post answers. Energy/wellbeing and diet-preference fields are context only and must not affect 3A totals.

## 6. Supported and unsupported capabilities

| Capability | Status now | Reason |
|---|---|---|
| Offer neutral selectable structures | Partially supported | Coarse meal-count index exists but is discarded and not explicitly confirmed |
| Allocate existing daily KБЖУ | Supported from calculated parent | Each calculated Phase2C2 day/scenario has energy and macro totals |
| Preserve rest/single/double/typical day types | Supported | Parent scenarios expose them by profile; double day has known limitations |
| Allocate lower/central/upper | Supported mathematically | All three exist, but user selection policy/UI is absent |
| Exact meal schedule | Unsupported | No meal clock times or wake/sleep schedule |
| Training-relative labels | Partially supported | Coarse part-of-day is collected but discarded; duration alone is insufficient |
| Double-session placement | Unsupported | No individual times, durations or separation |
| Food/menu recommendations | Unsupported and excluded | Phase 3B boundary; production restrictions are too coarse |
| Hunger/appetite/GI personalization | Unsupported | Hunger exists only in independent D2A journal; appetite absent; GI schema-only |

## 7. Three-scenario handling options

| Option | Transparency / consistency / tests | UX and interpretation risk | Phase 3B fit |
|---|---|---|---|
| A. Allocate all three at once | Maximum comparison; deterministic but triples reconciliation cases | Highest overload, especially mobile; lower is easily misread as prescribed deficit | Large cross-product of templates |
| B. Allocate central only | Simple and consistent | Illegitimately hides existing alternatives and effectively selects central | Easy but loses parent semantics |
| C. Central shown by default, lower/upper expandable | Good comparison and moderate mobile load | “Default” still implies a recommendation unless selection is explicit | Good if all remain addressable |
| D. User selects scenario before allocation | Clearest agency; one exact daily total and one reconciliation at a time; strongest testing | Requires neutral descriptions and no preselection; extra interaction | Best: one selected daily budget for later food templates |
| E. Relative percentages only | Avoids grams but cannot demonstrate exact daily reconciliation | Less useful, can hide mismatch and still imply prescriptive percentages | Insufficient contract for portioned Phase 3B |

**Recommendation: D, with C only as navigation after a selection.** Require the user to select lower, central or upper; do not preselect. Show one allocation, keep a visible scenario switcher and daily total, and state that lower is not automatically a deficit and upper is not automatically a surplus. All three can be generated/tested by the pure core on demand, but the UI need not render all simultaneously.

## 8. Meal-structure model comparison

| Model | Inputs | Ordinary / athlete and timing fit | Determinism / UX | Main risk |
|---|---|---|---|---|
| A. Three main meals | Explicit selection | Good ordinary; acceptable athlete; neutral for morning/evening | Simple, explainable, mobile-friendly | Can imply breakfast/lunch/dinner and rigidity |
| B. Three main + snack | Explicit selection and snack policy | Good both; adaptable around one session | Simple four-card layout | “Snack” may be mistaken as mandatory or inferior |
| C. Four eating occasions | Explicit selection | Good both; avoids naming hierarchy | Strong deterministic/mobile fit | May feel abstract; still rigid if prescribed |
| D. User-selected count | Validated count and allocation template per count | Flexible both | Deterministic within approved bounds; more testing | Arbitrary limits and false personalization |
| E. Training-relative | At least athlete branch, confirmed event context; exact times for clock output | Useful for single-session athletes; weak ordinary; morning/evening labels possible; double unsupported | Deterministic only after timing policy | False precision and “anabolic window” messaging |
| F. Flexible percentages, unnamed | User-entered validated shares | Flexible for both | Arithmetic clear but input/editing awkward on mobile | Percent burden, impossible patterns, pseudo-precision |
| G. Fully custom structure | Names/order/count/shares, strict bounds | Most flexible | Highest validation and mobile complexity | Rigid self-tracking burden and unsafe/extreme patterns |

Safe MVP: A, B and C as co-equal user-selected templates, displayed as `Приём 1…N`; optionally allow friendly labels in presentation without assuming breakfast. Do not infer that more frequent is better, that 1–2 is bad, or that skipping breakfast is fasting pathology. Defer D/G until bounds and accessibility are approved. Defer E to 3A2.

## 9. Macro-distribution method comparison

No coefficient below is approved.

| Method | Inputs/evidence | Mathematical and rounding behavior | Fit and risk |
|---|---|---|---|
| 1. Equal energy | Meal count; general practicality, no universal outcome evidence | Split kcal share; macro split remains undefined; rounded totals need residual | Simple both groups, but equal kcal can make awkward macro meals |
| 2. User-selected energy | Validated shares summing to 100% | Apply shares, round, reconcile | Flexible but burdensome and prone to false precision/extremes |
| 3. Even protein; remaining proportional | Meal count; mixed protein-distribution trials/stands | Split displayed protein equally, allocate fat/carbs by template; reconcile each macro | Plausible option, not universal optimum; may produce awkward meals |
| 4. Protein floor + residual | Body mass/meal count plus approved floor | Allocate floor, reject infeasible totals, distribute remainder, reconcile | Strongest overclaiming risk; floor is unapproved and can be impossible |
| 5. Carbohydrate emphasis near training | Confirmed training events and approved shares; sports position statements | Shift carbs only, exact daily carb conserved | Athlete-only potential; unsupported for unknown/double timing and not a performance guarantee |
| 6. Fat away from adjacent meals | Confirmed events and approved shares | Shift fat only, exact daily fat conserved | Athlete-only; evidence does not justify a universal limit |
| 7. Pure percentage templates | Structure + approved macro-specific matrix | Multiply daily displayed grams by shares; per-macro residual | Explainable/versionable; percentages can appear authoritative |
| 8. Gram allocation + final reconciliation | Displayed daily grams, template, precision, residual policy | Compute raw grams, round each, assign signed residual deterministically, assert exact equality | Required arithmetic mechanism, not a nutrition policy; safest compatibility with Phase2C2 |

Recommended technical basis is method 8 driven by a separately approved, simple template (likely 3 and/or 7). Consume the **approved displayed Phase2C2 grams**, because `/result` promises those totals; do not reconstruct from unrounded trace. For each macro independently: calculate raw meal grams at full precision, round to an approved increment using a named ties-to-even rule, compute `displayedDailyTotal - sum(roundedMeals)`, apply the signed residual to one policy-designated eligible meal, verify non-negative finite values and exact decimal-unit closure, and record raw values, rounded values, residual and destination. Energy per meal should be derived consistently from reconciled grams or separately allocated under an explicitly approved rule; never present contradictory kcal and grams.

Day type changes only the chosen approved template. Ordinary, rest and unknown-time days use neutral structures. Training emphasis is unavailable until 3A2. Double-session behavior must fail to neutral allocation rather than invent two event windows. Property tests must assert exact protein/fat/carbohydrate totals and the selected daily energy presentation.

## 10. Training-timing capability

| Input | Status | Production fact |
|---|---|---|
| Exact training clock time | Unsupported | No clock field |
| Part of day | Partially supported | `selections[5]` morning/day/evening is rendered but discarded; branch ambiguity remains |
| Duration | Supported for athlete | One `typicalSessionMinutes`, not a dated session |
| One vs two sessions | Partially supported | Boolean “double days happen”; not the selected day’s actual sessions |
| Separation between sessions | Unsupported | No field |
| Last meal time | Unsupported | No field |
| Food tolerance before training | Unsupported | `preTrainingMeal` is schema-only and would not prove tolerance |
| Food availability after training | Unsupported | No field; schema-only timing is not availability |

| Situation | Capability |
|---|---|
| Morning/day/evening single training | Partial: event-relative labels possible only after strict mapping and explicit confirmation; no clock times |
| Double-training day | Unsupported for placement; neutral allocation only |
| Unknown training time | Neutral structure only |
| Duration known, clock time unknown | Event-relative `приём пищи до тренировки` / `после тренировки` may be shown after confirmation; duration must never generate clock time |

## 11. Evidence review

| Source | Population / intervention / duration | Supported conclusion | Unsupported conclusion / applicability limit |
|---|---|---|---|
| [Academy/DC/ACSM position, 2016](https://pubmed.ncbi.nlm.nih.gov/26920240/), DOI `10.1016/j.jand.2015.12.006` | Consensus/position across athletic scenarios; not an RCT | Nutrition type, amount and timing can be relevant and should be individualized | No single meal count, percentage grid, Phase 3A algorithm or outcome guarantee; athlete guidance does not automatically generalize to ordinary users |
| [ISSN nutrient timing position, 2017](https://pubmed.ncbi.nlm.nih.gov/28919842/), DOI `10.1186/s12970-017-0189-4` | Position stand synthesizing exercise/timing literature | Timing can be a practical layer around adequate daily intake and exercise context | Does not establish one mandatory schedule or exact universal pre/post window; some conclusions are sport-specific |
| [ISSN protein and exercise position, 2017](https://link.springer.com/article/10.1186/s12970-017-0177-8), DOI `10.1186/s12970-017-0177-8` | Position stand focused on exercising people | Daily protein adequacy is primary; distribution can be considered | Does not approve a NutriMind per-meal floor for all adults or prove long-term outcomes from acute MPS |
| [Yasuda et al., 2020](https://pubmed.ncbi.nlm.nih.gov/32321161/), DOI `10.1093/jn/nxaa101` | 26 healthy young men; resistance training; protein-enriched breakfast/even 3-meal pattern vs skewed; 12 weeks | In this small sample, a more even three-meal pattern increased hypertrophy measures more than the skewed comparator at similar daily protein | Not proof that breakfast, three meals, its per-meal dose, or even distribution is optimal for women, older adults, ordinary users or every athlete |
| [Lobene et al., 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5657287/), DOI `10.3945/ajcn.117.158246` | Adults with overweight/obesity in energy restriction + resistance training; even 30/30/30 g vs skewed 10/20/60 g; intervention study | Within-day pattern can be tested while holding daily protein explicit | Found no body-composition advantage; does not support a universal even-distribution rule; weight-loss context limits generalization |
| [Tavares et al., 2025](https://pubmed.ncbi.nlm.nih.gov/40673785/), PMID `40673785` | 32 young resistance-trained men; three vs five protein-rich meals; 8 weeks; randomized non-controlled trial | Three and five frequencies can both be viable when daily protein is similar | Small, male, trained sample with no non-training control; cannot prescribe either frequency or generalize broadly |

Evidence conclusion: the daily calculated diet remains the foundation. Timing and distribution may improve practicality or support a chosen routine, but do not replace adequate daily intake. Evidence does not establish one meal frequency for everyone. Findings in young trained men, adults under energy restriction, older adults or women cannot be automatically transferred to all users. Acute muscle-protein-synthesis responses are not guaranteed long-term changes in body composition. Phase 3A must not promise performance, recovery or hypertrophy outcomes.

## 12. Safety constraints

- Exactly nine questionnaire sections remain.
- Only `status: calculated` adult parents may produce meal-level kcal or grams. `blocked`, `specialist_review`, `minor_suppressed`, `invalid_input`, malformed and old schemas are number-free.
- Goals never weaken admission and do not change daily totals.
- Allergies remain hard exclusions; celiac remains strict gluten-free context. Phase 3A produces no foods, so it must not claim allergen safety of a menu.
- Phase 3A must not mutate or reinterpret Phase2C2, Phase2D1 hydration, or Phase2D2A observations.
- No diagnosis, deficiency claim, medical diet, fasting protocol, skipped-meal advice, mandatory breakfast/bedtime eating, rigid anabolic window, diabetes/GI advice, low-FODMAP, keto, carb cycling, refeeds, supplements, powders, gainers, electrolytes, caffeine, alcohol guidance, micronutrient/fibre targets, pregnancy/lactation meal plans, products or brands.
- No user payload in URLs, requests, analytics or server persistence. Calculation result remains session-only.
- Exact meal count, percentages, intervals, windows, protein grams per meal, training-adjacent carb/fat thresholds and meal-specific calorie rounding are policy decisions, not evidence facts.

## 13. Allergy and celiac boundary

Phase 3A should carry only minimal capability/safety markers needed to prevent unsafe downstream assumptions, ideally by reference to the immutable validated parent rather than copying sensitive raw answers. Suggested normalized markers: `foodSelectionAllowed`, `hasHardAllergyExclusions`, `strictGlutenFree`, and `restrictionPayloadStatus: known | unresolved | malformed`. Do not copy free-text allergy or doctor instructions into the 3A result.

Unknown allergy payload, malformed restrictions, or a non-calculated safety parent must fail closed. Phase 3B, not 3A, must obtain canonical hard-exclusion codes from the validated upstream safety result using a strict parent link. Fields that cannot be lost between phases are the parent schema/version/status, safety capability, hard-exclusion reference, strict-gluten-free marker and unresolved/malformed state. No food selection is implemented here.

## 14. Proposed contract

Use strict schema `nutrimind.phase3a.result.v1` and a discriminated union:

```ts
type Phase3AResult =
  | {
      schemaVersion: "nutrimind.phase3a.result.v1";
      status: "calculated";
      parent: { schemaVersion: "nutrimind.phase2d1.result.v1"; status: "calculated" };
      normalizedMealContext: NormalizedMealContext;
      selected: { dayScenarioId: ScenarioId; macroScenarioId: MacroScenarioId; structureId: MealStructureId };
      availableMealStructures: MealStructureDescriptor[];
      dayPlan: { dailyTotals: MacroTotals; meals: MealAllocation[] };
      macroAllocationTrace: AllocationTrace;
      safetyCapabilities: MinimalSafetyCapabilities;
      warnings: string[];
      appliedPolicy: { policyId: string; ruleIds: string[] };
    }
  | {
      schemaVersion: "nutrimind.phase3a.result.v1";
      status: "blocked" | "specialist_review" | "minor_suppressed" | "invalid_input";
      parent: { schemaVersion?: string; status?: string };
      issues: NumberFreeIssue[];
      nextStepCode: string;
    };
```

Use the existing chain style but do **not** nest a second full Phase2D1 copy. The Phase3A session envelope should contain the unchanged Phase2D1 payload once plus its Phase3A child, or use separate session keys with strict co-validation. A “minimal reference” is only safe in session storage if it is bound to the exact current parent by an approved deterministic identifier; do not invent a hash policy silently.

`MealAllocation` may contain `mealId`, neutral `displayLabel`, `relativeOrder`, optional event relation, reconciled kcal/protein/fat/carbohydrate, and residual markers. Raw decimals belong in trace. Day IDs must reuse actual parent semantics: ordinary users have `typical_day`; athletes may have `rest`, `training`, `double_training`. Do not manufacture an “ordinary training day” unless the parent exposes one.

Runtime validation must reject unknown schema versions, extra/unknown enums, non-finite or negative numbers, wrong meal order/count, duplicate IDs, absent parent, non-calculated parent with numbers, totals that do not close exactly, unrecognized rule IDs, and training relations unsupported by context. Malformed session data produces the existing neutral “complete questionnaire again” state; no best-effort migration.

## 15. Proposed UX

Preferred placement is on `/result`, after the daily macro scenarios and before hydration. It makes the unchanged parent totals visible immediately above the derived distribution and preserves one result route. After hydration weakens the parent/child connection; a separate route adds navigation and session synchronization complexity; placing before scenarios reverses the dependency.

Flow: choose day type -> explicitly choose macro scenario -> choose structure -> show stacked meal cards. Keep the selected daily total visible, include “why this distribution” details, and state that daily values are unchanged. On mobile, controls stack, cards use one column, labels wrap by words, no table or horizontal scrolling is required, and status is conveyed by text/icons as well as color. The future implementation must verify 1440×900, 1024×768 and 390×844.

Required copy meanings:

- `Это один из способов распределить уже рассчитанные суточные КБЖУ.`
- `Количество приёмов можно выбрать под свой режим.`
- `Распределение не является медицинским назначением.`
- `При аллергии или целиакии состав продуктов должен соблюдать жёсткие исключения.`

No food examples appear in Phase 3A.

## 16. Test matrix

| Group | Deterministic cases/assertions |
|---|---|
| Profiles | Adult female/male ordinary; each ordinary activity; amateur/competitive/professional athlete; every goal; exact parent immutability |
| Days/timing | Typical, rest, single, double; morning/day/evening coarse timing; unknown timing; duration without clock; double placement falls back or is unavailable |
| Structures/scenarios | Three; three+snack; four neutral occasions; every lower/central/upper for every available parent day; no implicit scenario selection |
| Reconciliation | Exact daily kcal presentation; exact protein/fat/carb closure; decimal and ties-to-even cases; zero/tiny/large positive and negative residual; infeasible/negative result rejected; raw/rounded trace |
| Input strictness | Missing meal context; untouched/default ambiguity; malformed index/type; wrong branch; unsupported legacy meal value; contradictory count; unknown enum |
| Schema/session | Old 3A schema; malformed result; missing/mismatched Phase2D1 parent; extra fields; duplicate meal IDs; non-finite numbers; stale separate keys |
| Suppression | Minor, blocked, specialist_review, invalid_input recursively contain no kcal, macro grams, ml, meals or calculated parent payload |
| Safety | Celiac marker retained; allergy capability retained; unresolved/malformed restrictions fail closed; no diagnosis |
| Non-regression | No product, brand, supplement, hydration, goal multiplier, calorie or macro-total changes; no Phase2D2A dependency/mutation |
| Privacy | No sensitive URL data, network/server request, localStorage, cookie or IndexedDB write by 3A |
| UI/a11y | 1440×900, 1024×768, 390×844; keyboard/radio semantics; visible totals; card stacking; word wrapping; no horizontal overflow; meaning not color-only |

## 17. Recommended phase split

- **Phase 3A1:** normalized coarse meal context, explicit scenario selection, three approved user-selectable structures, deterministic distribution/reconciliation of existing displayed daily macros, no foods.
- **Phase 3A2:** single-training event-relative placement only after timing input normalization and explicit confirmation. It may be merged with 3A1 technically only if it ships disabled whenever context is insufficient and has an independent approved timing policy. Double-session placement should remain separate.
- **Phase 3B:** food-group templates, canonical hard allergy exclusions, celiac cross-contact rules, dietary pattern/preferences, no brands. Keep separate because it changes the safety and data surface.
- **Phase 3C:** example days/menus plus nutrient-quality/variety policy and a separate safety/evidence review. Keep separate from all 3A work.

## 18. Expected implementation files

Probable new files after authorization:

- `PHASE_3A_REPORT.md`
- `core/calculation/meal-policy.ts`
- `core/calculation/meal-allocation.ts`
- `core/calculation/phase3a.ts`
- `core/calculation/phase3a-result-schema.ts`
- `tests/meal-allocation.test.mjs`

Probable existing changes:

- `core/questionnaire-adapter.ts` — separate strict meal-context projection;
- `core/calculation/types.ts`, `core/calculation/index.ts`, `core/index.ts` — contracts/exports;
- `app/questionnaire/page.tsx` — only if explicit confirmation/default ambiguity is resolved without changing nine sections;
- `app/result/page.tsx`, `app/globals.css` — result controls/cards;
- `tests/nutrimind-core.test.mjs`, optionally rendered HTML tests;
- `PHASE_2_ARCHITECTURE.md` — implemented boundary.

Phase2C1/2C2/2D1 arithmetic, hydration, calibration storage/journal and survey specification should not change merely to add 3A.

## 19. Blocking policy decisions

1. Approved structure IDs/counts and whether user choice is mandatory.
2. How untouched default meal/timing answers become explicit, without changing nine sections.
3. Whether one selected scenario is computed on demand or all three are stored; no automatic scenario selection.
4. Macro-specific distribution shares; equal/proportional/template choice.
5. Whether protein is even, floor-based or merely template-driven; any floor value requires separate approval.
6. Whether/when carbohydrate or fat moves around training; no exact windows or limits are approved.
7. Double-session policy (recommended: neutral-only until new inputs are approved).
8. Source totals: recommended displayed Phase2C2 grams; confirm energy presentation rule.
9. Decimal precision, ties rule, signed residual destination and infeasible allocation behavior.
10. Missing/ambiguous meal context behavior and whether the user may choose independently on `/result`.
11. Strict enum normalization and legacy-value rejection list.
12. `/result` placement and card/control accessibility behavior.
13. Session envelope/key, parent binding, stale-key handling and whether a new schema is stored.
14. Minimal allergy/celiac capability projection and future Phase 3B handoff.

## 20. Explicit exclusions

Implementation; production UI/questionnaire/calculation changes; commits, pushes and deployment; daily-total recalculation; deficit/proficit; goal adjustment; Phase2D2A-derived correction; hydration changes; exact schedules/windows/intervals; fixed meal count or per-meal protein target; products, food examples, menus, brands and supplements; micronutrient/fibre calculations; diagnosis or GI/diabetes/clinical diets; server/account storage, requests, tracking, analytics and sensitive URLs.

## 21. Recommended MVP

Implement later, after the blocking decisions are approved, a Phase 3A1 pure calculation child of a strictly validated calculated adult Phase2D1 parent. Let the user explicitly choose day type, lower/central/upper scenario and one of three neutral structures (three occasions, three plus optional snack, or four occasions). Allocate the already displayed daily protein/fat/carbohydrate grams with a versioned template and deterministic exact reconciliation; show one scenario at a time, its unchanged daily total, raw/rounding trace on demand and the required non-medical wording. Store only a versioned session result bound to the current parent. Do not use training timing, foods, Phase2D2A or automatic goal changes in this MVP.
