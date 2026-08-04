# Phase 3B2B1 — Russian food-catalog engine report

## Scope and final lock

Phase 3B2B1 implements infrastructure only. The owner-approved final lock is recorded in `PHASE_3B2B_AUDIT.md`; all domain versions, strict shapes, enums, diagnostics, rules, expiry and invalidation behavior are exact. No production catalog artifact, food entity, product name, brand, SKU, source record, reviewed content or UI is present.

## Architecture and versions

The pure `core/food-catalog` domain separates a `FoodCatalogEntityV1` presentation identity from one immutable `FoodSafetyProfileV1`. Exact schema versions are:

- catalog `nutrimind.food-catalog.schema.v1`;
- entity `nutrimind.food-catalog.entity.v1`;
- safety profile `nutrimind.food-catalog.safety-profile.v1`;
- source `nutrimind.food-catalog.source.v1`;
- review `nutrimind.food-catalog.review.v1`;
- policy `nutrimind.food-catalog.policy.ru.v1`;
- future content `nutrimind.food-catalog.ru.v1.0.0`;
- future coverage `nutrimind.catalog-coverage.ru.v1`.

Production remains on `nutrimind.catalog-coverage.none.v1`; the future contract is not written to restriction context and is not imported by application code.

## Metadata and review

Every valid synthetic profile requires all 17 exact taxonomy codes once in canonical order. Ingredient presence and cross-contact remain separate. Future coverage supports 16 codes and deliberately excludes `oats`; an oats restriction yields abstract-only capability. Confirmed celiac also yields abstract-only capability independently of profile metadata. Dietary compatibility is explicit for omnivore, vegetarian, vegan and pescatarian and enforces the approved coherence implications.

Sources are strict, dated, hashed and limited to approved official/manufacturer/label types. Publication readiness requires two distinct approved specialist reviewers: an allergen/celiac specialist and either a nutrition or regulatory-labeling specialist. A technical validator cannot substitute. Reviews bind exact profile/source/policy hashes and expire at the exact injected `asOf` instant 180×24 hours after review.

## Validation, capability and filtering

The validator accepts only the exact v1 compatibility matrix, rejects unknown fields and invalid nested records, enforces one-to-one entity/profile references and duplicate rules, returns newly allocated canonical deeply frozen output, and never mutates or repairs input. One invalid entity/profile/source/review invalidates the whole catalog; there is no quarantine or partial coverage.

Catalog statuses are `valid`, `valid_empty`, `invalid`; capability is `abstract_only` or `concrete_available`; filter statuses are `matched`, `empty`, `catalog_unavailable`, `context_unavailable`, `slot_unsupported`. Filtering is exact-code only, applies the union of all allergies, keeps cross-contact separate and requires explicit pattern compatibility. Empty results never fall back or suggest restriction relaxation.

Missing production catalog, malformed/empty catalog, old/unresolved context, unsupported coverage, confirmed celiac and oats all remain abstract-only. Phase 3B1 remains independent and available. Emergency withdrawal invalidates a bundled v1 catalog and requires a new release; there is no remote kill switch.

## Privacy and invariants

The domain has no React, browser storage, URL, analytics, network, implicit clock, randomness, fuzzy matching, substring matching or LLM dependency. No restrictions are transported. Phase 2 calculations, Phase 3A allocation/timing, Phase 3B1 slots, questionnaire, taxonomy, restriction schema, calibration and UI remain unchanged. No portions, composition, macros, menus or product selections exist.

## Verification

- deterministic suite: 216 passed, 0 failed, 0 skipped after adding the catalog tests; the existing 199 tests remain present and passing;
- typecheck, Next.js build and Sites/Vinext build passed; the Sites artifact contains its ESM Worker entry and hosting manifest;
- local production regression passed on `/`, `/questionnaire`, `/result`, `/meal-structure`, `/calibration`, and `/report-demo`; the synthetic adult flow reached Phase2D1, Phase3A1/3A2 and all four Phase3B1 slots, with no catalog UI, console error or horizontal overflow at 390×844;
- final diff checks and production QA are recorded in the delivery after execution;
- synthetic adversarial coverage includes incomplete/unknown/duplicate allergens, cross-contact unknown, celiac, oats, patterns, multiple allergies, reviewer independence, exact expiry, source/review binding, lifecycle, duplicate identity, malformed/empty/versioned catalogs and non-mutation/deep-freeze behavior.

## Independent review

No production entity, real product name, brand or SKU exists. Missing allergen metadata cannot pass; incomplete profiles and unsupported contexts cannot receive partial output; every selected allergen is evaluated independently; unknown cross-contact fails; celiac is separate; oats cannot receive concrete capability; one reviewer or a technical validator alone cannot publish; expired/deprecated/withdrawn records fail; source changes invalidate bound reviews; malformed catalog cannot disable Phase 3B1; no restriction is sent to a server; restriction schema/taxonomy/nutrition/timing/neutral slots are unchanged; no portion or product UI was added. The implementation is already narrower than a content-bearing catalog.

## Phase 3B2B2 boundary

Phase 3B2B2 remains exactly 24 fully reviewed generic `single_food` entities, six primary candidates per Phase 3B1 slot. They were not created, proposed in code or wired in this phase. No oats entity, brand, SKU, packaged generic, bulk/restaurant item, portion, composition or menu has been started.
