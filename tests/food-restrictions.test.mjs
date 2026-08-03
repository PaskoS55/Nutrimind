import test from "node:test";
import assert from "node:assert/strict";
import {
  ALLERGEN_CODES, ALLERGEN_TAXONOMY, ALLERGEN_TAXONOMY_VERSION,
  CATALOG_COVERAGE_VERSION, CATALOG_SUPPORTED_ALLERGEN_CODES, ERROR_CODES,
  MARKET_VERSION, PRESENTATION_GROUPS, RESTRICTION_SCHEMA_VERSION,
  RESTRICTION_STORAGE_KEY, RULE_IDS, WARNING_CODES, getRestrictionCapability,
  isRestrictionContextV1, normalizeRestrictionContext, parseRestrictionContextJson,
  warningsForStatus,
} from "../core/food-restrictions/index.ts";

const resolvedRaw = { foodAllergyStatus: "none", foodAllergenCodes: [], celiacStatus: "no", dietaryPattern: "omnivore" };

test("uses exact Russian market, taxonomy, schema and empty coverage versions", () => {
  assert.equal(MARKET_VERSION, "nutrimind.market.ru.v1");
  assert.equal(ALLERGEN_TAXONOMY_VERSION, "nutrimind.food-allergen.ru.v1");
  assert.equal(CATALOG_COVERAGE_VERSION, "nutrimind.catalog-coverage.none.v1");
  assert.equal(RESTRICTION_SCHEMA_VERSION, "nutrimind.phase3b2.restriction-context.v1");
  assert.equal(RESTRICTION_STORAGE_KEY, RESTRICTION_SCHEMA_VERSION);
  assert.deepEqual(CATALOG_SUPPORTED_ALLERGEN_CODES, []);
  assert.equal(getRestrictionCapability(), "abstract_only");
});

test("presentation groups have exact ids, order, labels and membership", () => {
  assert.deepEqual(PRESENTATION_GROUPS, [
    { id: "gluten_cereals", label: "Злаки, содержащие глютен", order: 1, allergenCodes: ["wheat", "rye", "barley", "oats", "other_gluten_cereal"] },
    { id: "nuts_peanuts_sesame", label: "Орехи, арахис и кунжут", order: 2, allergenCodes: ["tree_nuts", "peanuts", "sesame"] },
    { id: "fish_and_seafood", label: "Рыба и морепродукты", order: 3, allergenCodes: ["fish", "crustaceans", "molluscs"] },
    { id: "milk_and_eggs", label: "Молоко и яйца", order: 4, allergenCodes: ["milk", "eggs"] },
    { id: "other_allergens", label: "Другие аллергены", order: 5, allergenCodes: ["soybeans", "celery", "mustard", "lupin"] },
  ]);
  const grouped = PRESENTATION_GROUPS.flatMap((group) => group.allergenCodes);
  assert.deepEqual(grouped, ALLERGEN_CODES);
  assert.equal(new Set(grouped).size, 17);
  assert.ok(PRESENTATION_GROUPS.every((group) => group.allergenCodes.length > 0));
});

test("taxonomy has exact codes, labels, display order and umbrella mapping", () => {
  assert.deepEqual(ALLERGEN_CODES, ["wheat", "rye", "barley", "oats", "other_gluten_cereal", "tree_nuts", "peanuts", "sesame", "fish", "crustaceans", "molluscs", "milk", "eggs", "soybeans", "celery", "mustard", "lupin"]);
  assert.deepEqual(ALLERGEN_TAXONOMY.map(({ code, label, eaeuUmbrellaId }) => [code, label, eaeuUmbrellaId]), [
    ["wheat", "Пшеница", "eaeu_gluten_cereals"], ["rye", "Рожь", "eaeu_gluten_cereals"], ["barley", "Ячмень", "eaeu_gluten_cereals"], ["oats", "Овёс", "eaeu_gluten_cereals"], ["other_gluten_cereal", "Другой злак, содержащий глютен", "eaeu_gluten_cereals"],
    ["tree_nuts", "Орехи", "eaeu_tree_nuts"], ["peanuts", "Арахис", "eaeu_peanuts"], ["sesame", "Кунжут", "eaeu_sesame"], ["fish", "Рыба", "eaeu_fish"], ["crustaceans", "Ракообразные", "eaeu_crustaceans"], ["molluscs", "Моллюски", "eaeu_molluscs"], ["milk", "Молоко", "eaeu_milk"], ["eggs", "Яйца", "eaeu_eggs"], ["soybeans", "Соя", "eaeu_soybeans"], ["celery", "Сельдерей", "eaeu_celery"], ["mustard", "Горчица", "eaeu_mustard"], ["lupin", "Люпин", "eaeu_lupin"],
  ]);
  assert.deepEqual(ALLERGEN_TAXONOMY.map((entry) => entry.displayOrder), Array.from({ length: 17 }, (_, index) => index + 1));
  for (const forbidden of ["gluten", "cereals_containing_gluten", "seafood", "lactose", "sulphites", "aspartame", "phenylalanine"]) assert.ok(!ALLERGEN_CODES.includes(forbidden));
});

test("exact warning, error and rule enums remain canonical", () => {
  assert.deepEqual(WARNING_CODES, ["CATALOG_NOT_IMPLEMENTED", "CATALOG_COVERAGE_EMPTY", "REGULATORY_EXCEPTIONS_NOT_MODELED", "PRODUCT_CROSS_CONTACT_NOT_ASSESSED", "DEFERRED_RESTRICTION_DOMAINS_NOT_COVERED", "RESTRICTION_CONTEXT_UNRESOLVED", "RESTRICTION_CONTEXT_NOT_PROVIDED", "RESTRICTION_CONTEXT_UNSUPPORTED", "RESTRICTION_CONTEXT_MALFORMED"]);
  assert.equal(ERROR_CODES.length, 20);
  assert.deepEqual(ERROR_CODES.slice(0, 7), ["ALLERGY_STATUS_NOT_PROVIDED", "ALLERGY_STATUS_UNSUPPORTED", "ALLERGY_STATUS_MALFORMED", "ALLERGEN_CODES_REQUIRED", "ALLERGEN_CODES_FORBIDDEN", "ALLERGEN_CODES_MALFORMED", "ALLERGEN_CODE_UNSUPPORTED"]);
  assert.deepEqual(ERROR_CODES.slice(-7), ["CONTEXT_JSON_MALFORMED", "CONTEXT_SCHEMA_UNSUPPORTED", "CONTEXT_MARKET_UNSUPPORTED", "CONTEXT_TAXONOMY_UNSUPPORTED", "CONTEXT_CATALOG_COVERAGE_UNSUPPORTED", "CONTEXT_SHAPE_MALFORMED", "CONTEXT_STATUS_CONFLICT"]);
  assert.equal(RULE_IDS.length, 16);
  assert.equal(RULE_IDS[0], "FOOD_RESTRICTION.RU_MARKET_SCOPE.001");
  assert.equal(RULE_IDS[15], "FOOD_RESTRICTION.NO_PRODUCT_SAFETY_GUARANTEE.001");
});

test("warning assignment is exact and canonical", () => {
  for (const [status, tail] of [["resolved", undefined], ["unresolved", "RESTRICTION_CONTEXT_UNRESOLVED"], ["not_provided", "RESTRICTION_CONTEXT_NOT_PROVIDED"], ["unsupported", "RESTRICTION_CONTEXT_UNSUPPORTED"], ["malformed", "RESTRICTION_CONTEXT_MALFORMED"]]) {
    const warnings = warningsForStatus(status);
    assert.equal(new Set(warnings).size, warnings.length);
    assert.deepEqual(warnings.slice(0, 5), WARNING_CODES.slice(0, 5));
    assert.equal(warnings[5], tail);
  }
});

test("explicit none produces a strict resolved abstract-only context", () => {
  const context = normalizeRestrictionContext(resolvedRaw);
  assert.equal(context.status, "resolved");
  assert.equal(context.foodAllergyStatus, "none");
  assert.deepEqual(context.foodAllergenCodes, []);
  assert.deepEqual(context.errorCodes, []);
  assert.deepEqual(context.ruleIds, RULE_IDS);
  assert.equal(context.futureFilterMode, "abstract_only");
  assert.ok(isRestrictionContextV1(context));
  assert.ok(!("presentationGroupId" in context));
  assert.ok(!("regulatoryUmbrellaCodes" in context));
});

test("known allergies deduplicate and normalize to taxonomy order", () => {
  const context = normalizeRestrictionContext({ ...resolvedRaw, foodAllergyStatus: "known", foodAllergenCodes: ["fish", "wheat", "fish", "peanuts"] });
  assert.equal(context.status, "resolved");
  assert.deepEqual(context.foodAllergenCodes, ["wheat", "peanuts", "fish"]);
  assert.ok(isRestrictionContextV1(context));
});

for (const code of ALLERGEN_CODES) test(`normalizes exact allergen ${code}`, () => {
  const context = normalizeRestrictionContext({ ...resolvedRaw, foodAllergyStatus: "known", foodAllergenCodes: [code] });
  assert.deepEqual(context.foodAllergenCodes, [code]);
  assert.equal(context.status, code === "other_gluten_cereal" ? "unresolved" : "resolved");
});

test("other, not sure and withheld are unresolved without errors or codes", () => {
  for (const rawStatus of ["other", "not_sure", "prefer_not_to_say"]) {
    const context = normalizeRestrictionContext({ ...resolvedRaw, foodAllergyStatus: rawStatus });
    assert.equal(context.status, "unresolved");
    assert.deepEqual(context.errorCodes, []);
    assert.deepEqual(context.foodAllergenCodes, []);
  }
});

test("missing never becomes explicit none", () => {
  const context = normalizeRestrictionContext({});
  assert.equal(context.status, "not_provided");
  assert.equal(context.foodAllergyStatus, "not_provided");
  assert.ok(context.errorCodes.includes("ALLERGY_STATUS_NOT_PROVIDED"));
  assert.notEqual(context.foodAllergyStatus, "none");
});

test("unknown status and mixed supported/unsupported codes fail closed", () => {
  const unknown = normalizeRestrictionContext({ ...resolvedRaw, foodAllergyStatus: "mystery" });
  assert.equal(unknown.status, "unsupported");
  assert.equal(unknown.foodAllergyStatus, "unsupported");
  const mixed = normalizeRestrictionContext({ ...resolvedRaw, foodAllergyStatus: "known", foodAllergenCodes: ["wheat", "mystery"] });
  assert.equal(mixed.status, "unsupported");
  assert.equal(mixed.foodAllergyStatus, "unsupported");
  assert.deepEqual(mixed.foodAllergenCodes, []);
  assert.deepEqual(mixed.errorCodes, ["ALLERGEN_CODE_UNSUPPORTED"]);
  assert.ok(!JSON.stringify(mixed).includes("mystery"));
});

test("contradictory or malformed allergen payloads fail closed", () => {
  const cases = [
    [{ ...resolvedRaw, foodAllergyStatus: "known", foodAllergenCodes: [] }, "ALLERGEN_CODES_REQUIRED"],
    [{ ...resolvedRaw, foodAllergyStatus: "none", foodAllergenCodes: ["wheat"] }, "ALLERGEN_CODES_FORBIDDEN"],
    [{ ...resolvedRaw, foodAllergyStatus: "known", foodAllergenCodes: ["wheat", 1] }, "ALLERGEN_CODES_MALFORMED"],
    [{ ...resolvedRaw, foodAllergyStatus: { value: "none" } }, "ALLERGY_STATUS_MALFORMED"],
  ];
  for (const [raw, error] of cases) {
    const context = normalizeRestrictionContext(raw);
    assert.equal(context.status, "malformed");
    assert.ok(context.errorCodes.includes(error));
    assert.notEqual(context.foodAllergyStatus, "none");
  }
});

test("celiac remains separate and can coexist with wheat allergy", () => {
  const context = normalizeRestrictionContext({ ...resolvedRaw, foodAllergyStatus: "known", foodAllergenCodes: ["wheat"], celiacStatus: "confirmed" });
  assert.equal(context.celiacStatus, "confirmed");
  assert.deepEqual(context.foodAllergenCodes, ["wheat"]);
  assert.ok(!context.foodAllergenCodes.includes("celiac"));
});

test("celiac and dietary values normalize without inference", () => {
  for (const celiacStatus of ["no", "confirmed", "not_sure", "prefer_not_to_say"]) assert.equal(normalizeRestrictionContext({ ...resolvedRaw, celiacStatus }).celiacStatus, celiacStatus === "prefer_not_to_say" ? "withheld" : celiacStatus);
  for (const dietaryPattern of ["omnivore", "vegetarian", "vegan", "pescatarian", "other", "not_sure", "prefer_not_to_say"]) assert.equal(normalizeRestrictionContext({ ...resolvedRaw, dietaryPattern }).dietaryPattern, dietaryPattern === "prefer_not_to_say" ? "withheld" : dietaryPattern);
});

test("parser accepts current strict context and rejects malformed or old sessions", () => {
  const context = normalizeRestrictionContext(resolvedRaw);
  assert.equal(parseRestrictionContextJson(JSON.stringify(context)).kind, "available");
  assert.deepEqual(parseRestrictionContextJson(null), { kind: "missing" });
  assert.deepEqual(parseRestrictionContextJson("{"), { kind: "invalid", errorCode: "CONTEXT_JSON_MALFORMED" });
  for (const [field, value, errorCode] of [["schemaVersion", "old", "CONTEXT_SCHEMA_UNSUPPORTED"], ["marketVersion", "neutral", "CONTEXT_MARKET_UNSUPPORTED"], ["taxonomyVersion", "allergen-taxonomy.union.eu-eaeu-us.v1", "CONTEXT_TAXONOMY_UNSUPPORTED"], ["catalogCoverageVersion", "old", "CONTEXT_CATALOG_COVERAGE_UNSUPPORTED"]]) {
    assert.deepEqual(parseRestrictionContextJson(JSON.stringify({ ...context, [field]: value })), { kind: "invalid", errorCode });
  }
  assert.deepEqual(parseRestrictionContextJson(JSON.stringify({ ...context, product: "forbidden" })), { kind: "invalid", errorCode: "CONTEXT_SHAPE_MALFORMED" });
  assert.deepEqual(parseRestrictionContextJson(JSON.stringify({ ...context, status: "unresolved" })), { kind: "invalid", errorCode: "CONTEXT_STATUS_CONFLICT" });
  assert.deepEqual(parseRestrictionContextJson(JSON.stringify({ ...context, futureFilterMode: "unrestricted" })), { kind: "invalid", errorCode: "CONTEXT_STATUS_CONFLICT" });
});

test("context contains no nutrition, parent, journal, medical payload, labels or products", () => {
  const context = normalizeRestrictionContext(resolvedRaw);
  const forbiddenKeys = ["kcal", "macros", "hydration", "phase2d1", "phase3a", "journal", "labs", "weight", "products", "ingredients", "labels", "url", "medicalAnswers"];
  for (const forbidden of forbiddenKeys) assert.ok(!(forbidden in context));
});
