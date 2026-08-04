# Phase 3B2B2A — content-and-evidence audit

Audit date: 2026-08-04. Scope: selection and review preparation only. This document is not a catalog, medical advice, specialist review, or permission to publish.

## 1. Executive summary

The repository can support a future 24-entity catalog mechanically, but the requested generic, unbranded model cannot currently produce a defensible safety dossier for all 24 entities. Official sources can establish food identity, intrinsic allergen relationships, and labeling duties. They cannot establish supply-chain cross-contact or absence of 16 other allergens for every generic food independent of producer, package, and facility.

Classification: **`CONTRACT_RECONSIDERATION_REQUIRED`**. None of the candidates below is production-ready or specialist-approved. Nine intact fresh plant foods are plausible research candidates; the remaining foods have stronger processing, packing, species, or intrinsic-allergen burdens. The blocking contradiction is catalog-wide: one invalid entity invalidates the future catalog, while the schema requires a completed safety profile and `labelVerificationStatus: not_applicable` for generic `single_food` entities.

## 2. Repository confirmation

- Root: `C:/Projects/nutrimind`; branch: `main`.
- Local HEAD and `origin/main`: `f4895afdb3519cfe266eddad56ccf25562302094`; divergence: `0 0`.
- Remote `refs/heads/main` resolved to the same commit during pre-flight.
- Primary worktree was used; `C:/Projects/nutrimind-original` was not used.
- No merge, rebase, or cherry-pick was active; the tree was clean before this file.
- No test, typecheck, build, server, browser QA, commit, push, or deployment belongs to this audit.

## 3. Current production baseline

- Phase 3B2B1 engine exists; production catalog artifact and entities do not.
- Coverage is `nutrimind.catalog-coverage.none.v1`; supported allergen subset is `[]`.
- Capability is `abstract_only`; Phase 3B1 abstract slots remain available.
- Phase 3B2B2 production content has not started.

## 4. Approved Phase 3B2B1 contracts

- Future content version: `nutrimind.food-catalog.ru.v1.0.0`.
- Future coverage: `nutrimind.catalog-coverage.ru.v1`; entity type: `single_food`.
- Exactly 24 entities, six primary entities for each of four slots.
- Every safety profile contains all 17 allergen codes; the supported future subset contains 16 and excludes `oats`.
- Confirmed celiac disease is not supported by the concrete layer.
- Two independent specialist reviews are required and expire after exactly `180 × 24` hours.
- Validation is fail-closed and catalog-level; one invalid entity prevents the complete artifact from becoming usable.

## 5. Audit methodology

The audit used the checked-in schemas, validator, capability/filter behavior, restriction taxonomy, neutral-slot contracts, tests, and prior phase reports as the production truth. Candidates were screened in this order: single-food identity; stable definition; prohibited forms; source availability; 17-code allergen feasibility; cross-contact; gluten/celiac; dietary patterns; labeling; review reproducibility; batch consequence. Unknowns remain unknown.

## 6. Source-research methodology

Research was limited to current official or primary sources. The search sought rules and reusable evidence classes, not a misleading web citation for each familiar food name. A source was accepted only for the proposition it actually supports. No marketplace, retailer, blog, forum, review, SEO page, AI summary, or unverified database was treated as evidence. Access date for web sources: 2026-08-04.

## 7. Single-food boundary

A candidate is one generic, unbranded food with one stable ordinary and technical meaning, no recipe, brand, SKU, flavor, coating, glaze, additive, restaurant preparation, or assumed bulk-store handling. Included processing must be explicitly bounded and must not introduce ingredients. Fresh and a named dry/raw form are separate definitions; a generic name cannot silently cover both. `single_food` describes identity, not allergen safety.

## 8. Candidate inclusion rules

- One biological source or one unambiguously defined edible material.
- A Russian display name understandable without a brand.
- A definition reproducible by two reviewers.
- One declared primary slot based only on neutral food-group use, never macro composition.
- A plausible official identity source and a traceable path to specialist evidence.
- No oats and no need for `labelVerificationStatus` other than the currently mandated `not_applicable`.

## 9. Candidate exclusion rules

Excluded: bread, yogurt, cheese, variably defined curd products, plant drinks, sausages, protein products/bars, prepared dishes, variable-composition preserves, sauces, mixtures, additive-containing products, restaurant foods, packaged product types, brands, SKU, oats, and any entity whose definition necessarily requires a specific label. Frozen, dried, glazed, coated, seasoned, roasted, blended, or otherwise processed variants are excluded unless independently audited later.

## 10. Slot-distribution method

The set contains exactly six candidates per primary slot. Slot assignment means neutral food-group compatibility only. No nutrient value, portion, menu, recipe, energy calculation, or macro matching was used. `additionalSlots` is empty where a second assignment would require nutritional inference.

## 11. Allergen-evidence model

Audit-only states are: `evidence_supports_contains`, `evidence_may_support_does_not_contain`, `evidence_insufficient`, `not_applicable_to_generic_definition`, and `specialist_decision_required`. They are not production enums.

All 17 codes are assessed for every record through a compact vector: `self` identifies any intrinsic code; `other16` or `other17` covers the remainder. For egg, `self=eggs`; cod, `self=fish`; sunflower seed, pumpkin seed, flax seed, and all other candidates have no direct match to the named 17-code taxonomy (`self=none`). “No direct match” is not an absence finding. In every record the non-self codes are `evidence_insufficient`; their production statuses cannot be filled from a generic definition alone. `oats` is always `evidence_insufficient` and outside future supported coverage, never silently cleared.

## 12. Cross-contact feasibility

For generic food, facility, packing, transport, bulk handling, and shared-equipment facts vary. Regulatory labeling rules do not prove that cross-contact is `not_applicable`, and silence on a label does not prove `assessed_no_known_warning`. Dry grains, legumes, seeds, and oils have an especially material processing/packing burden; meat, fish, egg, and produce still lack a universal chain-of-custody assertion. Therefore no candidate has a complete cross-contact dossier. This is the central blocker.

## 13. Celiac and oats boundary

No candidate is oats. Generic non-gluten identity does not establish celiac suitability because contamination and handling remain separate questions. The future concrete layer excludes confirmed celiac disease, so every record uses `celiac feasibility: unsupported by current contract; no suitability claim`. A gluten relationship must not be converted into a celiac decision.

## 14. Dietary-pattern feasibility

Pattern compatibility requires an approved pattern taxonomy and specialist mapping. Plant identity may provide evidence relevant to vegetarian/vegan review; animal identity may provide evidence of incompatibility with those patterns. Neither is assigned a production status here. Religious, ethical, medical, and personal pattern variants are not inferred from names.

## 15. Source hierarchy

| Source | Jurisdiction/date | Supports | Does not support | Applicability/limits |
|---|---|---|---|---|
| EEC, [TR CU 022/2011 official page](https://eec.eaeunion.org/comission/department/deptexreg/tr/PischevkaMarkirovka.php) and [consolidated text](https://eec.eaeunion.org/upload/medialibrary/9db/TrTsPishevkaMarkirovka.pdf) | EAEU; adopted 2011, effective 2013, official page lists amendments through 2024 | Composition/label framework and designated reaction-causing components | Generic absence, facility cross-contact, celiac suitability, pattern mapping | Primary for Russian-market labeling; product/facility facts still required |
| EEC, [TR CU 021/2011 official page](https://eec.eaeunion.org/comission/department/deptexreg/tr/PischevayaProd.php) | EAEU; adopted 2011, current official page | General food-safety and production framework | Candidate-specific safety metadata | Context only; not a dossier substitute |
| FAO/INFOODS, [Food nomenclature](https://www.fao.org/infoods/infoods/standards-guidelines/food-nomenclature/en/) | International; page updated 2022-10-20; underlying guidelines 1991 | Unambiguous food description and single/mixed distinction | Allergen absence, cross-contact, celiac or pattern status | Strong for identity facets, not clinical or production evidence |
| FAO/INFOODS, [Standards and guidelines](https://www.fao.org/infoods/infoods/standards-guidelines/en/) | International; page updated 2022-10-20 | Matching, documentation and data-quality discipline | Safety conclusions for a generic Russian product | Useful for reproducibility and source-gap control |
| Codex Alimentarius, General Standard for the Labelling of Prepackaged Foods, CXS 1-1985 | International; current official standard family | International allergen/ingredient labeling baseline | Universal generic cross-contact absence or Russian legal conclusion | Secondary to EAEU rules; prepackaged-food scope |
| Ministry of Health RF, [clinical recommendations registry](https://cr.minzdrav.gov.ru/) | Russia; live registry | Location for current approved clinical recommendations and specialist verification | Product-chain facts or generic entity approval | Reviewer must archive the exact applicable record/version |
| EAACI, [Guideline on management of IgE-mediated food allergy](https://eaaci.org/guidelines-position-papers/eaaci-guidelines-on-the-management-of-ige-mediated-food-allergy/) | Europe; 2024 | Clinical need for confirmed-allergy management and specialist context | Russian labeling, candidate-specific absence/cross-contact | Clinical context only |
| WGO, [Celiac disease guideline](https://www.worldgastroenterology.org/guidelines/celiac-disease/celiac-disease-english) | International; living guideline page | Gluten/cross-contamination complexity and special oats boundary | Russian label or candidate certification | Clinical context; no candidate suitability inference |

Publication/update dates not visibly established by the official landing page must be recorded from the retrieved controlled document at dossier time; this audit does not invent them.

## 16. Specialist-review package

Each eventual package must include: frozen exact definition and exclusions; source register with archived version/date/locator; a 17-code claim-by-claim evidence table; cross-contact rationale tied to a defined supply model; gluten/celiac separation; pattern mapping; label rationale; reviewer identity/role/independence; decision timestamps; expiry; and reproducible source fingerprints generated by the designated owner. Required independent roles are (1) physician allergist-immunologist or appropriately credentialed clinical specialist and (2) food-safety/labeling specialist with EAEU competence. Codex assigns neither identity nor approval.

## 17. Publication-readiness gate

A candidate may advance only when every schema field has direct evidence, both independent reviews are valid and unexpired, sources are reproducible, no evidence gap was converted into a favorable value, and the exact entity still matches the reviewed definition. No candidate passes this gate today.

## 18. Batch-level release gate

The artifact must contain exactly 24 mutually valid entities, six per primary slot, correct version/coverage, all required allergen entries, valid review records, and no expired or contradictory source. Current whole-catalog invalidation means partial release is not available. One blocked entity blocks all 24.

## 19. Practicality check

The engine's fail-closed behavior is safe, but the combination of generic identity, mandatory complete metadata, `labelVerificationStatus: not_applicable`, and catalog-wide validity is impractical for the proposed evidence model. It risks showing almost every allergic user abstract slots only. That is safe degradation but can make the concrete layer operationally useless. Nutrition calculations need no change; the owner must first resolve safety-evidence granularity.

## 20. Protein-source candidates

Common fields for records 1–6: `entityType: single_food`; additionalSlots: `[]`; required sources: official identity/nomenclature, EAEU labeling, clinical allergen reference, candidate-specific supply-chain evidence; label feasibility: currently only `not_applicable`, not established; reviewers: allergist-immunologist + EAEU food-safety/labeling specialist; celiac: unsupported; dietary: specialist mapping required.

### Candidate 1

- candidateNumber: 1; proposedFoodId: `food_ru_chicken_egg`; proposedDisplayNameRu: «Яйцо куриное»; primarySlot: `protein_source`.
- exact definition: intact edible hen egg, raw, without shell as consumed; included: fresh unseasoned hen egg; excluded: egg products, powder, pasteurized blend, prepared/coated egg; processing boundary: no added ingredient or industrial fractionation.
- why stable: species and ordinary identity can be fixed; why unsafe/broad: intrinsic `eggs`, farm/packing variability.
- sources found: FAO identity method; EAEU labeling framework; source gaps: Russian identity standard/version and universal chain evidence.
- allergen feasibility: `eggs=evidence_supports_contains`; other16=`evidence_insufficient`; cross-contact: `specialist_decision_required`, not generic-provable; gluten: `evidence_insufficient`; dietary: animal identity only; unresolved: chain scope and raw/heat boundary; status: `blocked_by_cross_contact_uncertainty`.

### Candidate 2

- candidateNumber: 2; proposedFoodId: `food_ru_chicken_meat`; proposedDisplayNameRu: «Мясо курицы»; primarySlot: `protein_source`.
- exact definition: raw unseasoned skeletal meat of domestic chicken; included: chilled/frozen plain cuts without glaze; excluded: mince, brined, injected, breaded, marinated, offal; processing boundary: cutting/freezing only.
- stable: species and tissue are definable; unsafe/broad: cuts and processing chains vary.
- sources found/gaps: identity/nomenclature framework found; exact Russian commodity and chain evidence missing.
- allergen feasibility: all17=`evidence_insufficient`; cross-contact: chain-specific; gluten: insufficient; dietary: animal identity only; unresolved: frozen handling and shared equipment; status: `blocked_by_cross_contact_uncertainty`.

### Candidate 3

- candidateNumber: 3; proposedFoodId: `food_ru_turkey_meat`; proposedDisplayNameRu: «Мясо индейки»; primarySlot: `protein_source`.
- definition/forms/boundary: raw unseasoned turkey skeletal meat; plain cuts included; mince, brine, injection, coating, marinade, offal excluded; cutting/freezing only.
- stable: species-bound; risk: processing and packing vary; sources found: generic identity and legal framework; gaps: Russian commodity definition and chain evidence.
- allergen: all17=`evidence_insufficient`; cross-contact/gluten: insufficient and specialist decision; dietary: animal identity only; label feasibility and reviewers: common fields; unresolved: same as chicken; status: `blocked_by_cross_contact_uncertainty`.

### Candidate 4

- candidateNumber: 4; proposedFoodId: `food_ru_beef`; proposedDisplayNameRu: «Говядина»; primarySlot: `protein_source`.
- definition: raw unseasoned bovine skeletal meat; plain cuts included; mince, offal, brined/injected/marinated/coated forms excluded; cutting/freezing only.
- stable: commodity identity can be bounded; risk: species/age/cut terminology and shared processing.
- sources found: identity methodology and EAEU framework; gaps: exact Russian definition and supply-chain facts.
- allergen: all17=`evidence_insufficient`; cross-contact/gluten: insufficient; dietary: animal identity only; unresolved: taxonomy granularity; status: `blocked_by_cross_contact_uncertainty`.

### Candidate 5

- candidateNumber: 5; proposedFoodId: `food_ru_atlantic_cod`; proposedDisplayNameRu: «Треска атлантическая»; primarySlot: `protein_source`.
- definition: raw skeletal muscle of *Gadus morhua*; included: plain chilled/frozen fillet without glaze/additives; excluded: generic “cod”, mince, salted, smoked, dried, glazed/coated product; freezing/cutting only.
- stable: scientific species narrows identity; risk: species substitution, glaze and processing.
- sources found: identity methodology and EAEU allergen framework; gaps: authoritative Russian species/market definition and chain evidence.
- allergen: `fish=evidence_supports_contains`; other16=`evidence_insufficient`; cross-contact/gluten: insufficient; dietary: fish identity only; unresolved: species verification and unglazed availability; status: `blocked_by_cross_contact_uncertainty`.

### Candidate 6

- candidateNumber: 6; proposedFoodId: `food_ru_red_lentils`; proposedDisplayNameRu: «Чечевица красная сухая»; primarySlot: `protein_source`.
- definition: dry seeds of cultivated lentil sold as red lentils, whole or split only if the owner fixes one form; included: plain dry single ingredient; excluded: mixes, flour, cooked/canned/seasoned product; drying, dehulling and splitting require a fixed boundary.
- stable: botanical commodity is plausible; risk: color/variety, dehulling, milling and shared packing.
- sources found: FAO nomenclature method and legal framework; gaps: exact botanical/form definition and facility evidence.
- allergen: all17=`evidence_insufficient`; cross-contact: high, mill/packer-specific; gluten: high uncertainty; dietary: plant identity only; unresolved: whole versus split; status: `blocked_by_generic_variability`.

## 21. Carbohydrate-source candidates

Common fields for records 7–12 are the same as section 20 except candidate-specific definitions. All have `entityType: single_food`, `primarySlot: carbohydrate_source`, additionalSlots `[]`, celiac unsupported, label feasibility unestablished, and both reviewer roles required.

### Candidates 7–12

| # / id / Russian name | Exact definition; included/excluded forms; processing boundary | Stability and risk | Evidence feasibility, gaps, unresolved, status |
|---|---|---|---|
| 7 `food_ru_buckwheat_groats` «Крупа гречневая» | Plain dry buckwheat groats; one owner-selected kernel form; exclude flakes, flour, mixes, cooked/seasoned; cleaning/dehulling/thermal state must be fixed | Recognizable commodity; “ядрица/продел”, roasting and mills vary | FAO/EAEU framework found; exact standard and facility proof missing. all17=`evidence_insufficient`; cross-contact/gluten high; dietary specialist mapping; unresolved form; `blocked_by_generic_variability` |
| 8 `food_ru_white_rice` «Рис белый шлифованный» | Plain dry milled rice grain; exclude brown, parboiled, flavored, mixes, flour, cooked; milling only | Stable if grain/processing fixed; shared mill/packing varies | all17 insufficient; identity source class found, chain evidence missing; cross-contact/gluten high; `blocked_by_cross_contact_uncertainty` |
| 9 `food_ru_millet_groats` «Пшено» | Plain dry dehulled millet groats; exclude flour, flakes, mixes, cooked; dehulling fixed | Russian name is familiar but botanical species and processing may vary | all17 insufficient; authoritative species definition and facility evidence missing; unresolved species; `blocked_by_generic_variability` |
| 10 `food_ru_corn_groats` «Крупа кукурузная» | Plain dry maize groats of one specified grind; exclude flour, flakes, polenta mixes, flavored/cooked; milling fixed | Material stable only after grind boundary | all17 insufficient; shared mill is material; exact grind and chain unresolved; `blocked_by_generic_variability` |
| 11 `food_ru_potato` «Картофель» | Intact fresh potato tuber; washed/unwashed included; exclude peeled processed, dried, frozen, cooked, sprouted/green, additive-treated forms; no processing beyond cleaning | Strong household identity; cultivar/storage and retail handling vary | all17 insufficient; cross-contact cannot be universal but lower processing burden; identity evidence needs Russian source; `needs_more_evidence` |
| 12 `food_ru_sweet_potato` «Батат» | Intact fresh sweet-potato storage root; exclude processed/frozen/dried/cooked forms; cleaning only | Ordinary identity plausible, botanical naming needs locking | all17 insufficient; exact species and Russian-market identity source missing; cross-contact unresolved; `needs_more_evidence` |

For every row: required source types are official identity/nomenclature, EAEU labeling, clinical allergen, and supply-chain evidence; sources found are those in section 15; `glutenRelationship` cannot be finalized from identity; `labelVerificationStatus: not_applicable` remains unsupported.

## 22. Vegetables/fruit/berries candidates

All records have `entityType: single_food`, primarySlot `vegetables_fruit_berries`, additionalSlots `[]`, all17=`evidence_insufficient`, cross-contact=`specialist_decision_required`, celiac unsupported, pattern mapping unassigned, label feasibility unestablished, and require both specialist roles plus the common source set.

| # / id / name | Exact definition and forms | Stable/risk | Sources, gaps, unresolved, status |
|---|---|---|---|
| 13 `food_ru_carrot` «Морковь» | Intact fresh cultivated carrot root; cleaning included; exclude cut, frozen, dried, cooked, glazed/seasoned | Strong identity; cultivar, post-harvest treatment/handling vary | Framework found; exact identity and chain proof missing; `needs_more_evidence` |
| 14 `food_ru_white_cabbage` «Капуста белокочанная» | Intact fresh head of white cabbage; trimming/cleaning included; exclude shredded, fermented, frozen, cooked | Species/cultivar naming must be fixed; handling varies | Botanical/commodity locator and chain facts missing; `needs_more_evidence` |
| 15 `food_ru_cucumber` «Огурец» | Intact fresh cultivated cucumber fruit; exclude pickled, cut, frozen, seasoned | Strong ordinary identity; cultivar/wax/handling vary | Exact source and chain evidence missing; `needs_more_evidence` |
| 16 `food_ru_tomato` «Томат свежий» | Intact fresh cultivated tomato fruit; exclude dried, canned, puree, cut, seasoned | Strong identity; no recipe ambiguity | Exact identity and distribution evidence missing; `needs_more_evidence` |
| 17 `food_ru_apple` «Яблоко» | Intact fresh apple fruit; cleaning included; exclude dried, puree/juice, candied, cut/coated | Stable genus/species after locking; coatings/handling vary | Species and post-harvest boundary unresolved; `needs_more_evidence` |
| 18 `food_ru_banana` «Банан» | Intact fresh dessert banana fruit in peel; exclude plantain, dried, puree, chips, coated | Common name can hide cultivar/species group | Botanical and dessert-banana boundary plus chain proof missing; `needs_more_evidence` |

Processing boundary for all six is harvest, ordinary sorting, transport, and cleaning only; no ingredient addition. Gluten feasibility remains insufficient because cross-contact is not an identity property.

## 23. Fat-source candidates

All have `entityType: single_food`, primarySlot `fat_source`, additionalSlots `[]`, common evidence/reviewer requirements, no celiac claim, and no production pattern status.

| # / id / name | Exact definition and forms | Stability/risk | Allergen/cross-contact/gluten/label feasibility; status |
|---|---|---|---|
| 19 `food_ru_avocado` «Авокадо» | Intact fresh avocado fruit; exclude oil, puree, guacamole, frozen/seasoned; cleaning only | Stable only with fruit boundary; cultivar/handling vary | all17 insufficient; cross-contact unresolved but low processing; label `not_applicable` not proven; `needs_more_evidence` |
| 20 `food_ru_sunflower_seeds` «Семена подсолнечника» | Plain raw hulled seed, or in-shell only after owner selects one; exclude roasted/salted/coated/mixes/oil | Form and shared packing vary | all17 insufficient; seed not a named code but that proves no absence; mill/packer evidence needed; `blocked_by_generic_variability` |
| 21 `food_ru_pumpkin_seeds` «Семена тыквы» | Plain raw hulled seed from a fixed *Cucurbita* scope; exclude roasted/salted/coated/mixes/oil | Species and hull form vary | all17 insufficient; shared packing high; botanical and facility gaps; `blocked_by_generic_variability` |
| 22 `food_ru_flax_seeds` «Семена льна» | Plain whole raw flax seed; exclude ground, flour, roasted, mixes, oil | Whole form stable; packing/shared equipment vary | all17 insufficient; cross-contact/gluten high; exact commodity/facility proof missing; `blocked_by_cross_contact_uncertainty` |
| 23 `food_ru_sunflower_oil` «Масло подсолнечное» | Single-source edible sunflower oil, but refining state must be fixed; exclude blends, flavored/fortified/frying products | Generic term spans refined/unrefined and production methods | Processing may affect residual protein and evidence; all17/cross-contact insufficient; label model contested; `blocked_by_generic_variability` |
| 24 `food_ru_olive_oil` «Масло оливковое» | Single-source edible olive oil of one owner-fixed production class; exclude blends, flavored oils, pomace/other classes unless separately defined | Legal/processing classes differ | all17/cross-contact insufficient; exact class and facility evidence missing; `blocked_by_generic_variability` |

## 24. Reserve candidates

These are not part of the 24 and are not approved.

| Slot | Reserves (reason; main risk; evidence burden; likely status) |
|---|---|
| protein_source | Rabbit meat, pork, lamb (species-defined alternatives; chain/shared processing; commodity + facility evidence; `blocked_by_cross_contact_uncertainty`); chickpeas, green lentils, white beans (dry plant alternatives; milling/packing/form variability; botanical + facility evidence; `blocked_by_generic_variability`) |
| carbohydrate_source | Brown rice, quinoa, amaranth, sorghum (plain grains; mill contamination/species/form; identity + facility evidence; `blocked_by_cross_contact_uncertainty` or generic variability); cassava root, Jerusalem artichoke (fresh roots; Russian identity/availability scope; botanical + chain evidence; `needs_more_evidence`) |
| vegetables_fruit_berries | Beetroot, broccoli, cauliflower, zucchini, pear, blueberry (fresh alternatives; species/cultivar and handling; identity + chain evidence; `needs_more_evidence`) |
| fat_source | Sesame seed, walnut, peanut, almond (clear intrinsic named allergen for the first three taxonomy relationships, but severe other-code/cross-contact burden; clinical + facility evidence; `blocked_by_cross_contact_uncertainty`); hemp seed (regulatory/identity and packing burden; `blocked_by_generic_variability`); grape-seed oil (processing/class variability; `blocked_by_generic_variability`) |

## 25. Final 24-candidate table

**Proposed Phase 3B2B2 specialist-review candidate set** (a research set, not a production catalog).

| № | proposedFoodId | Russian name | primary slot | additional | boundary / main source | allergen / cross-contact concern | celiac / dietary note | status | blocker / next action |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `food_ru_chicken_egg` | Яйцо куриное | protein | — | plain hen egg / EAEU+FAO | intrinsic eggs; chain unknown | unsupported / animal | `blocked_by_cross_contact_uncertainty` | define supply evidence |
| 2 | `food_ru_chicken_meat` | Мясо курицы | protein | — | plain skeletal meat / FAO | all17 and processor unknown | unsupported / animal | `blocked_by_cross_contact_uncertainty` | source commodity and chain |
| 3 | `food_ru_turkey_meat` | Мясо индейки | protein | — | plain skeletal meat / FAO | processor unknown | unsupported / animal | `blocked_by_cross_contact_uncertainty` | source commodity and chain |
| 4 | `food_ru_beef` | Говядина | protein | — | plain skeletal meat / FAO | taxonomy/processor unknown | unsupported / animal | `blocked_by_cross_contact_uncertainty` | lock definition and chain |
| 5 | `food_ru_atlantic_cod` | Треска атлантическая | protein | — | *G. morhua* muscle / EAEU | intrinsic fish; substitution/glaze | unsupported / fish | `blocked_by_cross_contact_uncertainty` | verify species and chain |
| 6 | `food_ru_red_lentils` | Чечевица красная сухая | protein | — | plain dry seed / FAO | form, mill, packer | unsupported / plant | `blocked_by_generic_variability` | lock botanical/form scope |
| 7 | `food_ru_buckwheat_groats` | Крупа гречневая | carbohydrate | — | one groat form / FAO | mill/gluten cross-contact | unsupported / plant | `blocked_by_generic_variability` | select form and facility model |
| 8 | `food_ru_white_rice` | Рис белый шлифованный | carbohydrate | — | plain milled grain / FAO | shared mill/packing | unsupported / plant | `blocked_by_cross_contact_uncertainty` | facility evidence |
| 9 | `food_ru_millet_groats` | Пшено | carbohydrate | — | plain dehulled groat / FAO | species and mill | unsupported / plant | `blocked_by_generic_variability` | fix species/form |
| 10 | `food_ru_corn_groats` | Крупа кукурузная | carbohydrate | — | fixed grind / FAO | grind and shared mill | unsupported / plant | `blocked_by_generic_variability` | fix grade/facility |
| 11 | `food_ru_potato` | Картофель | carbohydrate | — | intact tuber / FAO | handling; all17 unknown | unsupported / plant | `needs_more_evidence` | obtain identity/chain dossier |
| 12 | `food_ru_sweet_potato` | Батат | carbohydrate | — | intact root / FAO | species/handling | unsupported / plant | `needs_more_evidence` | lock botanical identity |
| 13 | `food_ru_carrot` | Морковь | vegetables/fruit/berries | — | intact root / FAO | handling; all17 unknown | unsupported / plant | `needs_more_evidence` | identity/chain dossier |
| 14 | `food_ru_white_cabbage` | Капуста белокочанная | vegetables/fruit/berries | — | intact head / FAO | taxonomy/handling | unsupported / plant | `needs_more_evidence` | lock botanical definition |
| 15 | `food_ru_cucumber` | Огурец | vegetables/fruit/berries | — | intact fruit / FAO | post-harvest handling | unsupported / plant | `needs_more_evidence` | chain evidence |
| 16 | `food_ru_tomato` | Томат свежий | vegetables/fruit/berries | — | intact fruit / FAO | post-harvest handling | unsupported / plant | `needs_more_evidence` | chain evidence |
| 17 | `food_ru_apple` | Яблоко | vegetables/fruit/berries | — | intact fruit / FAO | coating/handling | unsupported / plant | `needs_more_evidence` | fix coating boundary |
| 18 | `food_ru_banana` | Банан | vegetables/fruit/berries | — | dessert fruit / FAO | cultivar/species group | unsupported / plant | `needs_more_evidence` | botanical scope |
| 19 | `food_ru_avocado` | Авокадо | fat | — | intact fruit / FAO | handling; all17 unknown | unsupported / plant | `needs_more_evidence` | identity/chain dossier |
| 20 | `food_ru_sunflower_seeds` | Семена подсолнечника | fat | — | one raw form / FAO | hull form/shared packing | unsupported / plant | `blocked_by_generic_variability` | select form/facility |
| 21 | `food_ru_pumpkin_seeds` | Семена тыквы | fat | — | fixed raw species/form / FAO | species/shared packing | unsupported / plant | `blocked_by_generic_variability` | botanical/form decision |
| 22 | `food_ru_flax_seeds` | Семена льна | fat | — | whole raw seed / FAO | shared packing/gluten | unsupported / plant | `blocked_by_cross_contact_uncertainty` | facility evidence |
| 23 | `food_ru_sunflower_oil` | Масло подсолнечное | fat | — | one production class / EAEU | refining/residual protein | unsupported / plant | `blocked_by_generic_variability` | decide oil class/model |
| 24 | `food_ru_olive_oil` | Масло оливковое | fat | — | one production class / EAEU | class/blend/facility | unsupported / plant | `blocked_by_generic_variability` | decide oil class/model |

Count: 24 total; 6 protein, 6 carbohydrate, 6 vegetables/fruit/berries, 6 fat.

## 26. Candidate risk summary

- `ready_for_specialist_review`: 0.
- `needs_more_evidence`: 9 (fresh intact plant foods: 11–19).
- `blocked_by_cross_contact_uncertainty`: 8 (1–5, 8, 22, plus chain-dependent constraints recorded above).
- `blocked_by_generic_variability`: 7 (6, 7, 9, 10, 20, 21, 23, 24 would mathematically be eight); correction after recount: **8**, and cross-contact count is **7** (1–5, 8, 22). Totals: 0 + 9 + 7 + 8 = 24.
- `blocked_by_schema`: 0 as the primary label; nevertheless the batch as a whole is contract-blocked.
- `exclude_from_first_batch`: 0 among the displayed 24; exclusions are in sections 9 and 33.

No favorable allergen, cross-contact, celiac, pattern, label, or review status is implied by these counts.

## 27. Privacy confirmation

This audit changes no data flow. The intended catalog remains bundled and loads without personal parameters; filtering remains client-side; restriction context is not sent to a server; allergen codes enter neither URLs nor analytics; selected foods are not persisted; no localStorage, IndexedDB, personalized fetch, or privacy implementation is added.

## 28. User-facing terminology

Preferred term: **«пример продукта с размеченными ограничениями»**. Disclaimer: **«Это справочный пример, а не подтверждение безопасности или индивидуальная рекомендация; при аллергии и медицинских ограничениях сверяйтесь с маркировкой конкретного продукта и рекомендациями специалиста.»**

Do not use «безопасный продукт», «точно подходит», «не содержит аллергенов», «можно при аллергии/целиакии», or macro-fit claims without the required evidence and supported capability.

## 29. Adversarial review

All 20 requested attacks were applied. No recipe or branded source was accepted; no absence came from silence; no cross-contact conclusion came from a missing warning; gluten was kept separate from celiac; oats stayed excluded; pattern compatibility was not inferred; no review, fingerprint, hash, or production entity was invented. Definitions explicitly exclude glaze, coating, additives, mixtures, bulk assumptions, and variable processing. Generic names that hide species/form were blocked. Evidence must be reproducible at 180-day renewal. Because one blocked entity invalidates the whole artifact, safer substitutes do not solve the generic cross-contact problem; they only shift its burden. Engine-contract correction must precede content implementation.

## 30. Blocking owner decisions

| Decision | Recommendation | Alternatives | Residual risk | Implementation blocked |
|---|---|---|---|---|
| Exact 24 and replacements | Treat this as a research shortlist, not approval | replace any candidate with a reserve after equivalent audit | replacement retains generic-chain problem | yes |
| Unresolved cross-contact | Do not admit as favorable metadata | add a true unknown state; narrow to a controlled sourcing class; or move to verified SKU in a later model | false reassurance or near-empty concrete output | yes |
| Reviewer identities | Appoint two independent qualified roles described in §16 | stricter credential policy | competence/independence must be documented | yes |
| Identity records | Owner-controlled registry with verifiable credentials and conflicts | contracted review organization | privacy and auditability | yes |
| Source fingerprints/hashes | Assign an evidence custodian and reproducible archival procedure | controlled document system | source drift | yes |
| Batch size | Keep 24 only if partial validity is supported safely | smaller independently valid batches | contract and UX change | yes |
| Engine/schema contract | Reconsider cross-contact/unknown, label applicability, and whole-catalog invalidation before content | verified-SKU future layer; stay abstract-only | migration and safety review | yes |
| Advance to specialist review | Only after the contract decision and dossiers close basic source gaps | exploratory reviewer workshop, explicitly non-approval | wasted review effort | yes |
| Create production catalog after review | Require all publication gates and fresh approvals | none consistent with current rules | expiry and source drift | yes |

## 31. GO / NO-GO classification

### CONTRACT_RECONSIDERATION_REQUIRED

The strict generic `single_food` contract cannot support 24 evidence-complete entities without changing schema/coverage/entity semantics or adopting a controlled, product-specific evidence model. Choosing GO merely to satisfy batch count would manufacture safety metadata.

## 32. Recommended next stage

Hold Phase 3B2B2 implementation. Convene an owner decision focused on one minimal question: should cross-contact be representable as unresolved/non-applicable at generic identity level without disabling unrelated entities, or should concrete recommendations move to a traceable product/supply-chain granularity? Then update the approved architecture in a separate authorized phase, re-audit the exact candidates, build archival source dossiers, and only then commission two independent reviews. Nutrition calculations, portions, menus, and Phase 3B1 need no change.

## 33. Explicit exclusions

No production catalog JSON/TypeScript, entity, schema/validator/capability/filter/UI/questionnaire/restriction/Phase3A/Phase3B1 change, brand, SKU, portion, nutrition composition, menu, recipe, approval claim, secret, credential, real medical data, test/build/server/browser run, commit, push, or deployment was created. Oats and confirmed-celiac concrete recommendations remain excluded. The production coverage remains `nutrimind.catalog-coverage.none.v1`.

## 34. Final contradiction check

- Exactly 24 research candidates and 6-per-slot coexist with an explicit finding that they are not publishable merely because the count is complete.
- All are intended as bounded `single_food`; ambiguous forms are visibly blocked, not normalized by assumption.
- All 17 codes are considered; future coverage has only 16 and excludes oats. No gap became favorable metadata.
- Cross-contact remains fail-closed; celiac remains excluded; dietary status remains unassigned.
- Two reviewers, exact 180-day expiry, reproducible evidence, bundled privacy, and whole-catalog invalidation remain intact.
- No candidate is called reviewed, approved, safe, suitable, compatible, or production-ready.
- The only resolved design conclusion is that content implementation must wait for the owner contract decision. No production contract was changed by this audit.
