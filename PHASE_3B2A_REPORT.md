# Phase 3B2A — Russian-market normalized dietary restriction context

## Scope

Phase 3B2A implements only exact questionnaire inputs, deterministic normalization, a strict tab-scoped context and future-capability boundary for the Russian Federation market. It does not implement Phase 3B2B, products, a catalog, ingredients, filtering, regulatory exceptions, portions, recipes, menus, brands, supplements or macro matching.

## Market and regulatory framing

- target market: Russian Federation;
- regulatory scope: EAEU / Russian Federation;
- primary UI language: Russian;
- market version: `nutrimind.market.ru.v1`;
- taxonomy version: `nutrimind.food-allergen.ru.v1`;
- coverage version: `nutrimind.catalog-coverage.none.v1`.

The mixed list in paragraph 14 of part 4.4 of TR CU 022/2011 is not represented wholesale as a food-allergy enum. Aspartame/phenylalanine, sulphites and lactose-intolerance policies remain separate and deferred. Russian UI does not itself establish legal compliance.

## Taxonomy and presentation

The 17 selectable exact codes are `wheat`, `rye`, `barley`, `oats`, `other_gluten_cereal`, `tree_nuts`, `peanuts`, `sesame`, `fish`, `crustaceans`, `molluscs`, `milk`, `eggs`, `soybeans`, `celery`, `mustard`, and `lupin`.

Five static UI groups organize the controls: `gluten_cereals`, `nuts_peanuts_sesame`, `fish_and_seafood`, `milk_and_eggs`, and `other_allergens`. Every code occurs once. Groups and EAEU umbrella mappings are application presentation/catalog metadata and are not persisted. `gluten`, `seafood`, `lactose`, `sulphites`, `aspartame`, `phenylalanine` and individual tree-nut species are not selectable codes.

## Questionnaire

The questionnaire remains exactly nine sections. Section 4 now contains named `foodAllergyStatus`, conditional `foodAllergenCodes`, and separate `celiacStatus`. Section 5 contains `dietaryPattern` while preserving the existing current-meal-pattern answer. Explicit none is never a default. Known allergy requires at least one checkbox; changing away from known clears hidden codes. Multiple allergies are allowed. No symptoms, severity, diagnosis date, laboratory data or free text are collected.

The legacy safety adapter derives only its existing coarse safety meaning from the new named statuses. It cannot derive exact codes and the new context never enters nutrition formulas.

## Normalization

Pure modules contain no React, browser API, network, clock, randomness or calculation dependency. Exact sets are validated as a whole, deduplicated and sorted by taxonomy order. Unknown members invalidate the whole allergy dimension; supported members are not retained as a usable partial set. Missing, empty, unsupported and malformed never become explicit none. `other`, `not_sure`, withheld and `other_gluten_cereal` remain unresolved.

Celiac is a separate status and may coexist with wheat allergy. It never becomes an allergen code and neither wheat nor oats is inferred from it. Dietary pattern is explicit, separate and cannot change nutrition calculations or prove adequacy.

## Context and privacy

The exact schema and storage key are both `nutrimind.phase3b2.restriction-context.v1`. The strict object includes exact market/taxonomy/coverage discriminators, normalized statuses and codes, `futureFilterMode: "abstract_only"`, canonical WarningCode/ErrorCode arrays and the fixed 16 RuleId array.

The key is removed at the beginning of each submit. Only a strictly validated context is written. Storage is `sessionStorage` only; there is no localStorage, IndexedDB, cookie, URL serialization, server request or analytics transport. The payload contains no kcal, macros, hydration, REE, PAL, demographics, Phase2D1/Phase3A objects, journal, labs, full medical answers, UI labels, EAEU mappings, raw unsupported values, source URLs or products.

## Capability and old sessions

`catalogSupportedAllergenCodes` is the application constant `[]`; it is intentionally not duplicated in the user context. Empty coverage always means `abstract_only`, never unrestricted. Concrete output is unavailable for every state, including explicit none and resolved restrictions. Phase3B1 abstract slots remain available whenever their existing Phase3A parent is valid.

Missing, old, malformed, neutral-union and incompatible-version sessions are rejected without migration. They do not create a persisted replacement object. This blocks only a future concrete layer and does not delete or invalidate a compatible Phase3A/Phase3B1 result.

## Independent review

1. Missing, unknown and malformed cannot become none.
2. Unsupported codes are not silently dropped; a mixed set is wholly unsupported.
3. Old and neutral-union sessions cannot become RU or unrestricted contexts.
4. Empty coverage cannot enable products.
5. Celiac, lactose, gluten and seafood cannot enter the approved allergy code set.
6. Regulatory exceptions, including fish gelatine, cannot remove a restriction.
7. Oats are not automatically permitted for celiac disease.
8. Dietary pattern is never inferred.
9. Free text and full medical payload are not persisted.
10. Phase3A contracts, nutrition values, timing and neutral slots are unchanged.
11. No product output exists.
12. Phase3B1 remains operational without restriction context; the direct route retains strict Phase3A validation.
13. A narrower useful implementation was not found: named fields plus a separate minimal context are required to preserve exact user intent without coupling calculations.

## Adversarial review

Synthetic explicit-none, single/multiple allergy, wheat, oats, other gluten cereal, tree-nut, peanut, fish, crustacean, mollusc, celiac-plus-wheat, unresolved, withheld, missing, unsupported, malformed, old and neutral-union cases were checked. Deferred lactose, sulphites and aspartame domains never masquerade as no restriction. The UI makes no product-safety, cross-contact or legal-compliance claim. Nutrition output remains independent.

## Verification

- automated suite after closure patch: `199 passed / 0 failed / 0 skipped`;
- all existing 195 tests remain included and passing;
- TypeScript typecheck: passed;
- Next.js production build: compiled, typechecked and generated all routes;
- diff whitespace check: recorded in final handoff;
- local browser QA: recorded in final handoff;
- production QA: performed after deployment and recorded in the final handoff because production necessarily follows the single commit.

## Production deployment verification chronology

1. After the initial push, the canonical routes returned HTTP 200.
2. The first ten-minute check incorrectly suspected an old artifact because the `/questionnaire` ETag did not change and the initial server HTML does not contain the conditionally client-rendered fields from sections 4 and 5.
3. Subsequent Vercel metadata verification established that the deployment was READY, targeted production, carried commit metadata for `b1e886ad9635f81a2676d80c626ae80ca7701bc5`, and already served the canonical alias. No redeployment was needed and the alias was not switched manually.
4. Interactive QA on the canonical production UI confirmed the new Phase 3B2A allergy, celiac and dietary-pattern fields.
5. The ETag is therefore not used as independent proof of version identity for this client-rendered flow. There was no deployment failure; the initial diagnosis was corrected after interactive and metadata verification.

## Production QA limitation and closure follow-up

Malformed and old-session behavior was fully covered by deterministic parser tests. The initial production QA did not inject values directly into `sessionStorage`; it did interactively verify the primary synthetic production flow. The closure QA result must remain explicit: the browser automation environment prohibits direct session-store inspection or mutation, so the automated regression suite remains the canonical verification of malformed and old-session parser behavior. No debug route, test-only production code or weakened browser boundary was added.

## Boundary

Phase 3B2B must introduce a separately reviewed catalog and nonempty coverage version together. Phase 3B2C remains the unresolved/other workflow. Phase 3B3 remains composition, portion and reconciliation work. None is started here.
