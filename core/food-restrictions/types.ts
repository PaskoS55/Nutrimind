export const RESTRICTION_SCHEMA_VERSION = "nutrimind.phase3b2.restriction-context.v1" as const;
export const RESTRICTION_STORAGE_KEY = RESTRICTION_SCHEMA_VERSION;
export const MARKET_VERSION = "nutrimind.market.ru.v1" as const;
export const ALLERGEN_TAXONOMY_VERSION = "nutrimind.food-allergen.ru.v1" as const;
export const CATALOG_COVERAGE_VERSION = "nutrimind.catalog-coverage.none.v1" as const;
export const CATALOG_SUPPORTED_ALLERGEN_CODES = [] as const;

export const WARNING_CODES = [
  "CATALOG_NOT_IMPLEMENTED", "CATALOG_COVERAGE_EMPTY", "REGULATORY_EXCEPTIONS_NOT_MODELED",
  "PRODUCT_CROSS_CONTACT_NOT_ASSESSED", "DEFERRED_RESTRICTION_DOMAINS_NOT_COVERED",
  "RESTRICTION_CONTEXT_UNRESOLVED", "RESTRICTION_CONTEXT_NOT_PROVIDED",
  "RESTRICTION_CONTEXT_UNSUPPORTED", "RESTRICTION_CONTEXT_MALFORMED",
] as const;
export type WarningCode = typeof WARNING_CODES[number];

export const ERROR_CODES = [
  "ALLERGY_STATUS_NOT_PROVIDED", "ALLERGY_STATUS_UNSUPPORTED", "ALLERGY_STATUS_MALFORMED",
  "ALLERGEN_CODES_REQUIRED", "ALLERGEN_CODES_FORBIDDEN", "ALLERGEN_CODES_MALFORMED",
  "ALLERGEN_CODE_UNSUPPORTED", "CELIAC_STATUS_NOT_PROVIDED", "CELIAC_STATUS_UNSUPPORTED",
  "CELIAC_STATUS_MALFORMED", "DIETARY_PATTERN_NOT_PROVIDED", "DIETARY_PATTERN_UNSUPPORTED",
  "DIETARY_PATTERN_MALFORMED", "CONTEXT_JSON_MALFORMED", "CONTEXT_SCHEMA_UNSUPPORTED",
  "CONTEXT_MARKET_UNSUPPORTED", "CONTEXT_TAXONOMY_UNSUPPORTED",
  "CONTEXT_CATALOG_COVERAGE_UNSUPPORTED", "CONTEXT_SHAPE_MALFORMED", "CONTEXT_STATUS_CONFLICT",
] as const;
export type ErrorCode = typeof ERROR_CODES[number];

export const RULE_IDS = [
  "FOOD_RESTRICTION.RU_MARKET_SCOPE.001", "FOOD_RESTRICTION.EXPLICIT_NONE_ONLY.001",
  "FOOD_RESTRICTION.MULTIPLE_EXACT_CODES.001", "FOOD_RESTRICTION.UNKNOWN_FAIL_CLOSED.001",
  "FOOD_RESTRICTION.NO_FUZZY_MATCHING.001", "FOOD_RESTRICTION.CELIAC_SEPARATE.001",
  "FOOD_RESTRICTION.DIETARY_PATTERN_SEPARATE.001", "FOOD_RESTRICTION.DEFERRED_DOMAINS_EXCLUDED.001",
  "FOOD_RESTRICTION.REGULATORY_EXCEPTIONS_NOT_MODELED.001", "FOOD_RESTRICTION.CATALOG_NOT_IMPLEMENTED.001",
  "FOOD_RESTRICTION.CATALOG_COVERAGE_EMPTY.001", "FOOD_RESTRICTION.OLD_SESSION_NO_CONCRETE_OUTPUT.001",
  "FOOD_RESTRICTION.PHASE3A_REMAINS_AVAILABLE.001", "FOOD_RESTRICTION.PHASE3B1_REMAINS_AVAILABLE.001",
  "FOOD_RESTRICTION.SESSION_ONLY.001", "FOOD_RESTRICTION.NO_PRODUCT_SAFETY_GUARANTEE.001",
] as const;
export type RuleId = typeof RULE_IDS[number];

export type RawFoodAllergyStatus = "none" | "known" | "other" | "not_sure" | "prefer_not_to_say";
export type FoodAllergyStatus = "none" | "known" | "other" | "not_sure" | "withheld" | "not_provided" | "unsupported" | "malformed";
export type RawCeliacStatus = "no" | "confirmed" | "not_sure" | "prefer_not_to_say";
export type CeliacStatus = "no" | "confirmed" | "not_sure" | "withheld" | "not_provided" | "unsupported" | "malformed";
export type RawDietaryPattern = "omnivore" | "vegetarian" | "vegan" | "pescatarian" | "other" | "not_sure" | "prefer_not_to_say";
export type DietaryPattern = "omnivore" | "vegetarian" | "vegan" | "pescatarian" | "other" | "not_sure" | "withheld" | "not_provided" | "unsupported" | "malformed";
export type RestrictionStatus = "resolved" | "unresolved" | "not_provided" | "unsupported" | "malformed";

export interface RawRestrictionAnswers {
  foodAllergyStatus?: unknown;
  foodAllergenCodes?: unknown;
  celiacStatus?: unknown;
  dietaryPattern?: unknown;
}

export interface RestrictionContextV1 {
  schemaVersion: typeof RESTRICTION_SCHEMA_VERSION;
  marketVersion: typeof MARKET_VERSION;
  taxonomyVersion: typeof ALLERGEN_TAXONOMY_VERSION;
  catalogCoverageVersion: typeof CATALOG_COVERAGE_VERSION;
  status: RestrictionStatus;
  foodAllergyStatus: FoodAllergyStatus;
  foodAllergenCodes: FoodAllergenCode[];
  celiacStatus: CeliacStatus;
  dietaryPattern: DietaryPattern;
  futureFilterMode: "abstract_only";
  warningCodes: WarningCode[];
  errorCodes: ErrorCode[];
  ruleIds: RuleId[];
}

export type FoodAllergenCode =
  | "wheat" | "rye" | "barley" | "oats" | "other_gluten_cereal"
  | "tree_nuts" | "peanuts" | "sesame" | "fish" | "crustaceans" | "molluscs"
  | "milk" | "eggs" | "soybeans" | "celery" | "mustard" | "lupin";

export type PresentationGroupId = "gluten_cereals" | "nuts_peanuts_sesame" | "fish_and_seafood" | "milk_and_eggs" | "other_allergens";
export type EaeuUmbrellaId = "eaeu_gluten_cereals" | "eaeu_tree_nuts" | "eaeu_peanuts" | "eaeu_sesame" | "eaeu_fish" | "eaeu_crustaceans" | "eaeu_molluscs" | "eaeu_milk" | "eaeu_eggs" | "eaeu_soybeans" | "eaeu_celery" | "eaeu_mustard" | "eaeu_lupin";
