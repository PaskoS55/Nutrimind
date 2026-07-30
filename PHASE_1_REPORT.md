# Phase 1 — production safety contracts and input validation

Implemented a framework-independent TypeScript core in `core/`. It defines the canonical Phase 1 survey input, normalized profile, structured validation issues, safety flags, tri-state medical gateway, and recommendation capabilities. No React, Next.js, persistence, UI, calorie, macro, menu, or ranking calculations were added.

Safety behavior includes minor output suppression, hard allergy exclusions, unresolved-allergy blocking, strict gluten-free handling for celiac disease, pregnancy/breastfeeding and eating-disorder safety gates, specialist review for medical restrictions, explicit missing/uncertain-answer warnings, and separation of named laboratory tests from numeric results. Diagnosis output is always disabled; automatic energy reduction remains disabled.

The pregnancy, breastfeeding, and eating-disorder fields are an optional `safetyScreening` contract because section 9 of `docs/CALCULATION_CORE_SPEC.md` marks that screen as awaiting separate approval and those fields are not present in `data/survey-schema.json`. This implementation does not alter the approved nine-section survey. Missing screening is surfaced explicitly and never enables energy reduction.

Tests import `core/index.ts` directly. The cross-platform commands are `npm test` and `npm run typecheck`; the latter uses the core-only `tsconfig.core.json` so framework/Worker ambient types do not leak into the framework-independent module. The previous build-dependent smoke check remains available separately as `npm run test:artifact` after a build.

Verification on Windows: `npm ci` completed; `npm test` passed 29/29 with no failures or skips; `npm run typecheck` completed with no errors. The existing `npm run build` remains Windows-incompatible because it invokes `bash scripts/build-verified.sh`; build portability is outside the requested test/typecheck script scope and was not silently redesigned.

Unresolved specification ambiguity: safety screening is explicitly “на отдельное утверждение”, while Phase 1 explicitly requires pregnancy, breastfeeding, and eating-disorder rules. The core therefore supports those inputs conservatively without adding them to the approved survey. Numeric lab evidence is treated as necessary only for a matching analyte; diagnosis output remains prohibited. Clinical interpretation and reference-range rules are intentionally not guessed or implemented.
