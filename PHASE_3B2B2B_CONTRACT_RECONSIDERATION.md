# Phase 3B2B2B — reconsideration of generic food and cross-contact contracts

Audit date: 2026-08-04. Scope: contract analysis only. No implementation, content approval, specialist review, or medical recommendation is authorized by this document.

## 1. Executive summary

The recommended direction is a hybrid two-layer model, implemented through separate strict contracts rather than by weakening or silently redefining the existing v1 engine:

1. A future generic-example layer may show bounded single-food examples only when the restriction context is valid, `foodAllergyStatus === none`, `celiacStatus === no`, and the dietary pattern is supported. It may use intrinsic identity and explicit dietary-pattern metadata, but it must not make allergy, cross-contact, or celiac-suitability claims.
2. A later verified-product layer may support allergy-aware filtering only for an exact packaged product/SKU with applicable manufacturer, package, label, cross-contact, source, and review evidence.
3. Every other context remains on the Phase 3B1 abstract fallback until an independently audited layer supports it.

The present v1 catalog contract remains unchanged and inactive. Production coverage remains `nutrimind.catalog-coverage.none.v1`; no production artifact exists. A separate, narrow engine/schema patch must be approved and completed before content dossier preparation or specialist review.

## 2. Repository confirmation

- Root: `C:/Projects/nutrimind`; branch: `main`.
- Local HEAD, `origin/main`, and remote `refs/heads/main`: `f4895afdb3519cfe266eddad56ccf25562302094`; divergence `0 0`.
- Primary worktree is `C:/Projects/nutrimind`; the detached `C:/Projects/nutrimind-original` worktree was not used.
- No merge, rebase, or cherry-pick was active.
- Pre-flight contained exactly one untracked file: `PHASE_3B2B2A_CONTENT_AUDIT.md`.

## 3. Current production baseline

- The Phase 3B2B1 engine is implemented, but no production catalog artifact or entity exists.
- Restriction context uses `nutrimind.phase3b2.restriction-context.v1`, storage key equal to that version, coverage `nutrimind.catalog-coverage.none.v1`, supported allergen set `[]`, and `futureFilterMode: abstract_only`.
- Production capability is `abstract_only`; Phase 3B1 remains available.
- Future v1 constants are catalog/schema/entity/safety/source/review/policy v1, content `nutrimind.food-catalog.ru.v1.0.0`, and coverage `nutrimind.catalog-coverage.ru.v1`.
- The future envelope permits only `single_food`, exactly 16 supported allergen codes (all taxonomy codes except `oats`), four dietary patterns, and no celiac support.
- A profile requires all 17 allergen assessments, separate ingredient and cross-contact states, gluten and celiac states, all four pattern assessments, sources, and two independent reviews. Approved reviews expire at `reviewedAt + 180 × 86400000 ms`.
- Validation uses exact fields, canonical ordering, Unicode/identifier/hash/date validation, deep freeze, and whole-catalog invalidation.
- Capability is currently only `abstract_only | concrete_available`. Filtering requires a resolved context, valid catalog and `concrete_available`; for each selected allergen it requires `ingredientStatus === does_not_contain` and cross-contact `not_applicable | assessed_no_known_warning`. It never relaxes restrictions when results are empty.

## 4. Phase 3B2B2A findings

The prior audit proposed exactly 24 candidates: 0 ready for review, 9 needing evidence, 7 blocked by cross-contact uncertainty, and 8 blocked by generic variability. All 24 lack a generic-class cross-contact dossier. It concluded `CONTRACT_RECONSIDERATION_REQUIRED`, kept production content absent, and preserved coverage `none.v1`. Its candidate-level evidence confirms the contract problem rather than merely hypothesizing it.

## 5. Exact contradiction

The v1 profile binds immutable hashes, sources, all 17 ingredient/cross-contact entries, two approvals, and expiry to one entity version. A generic food class has no single producer, line, package, label, or stable cross-contact environment. It can support intrinsic identity but cannot provide one truthful commercial fingerprint for every real manifestation. Thus the validator can accept a syntactically complete generic profile only if reviewers assert commercial facts that the generic class does not establish; leaving them unknown makes filtering fail closed and the complete catalog practically unusable.

## 6. Four-model comparison

| Dimension | Model A: current generic allergy-aware | Model B: generic only for unrestricted users | Model C: verified SKU only | Model D: hybrid two-layer |
|---|---|---|---|---|
| Safety | fail-closed but invites unsupported generic absence claims | strong if exact context gate precedes output | strongest evidence-to-product binding | strong with strict layer separation |
| Usefulness | low: most items/users fail | useful for allergy-none/celiac-no dietary examples | useful for allergy users only after expensive catalog creation | useful first generic release plus credible future allergy path |
| Evidence feasibility | poor | feasible for identity/pattern, not commercial safety | feasible per exact product, subject to label limits | feasible per layer |
| Cross-contact precision | inherently false or unknown at class level | explicitly out of scope | product/package/facility applicable | none in generic capability; exact in product capability |
| Celiac | unsupported | generic blocked unless explicit `no` | future separate policy still required | generic blocked; future celiac stage separate |
| Update/review burden | high with little evidentiary value | moderate | very high and continuous | moderate now, high only for later SKU layer |
| Legal/label dependence | mismatched to generic class | regulatory review for wording, no label claim | central | isolated to product layer |
| Privacy/determinism | local/deterministic | local/deterministic | can remain bundled/local | can remain bundled/local |
| Migration/current engine | none, but content remains blocked | new generic contract and capability | new entity/schema/catalog | separate generic engine now; preserve v1 for future product redesign |
| Initial batch | not defensibly publishable | feasible after new contract and review | not near-term | feasible generic batch after patch |
| Residual risk | misleading safety inference | examples may still be misunderstood | label drift, SKU churn, precautionary-label limits | layer confusion unless types, capability, UI, and sources are separate |

Model A is rejected. Model C is a valid long-term allergy-aware direction but not the next implementation scope. Model B is safe but lacks an explicit future product boundary. Model D gives Model B's narrow first release plus a separated future allergy layer.

## 7. Preliminary owner direction

The owner's preliminary preference for Model D is consistent with the safety goal only if it means two distinct schemas/capabilities and not two meanings hidden behind `concrete_available`. Current restriction-context values are sufficient to derive the generic gate; questionnaire and taxonomy need not change. Current catalog entity/profile, capability, filter, coverage identifiers, rule/warning/error identifiers, and whole-catalog behavior cannot represent the new semantics without an explicit new version and engine patch.

## 8. Generic versus commercial metadata

| Intrinsic metadata | Commercial-product metadata |
|---|---|
| stable generic/display name; botanical/animal origin; bounded form; slot membership; intrinsic positive allergen identity; gluten-cereal relationship; explicit pattern compatibility | producer; SKU/version; ingredients as sold; package/label; facility/shared-equipment warnings; cross-contact assessment; product-specific absence; label verification; product fingerprint and lifecycle |

Current entity name, slots, display order, lifecycle, and part of pattern assessment are conceptually intrinsic. Current `ingredientStatus` mixes intrinsic presence with a commercial absence claim. `crossContactStatus`, `labelVerificationStatus`, manufacturer/package source types, and product evidence are commercial. `glutenRelationship` may be intrinsic, but current `celiacStatus` is clinical/product-facing and cannot be derived from it. Current hashes/reviews are reusable mechanisms, but their reviewed subject and policy must differ by layer.

## 9. Capability split

1. One existing `CatalogCapabilityStatus` cannot safely express two independently valid layers without ambiguous branching.
2. A new discriminated capability domain is recommended, with layer identity in the type/result.
3. Generic capability must not reuse existing `concrete_available`; callers could reasonably interpret it as restriction-aware concrete safety.
4. The word is materially misleading for allergy/celiac contexts.
5. Conceptual statuses such as `generic_examples_available` and `verified_products_available` are clearer, but exact enum names require owner approval during the patch design. A result with independent `genericExamples` and `verifiedProducts` branches is safer than a single mutually exclusive status.
6. Backward compatibility: keep current v1 result and production function unchanged/abstract-only; add a separate versioned API, then adapt callers explicitly.
7. Partial fail-open is avoided by deriving each branch independently, requiring exact context/schema/coverage matches, and defaulting unknown layers/statuses to unavailable with Phase 3B1 fallback.

## 10. Generic safety boundary

Generic examples may assert a reviewed definition, origin, form, slot, intrinsic positive allergen relationship, gluten-cereal relationship, and explicit dietary-pattern relationship. They may not assert absence of cross-contact, contamination, shared equipment, packaging variation, current label conformity, allergy suitability, celiac suitability, or invariant composition of a commercial item. “Intrinsic” means true of the bounded identity; “commercial” means dependent on manufacture, processing, packing, transport, label, or SKU. The generic gate is a context eligibility rule, not a safety assessment.

## 11. Cross-contact options

| Option | Required impact | Burden/claims | Misuse risk | Verdict |
|---|---|---|---|---|
| 1. Keep exact gate | no code change; generic remains blocked | impossible class-wide source/review burden | pressure to invent favorable values | reject |
| 2. Not applicable only for allergy-none users | capability/filter change; schema semantics still awkward | moderate; disclaimer required | a stored `not_applicable` may be reused by future caller | safer than 1, not preferred |
| 3. Remove from generic profile | new generic schema/validator/capability/filter/source policy | clean separation and lower review burden | lowest when types are distinct | recommend |
| 4. Store unknown but make non-capability-bearing | profile, validator, capability and filter changes | preserves matrix shape | future caller may treat unknown inconsistently | acceptable fallback, less clean |

Recommended invariant: generic schema contains no commercial cross-contact assertion. Its capability requires explicit allergy none and celiac no before any item filtering. Unknown cross-contact can never open the verified-product branch; celiac never receives generic clinical suitability; Phase 3B1 remains available.

## 12. Allergen metadata options

- A: keeping the full matrix unchanged preserves a misleading `does_not_contain` distinction and unnecessary commercial burden.
- B: separating intrinsic allergen relationship from commercial cross-contact relationship matches evidence scope and is recommended.
- C: positive/intrinsic presence only is the safest generic representation; non-listed codes remain unassessed, never absent.
- D: a required 17-code matrix not used for capability offers schema consistency but invites downstream misuse and review theater.

For a pure definition, `does_not_contain` could mean “not intrinsically part of this definition,” but users and callers may read it as a package/contamination claim. Use new field names and a new generic-profile schema version rather than redefine the old value. Keep the existing v1 engine unchanged. Absence of metadata remains not absence of allergen.

## 13. Celiac boundary

Generic examples require both `context.status === resolved` and `celiacStatus === no`. Confirmed, `not_sure`, withheld, missing, malformed, unsupported, and old contexts receive no generic or verified output under the current releases. `glutenRelationship` never proves suitability; “naturally gluten-free” is not a commercial product claim. Oats stays excluded. Phase 3B1 remains available. No additional questionnaire field is required now; exact explicit `no` plus valid current context is sufficient for this narrow non-celiac capability.

## 14. Allergy-status matrix

| Allergy state | Generic examples | Verified products now | Phase3B1 | Filtering | Explanation |
|---|---|---|---|---|---|
| `none` | potentially available if all other gates pass | unavailable | available | generic pattern filter only | examples are not allergen-assessed products |
| `known` | unavailable | unavailable until future verified layer | available | no concrete filtering now | product evidence required for allergy restrictions |
| `other` | unavailable | unavailable | available | none | restriction unresolved |
| `not_sure` | unavailable | unavailable | available | none | uncertainty is not “none” |
| `withheld` | unavailable | unavailable | available | none | no safety assumption from withheld data |
| missing / `not_provided` | unavailable | unavailable | available | none | explicit answers required |
| `malformed` | unavailable | unavailable | available | none | invalid context |
| `unsupported` | unavailable | unavailable | available | none | unsupported restriction |

No row falls back to unrestricted concrete output.

## 15. Dietary-pattern role

The first layer can be dietary-pattern-aware for supported `omnivore`, `vegetarian`, `vegan`, and `pescatarian` contexts while remaining neither allergy-aware nor celiac-aware. Compatibility must be explicit and reviewed per bounded identity. Processing aids and ambiguous animal-derived processing keep an entity/pattern unknown or blocked. Pattern filtering never substitutes for allergy filtering and never claims nutritional adequacy, completeness, portions, or macro fit.

## 16. Review-model reconsideration

The generic layer still merits two independent reviews until the owner explicitly changes policy: one nutrition/taxonomy reviewer for definition, slots, and pattern mapping; one allergen/celiac specialist to verify intrinsic positive relationships and absence of unsafe claims. A regulatory specialist may replace or supplement the first role where wording/source scope demands it. Review roles should differ by entity type under a new review-policy version. The verified-product layer requires an allergen/celiac specialist and regulatory-labeling specialist bound to exact product/package sources. Independence and expiry remain; the reviewed claims become narrower for generic entities.

## 17. Source-model reconsideration

Generic sources: official food-definition/nomenclature, taxonomy, clinical, regulatory, and food-composition references only for identity—not nutrient values. Manufacturer sources are inapplicable to a generic class. Future product sources: manufacturer specification/page, current package label/document/image, product version and fingerprint. Separate generic and product source schemas, or at minimum a mandatory source-purpose discriminator, are required. Separate schemas are preferred to prevent generic evidence from validating a product. New policy versions are required; no real dossier sources are created here.

## 18. Entity architecture options

| Architecture | Strengths | Risks/costs | Decision |
|---|---|---|---|
| A. One entity union | shared envelope and presentation | union branches can leak profiles/coverage; current validator changes broadly | not preferred |
| B. Two catalogs/engines | strongest validation, removal, versioning and source isolation | modest duplication and UI orchestration | viable |
| C. One presentation entity/two profiles | presentation reuse | complex referential validity and accidental profile substitution | reject |
| D. Preserve current contract; separate simplified generic-example schema/catalog | narrow migration, strict isolation, current v1 stability | separate capability integration/tests | **selected** |

Architecture D implements the hybrid product direction using two separately versioned catalogs/engines. The current v1 contract may later inform a verified-product successor, but it must not be relabeled as SKU-ready without a separate audit because its entity type is currently only `single_food`.

## 19. Current-engine reuse

Reusable patterns/utilities: constants discipline, identifier/Unicode/hash/date validators, canonical ordering, deep freeze, strict unknown-field policy, diagnostics, deterministic RuleIds, independent review binding, expiry mechanism, local filtering, privacy invariants, and Phase 3B1 fallback.

Future changes: new generic entity/profile/source/review/envelope schemas; generic validator; layer-aware capability; generic pattern filter; separate coverage/policy/version/error/warning/rule identifiers; integration tests. Current v1 entity/profile/capability/filter and their tests should remain unchanged unless a later verified-product audit replaces them.

## 20. Versioning options

- A, changing v1 semantics, is rejected.
- B, catalog schema v2, is possible but unnecessarily couples two layers.
- C, adding a profile to envelope v1, violates exact-field and semantic version expectations.
- D, a separate generic-example catalog schema, is recommended.

New semantics receive new schema/profile/source/review/policy/coverage identifiers. Exact strings are owner decisions and should be specified in the implementation audit. Existing versions stay supported and inactive; old production remains abstract-only. Restriction-context migration is unnecessary if the new capability accepts the current validated context as input without changing its stored shape or `futureFilterMode` semantics. If that field must describe new capability, use a new derived API rather than silently mutate persisted v1.

## 21. Coverage reconsideration

Use separate layer coverage. Generic coverage means supported generic-definition and dietary-pattern domains with **zero allergy-aware and zero celiac coverage**. Zero allergy coverage must be explicitly named/typed, never interpreted as unrestricted safety. The current `nutrimind.catalog-coverage.ru.v1` should remain reserved/inactive pending a verified-product contract decision; it must not label generic examples as allergy-aware. Mixed or unresolved contexts fail closed per capability branch. Capability is derived per layer from exact context and exact coverage.

## 22. User-facing terminology

- Section heading: **«Примеры базовых продуктов»**.
- Item label: **«Пример продукта»**.
- Disclaimer: **«Примеры учитывают выбранный тип питания, но не подтверждают отсутствие аллергенов, перекрёстного контакта или пригодность при целиакии. Это не индивидуальная рекомендация; проверяйте конкретный продукт и рекомендации специалиста.»**
- Allergy/celiac unavailable: **«Для указанных аллергий или статуса целиакии примеры конкретных продуктов не показываются: для них нужны данные проверенного товара. Доступна нейтральная структура приёма пищи.»**
- Empty result: **«По выбранному типу питания проверенных примеров пока нет. Ограничения не ослаблены; используйте нейтральные группы продуктов.»**

Avoid “safe”, “approved for allergy/celiac”, certification, prescription, and macro-fit language. “Пример продукта с размеченными ограничениями” remains accurate but sounds more safety-assessed than the new generic layer; “вариант продукта” and “категория” are less precise.

## 23. Re-evaluation of 24 candidates

Current-model statuses are retained from 3B2B2A. New-model fields are audit judgments, not approvals. `yes*` means feasible only after the generic schema and sources are fixed and two reviews occur.

| # | Candidate | Current status | Definition | Pattern | Intrinsic allergen | Source/review | Generic variability | Future review candidate | Replace |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | Chicken egg | cross-contact blocked | yes | yes | eggs positive feasible | yes* | no | yes* | no |
| 2 | Chicken meat | cross-contact blocked | yes | yes | positive-only model feasible | yes* | no | yes* | no |
| 3 | Turkey meat | cross-contact blocked | yes | yes | feasible | yes* | no | yes* | no |
| 4 | Beef | cross-contact blocked | yes after tissue scope | yes | feasible | yes* | no | yes* | no |
| 5 | Atlantic cod | cross-contact blocked | yes with species | yes | fish positive feasible | yes* | no | yes* | no |
| 6 | Red lentils | generic variability blocked | no: whole/split/species scope | likely | feasible | not yet | yes | no | likely |
| 7 | Buckwheat groats | generic variability blocked | no: form/thermal state | likely | feasible | not yet | yes | no | likely |
| 8 | White rice | cross-contact blocked | yes with milled form | yes | feasible | yes* | no | yes* | no |
| 9 | Millet groats | generic variability blocked | no: species/form | likely | feasible | not yet | yes | no | likely |
| 10 | Corn groats | generic variability blocked | no: grind/grade | likely | feasible | not yet | yes | no | likely |
| 11 | Potato | needs evidence | yes | yes | feasible | yes* | no | yes* | no |
| 12 | Sweet potato | needs evidence | yes with botanical scope | yes | feasible | yes* | no | yes* | no |
| 13 | Carrot | needs evidence | yes | yes | feasible | yes* | no | yes* | no |
| 14 | White cabbage | needs evidence | yes with botanical scope | yes | feasible | yes* | no | yes* | no |
| 15 | Cucumber | needs evidence | yes | yes | feasible | yes* | no | yes* | no |
| 16 | Tomato | needs evidence | yes | yes | feasible | yes* | no | yes* | no |
| 17 | Apple | needs evidence | yes with coating excluded | yes | feasible | yes* | no | yes* | no |
| 18 | Banana | needs evidence | yes with dessert-fruit scope | yes | feasible | yes* | no | yes* | no |
| 19 | Avocado | needs evidence | yes | yes | feasible | yes* | no | yes* | no |
| 20 | Sunflower seed | generic variability blocked | no: hull/form | likely | feasible | not yet | yes | no | likely |
| 21 | Pumpkin seed | generic variability blocked | no: species/hull | likely | feasible | not yet | yes | no | likely |
| 22 | Flax seed | cross-contact blocked | yes as whole raw seed | yes | feasible | yes* | no | yes* | no |
| 23 | Sunflower oil | generic variability blocked | no: refining class | uncertain | processing-sensitive | not yet | yes | no | yes |
| 24 | Olive oil | generic variability blocked | no: legal/production class | uncertain | processing-sensitive | not yet | yes | no | yes |

Result: 16 of 24 can become generic-layer review candidates after the engine/schema patch and dossier completion; none is ready now. Eight remain definition/processing-variable. The batch can remain 24 only after those eight are narrowed successfully or replaced and audited.

## 24. Candidate replacement needs

Prioritize narrowing before replacement for lentils and groats; replace when a stable definition cannot be sourced. Oils should be replaced in the first generic batch because processing-class evidence adds little value to a simple example layer. Reserves must undergo the same audit. Plausible lower-variability substitutions include species-defined plain meat for protein, intact roots for carbohydrate, and explicitly defined whole peanut/walnut/sesame entities for fat; the latter carry intrinsic allergen relationships and therefore remain unavailable to every allergy context by gate, not by favorable filtering. No reserve is approved here. Exact replacements are an owner/content-audit decision.

## 25. Three-release phase split

1. **Release 1 — generic examples:** separate generic schema; only resolved allergy-none/celiac-no; supported dietary patterns; no allergy/celiac claims.
2. **Release 2 — verified SKU allergy layer:** separate future audit, product identity/label/manufacturer/cross-contact evidence and lifecycle; no implementation now.
3. **Release 3 — celiac-reviewed subset:** separate policy, label verification, contamination controls, and oats decision; no implementation now.

This ordering preserves value without pretending the generic layer solves commercial safety.

## 26. Context decision matrix

| Context | Phase3B1 | Generic examples | Verified products | Reason |
|---|---|---|---|---|
| allergy none + celiac no + supported pattern | yes | potentially yes | no current layer | exact narrow gate |
| allergy known | yes | no | future only | commercial evidence required |
| multiple allergies | yes | no | future only with full intersection | never relax intersection |
| allergy other / not_sure / withheld | yes | no | no | unresolved |
| celiac confirmed / not_sure | yes | no | no current layer | fail closed; no suitability inference |
| oats allergy | yes | no | no current layer | oats unsupported |
| vegan + allergy none + celiac no | yes | yes if pattern-reviewed catalog valid | no | generic pattern filtering only |
| vegetarian + allergy none + celiac no | yes | same | no | same |
| pescatarian + allergy none + celiac no | yes | same | no | same |
| malformed or missing context | yes | no | no | explicit valid context required |
| old context | yes | no | no | version mismatch fails closed |
| unsupported context/pattern | yes | no | no | no concrete capability |

## 27. Privacy confirmation

The generic catalog remains bundled. A future SKU catalog may also be bundled. Filtering remains client-side; no restriction context enters URLs, analytics, personalized fetches, server-side filtering, persisted selection, localStorage, or IndexedDB. The Phase2D2A journal is unchanged. A schema split alone does not require a new privacy model, but implementation still needs a regression privacy check because a new caller/catalog loader could accidentally add network or persistence behavior.

## 28. Safety invariants

1. Allergy hard restrictions never weaken.
2. Unknown and missing never become none.
3. Generic examples are neither allergy-safe nor celiac-safe claims.
4. Unknown cross-contact never opens allergy-aware output.
5. Oats is never automatically allowed.
6. Multiple restrictions apply as an exact intersection.
7. Unsupported restrictions disable every concrete layer.
8. Phase 3B1 remains the fallback.
9. Nutrition totals do not change; no portions or menus are added.
10. No fuzzy matching or LLM safety classification.
11. Restriction context remains local.

## 29. Future implementation scope

No files are changed now. A separately approved patch would likely add a generic-example types/schema/validator/capability/filter module and its tests under `core/food-catalog` or a clearly separate sibling domain, plus a contract report. Existing v1 files should remain unchanged where possible; integration may require an additive layer orchestrator and new diagnostics.

New tests: exact allergy/celiac/status matrix; old/malformed context; zero-allergy coverage semantics; pattern filtering; unknown-field/version rejection; cross-layer source rejection; whole-generic-catalog invalidation; deterministic ordering/freeze; Phase3B1 fallback; privacy/no-network boundaries; no portions/macros; 180-day review edge if retained.

Unchanged: questionnaire, restriction taxonomy, restriction-context storage key and persisted v1, Phase2 calculations, Phase3A, Phase3A2, Phase3B1, calibration, Vercel config, and current 216 tests. Those tests should remain valid; new tests are additive. Existing versions remain supported and production remains abstract-only. UI changes will eventually be needed for explicit terminology and unavailable messages, but not in the engine patch and not now. No user-data migration is required.

## 30. Blocking owner decisions

| # | Decision | Recommended | Alternatives / residual risk | Blocks implementation |
|---:|---|---|---|---|
| 1 | Hybrid model | approve architecture, not implementation | B is narrower; C delays value | yes |
| 2 | Generic only for allergy none | yes | no generic layer; wider gate is unsafe | yes |
| 3 | Require celiac no | yes | any uncertainty risks implied suitability | yes |
| 4 | Block celiac not_sure | yes | no safe alternative now | yes |
| 5 | Oats unsupported | yes | future dedicated policy | yes |
| 6 | Two generic reviews | retain independence | one review lowers cost but increases claim/taxonomy error | yes |
| 7 | Separate generic profile | yes | shared profile risks semantic leakage | yes |
| 8 | Separate generic coverage | yes | combined coverage is misleading | yes |
| 9 | Reserve current 16-code coverage | yes, inactive pending SKU audit | retire later via explicit version | no for generic; yes for SKU |
| 10 | Batch size 24 | retain only after 24 stable dossiers | smaller batch needs release-contract decision | yes for content |
| 11 | Replace variable candidates | narrow first; replace unresolved eight | accept variability is not recommended | yes for those records |
| 12 | Defer brands/SKU | yes | immediate SKU scope is large | no for generic |
| 13 | SKU required for allergy output | yes | equivalent exact-product model only | yes for allergy layer |
| 14 | Engine patch before content review | yes | reviewing against obsolete schema wastes approval | yes |
| 15 | Specialist review before patch | no; exploratory consultation only, not review | early formal review cannot bind final hashes/policy | yes |

Exact new version strings, module names, review-role composition, and replacement list remain owner decisions for the implementation audit.

## 31. Final recommendation

Choose Model D with Architecture D. Generic examples are available only to a current, resolved context with explicit allergy none, explicit celiac no, supported dietary pattern, valid generic catalog, and no unresolved restriction. Everyone else receives Phase 3B1 only until a future layer is valid. The generic catalog is not used for allergy or celiac filtering. Cross-contact is removed from the generic profile and exists only in a future verified-product profile. Generic allergen metadata records positive/intrinsic relationships only; it does not carry a favorable 17-code absence matrix. The current 16-code coverage remains inactive/reserved and is not reused for generic examples. New generic schema/profile/source/review-policy/coverage versions and an additive engine patch are required. After that patch, dossiers for 16 stable candidates may begin and eight candidates must be narrowed or replaced before a 24-item review batch. SKU is not required for Release 1; it is required for future allergy-aware output. Celiac support remains a later independent stage.

The result is fail-closed, deterministic, locally filtered, privacy-preserving, and free of medical, portion, macro, or menu claims.

## 32. GO / NO-GO classification

### APPROVE_HYBRID_TWO_LAYER_MODEL

This approves the contract direction only. It does not approve implementation, content, specialist review, SKU work, or release.

## 33. Explicit exclusions

No production code, catalog, entity, brand, SKU, UI, schema/validator/capability/filter patch, questionnaire/restriction change, portion, nutrition composition, recipe, menu, test/build/server/browser run, commit, push, or deployment is included. Production coverage remains `nutrimind.catalog-coverage.none.v1`; production capability remains `abstract_only`.

## 34. Adversarial review

1. Known allergy cannot receive generic output; the gate requires explicit none.
2. Unknown cross-contact cannot open allergy capability; it is absent from generic capability and mandatory in future product evidence.
3. Confirmed or uncertain celiac cannot receive generic output.
4. Oats cannot pass; missing/old/malformed context cannot become none.
5. Generic absence is not represented as `does_not_contain`, preventing a package-claim interpretation.
6. Dietary pattern never replaces allergy filtering; Phase3B1 never disappears.
7. Product sources and generic sources are type-separated; current coverage is not reused.
8. Existing version semantics do not change silently.
9. Formal review cannot start before final schema/policy hashes exist.
10. The count 24 does not override evidence; eight remain blocked or replaceable.
11. UI wording forbids “safe”; restrictions remain local; portions and calculations do not change.
12. Model B is the narrower fallback, but Model D does not broaden Release 1 beyond B; it only reserves a separately gated future layer. Two engines are coherent because they answer different capability questions and cannot validate each other's evidence.

No adversarial case requires changing the recommendation.

## 35. Final contradiction check

- Selected Model D and the context matrices both require explicit allergy none and celiac no for generic examples.
- The separate generic schema/version removes commercial cross-contact and favorable absence claims without changing v1 semantics.
- Intrinsic allergen metadata cannot unlock allergy output; verified products cannot use generic evidence.
- Confirmed/uncertain celiac, oats, unresolved, unsupported, old, missing, and malformed contexts remain abstract-only.
- Review roles and sources are layer-specific; coverage is layer-specific; the 24 candidates are not approved by architecture alone.
- Future SKU and celiac layers remain deferred and independently auditable.
- Privacy, neutral UI language, deterministic filtering, and Phase3B1 fallback agree with the selected model.
- No production content exists; production coverage remains none; the next scope is a narrow additive contract/engine patch with explicit tests.
