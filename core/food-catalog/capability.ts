import { parseRestrictionContextJson } from "../food-restrictions/context-schema.ts";
import type { RestrictionContextV1 } from "../food-restrictions/types.ts";
import { CATALOG_RULE_IDS, CATALOG_WARNING_CODES, FUTURE_SUPPORTED_ALLERGEN_CODES, SUPPORTED_PATTERNS, type CatalogCapabilityResult, type CatalogErrorCode, type CatalogValidationResult, type CatalogWarningCode } from "./types.ts";
import { deepFreeze } from "./validator.ts";

const ordered=<T extends string>(values:T[],order:readonly T[])=>[...new Set(values)].sort((a,b)=>order.indexOf(a)-order.indexOf(b));
const out=(errors:CatalogErrorCode[],warnings:CatalogWarningCode[],concrete=false):CatalogCapabilityResult=>deepFreeze({status:concrete?"concrete_available":"abstract_only",warningCodes:ordered(warnings,CATALOG_WARNING_CODES),errorCodes:errors,ruleIds:[...CATALOG_RULE_IDS]});
export function computeCatalogCapability(context:RestrictionContextV1|null|undefined,catalog:CatalogValidationResult|null|undefined):CatalogCapabilityResult{
 if(!context||context.status!=="resolved")return out(["CAPABILITY_CONTEXT_UNAVAILABLE"],["CATALOG_CONCRETE_OUTPUT_DISABLED","CATALOG_PHASE3B1_FALLBACK"]);
 if(context.celiacStatus==="confirmed")return out(["CAPABILITY_CELIAC_UNSUPPORTED"],["CATALOG_CONCRETE_OUTPUT_DISABLED","CATALOG_CELIAC_NOT_SUPPORTED","CATALOG_PHASE3B1_FALLBACK"]);
 if(context.foodAllergenCodes.includes("oats"))return out(["CAPABILITY_OATS_UNSUPPORTED"],["CATALOG_CONCRETE_OUTPUT_DISABLED","CATALOG_OATS_NOT_SUPPORTED","CATALOG_PHASE3B1_FALLBACK"]);
 if(context.foodAllergenCodes.some(x=>!FUTURE_SUPPORTED_ALLERGEN_CODES.includes(x as never))||!SUPPORTED_PATTERNS.includes(context.dietaryPattern as never))return out(["CAPABILITY_COVERAGE_UNSUPPORTED"],["CATALOG_COVERAGE_NOT_ACTIVE","CATALOG_CONCRETE_OUTPUT_DISABLED","CATALOG_PHASE3B1_FALLBACK"]);
 if(!catalog||catalog.status==="invalid"||catalog.status==="valid_empty")return out(["CAPABILITY_CATALOG_UNAVAILABLE"],[...(catalog?.status==="valid_empty"?["CATALOG_EMPTY" as const]:["CATALOG_NO_PRODUCTION_CONTENT" as const]),"CATALOG_CONCRETE_OUTPUT_DISABLED","CATALOG_PHASE3B1_FALLBACK"]);
 return out([], ["CATALOG_CROSS_CONTACT_FAIL_CLOSED","CATALOG_REVIEW_EXPIRY_180_DAYS","CATALOG_CLIENT_SIDE_FILTERING_ONLY","CATALOG_NO_PORTIONS","CATALOG_NO_MACRO_MATCHING"],true);
}
export function capabilityFromJson(rawContext:string|null,catalog:CatalogValidationResult|null):CatalogCapabilityResult{const parsed=parseRestrictionContextJson(rawContext);return computeCatalogCapability(parsed.kind==="available"?parsed.context:null,catalog)}
export const productionCatalogCapability=()=>out(["CAPABILITY_CATALOG_UNAVAILABLE"],["CATALOG_NO_PRODUCTION_CONTENT","CATALOG_COVERAGE_NOT_ACTIVE","CATALOG_CONCRETE_OUTPUT_DISABLED","CATALOG_PHASE3B1_FALLBACK","CATALOG_NO_PORTIONS","CATALOG_NO_MACRO_MATCHING"]);
