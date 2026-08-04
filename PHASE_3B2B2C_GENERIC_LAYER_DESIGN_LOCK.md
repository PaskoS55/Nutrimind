# Phase 3B2B2C — Generic-example layer exact contract

Design date: 2026-08-04. Status: exact additive contract proposed for owner lock; no code, content, specialist review, or release is authorized.

## 1. Executive summary

This design specifies a separate `core/generic-food-catalog` engine. It accepts the unchanged current restriction context and a valid calculated Phase3A parent, but exposes examples only for a resolved context with exact allergy `none`, empty allergen codes, exact celiac `no`, and a supported dietary pattern. It contains intrinsic identity/pattern metadata and positive-only intrinsic allergen codes. It has no cross-contact, label, manufacturer, SKU, nutrition, portion, or medical-suitability fields.

The design is implementation-complete but introduces new version strings, enums, diagnostics, schemas, batch policy, and review policy not previously owner-approved. Classification: **`READY_FOR_OWNER_LOCK`**. One approval sentence in §35 is required before Phase 3B2B2D.

## 2. Repository confirmation

- Root `C:/Projects/nutrimind`; branch `main`.
- Local HEAD, `origin/main`, remote main: `f4895afdb3519cfe266eddad56ccf25562302094`; divergence `0 0`.
- Primary worktree used; detached `nutrimind-original` unused; no merge/rebase/cherry-pick.
- Pre-flight contained only the two expected untracked 3B2B2A/3B2B2B documents.

## 3. Current production baseline

No production catalog or entities exist. Coverage is `nutrimind.catalog-coverage.none.v1`, restriction capability and catalog capability are `abstract_only`, and Phase3B1 supplies four frozen neutral slots. Current Phase3B2B1 future v1 validates `single_food`, a full 17-code ingredient/cross-contact matrix, four patterns, sources, two reviews, exact 180-day expiry, and whole-catalog validity. Its filter is allergy-aware and fail-closed. It stays inactive.

## 4. Immutable existing contracts

The following do not change: restriction schema/storage key `nutrimind.phase3b2.restriction-context.v1`; market `nutrimind.market.ru.v1`; taxonomy `nutrimind.food-allergen.ru.v1`; production coverage `nutrimind.catalog-coverage.none.v1`; production `abstract_only`; Phase3B2B1 v1 and reserved `nutrimind.catalog-coverage.ru.v1`; oats and confirmed celiac unsupported; Phase3B1 slots; Phase3A totals/allocation; Phase3A2 timing; calibration IndexedDB; questionnaire; no restriction data in URL, analytics, or requests. Existing version meanings are immutable.

## 5. Approved hybrid direction

Layer 1 is a bundled generic-example catalog for explicit allergy-none/celiac-no contexts and supported pattern filtering. Layer 2 is a future exact packaged-product/SKU system with commercial evidence; it is outside this design. The generic engine neither knows nor emits a future SKU capability status. Phase3B1 always remains available.

## 6. Fifteen owner decisions

| # | Question | Recommendation and selected design answer | Alternatives | Rationale / residual risk | Blocked | Downstream contract |
|---:|---|---|---|---|---|---|
| 1 | Approve hybrid? | `OWNER_APPROVAL_REQUIRED`: yes | Model B or SKU-only | preserves narrow release; layer confusion mitigated by separate module | yes | architecture |
| 2 | Generic only allergy none? | `OWNER_APPROVAL_REQUIRED`: yes, exact `none` | no generic output | mandatory safety boundary | yes | capability |
| 3 | Require celiac no? | `OWNER_APPROVAL_REQUIRED`: yes | no generic output | avoids celiac implication | yes | capability |
| 4 | Block celiac not_sure? | `OWNER_APPROVAL_REQUIRED`: yes | none safe | unknown never becomes no | yes | errors |
| 5 | Oats unsupported? | `OWNER_APPROVAL_REQUIRED`: yes; entity forbidden in first content policy | later separate audit | taxonomy/source ambiguity remains | yes | validator/policy |
| 6 | Two generic reviews? | `OWNER_APPROVAL_REQUIRED`: yes | one review | independent unsafe-claim check worth cost | yes | review schema |
| 7 | Separate generic profile? | `OWNER_APPROVAL_REQUIRED`: yes | shared profile | prevents commercial metadata leakage | yes | schemas |
| 8 | Separate coverage? | `OWNER_APPROVAL_REQUIRED`: yes | combined coverage | avoids “zero means unrestricted” | yes | envelope/capability |
| 9 | Reserve current 16-code coverage? | `OWNER_APPROVAL_REQUIRED`: yes | retire explicitly later | no silent semantic reuse | yes | versioning |
| 10 | Batch size? | `OWNER_APPROVAL_REQUIRED`: target 24/6 per slot, not a validity condition | hard exactly 24; smaller launch | safety must beat vanity count | yes | release policy |
| 11 | Replace eight blocked? | `OWNER_APPROVAL_REQUIRED`: narrow where stable; otherwise replace | keep all; shrink batch | weak definition cannot publish | yes | content stage |
| 12 | Defer brands/SKU? | `OWNER_APPROVAL_REQUIRED`: yes | start SKU now | controls scope | yes | phase split |
| 13 | SKU required for allergy output? | `OWNER_APPROVAL_REQUIRED`: yes | another exact-product class | generic evidence is insufficient | yes | future layer |
| 14 | Engine patch before content review? | `OWNER_APPROVAL_REQUIRED`: yes | review old shape | stable hashes/schema first | yes | review gate |
| 15 | Review timing? | `OWNER_APPROVAL_REQUIRED`: only after patch and validator fixtures | before patch/integration | avoids rework; integration not required | yes | stage gate |

## 7. Layer purpose

Purpose: show generic single-food examples inside Phase3B1 only after a valid calculated Phase3A parent and exact eligible restriction context. Not purposes: allergy filtering, celiac suitability, cross-contact, commercial/label/SKU claims, medical advice, nutritional adequacy, portions, grams, macros, menus, recipes, timing, goal, or sport. Output must never be called safe, allergen-free, gluten-free, suitable, or recommended.

## 8. Versioning matrix

Two naming approaches were compared: (A) suffix existing `food-catalog` v2 strings, which risks sibling-engine confusion; (B) explicit `generic-food-catalog` namespace, which is self-describing and additive. Select B, subject to owner lock.

| Contract | Exact string |
|---|---|
| catalog schema | `nutrimind.generic-food-catalog.schema.v1` |
| entity schema | `nutrimind.generic-food-catalog.entity.v1` |
| intrinsic profile | `nutrimind.generic-food-catalog.intrinsic-profile.v1` |
| source schema | `nutrimind.generic-food-catalog.source.v1` |
| review schema | `nutrimind.generic-food-catalog.review.v1` |
| policy | `nutrimind.generic-food-catalog.policy.ru.v1` |
| content | `nutrimind.generic-food-catalog.ru.v1.0.0` |
| coverage | `nutrimind.generic-food-catalog.coverage.ru.v1` |

Compatibility is exact equality only. No wildcard, migration, or mixed-version acceptance.

## 9. Catalog envelope

Exact type `GenericFoodCatalogEnvelopeV1` fields, in contract order:

```text
schemaVersion; marketVersion; taxonomyVersion; policyVersion; contentVersion;
coverageVersion; supportedEntityTypes; supportedDietaryPatterns; supportedSlotCodes;
eligibleRestrictionContext; entities; intrinsicProfiles
```

Literals: version matrix; existing market/taxonomy; `supportedEntityTypes: ["generic_single_food"]`; patterns `[omnivore, vegetarian, vegan, pescatarian]`; slots in Phase3B1 order; eligibility `{foodAllergyStatus:"none",foodAllergenCodes:"must_be_empty",celiacStatus:"no"}`. No allergen-coverage field. Maximum 250 entities/profiles. Arrays required; exact one profile per entity/reference and vice versa; duplicate IDs invalid. Unknown fields invalidate. `[]/[]` is `valid_empty`; capability unavailable. Any malformed entry invalidates the whole catalog. Valid output clones, canonically sorts entities by `displayOrder, foodId`, profiles by ID/version, and recursively freezes. Validation statuses: `valid | valid_empty | invalid`.

## 10. Entity schema

Exact type `GenericFoodEntityV1`; literal `entityType: "generic_single_food"` prevents use by the allergy-aware `single_food` engine. Fields:

```text
schemaVersion; foodId; entityVersion; entityType; displayNameRu; primarySlotCode;
additionalSlotCodes; displayOrder; intrinsicProfileRef; lifecycleStatus;
lifecycleReason; supersedes; supersededBy; contentHash
```

`foodId`: `^generic_food_ru_[a-z0-9]+(?:_[a-z0-9]+)*$`, 16–96 chars. Version integer 1..2147483647. Display name: trimmed NFC, 1–120 Unicode scalars; reject controls, unpaired surrogates, `<`, `>`. Primary is one approved slot. Additional slots: 0–3, unique, not primary, canonical Phase3B1 order; total maximum 4. Profile ID regex `^generic_profile_ru_[a-z0-9]+(?:_[a-z0-9]+)*$`, 19–112. Display order nonnegative integer. Hash exact lowercase `sha256:` + 64 hex. Unknown fields invalid. Entity canonical order as above.

## 11. Intrinsic-profile schema

Exact type `GenericIntrinsicProfileV1` fields:

```text
schemaVersion; intrinsicProfileId; intrinsicProfileVersion; foodId; entityVersion;
profileHash; sourceSetHash; policyVersion; genericIdentity; origin;
intrinsicAllergenCodes; glutenCerealRelationship; dietaryPatternAssessments;
sources; reviews
```

`genericIdentity`: `{definitionRu, includedFormsRu, excludedFormsRu, processingBoundaryRu}`, each trimmed NFC 1–500 scalars under the same text rejection rule. `origin`: discriminated `{kind:"plant", scientificName}` or `{kind:"animal", scientificName}`; scientific name trimmed NFC 3–160, or `{kind:"other", descriptionRu}` only if separately policy-approved (first batch forbids `other`). Allergen codes are positive-only (§12). Gluten enum: `intrinsically_contains_gluten_cereal | not_intrinsically_identified_as_gluten_cereal | unknown`; the middle value is explicitly not a contamination/celiac claim. Pattern matrix, sources and reviews follow §§15–17. Exact fields only, hashes/policy bound. No slot fields.

Forbidden and rejected as unknown: cross-contact/may-contain/facility, label verification, manufacturer/package/SKU/formulation/line evidence, nutrient/portion/menu fields.

## 12. Intrinsic allergen model

Select Model A: `intrinsicAllergenCodes`, a unique canonical positive-only subset of the existing 17-code taxonomy. Empty means “no intrinsic taxonomy relationship positively recorded,” never absence, allergy compatibility, or unrestricted support. Model B/C create negative-looking values and 17-fold review theater; D loses useful diagnostic identity. Every code needs a source/review binding at profile level. Capability gates allergy before catalog filtering; this array is never an eligibility input. Tests must prove non-`none` allergy cannot receive output even when the array is empty.

## 13. No-cross-contact contract

No cross-contact field exists, defaults, computes, or serializes. `unknown`, `not_applicable`, and favorable values are all structurally impossible. Unknown fields invalidate the profile. Runtime capability asserts exact allergy none + empty codes and exact celiac no before filter use.

Canonical warning `GENERIC_EXAMPLES_NO_CROSS_CONTACT_ASSESSMENT` and rule `GENERIC_FOOD_CATALOG.NO_CROSS_CONTACT_METADATA.001` accompany available output. Rule `GENERIC_FOOD_CATALOG.NOT_ALLERGY_AWARE.001` forbids future caller reuse.

## 14. Celiac and oats gate

Only `celiacStatus === "no"` is eligible. Confirmed maps to `GENERIC_CAPABILITY_CELIAC_CONFIRMED_INELIGIBLE`; not_sure/withheld map to `GENERIC_CAPABILITY_CELIAC_UNRESOLVED`; missing/malformed/unsupported are rejected earlier as context unavailable. All carry Phase3B1 fallback warnings.

First-batch policy forbids a generic entity whose identity is oats; validator uses a policy-level reserved identity code/controlled source review rather than fuzzy name matching. No oats code in intrinsic metadata can override this rule. Gluten relationship never produces a celiac claim. Warning: `GENERIC_EXAMPLES_NOT_CELIAC_ASSESSED`; rule: `GENERIC_FOOD_CATALOG.EXPLICIT_CELIAC_NO_ONLY.001`.

## 15. Dietary-pattern model

Exact `GenericDietaryPatternAssessmentV1`: `{pattern, status}`. Full four-entry canonical matrix. Status enum `compatible | not_compatible | unknown | not_assessed`. Filter admits exact `compatible` only. Coherence: omnivore must be compatible; vegan compatible implies vegetarian, pescatarian, omnivore compatible; vegetarian implies pescatarian and omnivore; pescatarian implies omnivore. Conflict invalidates the whole profile. Unknown/not_assessed exclude the item, never relax. Two reviewers bind the matrix. No adequacy claim.

## 16. Source model

Select new schema (Model B), not restricted reuse or a common discriminator. Exact type `GenericCatalogSourceV1` fields:

```text
schemaVersion; sourceId; sourceType; sourcePurpose; title; publisher;
sourceVersion; publishedOn; verifiedOn; locatorType; locator; sourceFingerprint
```

Types: `official_food_definition | official_taxonomy | official_clinical_guideline | official_regulation | recognized_food_reference`. Purposes: `generic_identity | botanical_animal_origin | intrinsic_allergen_relationship | gluten_cereal_relationship | dietary_pattern_classification | policy_context`. One source has one purpose; repeat records/IDs if necessary. Dates `YYYY-MM-DD`, verified not before published or after validation time. Locators `https_url | document_reference | asset_reference`; HTTPS forbids credentials, max 2048; other max 512. IDs `^generic_source_[a-z0-9]+(?:_[a-z0-9]+)*$`, 15–112. Fingerprint lower SHA-256. 1–12 sources/profile, unique ID; canonical by purpose, type, ID. Any source change creates new fingerprint/source set and invalidates reviews. Manufacturer, retailer, marketplace, package, label, blog, forum, and SEO sources are prohibited.

## 17. Review model

Exact roles: `nutrition_food_definition_specialist`, `allergen_policy_specialist`, `technical_validator`. Required publication combination is one approved review of each first two roles by distinct reviewer IDs. Technical validation is optional and never substitutes. Statuses: `approved | changes_required | rejected`. Exact record fields mirror safe binding mechanics: `schemaVersion, reviewId, reviewerId, reviewerRole, reviewStatus, reviewedAt, profileHash, sourceSetHash, policyVersion`. Two to four reviews; unique review and reviewer IDs. Approved review expires when `asOf >= reviewedAt + 180*86400000`. Source/profile/policy change invalidates binding. Reviewers assert definition, patterns, intrinsic positive relationships, and absence of prohibited claims—not cross-contact safety.

## 18. Capability domain

Use minimal Model A, exact status `generic_examples_unavailable | generic_examples_available`; no SKU knowledge and no overloaded `abstract_only`.

```text
GenericExampleCapabilityInputV1 {
  phase3AParent: Phase3AResult | null | undefined;
  restrictionContext: RestrictionContextV1 | null | undefined;
  catalogValidation: GenericCatalogValidationResult | null | undefined;
}
GenericExampleCapabilityResultV1 {
  status; warningCodes; errorCodes; ruleIds
}
```

All arrays canonical, results cloned/deep-frozen, inputs unmodified. Available still carries non-safety/no-cross-contact/client-only/no-portion warnings. Exact enums are §§21–23.

## 19. Capability precedence

Return all errors within the first failing precedence class only:

1. Phase3A missing/malformed/non-calculated → `GENERIC_CAPABILITY_PHASE3A_UNAVAILABLE`.
2. context missing, invalid/old/wrong-version, or status not resolved → `...CONTEXT_UNAVAILABLE` (parser retains its detailed errors).
3. allergy not exact none or codes nonempty → known: `...ALLERGY_INELIGIBLE`; other/not_sure/withheld: `...ALLERGY_UNRESOLVED`; inconsistent codes: context unavailable.
4. celiac not no → confirmed-specific or unresolved error from §14.
5. unsupported pattern → `...DIETARY_PATTERN_UNSUPPORTED`.
6. catalog missing → `...CATALOG_UNAVAILABLE`; invalid including malformed/wrong/mixed version → `...CATALOG_INVALID`; valid_empty → `...CATALOG_EMPTY`.
7. Otherwise available. Catalog validation already proves every entity/profile publication-ready.

Every unavailable result includes generic-disabled and Phase3B1-fallback warnings. No partial items.

## 20. Filter domain

Exact statuses: `matched | empty | catalog_unavailable | context_unavailable | slot_unsupported`. Input: valid catalog result, available capability result, unchanged context, requested slot. Result fields: `status, items, exclusions, warningCodes, errorCodes, ruleIds`; exclusion is `{foodId,errorCodes}`. Gate order: slot; resolved/eligible context; available capability + valid nonempty catalog; then active entities in requested primary/additional slot with exact pattern `compatible`. Sort items by displayOrder/foodId and exclusions by foodId, deep-freeze, no mutation. Empty returns no fallback entities, `GENERIC_FILTER_NO_MATCHES`, and no relaxation prompt. Filtering ignores allergy arrays, cross-contact, celiac suitability, timing, goal, sport, calories, macros, and portions.

## 21. Warning codes

Exact canonical order:

```text
GENERIC_EXAMPLES_NOT_ALLERGY_ASSESSED
GENERIC_EXAMPLES_NOT_CELIAC_ASSESSED
GENERIC_EXAMPLES_NO_CROSS_CONTACT_ASSESSMENT
GENERIC_CATALOG_LIMITED
GENERIC_EXAMPLES_DISABLED
GENERIC_CATALOG_EMPTY
GENERIC_CLIENT_SIDE_FILTERING_ONLY
GENERIC_PHASE3B1_FALLBACK
GENERIC_NO_PORTIONS
GENERIC_NO_MACRO_MATCHING
GENERIC_NO_MENUS
GENERIC_FILTER_ITEMS_EXCLUDED
GENERIC_FILTER_NO_MATCHES
```

## 22. Error codes

Exact canonical order:

```text
GENERIC_CATALOG_MISSING
GENERIC_CATALOG_NOT_OBJECT
GENERIC_CATALOG_UNKNOWN_FIELD
GENERIC_CATALOG_SCHEMA_UNSUPPORTED
GENERIC_CATALOG_MARKET_UNSUPPORTED
GENERIC_CATALOG_TAXONOMY_UNSUPPORTED
GENERIC_CATALOG_POLICY_UNSUPPORTED
GENERIC_CATALOG_CONTENT_VERSION_UNSUPPORTED
GENERIC_CATALOG_COVERAGE_UNSUPPORTED
GENERIC_CATALOG_COVERAGE_INVALID
GENERIC_CATALOG_COLLECTION_INVALID
GENERIC_CATALOG_SIZE_EXCEEDED
GENERIC_CATALOG_DUPLICATE_ID
GENERIC_CATALOG_REFERENCE_INVALID
GENERIC_CATALOG_CONTAINS_INVALID_ENTRY
GENERIC_ENTITY_INVALID
GENERIC_PROFILE_INVALID
GENERIC_SOURCE_INVALID
GENERIC_REVIEW_INVALID
GENERIC_REVIEW_INDEPENDENCE_FAILED
GENERIC_REVIEW_REQUIRED_ROLE_MISSING
GENERIC_REVIEW_EXPIRED
GENERIC_REVIEW_BINDING_MISMATCH
GENERIC_CAPABILITY_PHASE3A_UNAVAILABLE
GENERIC_CAPABILITY_CONTEXT_UNAVAILABLE
GENERIC_CAPABILITY_ALLERGY_INELIGIBLE
GENERIC_CAPABILITY_ALLERGY_UNRESOLVED
GENERIC_CAPABILITY_CELIAC_CONFIRMED_INELIGIBLE
GENERIC_CAPABILITY_CELIAC_UNRESOLVED
GENERIC_CAPABILITY_DIETARY_PATTERN_UNSUPPORTED
GENERIC_CAPABILITY_CATALOG_UNAVAILABLE
GENERIC_CAPABILITY_CATALOG_INVALID
GENERIC_CAPABILITY_CATALOG_EMPTY
GENERIC_FILTER_CONTEXT_UNAVAILABLE
GENERIC_FILTER_CATALOG_UNAVAILABLE
GENERIC_FILTER_SLOT_UNSUPPORTED
GENERIC_FILTER_ENTITY_EXCLUDED_PATTERN
GENERIC_FILTER_ENTITY_EXCLUDED_LIFECYCLE
GENERIC_FILTER_NO_MATCHES
```

Fine-grained entity/profile/source errors may be added only by a new locked revision; the above exact public domain is sufficient for v1 and avoids copying allergy-aware semantics.

## 23. Rule IDs

Exact canonical order:

```text
GENERIC_FOOD_CATALOG.RU_MARKET_SCOPE.001
GENERIC_FOOD_CATALOG.EXPLICIT_ALLERGY_NONE_ONLY.001
GENERIC_FOOD_CATALOG.EXPLICIT_CELIAC_NO_ONLY.001
GENERIC_FOOD_CATALOG.NOT_ALLERGY_AWARE.001
GENERIC_FOOD_CATALOG.NOT_CELIAC_AWARE.001
GENERIC_FOOD_CATALOG.NO_CROSS_CONTACT_METADATA.001
GENERIC_FOOD_CATALOG.POSITIVE_INTRINSIC_ALLERGENS_ONLY.001
GENERIC_FOOD_CATALOG.EXPLICIT_PATTERN_COMPATIBILITY.001
GENERIC_FOOD_CATALOG.TWO_INDEPENDENT_SPECIALIST_REVIEWS.001
GENERIC_FOOD_CATALOG.REVIEW_EXPIRY_180_DAYS.001
GENERIC_FOOD_CATALOG.OLD_CONTEXT_FAIL_CLOSED.001
GENERIC_FOOD_CATALOG.MALFORMED_CATALOG_FAIL_CLOSED.001
GENERIC_FOOD_CATALOG.CLIENT_SIDE_FILTERING.001
GENERIC_FOOD_CATALOG.NO_PERSONALIZED_NETWORK.001
GENERIC_FOOD_CATALOG.PHASE3B1_FALLBACK.001
GENERIC_FOOD_CATALOG.NO_PORTIONS.001
GENERIC_FOOD_CATALOG.NO_MACRO_MATCHING.001
GENERIC_FOOD_CATALOG.NO_MENUS.001
GENERIC_FOOD_CATALOG.EMPTY_RESULT_NO_RELAXATION.001
```

## 24. Validation policy

Select strict whole-catalog invalidation for the first bundle. Catalog: `valid | valid_empty | invalid`; entity/profile/source/review validators: `valid | invalid`. Any malformed/unknown/mixed-version/duplicate/unbound/expired entry invalidates the catalog. No quarantine because it could silently change the reviewed set and slot balance. Exact versions only; max 250; canonical clones and recursive freeze. Empty is valid_empty but capability unavailable. This matches deterministic bundled delivery; emergency removal is handled by a new bundle (§25).

## 25. Lifecycle and emergency removal

Entity statuses `active | deprecated | withdrawn`; reasons `superseded | source_changed | policy_changed | review_expired | data_error | safety_review_required | emergency_withdrawal`. Active requires null reason/supersededBy; deprecated/withdrawn never enter output and require reason. Supersession uses same foodId and monotonic version links.

Publication artifacts should contain active, publication-ready entries only. A withdrawn record in the active bundle is invalid, not quarantined. Emergency response ships a new application/catalog bundle removing it; no remote kill switch. The remaining 23 may stay available if the replacement bundle is otherwise valid—24 is a launch target, not a runtime invariant. Expansion uses a new content version and complete review binding.

## 26. Generic coverage semantics

Coverage is the exact literal from §8 and fields in the envelope: entity type, four patterns, four slots, and exact eligible context. There is no allergen-code field. Explicit eligibility proves allergy none/empty codes; absence of an allergen field cannot mean unrestricted. Celiac support is represented only as eligibility literal `no`, not “supported.” Wrong/old coverage invalidates the catalog. Reserved `nutrimind.catalog-coverage.ru.v1` is rejected.

## 27. Privacy contract

Exact flow: validated local restriction parser → generic capability with locally read calculated Phase3A → bundled validated generic catalog → pure client filter → UI. No URL, analytics, request, server personalization, localStorage, IndexedDB, selected-item persistence, or allergy/celiac telemetry. Phase2D2A journal/calibration remain unchanged. Implementation documentation must add this data-flow and regression assertions; no new privacy architecture review is required unless network/persistence is later proposed.

## 28. UI contract

Future output appears inside the existing closed Phase3B1 disclosure after capability availability; it changes no totals, grams, portions, macros, or timing.

- Section: «Примеры базовых продуктов».
- Group: «Примеры для категории “{slot label}”».
- Disclaimer: «Примеры учитывают выбранный тип питания, но не подтверждают отсутствие аллергенов, риск перекрёстного контакта или пригодность при целиакии. Это не индивидуальная рекомендация.»
- Allergy unavailable: «При указанной аллергии примеры конкретных продуктов не показываются. Доступны нейтральные категории для самостоятельной сборки.»
- Celiac unavailable: «При подтверждённой или неопределённой целиакии примеры конкретных продуктов не показываются. Доступны нейтральные категории.»
- Empty: «Для выбранной категории и типа питания проверенных примеров пока нет. Ограничения не ослаблены.»
- Limited catalog: «Список ограничен продуктами, для которых завершена проверка определения и типа питания.»

Forbidden wording from the task remains forbidden.

## 29. Re-evaluated candidates

Potentially dossier-eligible after the engine patch (not reviewed): chicken egg, chicken meat, turkey meat, beef, Atlantic cod, white rice, potato, sweet potato, carrot, white cabbage, cucumber, tomato, apple, banana, avocado, whole raw flax seed — 16.

| Blocked | Reason | Narrow? | Replacement | Evidence burden |
|---|---|---|---|---|
| red lentils | whole/split/form scope | yes; one botanical/form definition | species-defined rabbit meat if unresolved | official identity, origin, pattern, intrinsic allergen review |
| buckwheat groats | kernel/thermal form | yes | intact cassava root | definition and pattern sources |
| millet groats | species/dehulling ambiguity | yes | intact Jerusalem artichoke | botanical identity and pattern sources |
| corn groats | grind/grade variability | yes | one precisely defined quinoa seed form | species/form and pattern sources |
| sunflower seed | hull/raw form | yes | whole raw walnut | identity plus intrinsic tree_nuts positive relation |
| pumpkin seed | species/hull form | yes | whole raw peanut | identity plus peanuts positive relation |
| sunflower oil | refining/process class | technically, but poor first-batch value | whole raw almond | identity plus tree_nuts positive relation |
| olive oil | legal/process class | technically, but poor first-batch value | whole raw sesame seed | identity plus sesame positive relation |

Select strategy B: narrow the first six only when one stable sourced form is practical; replace unresolved definitions and both oils. Every replacement requires a fresh audit/dossier. No entity is approved.

## 30. Batch policy

Target first release: 24 active reviewed items, aiming for 6 primary items per slot. Neither count is a schema validity condition. Every included item must be ready; 23 strong items may release rather than admit a weak 24th, with a limited-catalog notice. Category imbalance is allowed only when explicit and at least one active item exists for each supported slot; otherwise that slot yields empty safely. Withdrawal removes only the item through a new valid bundle and does not disable unrelated items. Additions require a new content version and complete validation/reviews.

## 31. Specialist-review start gate

Select C: formal specialist review starts only after Phase 3B2B2D implements schemas and validator fixtures and those contracts are stable. It need not wait for full UI integration. Earlier consultation is non-binding and cannot create approval records/hashes. This prevents packages being bound to obsolete shapes.

## 32. Future file scope

New files:

```text
core/generic-food-catalog/types.ts
core/generic-food-catalog/catalog-schema.ts
core/generic-food-catalog/entity-schema.ts
core/generic-food-catalog/intrinsic-profile-schema.ts
core/generic-food-catalog/source-schema.ts
core/generic-food-catalog/review-schema.ts
core/generic-food-catalog/validator.ts
core/generic-food-catalog/capability.ts
core/generic-food-catalog/filter.ts
core/generic-food-catalog/index.ts
tests/generic-food-catalog.test.mjs
PHASE_3B2B2D_REPORT.md
```

Modified in 3B2B2D only after approval: `package.json` test list and, only if needed for public imports, an additive `core/index.ts` export. UI, current food-catalog/restrictions/templates, questionnaire, Phase2/3A/3A2/3B1, calibration, Vercel, and production content remain unchanged. UI integration belongs to 3B2B2G. No migration or catalog artifact.

## 33. Future test matrix

- Versions: each exact literal accepted; wrong/current allergy-aware/mixed versions rejected.
- Context: none/known/multiple/other/not_sure/withheld/missing/malformed/old; celiac no/confirmed/not_sure/withheld; all precedence cases.
- Catalog: valid, empty, missing, non-object, wrong schema/coverage, unknown field, duplicate/reference/entry failure, expired reviews, withdrawn active entry.
- Profile: cross-contact/label/manufacturer fields rejected; positive intrinsic codes and empty semantics; oats policy; full pattern matrix/conflicts; sources/reviews/hash bindings.
- Capability: only exact eligible input available; every other input fully unavailable; Phase3B1 warning always on failure; no partial status.
- Filter: slot/pattern/lifecycle, empty, ordering, exclusions, non-mutation, deep freeze; prove allergy/celiac arrays are not filter dimensions because gate already excludes them.
- Privacy: instrument/stub fetch, URL, analytics, storage and server access; all absent.
- Regression: current Phase3B2B1/restriction/taxonomy/nine-section questionnaire/Phase3A/3A2/3B1/calibration tests unchanged; no products, portions, menus, skipped tests.
- Boundaries: exact 180-day millisecond edge, max 250/251, 1/12/13 sources, 2/4/5 reviews, Unicode normalization, identifier and hash limits.

## 34. Safe phase split

1. 3B2B2D: engine schemas/validator/capability/filter/tests; no content/UI.
2. 3B2B2E: candidate narrowing/replacements and evidence dossiers; no production content.
3. 3B2B2F: two independent reviews and bindings; no publication until complete.
4. 3B2B2G: reviewed catalog artifact, UI integration, production QA.
5. Future verified SKU layer: separate allergy/cross-contact audit.
6. Future celiac layer: separate label/oats policy audit.

D cannot merge with E/F; code contract must precede evidence/reviews. E and F cannot merge because reviewers need finalized reproducible dossiers. F and G cannot merge because publication readiness must be independently established. SKU/celiac work cannot merge with generic stages.

## 35. Closed owner decision table

| ID | Exact selected answer | Consequence | Blocked pending approval |
|---|---|---|---|
| D01 | Hybrid, separate generic module | no v1 semantic change | yes |
| D02 | Exact allergy none + empty codes | all other allergy states unavailable | yes |
| D03–D05 | Exact celiac no; uncertainty blocked; oats excluded | no celiac/oats claim | yes |
| D06 | Two independent roles, 180-day exact expiry | stable review gate | yes |
| D07–D09 | Separate profile/coverage; reserve 16-code coverage | layer isolation | yes |
| D10 | 24/6 target, not validator invariant | 23 strong may release | yes |
| D11 | Narrow-or-replace eight; replace oils | fresh audit required | yes |
| D12–D13 | SKU deferred and required for future allergy output | no brands now | yes |
| D14–D15 | Engine/fixtures before formal review | next phase 3B2B2D | yes |

Exact approval sentence:

> Утверждаю Phase 3B2B2C Generic-example layer exact contract в файле PHASE_3B2B2C_GENERIC_LAYER_DESIGN_LOCK.md, включая D01–D15, exact version strings, schemas, enums, diagnostics, review, coverage, lifecycle и batch policies; разрешаю начать отдельный этап Phase 3B2B2D без production content и UI.

## 36. Final recommendation

Use a separate `generic-food-catalog` engine. Eligible input is calculated Phase3A plus exact current resolved context: allergy none, empty codes, celiac no, supported pattern. All other contexts are unavailable. Entity literal is `generic_single_food`; profile is intrinsic identity/pattern/positive-allergen evidence only. Allergen model is positive-only; cross-contact absent; celiac and oats unsupported; full four-pattern compatible-only filter. Use new generic source and two-review schemas, 180-day expiry, status `generic_examples_unavailable | generic_examples_available`, exact fail precedence, pattern/slot-only filter, separate non-allergy coverage, new namespace versions, strict whole-catalog validation, and bundled lifecycle removal. Target 24/6 but never publish weak content for count. Narrow or replace eight; review starts after engine fixtures. Next is 3B2B2D. SKU and celiac layers stay deferred.

## 37. GO / NO-GO classification

### READY_FOR_OWNER_LOCK

All implementation-critical contracts are exact; owner approval is still required because their literals and policies were not part of the already approved Model D direction.

## 38. Explicit exclusions

No code, schema, validator, capability, filter, context, questionnaire, test, package, catalog, entity, UI, calculation, calibration, Vercel, build, server, browser, specialist review, commit, push, or deployment change is made. No portions, nutrition values, menus, recipes, brands, or SKU are created.

## 39. Adversarial review

All 27 attacks fail closed: known/uncertain/missing/malformed/old allergy or celiac contexts cannot pass precedence; absent allergen coverage cannot mean unrestricted because eligibility is explicit; intrinsic metadata has no favorable absence; cross-contact is rejected as unknown field; layer-specific types prevent allergy caller reuse; v1 and 16-code coverage are rejected; pattern cannot replace gates; reviewers cannot assert commercial safety and one/technical/expired review cannot publish; withdrawn/invalid items cannot fail open; Phase3B1 persists; totals/portions/UI safety words/network are forbidden; review waits for fixtures; count 24 is non-normative. The separate additive module is the narrowest patch that preserves v1.

## 40. Final contradiction check

- Version, envelope, entity, profile, source, review, coverage and diagnostics share one generic namespace and exact compatibility.
- Positive-only allergen identity cannot become an absence claim; cross-contact has no representation.
- Capability alone enforces allergy none, empty codes, celiac no and supported pattern before filtering.
- Oats is excluded by first-batch policy; patterns admit exact compatible only.
- Whole-catalog validation and lifecycle bundle replacement remain deterministic without a network kill switch.
- Privacy flow, UI wording, candidate strategy and post-fixture review timing agree.
- Current v1 remains unchanged; production remains abstract-only; no content or code exists; Phase3B1 remains fallback.
- The only open action is explicit owner lock, after which 3B2B2D is narrow and testable.
