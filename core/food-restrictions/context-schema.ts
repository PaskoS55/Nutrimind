import { ALLERGEN_CODES } from "./taxonomy.ts";
import { ALLERGEN_TAXONOMY_VERSION, CATALOG_COVERAGE_VERSION, ERROR_CODES, MARKET_VERSION, RESTRICTION_SCHEMA_VERSION, RULE_IDS, WARNING_CODES, type ErrorCode, type RestrictionContextV1 } from "./types.ts";
import { warningsForStatus } from "./capability.ts";

const keys = ["schemaVersion", "marketVersion", "taxonomyVersion", "catalogCoverageVersion", "status", "foodAllergyStatus", "foodAllergenCodes", "celiacStatus", "dietaryPattern", "futureFilterMode", "warningCodes", "errorCodes", "ruleIds"].sort();
const exactArray = (actual: unknown, expected: readonly string[]) => Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
const plainObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;

export function isRestrictionContextV1(value: unknown): value is RestrictionContextV1 {
  if (!plainObject(value) || !exactArray(Object.keys(value).sort(), keys)) return false;
  if (value.schemaVersion !== RESTRICTION_SCHEMA_VERSION || value.marketVersion !== MARKET_VERSION || value.taxonomyVersion !== ALLERGEN_TAXONOMY_VERSION || value.catalogCoverageVersion !== CATALOG_COVERAGE_VERSION || value.futureFilterMode !== "abstract_only") return false;
  const statuses = ["resolved", "unresolved", "not_provided", "unsupported", "malformed"];
  const allergies = ["none", "known", "other", "not_sure", "withheld", "not_provided", "unsupported", "malformed"];
  const celiac = ["no", "confirmed", "not_sure", "withheld", "not_provided", "unsupported", "malformed"];
  const patterns = ["omnivore", "vegetarian", "vegan", "pescatarian", "other", "not_sure", "withheld", "not_provided", "unsupported", "malformed"];
  if (!statuses.includes(value.status as string) || !allergies.includes(value.foodAllergyStatus as string) || !celiac.includes(value.celiacStatus as string) || !patterns.includes(value.dietaryPattern as string)) return false;
  if (!Array.isArray(value.foodAllergenCodes) || !value.foodAllergenCodes.every((code) => typeof code === "string" && ALLERGEN_CODES.includes(code as never)) || new Set(value.foodAllergenCodes).size !== value.foodAllergenCodes.length) return false;
  const allergenCodes = value.foodAllergenCodes as string[];
  if (!exactArray(allergenCodes, ALLERGEN_CODES.filter((code) => allergenCodes.includes(code)))) return false;
  if ((value.foodAllergyStatus === "known") !== (allergenCodes.length > 0)) return false;
  if (!exactArray(value.warningCodes, warningsForStatus(value.status as RestrictionContextV1["status"]))) return false;
  if (!Array.isArray(value.errorCodes) || !value.errorCodes.every((code) => ERROR_CODES.includes(code as ErrorCode))) return false;
  const errorCodes = value.errorCodes as ErrorCode[];
  if (!exactArray(errorCodes, ERROR_CODES.filter((code) => errorCodes.includes(code)))) return false;
  if (!exactArray(value.ruleIds, RULE_IDS)) return false;
  if (value.status === "resolved" && (errorCodes.length > 0 || [value.foodAllergyStatus, value.celiacStatus, value.dietaryPattern].some((item) => typeof item !== "string" || ["other", "not_sure", "withheld", "not_provided", "unsupported", "malformed"].includes(item)))) return false;
  return true;
}

export type RestrictionContextReadResult = { kind: "available"; context: RestrictionContextV1 } | { kind: "missing" } | { kind: "invalid"; errorCode: ErrorCode };
export function parseRestrictionContextJson(raw: string | null): RestrictionContextReadResult {
  if (raw === null) return { kind: "missing" };
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return { kind: "invalid", errorCode: "CONTEXT_JSON_MALFORMED" }; }
  if (!plainObject(value)) return { kind: "invalid", errorCode: "CONTEXT_SHAPE_MALFORMED" };
  if (value.schemaVersion !== RESTRICTION_SCHEMA_VERSION) return { kind: "invalid", errorCode: "CONTEXT_SCHEMA_UNSUPPORTED" };
  if (value.marketVersion !== MARKET_VERSION) return { kind: "invalid", errorCode: "CONTEXT_MARKET_UNSUPPORTED" };
  if (value.taxonomyVersion !== ALLERGEN_TAXONOMY_VERSION) return { kind: "invalid", errorCode: "CONTEXT_TAXONOMY_UNSUPPORTED" };
  if (value.catalogCoverageVersion !== CATALOG_COVERAGE_VERSION) return { kind: "invalid", errorCode: "CONTEXT_CATALOG_COVERAGE_UNSUPPORTED" };
  if (value.futureFilterMode !== "abstract_only") return { kind: "invalid", errorCode: "CONTEXT_STATUS_CONFLICT" };
  if (typeof value.status === "string" && Array.isArray(value.foodAllergenCodes) && Array.isArray(value.errorCodes)) {
    const dimensions = [value.foodAllergyStatus, value.celiacStatus, value.dietaryPattern];
    const persistedErrors = value.errorCodes as unknown[];
    let expectedStatus: RestrictionContextV1["status"] = "resolved";
    if (dimensions.includes("malformed") || persistedErrors.some((code) => typeof code === "string" && (code.endsWith("MALFORMED") || ["ALLERGEN_CODES_REQUIRED", "ALLERGEN_CODES_FORBIDDEN", "CONTEXT_STATUS_CONFLICT"].includes(code)))) expectedStatus = "malformed";
    else if (dimensions.includes("unsupported") || persistedErrors.includes("ALLERGEN_CODE_UNSUPPORTED")) expectedStatus = "unsupported";
    else if (dimensions.some((item) => ["other", "not_sure", "withheld"].includes(item as string)) || value.foodAllergenCodes.includes("other_gluten_cereal")) expectedStatus = "unresolved";
    else if (dimensions.includes("not_provided")) expectedStatus = "not_provided";
    if (value.status !== expectedStatus) return { kind: "invalid", errorCode: "CONTEXT_STATUS_CONFLICT" };
  }
  return isRestrictionContextV1(value) ? { kind: "available", context: value } : { kind: "invalid", errorCode: "CONTEXT_SHAPE_MALFORMED" };
}
