# Phase 3B — Safe food-group templates: audit

Audit date: 2026-08-04. Scope: evidence and architecture only; no implementation is authorised by this document.

## 1. Executive summary

The current production path cannot safely render concrete food examples. The production questionnaire does not collect a specific allergen set, intolerance subtype, dietary pattern, dislikes, cultural/religious exclusions, or a user-entered restriction. Its single Section 4 radio answer is collapsed by the adapter: “Аллергии” becomes unresolved `other`, “Непереносимости” becomes generic `other`, “Целиакия” alone remains specific, and “Нет известных ограничений” becomes `none`. The normalized safety profile is used for admission, but the Phase 2D1/Phase 3A session payload deliberately drops the restriction details. Thus downstream has neither an allergen set nor enough data to distinguish most hard exclusions.

Phase 3B is useful now only as **Model A: neutral food-group slots**, with no concrete foods, portions, recipes, brands, nutrient-adequacy claims, or timing-driven food choices. Phase 3B1 should be an optional presentation layer under existing meal cards, available only when the existing Phase 3A parent is `calculated`; its categories must not claim restriction-specific safety. Concrete examples must wait for explicit approved questionnaire inputs, a minimal normalized restriction context, a human-reviewed and jurisdiction-scoped catalog, deterministic metadata filtering, and a separate celiac policy. Phase 3A must remain fully usable when Phase 3B is missing or ineligible.

Two required-list files are absent at this HEAD: `PHASE_2D2A_REPORT.md` and `tests/meal-timing.test.mjs`. Their absence is recorded, not repaired. Phase 3A2 tests are presently in `tests/meal-allocation.test.mjs`.

## 2. Repository confirmation

| Check | Observed |
|---|---|
| Repository root | `C:/Projects/nutrimind` |
| Branch | `main` |
| HEAD | `d80b7bb0b885273b9a87d8bd695ff8c679794714` (`Implement Phase 3A2 training-relative placement`) |
| `origin/main...main` | `0 0` |
| Active worktree | primary `C:/Projects/nutrimind` |
| Other worktree | `C:/Projects/nutrimind-original`, detached; not used |
| Initial tree | clean; no merge, rebase, or cherry-pick |

The minimum requested production files were inspected. The two absent files named above could not be read. Repository-wide term searches were also performed. Specification/demo presence was not treated as production input.

## 3. First-pass factual inventory

The source files contain mojibake string literals (for example the intended “Аллергии” is stored as `РђР»Р»РµСЂРіРёРё`). The table gives intended Russian wording for legibility and identifies the literal/raw contract separately. This audit does not repair or reinterpret those strings.

### Production-rendered fields relevant to Phase 3B

| Sec. | Visible label / control | Raw field or index; exact values | Audience / required | Submitted and normalized | Persisted/displayed/used/discarded | Phase 3B fitness and prohibited inference |
|---|---|---|---|---|---|---|
| 1 | “Ваш профиль”: “Спортсмен”; “Обычный пользователь” / radio | `selections[0]`: `0`, `1`; submitted also as `userType`: `athlete`, `general_user` | all / effectively required by default selection | submitted; adapter prefers explicit `userType` | contributes to calculation branch; only downstream calculation consequences persist | eligibility context only; does not establish dietary pattern |
| 1 | “Возрастная группа”: “Взрослый”; “Несовершеннолетний” / radio | `ageGroup`: `adult`, `minor` | all / required | submitted and validated | influences safety admission; raw value is not a Phase3A field | adults-only eligibility possible; never infer capacity or diagnosis |
| 2 | “Возраст, полных лет” / number | `ageYears`, 1–120 | all / required | submitted and validated | used by REE and safety; demographic values occur inside calculated parent REE | adult/minor check only; not a restriction |
| 3 | “Главная цель” / radio | `goal`: `weight_loss`, `maintenance`, `muscle_gain`, `performance_recovery`, `habits_wellbeing` | all / required via default | submitted and normalized to calculation goal | retained as selected goal downstream | must not select foods, imply therapeutic effect, or override exclusions |
| 3 | athlete fields / select, number, checkbox | `sportType`; `sportLevel`; `sessionsPerWeek`; `typicalSessionMinutes`; `doubleTrainingDays` | athlete / required except checkbox | submitted; activity mapping | calculation context persists; no restriction meaning | athletic status never relaxes allergy/celiac rules |
| 3 | “Повседневная активность” / radio | `dailyActivity`: `mostly_sitting`, `lots_of_walking`, `physically_active_work`, `fitness_2_4_week` | general user / required | submitted and validated | calculation context/trace only | no food preference inference |
| 4 | “Ограничения”: “Аллергии”; “Непереносимости”; “Целиакия — Строгий безглютеновый режим”; “Нет известных ограничений” / one radio | `selections[3]`: `0`, `1`, `2`, `3` | all / required by default | `0→allergies:["other"], otherAllergy:"неуточнённый аллерген"`; `1→intolerances:["other"]`; `2→medicalRestrictions:["celiac"]`; `3→all three ["none"]` | used transiently by validation/safety/admission; restriction values are not fields of Phase2D1 or Phase3A and are discarded before session result; only status/issues/calculation consequences remain | insufficient for concrete examples. Cannot infer specific allergen, confirmed diagnosis, intolerance subtype, dislike, dietary pattern, or safe foods |
| 5 | “Основные приёмы пищи”: “1–2 раза в день”; “3 раза в день”; “4 и более” / radio | `selections[4]`: `0`, `1`, `2` | all / required by default | separately normalized to `one_or_two`, `three`, `four_or_more`; missing→`not_provided`; other→error | stored in Phase3A `normalizedMealContext`; displayed on `/meal-structure`; does not auto-select a structure | usable as display-only context; does not determine food groups or meal count |
| 6 | “Обычное время”: “Утром”; “Днём”; “Вечером” / radio | `selections[5]`: `0`, `1`, `2` | rendered to all despite athlete-oriented spec / defaulted | separately normalized to `morning`, `daytime`, `evening` | stored in `nutrimind.phase3a2.context`; displayed only for eligible single-training view | event-order hint only; cannot infer clock, interval, tolerance, or food choice |
| 7 | “Уровень энергии”: “Стабильный”; “Иногда снижается”; “Есть заметные спады” / radio | `selections[6]`: `0`, `1`, `2` | all / defaulted | submitted inside `selections` but adapter ignores it | discarded | cannot diagnose or choose foods |
| 8 | “Напитки в день”: “До 1,5 л”; “1,5–2 л”; “Более 2 л” / radio | `selections[7]`: `0`, `1`, `2` | all / defaulted | normalized to hydration band | Phase2D1 retains band and displays hydration guidance | not a food restriction or composition input |
| 9 | “Актуальные анализы”: “Есть числовые результаты”; “Нет свежих анализов” / radio | `selections[8]`: `0`, `1` → `availableLabs:["numeric_results_declared"]` or `["none_recent"]` | all / defaulted | submitted to validation, but no numeric laboratory values | declaration is discarded from Phase2D1/Phase3A; no deficiency can be confirmed | cannot support micronutrient or supplement claims |
| 9 | informational processing consent / checkbox | `informationalConsent`: `true`, `false` | all / required | submitted and validated | consent itself is not exposed in Phase3A | not consent to medical treatment or persistent restriction storage |

### Approved-schema fields that are not production-rendered/submitted

| Sec. | Schema field; exact raw values | Rendered / submitted | Current fate | Phase 3B implication |
|---|---|---|---|
| 4 | `allergies`: `none,milk,egg,peanut,tree_nut,fish,seafood,wheat,soy,sesame,other` | no dedicated multi-control; no specific value submitted | unavailable, except artificial `other` or `none` mapping | taxonomy in JSON/core is not production data |
| 4 | `otherAllergy` free text | no | adapter invents fixed text for generic allergy; no user text | user intent is unavailable; fuzzy parsing is impossible and unsafe |
| 4 | `intolerances`: `none,lactose,gluten,fructose,legumes,other` | no dedicated multi-control | generic `other` or `none`; discarded downstream | allergy/intolerance distinction exists only at generic branch level and is lost downstream |
| 4 | `medicalRestrictions`: `none,celiac,carbohydrate_metabolism,kidney,gastrointestinal,lipid_metabolism,high_blood_pressure,other` | only celiac is a visible aggregate option | celiac or none transiently; other values unavailable | no GI/medical recommendation is allowed |
| 4 | `doctorInstructions` text | no | unavailable | cannot claim compliance with clinician instructions |
| 4 | `dislikedFoods` list | no | unavailable | dislikes cannot be filtered |
| 4 | `selfExcludedFoods` list | no | unavailable | user exclusions cannot be filtered |
| 5 | `breakfast`, `proteinServingsPerDay`, `fruitVegetablePortionsPerDay`, `fishPerWeek`, `eatingOutPerWeek` | no | unavailable | current-diet detail cannot shape templates |
| 6 | `preTrainingMeal`, `postTrainingMealTiming`, `hardestDayPeriod`, `unplannedSnacks` | no | unavailable | no food-timing optimisation |
| 7 | `digestionSymptoms` | no | unavailable | no GI inference or therapeutic diet |
| 8 | `sweating`, `trainingDrink` | no | unavailable | no sports-food inference |
| 9 | `supplements`, `medications` | no | unavailable | no supplement/medication advice |
| — | dietary pattern (`vegan`, `vegetarian`, `pescatarian`, `omnivore`, etc.), religious/cultural restriction, suspected-vs-confirmed allergy | absent from schema and production UI | unavailable | support must not be invented |

No pregnancy, lactation, eating-disorder, or compensatory-practice controls are rendered. `safetyScreening` is absent, producing a warning and keeping automatic energy reduction disabled, but it does not by itself block ordinary adult numeric calculation.

## 4. Current restriction inputs

- Exact production allergy input: one radio option labelled “Аллергии”, raw `selections[3] = 0`; no specific allergens and no multiplicity. It becomes unresolved `other`, not a confirmed named allergen.
- Exact production celiac input: one radio option “Целиакия” with note “Строгий безглютеновый режим”, raw `selections[3] = 2`; it becomes `medicalRestrictions:["celiac"]`.
- Exact production intolerance input: “Непереносимости”, raw `1`; it becomes `intolerances:["other"]`.
- Exact unrestricted input: “Нет известных ограничений”, raw `3`; it becomes `none` for all three core arrays.
- Exact production dietary-pattern inputs: none. Vegan, vegetarian, pescatarian, flexitarian, and omnivore are not literals in the production questionnaire contract.
- Preference/dislike, cultural/religious, confirmed/suspected allergy, free-text restriction, and “other” user values: not collected.

## 5. Current data-flow map

```text
questionnaire UI selections[3]
  → submitted payload (only index)
  → adapter (aggregate choice collapsed to artificial core arrays)
  → validation + safety gateway (specificity available only transiently)
  → Phase2C2 (calculation result omits normalized profile/safety)
  → Phase2D1 (wraps Phase2C2; no restriction context)
  → Phase3A (wraps Phase2D1; no restriction context)
  → sessionStorage: phase2d1 result, phase3a result, separate timing context
  → /result
  → /meal-structure (validates schema and displays numbers/meal structure)
```

| Concept | Passed | Normalized | Collapsed | Discarded/unavailable downstream |
|---|---:|---:|---:|---:|
| generic allergy marker | yes to gateway | unresolved `other` | yes | yes |
| specific allergen(s) | no | no | n/a | unavailable |
| generic intolerance | yes to gateway | `other` | yes | yes |
| celiac | yes to gateway | `strictGlutenFree:true` | no | yes after admission |
| dietary pattern | no | no | n/a | unavailable |
| dislike/preference/free text | no | no | n/a | unavailable |
| current meal pattern | yes separately | exact enum | no | retained in Phase3A |

Answers to the required questions: (1) no downstream access to specific allergens; (2) not even a durable allergy capability marker exists in Phase3A—only status/issues and calculation consequences; (3) the adapter can transiently distinguish the generic allergy and generic intolerance branches, but downstream cannot; (4) celiac is distinguishable transiently from generic intolerance, but subjective gluten avoidance is not collected and downstream loses both; (5) no vegan/vegetarian distinction; (6) no preference/hard-exclusion distinction; (7) no free-text restriction survives; (8) no user “other” value survives; (9) unsupported numeric indices for restriction are currently mapped to unrestricted because every value other than `0/1/2` falls into the `none` branches—an unsafe silent fallback; (10) sessionStorage does not contain specific restriction values, so it avoids that redundant medical copy, although it does contain nested calculation/demographic data.

## 6. Central safety finding

Current production inputs are insufficient to deterministically enforce food exclusions.

| Required exclusion | Support |
|---|---|
| every declared allergen | unsupported: none is declared specifically |
| allergen-containing ingredients and obvious derivatives | unsupported: no ingredient/allergen graph |
| compound foods | unsupported |
| ambiguous processed foods | unsupported |
| cross-contact risk | unsupported |
| gluten for celiac | partially supported: marker exists transiently, but no catalog metadata and it is lost downstream |
| animal-origin foods for vegan | unsupported: no vegan input or metadata |
| meat/fish for vegetarian | unsupported: no vegetarian input or metadata |
| dislikes | unsupported |
| unknown free-text restrictions | unsupported: not collected; generic allergy is unresolved |

A warning cannot substitute for filtering. Concrete examples are therefore unsafe now.

## 7. Definition of food-template levels

| Model | Inputs/data required | Determinism and mathematical fit | Safety/false precision | Regional, maintenance, testing, mobile | Readiness |
|---|---|---|---|---|---|
| A — food-group slots | calculated meal IDs only; abstract category vocabulary | deterministic; makes no food-to-macro equation | lowest risk if explicitly non-personalized and non-exhaustive | jurisdiction-neutral, small review/test burden, compact UI | ready after policy approval |
| B — curated examples | exact restrictions plus reviewed catalog with allergen, gluten, pattern, processing, label/cross-contact metadata | deterministic filtering possible; no macro fit | material residual risk, especially compound/processed foods | needs locale/market, versioning, human review and intersection tests | not ready |
| C — examples with approximate portions | B plus validated composition, edible portion, raw/cooked, units | approximate only | high false precision and safety risk | large regional/database burden | not ready |
| D — exact food allocation | C plus solver, preparation/yield, rounding and residual reconciliation | only then mathematically auditable | highest precision claim and regression burden | very high maintenance/testing/mobile complexity | not ready |
| E — recipes/menu | ingredient graph, recipe yield/preparation, complete safety and quality policy | complex and version-sensitive | compound-food and cross-contact risks | largest content/localisation burden | not Phase 3B |

Safe MVP boundary: Model A only. Models B–E are separate later gates, not aliases for Phase 3B.

## 8. Eligibility matrix

The following is a proposed policy requiring explicit approval.

| State | Model A neutral slots | Concrete examples | Existing Phase 3A |
|---|---|---|---|
| calculated adult, production “no known restrictions” | eligible | disabled pending validated context/catalog | unchanged |
| calculated adult, known allergy set (future) | eligible only as non-food-specific slots | disabled until complete supported set + catalog filter | unchanged |
| calculated adult, celiac | eligible only as abstract slots | disabled pending celiac-specific review | unchanged |
| allergy + celiac / allergy + vegan | abstract slots only | fail closed | unchanged |
| vegetarian/vegan (future exact literals) | abstract slots only until policy | fail closed until metadata | unchanged |
| missing context, unknown non-empty, malformed, free-text only | abstract non-personalized slots at most; never claim restriction filtering | fail closed | unchanged if valid parent |
| `blocked`, `specialist_review`, `minor_suppressed`, `invalid_input` | no personalized templates | no | existing non-calculated behavior |

Invariant: Phase 3B failure never removes Phase 3A. No direct route or old session may synthesize unrestricted concrete examples.

## 9. Food-allergy model

Confirmed allergy, suspected allergy, intolerance, dislike, preference, and celiac disease are distinct states. Production collects none of those distinctions beyond an aggregate radio branch. The schema/core list (`milk,egg,peanut,tree_nut,fish,seafood,wheat,soy,sesame,other`) resembles the nine US major-allergen source groups but `seafood` is broader/less precise than crustacean shellfish, `tree_nut` lacks nut type, and fish lacks species; it is not the EU 14 list and is not a jurisdiction-neutral complete taxonomy.

Future concrete support requires: exact confirmed-allergy values; multiple-value intersection; no `none` conflict; unknown/out-of-vocabulary fail-closed; reviewed exact synonym codes only after explicit confirmation; recursive ingredient/derivative relationships; compound-food completeness; per-entity `contains/may-contain/unknown` evidence; no cross-contact guarantee; and blocking when metadata or context is incomplete. Fuzzy matching is prohibited for hard exclusions. A substitute must be filtered against the entire allergy set, not merely the allergen it replaces.

## 10. Celiac strict gluten-free model

Celiac disease is neither wheat allergy nor subjective gluten avoidance. A generic name cannot establish ingredients or cross-contact. Wheat, barley, rye, triticale, malt, brewer’s yeast, sauces/seasonings, meat substitutes, grain mixes, and processed foods require explicit policy and metadata. Oats require a separate jurisdiction-aware policy and verified/labeled status; they must not be automatically recommended. Naturally gluten-free identity does not guarantee preparation free from cross-contact, and NutriMind cannot certify a product.

| Strategy | Residual risk / decision |
|---|---|
| A abstract slots only | lowest; recommended for 3B1 |
| B unprocessed naturally GF examples | still needs identity, handling and cross-contact caveat; not current MVP |
| C processed only with verified GF label | jurisdiction/product-version dependent; future only |
| D disable concrete examples | safest current behavior; recommended now |
| E separate reviewed celiac catalog | viable future 3B2 only with specialist content review |

## 11. Dietary-pattern model

There are no production dietary-pattern inputs; therefore no literal pattern is currently supported. Future support must define exact values and exclusions rather than infer from goals or disliked foods. Vegan and vegetarian intersections must be applied after medical/allergy exclusions and before preferences. The 2025 Academy position concerns appropriately planned adult patterns; a short example list does not demonstrate adequacy, bioavailability, micronutrient coverage, or supplement need. Pregnancy/lactation are outside that paper’s adult scope and are not production-screened.

## 12. Restriction precedence

Proposed strict order: (1) parent safety/status gate; (2) celiac strict gluten-free; (3) confirmed allergies; (4) approved dietary-pattern exclusions; (5) cultural/religious exclusions only if explicitly collected; (6) dislikes/preferences; (7) variety. Hard exclusions are set intersections and always win. Unknown, malformed, contradictory, or unsupported hard context disables concrete examples; it never falls back to unrestricted. Conflicts such as vegan+soy allergy, vegetarian+milk allergy, celiac+vegan, celiac+wheat allergy, nut allergy+plant pattern, fish allergy+pescatarian, or an exhausted catalog are not medically “resolved”; output is empty/disabled with a neutral explanation.

## 13. Free-text and other-value policy

Production has no user free text, even though the approved schema describes `otherAllergy`. For future hard restrictions: fuzzy matching is rejected; an exact versioned synonym dictionary may propose an interpretation but requires explicit user confirmation; otherwise concrete examples are disabled. Specialist review may be a next-step message, not an automatic medical classification. Empty/malformed/compound/multilingual text fails closed. Model A can remain available only if it makes no personalized safety claim.

## 14. Curated taxonomy options

| Option | Assessment |
|---|---|
| A static food-group taxonomy only | deterministic, local, traceable, lowest privacy/safety burden; recommended 3B1 |
| B small reviewed example catalog | future 3B2; versionable/testable but needs human ownership and jurisdiction |
| C external composition DB | useful for later nutrients, not sufficient allergen/celiac evidence; network/version/privacy burden |
| D generative suggestions | unacceptable as hard-exclusion engine; hallucination and traceability risk |
| E catalog + generation | generation must never escape catalog/filter; unnecessary for MVP |

Minimum future entity metadata is not yet a final schema: stable `foodId`, Russian label, category, market/jurisdiction, exact dietary compatibility, explicit allergen relations and completeness, gluten relationship, processed flag, label-verification requirement, cross-contact/unknown capability, rule IDs, review source/version/date/owner. No ordinary string array can enforce safety.

## 15. Numeric and portion boundary

No validated food-composition database, edible-portion data, raw/cooked distinction, preparation/yield, density/serving units, brand-independent values, regional variance policy, food-level rounding, or residual reconciliation exists. Therefore grams, portions, and exact meal combinations are not defensible. Phase 3A numbers remain untouched.

Allowed wording: “категории продуктов для составления приёма”. “Примеры продуктов из разрешённых групп” is allowed only in a future filtered catalog. “Готовый рацион” and “продукты точно соответствуют КБЖУ” are misleading and prohibited.

## 16. Phase 3A1 compatibility

All `three_meals`, `three_meals_plus_snack`, and `four_occasions` IDs, labels, order, weights, reconciliation meal, kcal and macro values remain unchanged. Model A may attach the same small abstract slot vocabulary to each existing card. If main-meal/snack slot sets later differ, that is a presentation taxonomy only—never a nutrition coefficient. Snack remains optional and is not assumed to be fruit, dairy, protein, sports nutrition, or pre-workout food.

## 17. Phase 3A2 compatibility

Choose A/C: ignore timing for template derivation and, if visible, show existing relation labels beside an unchanged template. Do not map `before/after` to foods. A future timing-food policy must be a separately approved evidence phase. Missing clocks, intervals, tolerance, availability, and two-session details preclude “pre-workout” or “recovery” food inference.

## 18. UI placement options

| Option | Decision |
|---|---|
| A under each existing meal card | recommended as opt-in/details; has current plan state, no URL or selector persistence |
| B one block after all cards | lower repetition but loses meal association |
| C new route | rejected for MVP: new route/transport/direct-entry problem |
| D accessible `<details>` within cards | preferred form of A; good mobile/cognitive-load profile if keyboard/focus tested |
| E new persisted page/selection | rejected: unnecessary schema and old-session risk |

No URL data and no hidden auto-selection. Reload may require the existing explicit choices again.

## 19. User-language review

Use: “Это категории, из которых можно собрать приём пищи. Они не являются готовым меню и не гарантируют точного совпадения с рассчитанными КБЖУ.” For future examples: “Проверяйте состав и маркировку конкретного продукта.” For celiac processed foods, only after approved policy: verified label and cross-contact remain relevant.

Hard filtering is behavior; warnings explain residual limits; legal label claims depend on market; diagnosis/treatment language is out of scope. Prohibited claims include “полностью безопасно”, “гарантированно не содержит”, “подходит всем”, “лечебное питание”, adequacy/deficiency/performance promises, exact macro matching, or permission not to check labels.

## 20. Jurisdiction analysis

The app declares no country/market; Russian UI does not establish EAEU jurisdiction. EU rules identify 14 categories and regulate gluten-free statements; US FDA defines nine major allergens and a voluntary gluten-free claim under its own scope; EAEU/local rules require a separate authoritative review. A concrete general catalog without market scope cannot make legal label claims. Category-only wording can be jurisdiction-neutral. Future examples need an explicit market setting or a deliberately narrow catalog plus jurisdiction-neutral label-checking language; neither is legal advice.

## 21. Privacy and data minimization

Specific allergies/celiac are transient in validation today and are not copied into Phase2D1/Phase3A. Options:

| Architecture | Assessment |
|---|---|
| A extend Phase3A result | rejects separation and duplicates sensitive data/regresses parent schema |
| B separate Phase3B session context | future testable boundary, but duplicates sensitive values and needs old/direct-route policy |
| C React state only | minimal persistence, but unavailable after route boundary/reload |
| D derive at submit, store minimal filtered capability | best future concrete option if approved: coded restrictions only, no raw text, strict schema/TTL/session lifetime |
| E store none and disable concrete templates | recommended now; Model A needs no restriction copy |

No URL, server, analytics, cookie, `localStorage`, IndexedDB, or network transport. Do not use the Phase2D2A journal. A malformed/missing future context fails closed. Clear it with the relevant session lifecycle; do not persist at the calibration boundary.

## 22. Schema options

| Option | Decision |
|---|---|
| 1 extend `nutrimind.phase3a.result.v1` | reject; calculation parent stays immutable |
| 2 `nutrimind.phase3b.context.v1` | possible future 3B2 after privacy/safety approval |
| 3 `nutrimind.phase3b.result.v1` | premature; catalog/output contract not chosen |
| 4 presentation-only derivation | recommended for category-only 3B1; no schema |
| 5 defer concrete support | required until safe normalized context exists |

Non-calculated objects never carry a calculated parent, products, portions, or nutrition numbers. Missing, malformed, unknown-version, and old sessions produce no concrete output.

## 23. Evidence review

| Source | Population / supported conclusion | Unsupported conclusion / limitation | NutriMind applicability |
|---|---|---|---|
| EAACI, *Management of IgE-mediated Food Allergy*, 2024 | children and adults with confirmed IgE-mediated allergy; allergen avoidance, individual management/dietetic support | does not validate generic product names, app diagnosis, fuzzy free text, or cross-contact guarantees | supports hard exclusion before output; disclaimer is insufficient |
| American College of Gastroenterology, celiac guideline update, 2023, DOI `10.14309/ajg.0000000000002075` | people with celiac disease; strict lifelong gluten-free diet and follow-up | not wheat-allergy or self-avoidance policy; not product certification | requires separate celiac gate |
| ESPGHAN GFD position paper, 2024 | pediatric celiac; labels, naturally GF/containing foods, cross-contact and dietary quality | pediatric nutrition recommendations cannot be generalized to adults | safety principles support label/cross-contact policy only |
| Academy of Nutrition and Dietetics, vegetarian patterns, 2025, DOI `10.1016/j.jand.2025.02.002`; published erratum DOI `10.1016/j.jand.2025.156227` considered | nonpregnant/nonlactating adults; appropriately planned vegetarian/vegan patterns can be adequate | a few examples do not prove adequacy; not all life stages | exact pattern and full planning are prerequisites; no micronutrient claim |
| Academy/DC/ACSM, *Nutrition and Athletic Performance*, 2016, DOI `10.1016/j.jand.2015.12.006` / `10.1249/MSS.0000000000000852` | athletes; nutrition/performance planning context | does not override allergy/celiac exclusion or justify a food from a coarse timing label | no automatic sports-food mapping |
| FDA allergen guidance, including 2025 Q&A; FASTER sesame effective 2023 | US-regulated foods; nine major allergen source declarations | not global, not all foods/settings, not cross-contact guarantee | current taxonomy resemblance is not global completeness |
| FDA gluten-free rule | US voluntary claim; `<20 ppm` legal standard for covered food | app cannot certify or generalize globally | label evidence is product/market specific |
| EU Regulations 1169/2011 and 828/2014 / Commission guidance | EU 14 allergen categories and harmonized gluten-free statements | not US/EAEU law; not a generic-name safety guarantee | demonstrates jurisdiction dependence |

Evidence conclusions: avoidance cannot be replaced by a disclaimer; names alone cannot establish ingredients/cross-contact; celiac needs its own strict policy; vegetarian/vegan adequacy requires planning; examples prove neither micronutrient adequacy nor performance; timing labels do not select foods; and exact food-to-macro matching requires validated composition data.

Primary/official links reviewed: [EAACI guideline](https://eaaci.org/guidelines-position-papers/eaaci-guidelines-on-the-management-of-ige-mediated-food-allergy/), [ACG celiac guideline record](https://pubmed.ncbi.nlm.nih.gov/36602836/), [ESPGHAN position paper](https://www.espghan.org/knowledge-center/publications/Gastroenterology/2024-Gluten-Free-Diet), [Academy position and erratum links](https://pubmed.ncbi.nlm.nih.gov/39923894/), [FDA allergens](https://www.fda.gov/food/nutrition-food-labeling-and-critical-foods/food-allergies), [FDA gluten-free labelling](https://www.fda.gov/food/nutrition-education-resources-materials/gluten-and-food-labeling), [European Commission gluten-free rules](https://food.ec.europa.eu/food-safety/labelling-and-nutrition/specific-groups/gluten-free-food_en), and [EU allergen guidance](https://food.ec.europa.eu/food-safety/labelling-and-nutrition/food-information-consumers-legislation/guidance-documents_en). No blog, shop, commercial planner, forum, social-media post, or AI summary was used as evidence.

## 24. Safety feasibility review

| Question | Answer and reason |
|---|---|
| safe food-group slots? | yes, only if abstract, non-personalized, and not labelled allergen-safe |
| safe concrete examples? | no with current production inputs |
| states requiring examples off? | all current states; in future any allergy/celiac/unknown/free-text/malformed/incomplete context until reviewed support exists |
| current allergy taxonomy sufficient? | no; not collected and not jurisdiction-complete |
| celiac context sufficient? | no for products; marker exists only transiently |
| dietary context sufficient? | no; absent |
| support free-text hard restrictions? | no; only after exact confirmation workflow, otherwise off |
| hard exclusions without metadata? | no |
| LLM generation safe? | no as generator/filter for hard exclusions |
| ordinary string array safe? | no |
| human-reviewed catalog needed? | yes for any future example |
| country scope needed? | yes for label/legal claims and processed products |
| label-verification capability needed? | yes for future processed/celiac examples |
| MVP without portions? | yes; required |
| category-only utility remains? | yes: it explains meal composition roles without false product precision |

## 25. Independent architecture review

| MVP | Value | Safety / reassurance | Size, regression, testability, privacy, UX | Verdict |
|---|---|---|---|---|
| A neutral slots only | modest but real | highest safety if limitations explicit | smallest; deterministic; no sensitive copy; good mobile explainability | recommend |
| B foods only for “unrestricted” | higher apparent value | unsafe because unknown restriction index can collapse to unrestricted and no market/catalog proof | medium, misleading fallback risk | reject now |
| C foods + metadata | potentially high | viable only after new inputs/catalog/review | large, testable later, privacy context needed | future 3B2 |
| D defer all 3B for questionnaire normalization | safest but loses category value | no false reassurance | delays useful harmless layer | unnecessary for Model A; mandatory before B/C |

Preliminary recommendation: MVP A, while treating restriction-aware examples as deferred behind D prerequisites.

## 26. Adversarial review questions

1–12: no allergy/compound/processed/oat/vegan/substitute example exists in MVP A; unknown context never opens examples. Allergy, intolerance, celiac, dislike and pattern are not conflated. 13–15: no Phase3A numbers/meals/relations change and timing does not optimize foods. 16–19: wording explicitly says categories, not menu, macro match, adequacy or medical treatment. 20–22: no new sensitive persistence/default/direct route. 23: Phase3A remains independent. 24: limitations fit one paragraph. 25: removing category slots would be narrower but eliminates the intended user value.

## 27. Adversarial review outcome

The initial category-only recommendation passed only after one correction: the phrase “safe food-group slots” could falsely imply allergy/celiac filtering. The final recommendation calls them **neutral abstract food-group slots** and does not claim they are personalized to restrictions. Concrete examples are disabled for every current production state, including the apparent unrestricted state, because an unknown restriction index can silently map to `none` and there is no durable restriction context. No unrestricted fallback exists.

## 28. Final contradiction check

| Compared requirements | Result |
|---|---|
| UI inputs vs inventory/schema | resolved by distinguishing rendered production fields from schema-only fields |
| allergy model vs downstream contract | contradiction found: core can model named allergies, production cannot collect or retain them; examples deferred |
| celiac marker vs catalog metadata | contradiction found: marker alone cannot filter; concrete celiac output disabled |
| dietary policy vs questionnaire | contradiction found: no pattern input; no pattern-specific output |
| free text vs fail-closed | aligned: no parsing; unknown disables concrete output |
| precedence vs rendering | aligned prospectively: all filters must complete before rendering; warnings never replace them |
| taxonomy vs schema | aligned: no final catalog schema is asserted |
| privacy vs direct route | aligned: 3B1 adds no sensitive storage; future malformed/missing context fails closed |
| Phase3A1 invariants vs MVP | aligned: IDs/order/weights/numbers/reconciliation unchanged |
| Phase3A2 vs MVP | aligned: relation labels remain presentation-only |
| non-calculated states vs eligibility | aligned: no personalized template |
| test matrix vs policy | aligned: tests target failure behavior and invariants, not an unchosen catalog fixture |
| MVP vs portions/recipes | aligned: none |

## 29. Future test matrix

| Group | Deterministic cases and expected invariant |
|---|---|
| Base eligibility | calculated unrestricted/allergy/celiac/allergy+celiac/vegetarian/vegan/allergy+vegan; minor, blocked, specialist_review, invalid_input; missing/malformed parent; old schema. Only valid calculated parent can show neutral slots; none show current concrete examples |
| Restrictions | one/multiple/unknown/free-text/empty/malformed allergy; allergy≠intolerance≠dislike; celiac≠wheat allergy; conflicts; all examples excluded; no unrestricted fallback |
| Celiac | exclude wheat/barley/rye/triticale/malt; brewer’s yeast/sauces/seasonings/substitutes/grain mixes ambiguous; explicit oats policy; naturally GF category; processed label requirement; cross-contact warning; no guarantee |
| Patterns | exact supported future literals; missing/unknown; vegan/vegetarian exclusions; allergy/celiac intersections; no adequacy claim |
| Phase3A | all three structures × lower/central/upper × rest/training types; meal IDs/order/kcal/P/F/C/trace/reconciliation identical; no insertion/removal; snack optional |
| Phase3A2 | before/after/reset never alters template; no automatic timing mapping or training snack |
| Privacy | no URL/server/analytics/localStorage/IndexedDB/boundary persistence; minimal session context if later approved; malformed fails closed |
| UI/content | no brands/supplements/recipes/portions/exact-match/medical claims/shaming; 390×844 no overflow; keyboard, visible focus, screen-reader labels; restriction state not colour-only |
| Regression | Phase2D1, 3A1, 3A2, calibration, nine sections unchanged; existing tests pass with zero skips when implementation is eventually authorised |

Catalog fixtures remain undefined until catalog policy is selected.

## 30. Recommended phase split

- 3B1: neutral slots plus eligibility/presentation policy; no new restriction schema is needed for neutral slots. Questionnaire normalization work may be designed alongside but must not be silently merged into this audit.
- 3B2: exact normalized restriction capability, human-reviewed small catalog, deterministic intersection filtering, market scope, label verification, celiac-specific content/evidence review; no portions.
- 3B3: validated composition data, raw/cooked/portion model, solver and separate mathematical audit. Do not merge with 3B2.
- 3C: dishes/recipes/menus, ingredient graph, preparation/yield and nutrient-quality policy. Do not merge with 3B3.

Catalog text requires human content ownership; celiac, allergen derivatives, oats, and timing-food claims require new evidence review; any stored restriction context or cross-route lifecycle requires new privacy review.

## 31. Blocking policy decisions

| Decision | Recommended explicit choice | Residual risk |
|---|---|---|
| MVP level / groups vs foods | Model A neutral groups | may feel generic; wording must prevent menu interpretation |
| adults-only | calculated adults only for 3B1 | age admission relies on existing parent |
| allergy representation | future exact multi-code confirmed set; no aggregate marker for examples | taxonomy/diagnostic provenance remains user-declared |
| unknown/free text | concrete output off; confirmation required | user may receive less output |
| celiac / oats / processed | concrete output off now; separate reviewed label policy; no default oats | jurisdiction and cross-contact remain product-specific |
| cross-contact wording | never guarantee; explain verification limitation | warning is not filtering |
| pattern values | none until exact questionnaire literals approved | reduced functionality |
| precedence | safety→celiac→allergy→pattern→explicit culture→preference→variety | exhausted catalog must remain empty |
| catalog source/owner | small static versioned catalog, dietitian/allergy/celiac content review and named owner | maintenance/version staleness |
| jurisdiction | explicit future market scope | travel/imported products complicate labels |
| storage | none for 3B1; future minimal session context only | reload/session lifecycle trade-off |
| UI | optional accessible details under meal cards | repeated content/cognitive load |
| timing | ignore for derivation; display relation only | less personalization |
| portions | excluded | no quantitative food guidance |
| schema | none for 3B1; context schema only before 3B2 | old sessions must fail closed |
| old session | Phase3A works; concrete 3B unavailable | users must retake future questionnaire |

## 32. Expected future file scope

Possible new files after approval: `PHASE_3B1_REPORT.md`, `core/food-templates/types.ts`, `restriction-context.ts`, `policy.ts`, and `tests/food-templates.test.mjs`. `catalog.ts` and `filter.ts` belong only to 3B2 after content policy. Possible existing edits: `PHASE_2_ARCHITECTURE.md`, `app/questionnaire/page.tsx` (only if separately approved inputs are added), `app/meal-structure/meal-structure-client.tsx`, and `app/globals.css`.

Must remain unchanged by 3B1 numeric work: `core/calculation/meal-allocation.ts`, `meal-policy.ts`, `phase3a.ts`, Phase2C2 formulas, hydration policy, Phase3A1 schema, Phase3A2 context schema and meal-timing modules, calibration IndexedDB, questionnaire section count, Vercel configuration, and report-demo business logic.

## 33. Recommended MVP

1. Phase 3B is useful now only as neutral category education.
2. Food-group slots are sufficient for 3B1.
3. Concrete examples are not currently admissible for any production user.
4. Show 3B1 only with a valid calculated adult Phase3A parent; non-calculated states receive none.
5. Do not expand the questionnaire for category-only 3B1; exact restriction inputs are mandatory before 3B2 and require separate approval.
6. No normalized restriction context is needed for neutral 3B1; it is required before concrete 3B2.
7. Unknown/free-text/malformed context disables concrete output without fallback.
8. Celiac receives abstract slots only; concrete products await separate strict policy.
9. Multiple allergies are a future full-set intersection; any unsupported member disables examples.
10. Vegan/vegetarian are unsupported until exact literals exist; never infer them.
11. No new session key for 3B1.
12. Place optional accessible details beneath each existing meal card.
13. Do not use Phase3A2 timing to choose or change categories.
14. No portions or grams.
15. No recipes or menus.
16. Phase3A remains completely available without Phase3B.

## 34. Explicit exclusions

No production code, product picker/card, concrete food, menu, recipe, portion, grams, new calculation phase, route, storage schema, UI production change, nutrient database, micronutrient/deficiency/supplement/sports-food/brand/restaurant/affiliate recommendation, diagnosis, therapeutic/elimination/reintroduction advice, oral food challenge, emergency treatment advice, performance promise, deployment, commit, or push is part of this audit. Phase 2D2A journal data is excluded from food selection. This document does not begin Phase 3B1.
