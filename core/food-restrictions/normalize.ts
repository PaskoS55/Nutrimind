import { ALLERGEN_CODES, isFoodAllergenCode } from "./taxonomy.ts";
import { warningsForStatus } from "./capability.ts";
import { ALLERGEN_TAXONOMY_VERSION, CATALOG_COVERAGE_VERSION, ERROR_CODES, MARKET_VERSION, RESTRICTION_SCHEMA_VERSION, RULE_IDS, type CeliacStatus, type DietaryPattern, type ErrorCode, type FoodAllergenCode, type FoodAllergyStatus, type RawRestrictionAnswers, type RestrictionContextV1, type RestrictionStatus } from "./types.ts";

const allergyValues = ["none", "known", "other", "not_sure", "prefer_not_to_say"] as const;
const celiacValues = ["no", "confirmed", "not_sure", "prefer_not_to_say"] as const;
const patternValues = ["omnivore", "vegetarian", "vegan", "pescatarian", "other", "not_sure", "prefer_not_to_say"] as const;
const empty = (value: unknown) => value === undefined || value === null || value === "";
const canonicalErrors = (values: ErrorCode[]) => ERROR_CODES.filter((code) => values.includes(code));
const normalizedChoice = <T extends readonly string[]>(value: unknown, values: T, missing: ErrorCode, unsupported: ErrorCode, malformed: ErrorCode): { value: T[number] | "not_provided" | "unsupported" | "malformed"; errors: ErrorCode[] } => {
  if (empty(value)) return { value: "not_provided", errors: [missing] };
  if (typeof value !== "string") return { value: "malformed", errors: [malformed] };
  if (!(values as readonly string[]).includes(value)) return { value: "unsupported", errors: [unsupported] };
  return { value: value as T[number], errors: [] };
};
const persistedChoice = <T extends string>(value: T | "prefer_not_to_say") => value === "prefer_not_to_say" ? "withheld" : value;

export function normalizeRestrictionContext(raw: RawRestrictionAnswers): RestrictionContextV1 {
  const allergy = normalizedChoice(raw.foodAllergyStatus, allergyValues, "ALLERGY_STATUS_NOT_PROVIDED", "ALLERGY_STATUS_UNSUPPORTED", "ALLERGY_STATUS_MALFORMED");
  const celiac = normalizedChoice(raw.celiacStatus, celiacValues, "CELIAC_STATUS_NOT_PROVIDED", "CELIAC_STATUS_UNSUPPORTED", "CELIAC_STATUS_MALFORMED");
  const pattern = normalizedChoice(raw.dietaryPattern, patternValues, "DIETARY_PATTERN_NOT_PROVIDED", "DIETARY_PATTERN_UNSUPPORTED", "DIETARY_PATTERN_MALFORMED");
  const errors: ErrorCode[] = [...allergy.errors, ...celiac.errors, ...pattern.errors];
  let codes: FoodAllergenCode[] = [];
  const suppliedCodes = raw.foodAllergenCodes;
  if (allergy.value === "known") {
    if (!Array.isArray(suppliedCodes)) errors.push(empty(suppliedCodes) ? "ALLERGEN_CODES_REQUIRED" : "ALLERGEN_CODES_MALFORMED");
    else if (!suppliedCodes.every((code) => typeof code === "string")) errors.push("ALLERGEN_CODES_MALFORMED");
    else if (suppliedCodes.length === 0) errors.push("ALLERGEN_CODES_REQUIRED");
    else if (!suppliedCodes.every(isFoodAllergenCode)) errors.push("ALLERGEN_CODE_UNSUPPORTED");
    else codes = ALLERGEN_CODES.filter((code) => suppliedCodes.includes(code));
  } else if (Array.isArray(suppliedCodes) ? suppliedCodes.length > 0 : !empty(suppliedCodes)) {
    errors.push(Array.isArray(suppliedCodes) && suppliedCodes.every((code) => typeof code === "string") ? "ALLERGEN_CODES_FORBIDDEN" : "ALLERGEN_CODES_MALFORMED");
  }

  let normalizedAllergy = persistedChoice(allergy.value) as FoodAllergyStatus;
  if (errors.includes("ALLERGEN_CODE_UNSUPPORTED")) normalizedAllergy = "unsupported";
  else if (errors.some((code) => ["ALLERGEN_CODES_REQUIRED", "ALLERGEN_CODES_FORBIDDEN", "ALLERGEN_CODES_MALFORMED"].includes(code))) normalizedAllergy = "malformed";
  const normalizedCeliac = persistedChoice(celiac.value) as CeliacStatus;
  const normalizedPattern = persistedChoice(pattern.value) as DietaryPattern;
  let status: RestrictionStatus = "resolved";
  if ([normalizedAllergy, normalizedCeliac, normalizedPattern].includes("malformed") || errors.some((code) => code.endsWith("MALFORMED") || code === "ALLERGEN_CODES_REQUIRED" || code === "ALLERGEN_CODES_FORBIDDEN")) status = "malformed";
  else if ([normalizedAllergy, normalizedCeliac, normalizedPattern].includes("unsupported") || errors.includes("ALLERGEN_CODE_UNSUPPORTED")) status = "unsupported";
  else if ([normalizedAllergy, normalizedCeliac, normalizedPattern].some((value) => ["other", "not_sure", "withheld"].includes(value)) || codes.includes("other_gluten_cereal")) status = "unresolved";
  else if ([normalizedAllergy, normalizedCeliac, normalizedPattern].includes("not_provided")) status = "not_provided";

  return {
    schemaVersion: RESTRICTION_SCHEMA_VERSION, marketVersion: MARKET_VERSION,
    taxonomyVersion: ALLERGEN_TAXONOMY_VERSION, catalogCoverageVersion: CATALOG_COVERAGE_VERSION,
    status, foodAllergyStatus: normalizedAllergy, foodAllergenCodes: status === "unsupported" || status === "malformed" ? [] : codes,
    celiacStatus: normalizedCeliac, dietaryPattern: normalizedPattern, futureFilterMode: "abstract_only",
    warningCodes: warningsForStatus(status), errorCodes: canonicalErrors(errors), ruleIds: [...RULE_IDS],
  };
}
