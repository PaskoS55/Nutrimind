# Phase 3B2B — Human-reviewed food catalog for the Russian market: pre-implementation audit

Audit date: 2026-08-04. This is a design audit, not an implementation or a legal/medical opinion.

## 1. Executive summary

Phase 3B2B should mean a small, versioned set of human-reviewed **generic single-food examples** for the Russian market. The first content batch should contain exactly 24 entities, cover all four Phase 3B1 slots, exclude brands, SKU, compound/processed product types, oats, bulk foods and every entity whose ingredients or cross-contact status depend on a label. The user-facing term should be “проверенный пример продукта”, not “безопасный продукт”.

Use a catalog item plus a separate immutable reviewed safety profile. Each published profile must cover every one of the existing 17 allergen codes explicitly, keep ingredient presence separate from cross-contact, carry a separate celiac assessment and explicit dietary-pattern states, and cite dated evidence reviewed by identified roles. Missing or unknown data never means absence.

The catalog is available only for a current, resolved restriction context wholly covered by the catalog. One unsupported, unresolved, stale or malformed hard restriction disables the entire concrete layer while Phase 3B1 remains available. Celiac concrete output is deferred until a separately reviewed celiac subset and oats policy exist. Filtering remains local; no restriction code is sent, logged, placed in a URL or persisted as a selection.

Implement in three gates: 3B2B1 schema/validator/filter with no production content; 3B2B2 the reviewed batch and UI; 3B2B3 expansion/lifecycle tooling. The owner decisions in section 41 block implementation until accepted.

## 2. Repository confirmation

| Check | Observed result |
|---|---|
| root | `C:/Projects/nutrimind` |
| branch | `main` |
| local HEAD | `91a2e11c4a723add17af68218f67383c0f142a3b` |
| remote `refs/heads/main` | same commit |
| `origin/main...main` | `0 0` |
| working tree before audit | clean |
| primary worktree | `C:/Projects/nutrimind` |
| other worktree | `C:/Projects/nutrimind-original`, detached; not used |
| merge/rebase/cherry-pick | absent |

The prescribed files and repository-wide catalog/product/safety terms were inspected. Pass 1 recorded facts before selecting an architecture.

## 3. Current production baseline

The exact contracts are `nutrimind.market.ru.v1`, `nutrimind.phase3b2.restriction-context.v1` (schema and session key), `nutrimind.food-allergen.ru.v1`, and `nutrimind.catalog-coverage.none.v1`. `CATALOG_SUPPORTED_ALLERGEN_CODES` is `[]`; `futureFilterMode` and `getRestrictionCapability()` are `abstract_only`.

The taxonomy has 17 exact codes: `wheat`, `rye`, `barley`, `oats`, `other_gluten_cereal`, `tree_nuts`, `peanuts`, `sesame`, `fish`, `crustaceans`, `molluscs`, `milk`, `eggs`, `soybeans`, `celery`, `mustard`, `lupin`. Celiac and dietary pattern are separate dimensions. A mixed supported/unknown allergy set is wholly unsupported; unknown members are not dropped.

Phase 3B1 contains only `protein_source`, `carbohydrate_source`, `vegetables_fruit_berries`, and `fat_source`. These are equal-status abstract presentation slots, not foods, requirements, portions or macro matches. No concrete entity, ingredient graph, catalog, filtering, brand, SKU, recipe or composition exists. Missing/old/unresolved/unsupported/malformed contexts fail closed for future concrete output. Phase 3A and Phase 3B1 do not depend on catalog capability.

## 4. Meaning of concrete product

For this phase a “product” is a stable generic single-food identity with one intrinsic food substance, optionally altered only by physical state (for example cleaned, cut, frozen or dried) when that state does not introduce another ingredient or a variable safety claim. This definition describes an entity class, not a list of foods.

It is not a generic manufactured product type, branded packaged SKU, recipe, meal, dish, supplement, portion or nutrient-composition record. In the UI use “проверенный пример продукта”; “категория продукта” is too broad, “вариант для проверки по этикетке” belongs to a later label-dependent class, and “базовый продукт” can be mistaken for a prescription.

## 5. Catalog-model comparison

| Model | Safety precision and variability | Cost/staleness | Usefulness/testability | Decision |
|---|---|---|---|---|
| A generic single foods | Intrinsic allergen identity can be reviewed; handling/cross-contact remains limited | low–moderate; geographically robust | useful across four slots; small deterministic state space | first release |
| B generic product types | ingredients vary by manufacturer; absence and celiac claims cannot be generalized | high update and label burden | superficially useful, difficult to test honestly | exclude |
| C branded SKU | best label precision at a point in time, but recipe, factory and label can change | highest staleness, licensing and availability burden | testable only with dated label/version evidence | defer |
| D hybrid | future-proof but mixes evidence standards and lifecycle risks | highest schema/review complexity | useful later with discriminated types | architecture-ready, content not mixed in v1 |

Generic food, generic manufactured type and verified SKU must not share one undifferentiated entity schema: their identity, evidence, cross-contact and expiry semantics differ.

## 6. Recommended entity type

The first release admits only `single_food`. Brand and SKU fields are prohibited. A physical-state qualifier is allowed only when controlled by an enum and when the resulting entity remains single-ingredient. This is narrower than all four conceptual models and makes complete manual review credible.

## 7. Initial catalog-size analysis

| Size | Coverage/QA | Review and update burden | Main risk |
|---|---|---|---|
| under 20 | weak redundancy across four slots and patterns | easiest | token catalog presented as useful |
| 20–50 | enough for a balanced risk×slot matrix; combinations remain enumerable | feasible for complete two-person review | still visibly partial |
| 50–100 | broader choice | materially larger intersection matrix | incomplete review hidden by volume |
| 100–250 | broad surface | difficult first-pass re-verification | false completeness and stale records |
| over 250 | potentially broad | unsuitable for manual first release | governance becomes the product |

Choose exactly **24**: six primary candidates per Phase 3B1 slot, allowing multi-slot tags without using them to reduce the review count. This is large enough to test empty/intersection states and small enough to inspect every field, source and rendered claim. Rollback is entity/profile deprecation, not silent deletion.

## 8. Category and slot coverage

Candidate categories, not entities:

| Category class | Potential slots | Allergen/celiac/pattern complexity | Variability/cross-contact/label dependence | v1 |
|---|---|---|---|---|
| unprocessed animal-origin single foods | protein, sometimes fat | intrinsic allergens possible; incompatible with some patterns | low identity variability; handling unknown | conditional |
| unprocessed legumes/seeds/nuts as identity classes | protein/fat, sometimes carbohydrate | several intrinsic allergens; tree-nut umbrella needs care | bulk cross-contact risk | only packaged-source-independent identity with conservative cross-contact state |
| plain gluten-containing cereal identities | carbohydrate | explicit cereal allergen; not celiac-suitable | bulk cross-contact not decisive because intrinsic exclusion exists | conditional |
| plain non-gluten cereal/starchy identities | carbohydrate | allergy mapping still complete; celiac proof not implied | milling/bulk contamination can matter | non-celiac only |
| unprocessed vegetables/fruits/berries | vegetables_fruit_berries, sometimes carbohydrate | usually lower but never inferred allergen-free | low label dependence; handling unknown | preferred |
| single-source culinary fats | fat | source allergen and refining questions | processing/specification can vary | only if evidence supports the precise identity |
| dairy, fermented, canned or otherwise formulated types | protein/fat | ingredient variability and label dependence | high | exclude |
| breads, plant drinks, cheeses, yogurts, sausages, protein products | multiple | compound and pattern ambiguity | high | exclude |

Slot compatibility is a presentation tag, may be many-to-many, is not a nutrition prescription, does not assign grams or guarantee macro fit, and is not automatically modified by Phase 3A2 timing.

## 9. Single-ingredient boundary

One household name is insufficient. Admission requires a normalized identity and evidence that the defined commercial form has one ingredient. Water, salt, cultures, enzymes, fortification, flavouring, glazing, carrier, additive or processing aid with allergen relevance moves the item out of `single_food` unless the owner later defines another entity type.

Milk, eggs, fish, nuts, cereal grains and pure oils can conceptually be single-food identities but retain their intrinsic allergen status. Plain frozen produce can qualify only without additives. Canned, dried or water/salt products require an ingredient declaration and are excluded from v1 because their definition is too easily widened. Cottage cheese, cheese, bread, plant drinks, yogurt, sausages and protein products are manufactured/compound types and excluded. Oats are excluded because a generic identity cannot establish celiac-relevant contamination control.

An entity becomes unsafe-broad whenever variants sold under the same name can change ingredient allergen, gluten, cross-contact or dietary-pattern conclusions.

## 10. Entity-schema options

| Option | Fail-closed/review/versioning | Dedup/future SKU/localization | Decision |
|---|---|---|---|
| flat entity | easy initially, but presentation and safety lifecycle become coupled | poor when evidence changes or SKU arrives | reject |
| discriminated union | expresses type-specific evidence well | good future SKU migration | useful outer identity model |
| catalog item + reviewed safety profile | strongest independent validation, expiry, supersession and reuse | best separation of localized presentation from safety evidence | select |

Use a discriminated `CatalogItem` (`entityType: single_food` in v1) referencing exactly one current `ReviewedSafetyProfile`. Catalog publication is valid only when both records and their versions/hashes validate. Do not join by display name.

## 11. Minimum entity metadata

| Field | v1 classification | Note |
|---|---|---|
| schemaVersion, catalogVersion, catalogCoverageVersion | required | catalog envelope, not redundantly trusted per claim |
| foodId, entityType, entityVersion | required | immutable ID; version changes on semantic change |
| Russian display name | required | plain text, length-limited |
| short neutral description | useful/deferrable | omit rather than add marketing copy |
| Phase3B1 slot compatibility | required | nonempty, unique canonical order |
| ingredient complexity | required | must equal `single_food` in v1 |
| ingredient declaration | required | normalized factual identity/evidence, not copied marketing text |
| allergen presence/absence/unsupported domain | required as complete 17-code assessments | absence requires evidence; missing is invalid |
| EAEU umbrella mappings | useful/derived | derive from taxonomy, do not hand-author per entity |
| celiac status, gluten relationship | required | separate from allergy |
| dietary-pattern compatibility | required | all four exact patterns |
| cross-contact status, label-verification requirement | required | separate layers |
| jurisdiction | required | `nutrimind.market.ru.v1` boundary |
| source type/reference/version/accessedAt | required | reference may be internal locator; no arbitrary HTML |
| review status, reviewer role/ID, reviewedAt, expiresAt, lastVerifiedAt | required | pseudonymous stable reviewer ID is sufficient |
| safetyProfileVersion, content hash | required | immutable review artifact |
| supersedes/supersededBy | useful when applicable | absent on initial version |
| deprecated, deprecatedAt, reason | required lifecycle shape | reason/time required when deprecated |
| ruleIds, warningCodes | required only from approved vocabularies | exact IDs require owner approval |
| brand, SKU, portion, grams, composition, macro fields | prohibited in v1 | misleading/out of phase |

## 12. Allergen metadata model

Select model D: separate ingredient and cross-contact layers, with closed enumeration but **open-world semantics**. For each of all 17 codes store an ingredient assessment of `contains`, `does_not_contain`, or `unknown`, plus evidence references. Store cross-contact separately as `not_applicable`, `assessed_no_known_warning`, `may_contain`, `facility_warning`, `unknown`, or `not_assessed`.

Absence of a code, an empty array, or missing evidence means unknown and makes the entity ineligible; it never proves absence. `does_not_contain` is an evidence-bounded reviewed statement, not a universal guarantee. `tree_nuts` and gluten cereals use the existing exact taxonomy/umbrella mapping; no fuzzy synonyms or substring tests. Full 17-code assessment is required for every published entity because context can contain any of the 17 codes.

## 13. Catalog-coverage model

Keep distinct versions for schema, content and capability: `catalogSchemaVersion`, `catalogVersion`, and `catalogCoverageVersion`. The coverage record declares exact supported allergen codes, entity type(s), slots, patterns and whether celiac is supported. Capability is the intersection of this signed/validated declaration and complete entity metadata; neither alone can expand capability.

`catalogSupportedAllergenCodes` may leave `[]` only in the current no-catalog version. A nonempty release must support all 17 selectable codes or concrete output remains globally disabled; partial taxonomy support creates a dangerous mixed-context ambiguity. Incomplete coverage disables the concrete catalog, never just removes an unknown restriction. Coverage version must change with the first catalog and whenever supported domains change.

## 14. Filtering semantics

Deterministic order:

1. require calculated Phase 3A parent;
2. parse the exact current restriction context;
3. require overall `resolved`;
4. validate catalog envelope/market/taxonomy/schema/coverage/content hash;
5. validate and canonicalize every item/profile, rejecting duplicates;
6. require every hard-restriction domain to be covered;
7. apply separate celiac gate;
8. exclude on exact intersection with any `contains` ingredient allergen;
9. apply the approved cross-contact gate;
10. intersect explicit dietary-pattern compatibility;
11. apply slot compatibility;
12. sort by stable catalog order/`foodId` and render.

Unknown required metadata excludes the entity; structural/version/coverage conflicts disable the whole concrete catalog. Duplicate IDs/versions and mixed catalog versions disable the whole catalog. Deprecated, expired or superseded profiles are never selectable. No fuzzy/substring/LLM/free-text/probabilistic interpretation and no unrestricted fallback.

## 15. Multiple-restriction matrix

| Context | Concrete catalog | Entity rule | Phase 3B1 / message |
|---|---|---|---|
| one or several supported allergies | available | exclude union of every allergen and cross-contact failure | remains; limited reviewed examples |
| tree nuts + peanuts | available | two exact codes; no umbrella collapse | remains |
| wheat + celiac; oats + celiac; celiac + vegan | disabled in v1 | celiac domain unsupported | remains; no reviewed concrete examples for this combination |
| fish + vegetarian/vegan | available only if context otherwise covered | pattern AND allergy intersection | remains; empty is valid |
| milk + vegetarian; eggs + vegan | available | exact allergy AND pattern | remains |
| several allergies + pattern | available | conjunction of pattern with union of allergy exclusions | remains |
| supported + unresolved/unsupported restriction | disabled | no partial evaluation | remains; restriction not covered |
| old session or malformed context | disabled | no migration/synthesis | remains if its independent parent validates |

Any failure returns no concrete entities. It never suggests removing a restriction.

## 16. Celiac policy

Celiac is not wheat allergy and cannot reuse allergy metadata. Required entity states are `suitable`, `not_suitable`, `requires_verified_label`, `cross_contact_unknown`, `not_assessed`, `unsupported`, backed by gluten relationship and evidence.

The first batch does **not** support confirmed celiac; the whole concrete layer is disabled and Phase 3B1 remains. A later celiac-reviewed subset may admit appropriately evidenced naturally gluten-free or verified packaged identities, but generic manufactured types are insufficient. Oats are never automatically eligible and remain excluded until an owner-approved, specialist-reviewed, market-specific policy covers verified gluten-free labeling, contamination and individual clinical advice.

## 17. Cross-contact policy

Ingredient allergen and cross-contact are independent. Generic identities normally cannot prove a facility state; do not invent `not_applicable`. For a user with a relevant allergy, `may_contain`, `facility_warning`, `unknown` and `not_assessed` exclude the entity. `assessed_no_known_warning` is eligible only within the dated evidence scope and is not phrased as safe. The same conservative exclusion applies to future celiac output. Manufacturer disclaimers inform a specific SKU only, not a generic identity. Bulk and restaurant foods are excluded from v1.

## 18. Dietary-pattern compatibility

Store an explicit per-pattern result (`compatible`, `not_compatible`, `unknown`, `not_assessed`) for `omnivore`, `vegetarian`, `vegan`, `pescatarian`. Ingredient-level evidence is required; names/categories do not prove a pattern. Unknown/not assessed excludes the entity for that pattern. Honey, gelatine, rennet, additives, processing aids and ambiguous animal-derived inputs make manufactured types unsuitable for v1. Cross-contact is not automatically a dietary-pattern violation; it is a separate disclosed policy. Pattern compatibility is preference classification, not allergy safety or nutritional adequacy.

## 19. Russian/EAEU evidence review

| Organization/document | Date/jurisdiction | Supports | Does not support / limitation | Metadata use |
|---|---|---|---|---|
| EEC, [TR CU 022/2011 official landing page](https://eec.eaeunion.org/comission/department/deptexreg/tr/PischevkaMarkirovka.php) and consolidated regulation | adopted 2011; effective 2013; amendments listed through 2024; EAEU | composition/label framework and designated reaction-causing components; current amendment chain must be checked | does not certify a NutriMind entity or replace current package review | taxonomy mapping, source jurisdiction/version |
| EEC, [TR CU 021/2011 official page](https://eec.eaeunion.org/comission/department/deptexreg/tr/PischevayaProd.php) | amendments listed through 2024; EAEU | food-safety regulatory context | does not establish individual allergy/celiac suitability | policy provenance only |
| Ministry of Health RF registry, [clinical recommendations portal](https://cr.minzdrav.gov.ru/) and 2025 “Пищевая аллергия” record | 2025; Russia | confirmed allergy needs clinical management; avoidance/diet decisions are medical context | not a catalog-label certification system and not proof of absence | reviewer training/safe language, not entity auto-classification |
| EAACI, [Guideline on management of IgE-mediated food allergy](https://eaaci.org/guidelines-position-papers/eaaci-guidelines-on-the-management-of-ige-mediated-food-allergy/) | 2024; international/European clinical guidance | confirmed allergy management includes allergen avoidance and specialist dietary advice | cannot map generic names to safe foods | explains conservative filter and specialist boundary |
| WGO, [Celiac disease guideline](https://www.worldgastroenterology.org/guidelines/celiac-disease/celiac-disease-english) | current page based on global guideline; international | wheat/rye/barley exclusion, processed-food and cross-contamination difficulty, special oats issue | not Russia-specific labeling law; does not certify any item | separate celiac/oats/cross-contact policy |

The current consolidated text and applicable EEC decisions must be captured in the review record at implementation time; an undated source is not current evidence. Regulations define label obligations, not product safety guarantees. Clinical guidance defines disease-management boundaries, not a reusable commercial catalog. No official source found justifies claiming that missing allergen metadata proves absence or that a generic product type has stable composition. Vegetarian/vegan terminology requires an owner-approved convention; no legal completeness claim is made here.

## 20. Source hierarchy

1. Current official EAEU/Russian regulation for policy/taxonomy only.
2. For identity claims, an official product specification or authoritative primary producer record with version/date.
3. For a future SKU, current package label images plus manufacturer specification/page; discrepancies fail closed.
4. Current clinical guideline for celiac/allergy policy boundaries, never as proof of an entity’s ingredients.
5. Reviewer-entered factual abstraction tied to the above sources.
6. Public nutrition database only in Phase 3B3, not for allergy absence.

Retailer listings and third-party databases may locate a source but cannot approve allergy/celiac metadata. Blogs, marketplaces, forums, reviews, SEO pages and AI summaries are prohibited policy evidence.

## 21. Human-review workflow

Proposal → identity/scope check → source collection and licensing record → structured metadata entry → automated validation → first domain review → independent second review → approval/sign/hash → bundled publication → periodic re-verification → immutable replacement or deprecation → rollback drill. No entity publishes with partial review.

Every source has accessed/version dates. Review diffs show each changed claim. Conflicts remain unresolved and unpublished. Emergency deprecation is a new catalog release in v1; the rollback runbook must define owner, target time and verification.

## 22. Review ownership

| Model | Assessment |
|---|---|
| developer only | cheap/auditable technically, lacks implied clinical competence; reject |
| product owner + checklist | scalable for copy/identity, insufficient for celiac/allergen policy |
| nutrition specialist + developer | acceptable for low-risk v1 with explicit scope |
| nutrition specialist + allergy/celiac specialist | best for medical policy and future celiac subset; higher cost |
| external dataset | scalable only if provenance/license/update semantics match; not assumed |

Use a nutrition specialist as first reviewer and a different qualified allergy/celiac specialist for allergen, cross-contact, celiac and oats fields; a developer validates schema/provenance but does not medically approve. Product owner approves scope/language. Legal counsel is not a routine entity reviewer but must review licensing, trademarks and regulatory claims before branded content. Two-person review is mandatory for every published safety profile.

## 23. Versioning and lifecycle

Use semver-like immutable identifiers: schema `nutrimind.food-catalog.schema.v1`; initial content `nutrimind.food-catalog.ru.v1.0.0`; initial coverage `nutrimind.catalog-coverage.ru.v1`. These are recommendations requiring owner approval, not existing contracts.

`foodId` never changes. A semantic change creates a new entity/profile version and content hash; old records are superseded, never edited in place. Rename without identity change increments presentation/entity version. Identity split/merge creates new IDs and deprecates old IDs. Review/source change creates a new profile version. Initial review expiry: 180 days; earlier on source/label/regulatory change. Expired/deprecated/superseded items disappear from concrete output.

Catalog update need not invalidate the restriction context unless market/taxonomy/coverage discriminator changes. Unknown catalog version fails closed. A catalog release cannot mix arbitrary catalog versions. Static v1 emergency removal requires code review/release; this is acceptable only with a documented 24-hour removal target. Remote revocation is deferred rather than weakening integrity/privacy.

## 24. Static versus remote catalog

| Architecture | Privacy/offline/integrity | Removal/operations | Decision |
|---|---|---|---|
| TypeScript bundle | local and offline; executable content is unnecessary | deployment-coupled; awkward content diff | reject |
| versioned JSON bundle | local filtering, deterministic hash, offline, auditable | deployment-coupled emergency removal | select v1 |
| remote read-only JSON | can remain nonpersonalized; freshness/removal better | signature/cache/CDN/unavailable-source complexity | revisit after scale/removal evidence |
| database/API | easiest operations | unnecessary server/privacy/availability burden | reject for MVP |

Bundle one inert, schema-validated JSON catalog. Restriction context never leaves the client. If later remote, fetch the complete catalog without personal parameters, pin schema/content integrity, set bounded cache rules, and fail to Phase 3B1 when unavailable.

## 25. Licensing and copyright

Food/brand names and terse factual attributes may be facts, but database selection/arrangement, label photographs, retailer/manufacturer prose and external database content can carry rights and contractual limits. Do not copy descriptions or ingredient lists wholesale when a concise factual abstraction suffices. Keep source references and license/provenance records. Do not bundle label photographs in v1. Brand/SKU use also raises trademark, availability and endorsement concerns and needs legal review; this audit gives no legal advice. Nutrient values remain Phase 3B3. These risks reinforce excluding branded content from 3B2B v1.

## 26. User-facing UI options

| UI | Assessment |
|---|---|
| examples inside existing `<details>` | lowest cognitive/route cost; warnings stay near slot; selected |
| drawer | better comparison, more focus/mobile complexity |
| separate page | strongest disclosure space, disconnects meal/slot context |
| compact always-visible list | highest prescription/overload risk |

Within each existing slot disclosure: limited-catalog notice → neutral example names → entity type → “why shown for this slot” (category tag only) → restriction metadata summary → reviewed/source date → label/cross-contact caveat. No portions, grams, ranking, macro claim or timing-specific safety claim. Empty state stays within the slot and preserves the abstract slot.

## 27. User-facing language

Preferred: “Проверенные примеры из ограниченного каталога”; “Пример размечен по заявленным ограничениям и доступным источникам”; “Состав, маркировка и условия производства могут измениться — перепроверьте упаковку”; “Данные о возможном перекрёстном контакте могут быть неполными”; “Отсутствие примера не означает запрет, а наличие не заменяет медицинскую рекомендацию”.

Never say “безопасно для вас”, “точно не содержит”, “подходит при аллергии” without the defined full evidence, “лечебный”, “рекомендован врачами”, “идеально соответствует КБЖУ” or “можно без ограничений”. Even a reviewed entity is an evidence-bounded example, not certification.

## 28. Empty-result behavior

For one or more empty slots show the Phase 3B1 abstract slot plus “Для этого сочетания ограничений нет проверенных примеров в текущей версии каталога.” If every slot/meal is empty, show the message once at catalog level and keep all abstract structure. For insufficient coverage, malformed/unavailable catalog or all-deprecated content, disable the concrete layer and state that reviewed examples are unavailable. Never show unrestricted entities or invite the user to weaken a hard restriction.

## 29. Malformed-catalog behavior

Wrong JSON/schema/market/taxonomy/coverage, duplicate `foodId` or entity version, mixed catalog versions, unknown code, conflicting metadata or invalid envelope disables the entire concrete catalog. An otherwise valid envelope may quarantine a single entity for a local missing source/reviewer, expired review, deprecation, unknown celiac/pattern state or incomplete profile **only if** coverage is recomputed and still truthfully complete; for the 24-item static v1, prefer whole-catalog disable on any build-time validation error. Runtime never repairs or silently drops metadata. Phase 3B1 always remains independent.

## 30. Validator architecture

Pure layers: parse JSON to `unknown`; exact-key envelope parser; item parser; safety-profile parser; referential/duplicate/version validator; coverage derivation/comparison; capability evaluator; pure filter. Each returns discriminated unions (`ok` with canonical immutable value, or `error` with stable codes and paths). Warnings never authorize output. Canonical sort uses catalog order then `foodId`; arrays use approved vocabulary order. Output is deterministic for identical bytes/context. No React, storage, fetch, clock, fuzzy logic, LLM or silent normalization.

## 31. Catalog policy domains

Owner-approved IDs are needed for exact restriction intersection, unknown metadata fail-closed, separate celiac gate, cross-contact unknown, source/review requirements, expiry/deprecation exclusion, no portion, no macro claim, local filtering, unavailable-catalog fallback and Phase 3B1 continuity. Reuse existing `FOOD_RESTRICTION.*` and `FOOD_TEMPLATE.*` rules where semantics are identical; do not invent final IDs until naming/version ownership is approved.

## 32. Initial batch strategy

Select Strategy E, a risk × slot × restriction matrix, with lowest-risk admission as a hard gate. Each proposed entity must justify a slot gap, supported context combinations, authoritative identity evidence, complete 17-code/celiac/pattern/cross-contact metadata and two reviewers. Allocate six primary candidates to each slot and deliberately include multi-slot tags only after review. No real candidate names are approved by this audit.

## 33. Expansion policy

Expand in batches of 12, risk/category balanced, only after: 100% schema validation, source presence, two-person review, complete supported-allergen metadata, explicit celiac/pattern states, zero unresolved entities, all deterministic/regression/UI tests, production QA, measured rollback and owner sign-off. Coverage may expand only with a new coverage version. Track empty intersections and correction/update latency, not entity count alone.

## 34. Quality metrics

Report validated/reviewed/expired/deprecated counts; source and 17-code/celiac/pattern completeness; filter branch/combination coverage; empty-result rate by anonymous local test fixtures (not user analytics); reviewer disagreement; user-reported corrections without medical payload; median source-to-update latency; and rollback time. Targets for publication are 100% validation/source/review/required metadata and zero expired/unresolved/selectable-deprecated entities. No medical-outcome metric or claim.

## 35. Privacy

Flow: session-only restriction context → bundled catalog loader → pure client filter → UI. No restriction or celiac/pattern code in network requests, server logs, analytics, URL, cookies, localStorage or IndexedDB. No product selection persistence in MVP. Loading the same complete bundle for everyone needs no personalized request. Existing session context behavior remains unchanged. Any remote catalog can remain nonpersonalized; server-side personalization or selection persistence requires a new privacy review and consent analysis.

## 36. Security

For bundled JSON: exact schema/size limits; build-time and runtime validation; content hash; unique IDs; canonical Unicode normalization and length limits; render labels as text, never HTML; allowlist `https` source hosts for external disclosure and use safe link attributes; no executable fields; dependency/license review. Reject version spoofing and mixed releases. A future remote catalog additionally needs authenticated transport, signed/hash-pinned manifest, bounded cache/ETag rules, stale-version cutoff and fail-closed CDN behavior. Avoid a database/signing service for the static MVP.

## 37. Accessibility and mobile

Use semantic headings/lists and native disclosure controls; associate every warning with its list; expose entity type/review date in text; provide keyboard-visible focus; announce state changes without moving focus unexpectedly; never encode compatibility by color alone. Wrap long Russian names/source metadata, keep tap targets adequate, and verify 390×844 with no horizontal overflow. Screen readers must hear the limited-catalog and no-portion disclaimer before examples.

## 38. Performance

At 24 entities, static JSON parsing and O(entities × 17 codes) filtering are negligible. Memoize only by validated catalog identity plus canonical context if profiling shows need; no pagination, virtualization or lazy infrastructure. Reassess bundling when compressed catalog payload exceeds 250 KB, entity count exceeds roughly 500, or emergency updates must routinely beat application deployment. Those are review triggers, not automatic migration rules.

## 39. Future test matrix

| Domain | Deterministic minimum cases |
|---|---|
| catalog schema | correct; wrong schema/market/taxonomy/coverage; malformed; unknown-key rejection; duplicate foodId/version; mixed versions; empty |
| entity | every required field/type; source/reviewer missing; expired/deprecated; unsupported code; incomplete/conflicting allergen data; malformed celiac/pattern; unknown/duplicate slot |
| allergy | none; each of 17 codes; multiple; tree-nuts+peanuts; gluten cereals; fish/crustaceans/molluscs; supported+unsupported; missing metadata; exact intersection; no fuzzy/substring/partial fallback |
| celiac | all six states; oats; gluten cereal; generic type; future SKU; cross-contact unknown; v1 global disable |
| pattern | four supported literals plus other/unknown; conflicting evidence; pattern+allergy; pattern+celiac |
| cross-contact | all statuses for allergy/celiac and generic/future packaged identity |
| capability | valid complete; partial/empty/missing/malformed; old/unresolved/unsupported/mixed context; Phase3B1 fallback |
| privacy | no URL/analytics/personalized fetch/server storage/localStorage/IndexedDB/selection persistence/raw medical payload |
| UI | no concrete output for non-calculated states; empty/warnings/source review; no portions/grams/macro/medical claims; mobile/keyboard/screen reader/overflow |
| regression | Phase2D1, Phase3A1, Phase3A2, Phase3B1, restriction context, calibration and nine questionnaire sections unchanged; zero skipped tests |

Add property tests for filter monotonicity: adding a hard restriction cannot add entities; unknown metadata cannot improve eligibility; input ordering cannot change output; deprecated/expired cannot become selectable.

## 40. Recommended phase split

- **3B2B1:** schema, pure validator, capability and filter; fixtures only, no approved content/UI.
- **3B2B2:** 24 approved entities, source/review records and production UI after owner decisions and two-person review.
- **3B2B3:** 12-item expansion batches, update/deprecation/rollback workflow and coverage growth.
- **3B2C:** `other`, unresolved and deferred domains; no fuzzy interpretation.
- **3B3:** composition, units, grams, portions and macro reconciliation.
- **3C:** menus and recipes.

Do not combine 3B2B1 with unreviewed content, 3B2B2 with celiac/oats before specialist policy, catalog safety with 3B3 composition, or examples with 3C menus.

## 41. Blocking owner decisions

All rows block the affected implementation; “yes” means Phase 3B2B1 itself is blocked.

| Decision | Recommendation | Alternative / residual risk | Blocks 3B2B1? |
|---|---|---|---|
| product definition/type | generic `single_food` reviewed example | generic types/SKU increase variability/staleness | yes |
| brands/SKU | exclude v1 | include with label/version/legal workflow | no, but blocks content |
| first batch/category | 24; six per slot; narrow classes in §8 | smaller weak coverage; larger review burden | no, blocks 3B2B2 |
| entity architecture | item + separate profile, discriminated outer type | flat schema couples lifecycles | yes |
| allergen semantics | complete 17-code open-world tri-state + separate cross-contact | arrays risk treating absence as safe | yes |
| coverage | all 17 or catalog off | partial support risks mixed fail-open | yes |
| celiac/oats | celiac off in v1; oats excluded | specialist subset later | yes for capability semantics |
| cross-contact | unknown/not assessed exclude for relevant hard restriction | warning-only is unsafe | yes |
| patterns | explicit four-state metadata, no adequacy claim | infer from category/name | yes |
| sources | hierarchy in §20, dated provenance | retailer/third-party shortcuts | no, blocks content |
| reviewer qualifications | nutrition + independent allergy/celiac specialist; developer technical | one-person review lowers cost but weakens assurance | no, blocks content |
| review expiry | 180 days or earlier trigger | longer period raises staleness | yes for schema |
| architecture/removal | bundled JSON; 24-hour release target | remote manifest improves removal but adds operations | yes |
| licensing | factual abstraction, no photos/branded v1; legal review for expansion | copied content/brand risk | no, blocks content |
| UI language/empty state | §27/§28 | stronger safety claims or unrestricted fallback | no, blocks UI |
| policy IDs | approve domains before final IDs | ad-hoc IDs damage traceability | yes |
| versions | proposed schema/content/coverage IDs in §23 | different naming acceptable if atomic | yes |
| expansion gate | 12-item batches and 100% gates | count-first expansion raises debt | no |

## 42. Expected future file scope

Possible new files: `PHASE_3B2B_REPORT.md`, `core/food-catalog/types.ts`, `catalog-schema.ts`, `entity-schema.ts`, `validator.ts`, `filter.ts`, `capability.ts`, a versioned inert RU JSON catalog, and `tests/food-catalog.test.mjs`. Likely existing changes in implementation: `PHASE_2_ARCHITECTURE.md`, `app/meal-structure/meal-structure-client.tsx`, `app/globals.css`, and only if strictly versioned, `core/food-restrictions/capability.ts`.

Must remain semantically unchanged: questionnaire fields/taxonomy and nine sections; current restriction-context schema/storage; Phase 2 calculations; Phase 3A allocation; Phase 3A2 timing; Phase 3B1 neutral slots; calibration IndexedDB; Vercel configuration; report-demo business logic. This audit changes none of them.

## 43. Final recommendation

1. Entity: a human-reviewed generic `single_food` example.
2. Brands/SKU: no.
3. First batch: exactly 24.
4. Slots: all four, six primary candidates each; many-to-many tags permitted.
5. Excluded: compound/manufactured types, water/salt formulations, canned/dried ambiguous forms, bulk/restaurant foods, oats, branded/SKU and label-dependent categories.
6. Architecture: discriminated catalog item referencing a separate immutable reviewed safety profile.
7. Required fields: the required set in §11.
8. Allergens: per-code ingredient tri-state plus separate cross-contact state/evidence.
9. Full taxonomy: yes, all 17 for every published profile.
10. Multiple allergies: exact union of exclusions; every dimension must pass.
11. Unsupported restriction: whole concrete catalog disabled.
12. Celiac: concrete catalog disabled in v1.
13. Oats: excluded; never automatic.
14. Unknown cross-contact: exclude for the relevant allergy/celiac context.
15. Patterns: explicit omnivore/vegetarian/vegan/pescatarian compatibility; unknown excludes.
16. Sources: official policy → primary specification/label → reviewed factual abstraction; clinical sources define safety boundary.
17. Review: nutrition specialist plus technical validation.
18. Second reviewer: mandatory independent allergy/celiac specialist for safety profile.
19. Expiry: 180 days or immediate re-review trigger.
20. Storage: bundled versioned JSON for v1.
21. Server: restriction context is never sent.
22. Empty result: keep abstract slot and neutral “no reviewed examples” message.
23. Malformed catalog: concrete layer off; Phase 3B1 remains.
24. Update/removal: immutable replacement/deprecation and release; 24-hour emergency target.
25. Versions: proposed `nutrimind.food-catalog.ru.v1.0.0` and `nutrimind.catalog-coverage.ru.v1`, owner-approved atomically.
26. First implementation: 3B2B1 engine/schema with no production content.
27. Reviewed entities may be added only in 3B2B2 after all gates.
28. Portions/composition remain 3B3; menus/recipes remain 3C.

## 44. Explicit exclusions

No production code, catalog, entity records, concrete food examples, product cards, UI filters, ingredient UI, brands, SKU, portions, grams, nutrition composition, macro matching, menus, recipes, shopping links, storage change, API, database, tests/build/server/browser run, deployment, commit or push is part of this audit. It does not certify regulatory compliance, diagnose allergy/celiac disease or recommend a food to a real person.

## 45. Final contradiction check

Adversarial answers are uniformly fail-closed: missing allergen metadata is not absence; partial coverage cannot authorize an unsupported restriction; one supported code cannot hide another; generic product types cannot promise stable ingredients; SKU evidence can stale; undated evidence is not current; expired/deprecated records are not visible/selectable; celiac never relies on allergy metadata; oats and unknown cross-contact are never automatic; pattern is not inferred from a name; timing cannot change safety; entities receive no portions and cannot change kcal/macros; a missing catalog cannot disable Phase 3B1; empty results never solicit weaker restrictions; malformed entities cannot break the meal plan; restrictions and allergen analytics never leave the client; old contexts get no concrete output; UI never says “safe”; emergency removal has an explicit release target. The narrower 24-item single-food release is the result of this review.

Contradictions found and resolved:

- A generic single-food identity is stable enough for ingredient classification but cannot prove facility cross-contact. Resolution: separate cross-contact metadata and exclude unknown states for relevant users.
- Full 17-code coverage appears broader than a 24-item catalog. Resolution: coverage describes assessment completeness, not catalog completeness; UI explicitly says the list is limited.
- Static bundling conflicts with rapid removal. Resolution: accept only with a 24-hour release runbook; reconsider remote signed content when operational evidence demands it.
- Complete celiac metadata is required while celiac output is deferred. Resolution: profiles still declare `unsupported/not_assessed`; capability disables celiac until a separately reviewed coverage version exists.
- Six candidates per slot conflicts with multi-slot entities. Resolution: primary allocation is a review-planning quota; rendered compatibility remains many-to-many and never a macro claim.
- Regulations require label information but generic identities have no single label. Resolution: regulations guide taxonomy/policy; only evidence appropriate to the entity class supports its claims, and label-dependent classes are excluded.
- Per-entity quarantine can reduce declared coverage. Resolution: coverage must be derived after validation; any mismatch disables the whole v1 concrete layer.

The cross-check is internally consistent: every UI claim maps to metadata; every required metadata claim maps to dated evidence; every evidence set is reviewed; absence is never safety; celiac and cross-contact remain separate; unsupported contexts receive no partial output; catalog data never changes nutrition numbers or adds portions; Phase 3B1 remains fallback; privacy remains client-only; all 24 records can be manually reviewed; and no legal-compliance promise is made.

## Final Phase 3B2B1 implementation lock

Status: **approved, exact, closed for implementation, and not subject to implementation choice**. This section supersedes every proposed, tentative, recommended, example, unresolved, or owner-approval-required statement above for Phase 3B2B1.

### Exact versions and production boundary

The exact versions are: catalog `nutrimind.food-catalog.schema.v1`, entity `nutrimind.food-catalog.entity.v1`, safety profile `nutrimind.food-catalog.safety-profile.v1`, source `nutrimind.food-catalog.source.v1`, review `nutrimind.food-catalog.review.v1`, policy `nutrimind.food-catalog.policy.ru.v1`, future content `nutrimind.food-catalog.ru.v1.0.0`, and future coverage `nutrimind.catalog-coverage.ru.v1`. Existing market/taxonomy remain `nutrimind.market.ru.v1` and `nutrimind.food-allergen.ru.v1`; production restriction coverage remains `nutrimind.catalog-coverage.none.v1`.

Production has no catalog artifact, empty envelope, demo/fallback entity, or application import. Missing catalog and a test-only valid empty envelope both yield `abstract_only`; the latter validates as `valid_empty`. Phase 3B1 remains available and no catalog UI is rendered.

Future coverage supports only `single_food`, patterns `omnivore`, `vegetarian`, `vegan`, `pescatarian`, no celiac concrete output, and 16 allergen codes in this order: `wheat`, `rye`, `barley`, `other_gluten_cereal`, `tree_nuts`, `peanuts`, `sesame`, `fish`, `crustaceans`, `molluscs`, `milk`, `eggs`, `soybeans`, `celery`, `mustard`, `lupin`. `oats` remains mandatory in every complete 17-code profile but is not covered for concrete output.

### Exact strict schemas

`FoodCatalogEnvelopeV1` has exactly `schemaVersion`, `marketVersion`, `taxonomyVersion`, `policyVersion`, `contentVersion`, `coverageVersion`, `supportedEntityTypes`, `catalogSupportedAllergenCodes`, `catalogSupportedDietaryPatterns`, `catalogCeliacSupport`, `entities`, and `safetyProfiles`. Maximum cardinality is 250 each; entity/profile cardinality and references are one-to-one. One invalid record invalidates the whole catalog; no quarantine, partial coverage, repair, or unknown fields.

`FoodCatalogEntityV1` has exactly `schemaVersion`, `foodId`, `entityVersion`, `entityType`, `displayNameRu`, `slotCodes`, `displayOrder`, `safetyProfileRef`, `lifecycleStatus`, `lifecycleReason`, `supersedes`, `supersededBy`, and `contentHash`. Slots use Phase 3B1 canonical order. Lifecycle is `active|deprecated|withdrawn`; reasons are `superseded|source_changed|policy_changed|review_expired|data_error|safety_review_required|emergency_withdrawal`. Only active entities are valid in a production v1 envelope.

`FoodSafetyProfileV1` has exactly `schemaVersion`, `safetyProfileId`, `safetyProfileVersion`, `foodId`, `entityVersion`, `profileHash`, `sourceSetHash`, `policyVersion`, `allergenAssessments`, `glutenRelationship`, `celiacStatus`, `dietaryPatternAssessments`, `labelVerificationStatus`, `sources`, and `reviews`. Entity/profile identity and versions must match exactly.

IDs use the approved lower-case regexes: `^food_ru_[a-z0-9]+(?:_[a-z0-9]+)*$` (9–80), `^profile_ru_[a-z0-9]+(?:_[a-z0-9]+)*$` (12–96), `^source_[a-z0-9]+(?:_[a-z0-9]+)*$` (8–96), `^review_[a-z0-9]+(?:_[a-z0-9]+)*$` (8–96), and `^reviewer_[a-z0-9]+(?:_[a-z0-9]+)*$` (10–96). Versions are integers 1–2147483647. Hashes match `^sha256:[0-9a-f]{64}$`. Canonical authoring uses UTF-8, NFC, sorted object keys, canonical arrays, no insignificant whitespace, and SHA-256.

All strict nested objects reject unknown fields. Human text is trimmed NFC Unicode without C0/C1 controls, null, unpaired surrogates, `<` or `>`; display names are 1–120 code points. Successful output is newly allocated, canonicalized and deeply frozen without mutating input.

### Exact safety metadata

Every profile has all 17 taxonomy codes exactly once in taxonomy order. Ingredient status is `contains|does_not_contain|unknown`; cross-contact is independently `not_applicable|assessed_no_known_warning|may_contain|facility_warning|unknown|not_assessed`. A selected allergen passes only with `does_not_contain` and cross-contact `not_applicable` or `assessed_no_known_warning`.

Gluten relationship is `contains_gluten_cereal|does_not_contain_gluten_cereal|unknown|not_assessed`; it never proves celiac suitability. Celiac status is `suitable|not_suitable|requires_verified_label|cross_contact_unknown|not_assessed|unsupported`, but coverage-level celiac support is `not_supported`, so confirmed celiac yields `CAPABILITY_CELIAC_UNSUPPORTED` and `CATALOG_CELIAC_NOT_SUPPORTED` without filtering. An `oats` restriction similarly yields `CAPABILITY_OATS_UNSUPPORTED` and `CATALOG_OATS_NOT_SUPPORTED`.

Every profile has all four patterns exactly once with `compatible|not_compatible|unknown|not_assessed`. Only compatible passes. Compatibility implications are vegan→vegetarian,pescatarian,omnivore; vegetarian→pescatarian,omnivore; pescatarian→omnivore; omnivore must be compatible. Conflict is `PROFILE_PATTERN_CONFLICT`. Label verification is `not_applicable|required|verified|not_verified`; only `not_applicable` is valid for `single_food` v1.

### Exact sources and reviews

Sources use canonical types `official_regulation`, `official_government_reference`, `official_clinical_guideline`, `manufacturer_official_specification`, `manufacturer_official_page`, `package_label_document`, `package_label_image`; retailer sources are forbidden. A strict source has schema/versioned identity, title, publisher, source version, `publishedOn`, `verifiedOn`, locator type/value, and fingerprint. Profiles require 1–8 unique sources. Dates are valid `YYYY-MM-DD`, not future relative to injected `asOf`, and verified is not before published. Locators are `https_url|document_reference|asset_reference` with the approved length, control-character, HTTPS, and credential restrictions.

Reviewer roles are `allergen_celiac_specialist`, `nutrition_specialist`, `regulatory_labeling_specialist`, `technical_validator`; statuses are `approved|changes_required|rejected`. A strict review binds its ID/reviewer/role/status/UTC timestamp to exact profile/source hashes and policy. Publication requires distinct approved `allergen_celiac_specialist` plus one distinct approved `nutrition_specialist` or `regulatory_labeling_specialist`; technical validation never substitutes. Maximum four unique reviewers/reviews.

Approved reviews expire exactly 180×24 hours after `reviewedAt`: valid for `asOf < expiry`, expired for `asOf >= expiry`. Timestamps are exact UTC `YYYY-MM-DDTHH:mm:ss.sssZ`. Source/profile/policy hash mismatch is `REVIEW_BINDING_MISMATCH`; expiry is `REVIEW_EXPIRED`. No implicit clock or heuristic invalidation.

### Exact results, lifecycle, and sorting

Catalog validation is `valid|valid_empty|invalid`; entity/profile validation is `valid|invalid`; capability is `abstract_only|concrete_available`; filtering is `matched|empty|catalog_unavailable|context_unavailable|slot_unsupported`. Capability is concrete only for a resolved current context, valid nonempty exact-version catalog, fully supported allergen set, non-confirmed celiac, supported pattern, and wholly publication-ready catalog. There is no partial capability.

Filtering requires concrete capability and one exact slot. It applies the full allergen union, separate cross-contact gate and explicit pattern gate. Results contain canonical matched items, per-food canonical exclusion codes, warnings/errors and all rules. Empty matching produces `FILTER_NO_MATCHES` warning/error and never relaxes restrictions.

Canonical order is entities by displayOrder/foodId; profiles by profile ID/version; allergens by taxonomy; patterns and slots by their declared orders; sources by source-type/sourceId; reviews by role/reviewerId/reviewedAt; diagnostic codes and all 25 rules by their locked enum order.

Deprecated/withdrawn/expired/invalid records invalidate the whole catalog. Emergency removal is `withdrawn` + `emergency_withdrawal`, produces invalid catalog and abstract-only capability, and requires a bundled application release; there is no remote kill switch.

### Exact closed diagnostics and rules

The closed warning enum, in order, is: `CATALOG_NO_PRODUCTION_CONTENT`, `CATALOG_EMPTY`, `CATALOG_COVERAGE_NOT_ACTIVE`, `CATALOG_CONCRETE_OUTPUT_DISABLED`, `CATALOG_CELIAC_NOT_SUPPORTED`, `CATALOG_OATS_NOT_SUPPORTED`, `CATALOG_CROSS_CONTACT_FAIL_CLOSED`, `CATALOG_REVIEW_EXPIRY_180_DAYS`, `CATALOG_CLIENT_SIDE_FILTERING_ONLY`, `CATALOG_PHASE3B1_FALLBACK`, `CATALOG_NO_PORTIONS`, `CATALOG_NO_MACRO_MATCHING`, `FILTER_ITEMS_EXCLUDED`, `FILTER_NO_MATCHES`.

The closed error enum, in order, is: `CATALOG_MISSING`, `CATALOG_NOT_OBJECT`, `CATALOG_UNKNOWN_FIELD`, `CATALOG_SCHEMA_UNSUPPORTED`, `CATALOG_MARKET_UNSUPPORTED`, `CATALOG_TAXONOMY_UNSUPPORTED`, `CATALOG_POLICY_UNSUPPORTED`, `CATALOG_CONTENT_VERSION_UNSUPPORTED`, `CATALOG_COVERAGE_UNSUPPORTED`, `CATALOG_COVERAGE_INVALID`, `CATALOG_COLLECTION_INVALID`, `CATALOG_SIZE_EXCEEDED`, `CATALOG_DUPLICATE_ID`, `CATALOG_REFERENCE_INVALID`, `CATALOG_CONTAINS_INVALID_ENTRY`, `ENTITY_NOT_OBJECT`, `ENTITY_UNKNOWN_FIELD`, `ENTITY_SCHEMA_UNSUPPORTED`, `ENTITY_ID_INVALID`, `ENTITY_VERSION_INVALID`, `ENTITY_TYPE_UNSUPPORTED`, `ENTITY_LABEL_INVALID`, `ENTITY_SLOT_INVALID`, `ENTITY_ORDER_INVALID`, `ENTITY_PROFILE_REF_INVALID`, `ENTITY_HASH_INVALID`, `ENTITY_LIFECYCLE_INVALID`, `ENTITY_SUPERSESSION_INVALID`, `PROFILE_NOT_OBJECT`, `PROFILE_UNKNOWN_FIELD`, `PROFILE_SCHEMA_UNSUPPORTED`, `PROFILE_ID_INVALID`, `PROFILE_VERSION_INVALID`, `PROFILE_ENTITY_MISMATCH`, `PROFILE_HASH_INVALID`, `PROFILE_POLICY_UNSUPPORTED`, `PROFILE_ALLERGEN_MATRIX_INVALID`, `PROFILE_GLUTEN_RELATIONSHIP_INVALID`, `PROFILE_CELIAC_STATUS_INVALID`, `PROFILE_PATTERN_MATRIX_INVALID`, `PROFILE_PATTERN_CONFLICT`, `PROFILE_LABEL_VERIFICATION_INVALID`, `SOURCE_COLLECTION_INVALID`, `SOURCE_RECORD_INVALID`, `SOURCE_UNKNOWN_FIELD`, `SOURCE_TYPE_UNSUPPORTED`, `SOURCE_DATE_INVALID`, `SOURCE_LOCATOR_INVALID`, `SOURCE_HASH_INVALID`, `SOURCE_DUPLICATE`, `SOURCE_SET_HASH_MISMATCH`, `REVIEW_COLLECTION_INVALID`, `REVIEW_RECORD_INVALID`, `REVIEW_UNKNOWN_FIELD`, `REVIEW_ROLE_UNSUPPORTED`, `REVIEW_STATUS_INVALID`, `REVIEW_DUPLICATE`, `REVIEW_INDEPENDENCE_FAILED`, `REVIEW_REQUIRED_ROLE_MISSING`, `REVIEW_EXPIRED`, `REVIEW_BINDING_MISMATCH`, `CAPABILITY_CONTEXT_UNAVAILABLE`, `CAPABILITY_CATALOG_UNAVAILABLE`, `CAPABILITY_COVERAGE_UNSUPPORTED`, `CAPABILITY_CELIAC_UNSUPPORTED`, `CAPABILITY_OATS_UNSUPPORTED`, `FILTER_REQUEST_INVALID`, `FILTER_SLOT_UNSUPPORTED`, `FILTER_ENTITY_EXCLUDED_ALLERGEN`, `FILTER_ENTITY_EXCLUDED_CROSS_CONTACT`, `FILTER_ENTITY_EXCLUDED_PATTERN`, `FILTER_NO_MATCHES`.

The complete 25-rule array is: `FOOD_CATALOG.RU_MARKET_SCOPE.001`, `FOOD_CATALOG.NO_PRODUCTION_CONTENT.001`, `FOOD_CATALOG.ENTITY_PROFILE_SEPARATION.001`, `FOOD_CATALOG.SINGLE_FOOD_ONLY_V1.001`, `FOOD_CATALOG.FULL_ALLERGEN_MATRIX.001`, `FOOD_CATALOG.EXACT_RESTRICTION_INTERSECTION.001`, `FOOD_CATALOG.UNKNOWN_METADATA_FAIL_CLOSED.001`, `FOOD_CATALOG.CROSS_CONTACT_SEPARATE.001`, `FOOD_CATALOG.CELIAC_SEPARATE_GATE.001`, `FOOD_CATALOG.CELIAC_NOT_SUPPORTED_V1.001`, `FOOD_CATALOG.OATS_NOT_SUPPORTED_V1.001`, `FOOD_CATALOG.DIETARY_PATTERN_EXPLICIT.001`, `FOOD_CATALOG.SOURCE_REQUIRED.001`, `FOOD_CATALOG.TWO_SPECIALIST_REVIEWS.001`, `FOOD_CATALOG.REVIEW_EXPIRY_180_DAYS.001`, `FOOD_CATALOG.REVIEW_BINDING_REQUIRED.001`, `FOOD_CATALOG.DEPRECATED_EXCLUDED.001`, `FOOD_CATALOG.WITHDRAWN_EXCLUDED.001`, `FOOD_CATALOG.MALFORMED_CATALOG_DISABLES_CONCRETE.001`, `FOOD_CATALOG.CLIENT_SIDE_FILTERING.001`, `FOOD_CATALOG.NO_PERSONALIZED_NETWORK.001`, `FOOD_CATALOG.PHASE3B1_FALLBACK.001`, `FOOD_CATALOG.NO_PORTIONS.001`, `FOOD_CATALOG.NO_MACRO_MATCHING.001`, `FOOD_CATALOG.EMPTY_RESULT_NO_RESTRICTION_RELAXATION.001`.

### Closed Phase 3B2B2 boundary

Phase 3B2B2 remains exactly 24 fully reviewed `single_food` production entities, six primary candidates per Phase 3B1 slot, complete 17-code profiles, no oats entity, brand, SKU, packaged generic, bulk/restaurant item, portion, composition or menu. Phase 3B2B1 creates none of this content.
