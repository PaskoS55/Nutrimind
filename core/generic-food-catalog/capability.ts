import { isCompatiblePhase3APayload } from "../calculation/result-schema.ts";
import { isRestrictionContextV1 } from "../food-restrictions/context-schema.ts";
import * as T from "./types.ts";
import { deepFreeze } from "./validator.ts";
const order=<X extends string>(v:X[],o:readonly X[])=>[...new Set(v)].sort((a,b)=>o.indexOf(a)-o.indexOf(b));
const unavailable=(error:T.GenericErrorCode)=>deepFreeze<T.GenericExampleCapabilityResultV1>({status:"generic_examples_unavailable",warningCodes:["GENERIC_EXAMPLES_DISABLED","GENERIC_PHASE3B1_FALLBACK","GENERIC_NO_PORTIONS","GENERIC_NO_MACRO_MATCHING","GENERIC_NO_MENUS"],errorCodes:[error],ruleIds:[...T.GENERIC_RULE_IDS]});
export function computeGenericExampleCapability(input:T.GenericExampleCapabilityInputV1):T.GenericExampleCapabilityResultV1{
 const {phase3AParent:p,restrictionContext:c,catalogValidation:v}=input;
 if(!p||!isCompatiblePhase3APayload(p)||p.status!=="calculated")return unavailable("GENERIC_CAPABILITY_PHASE3A_UNAVAILABLE");
 if(!c||!isRestrictionContextV1(c)||c.status!=="resolved")return unavailable("GENERIC_CAPABILITY_CONTEXT_UNAVAILABLE");
 if(c.foodAllergyStatus!=="none"||c.foodAllergenCodes.length){return unavailable(["other","not_sure","withheld"].includes(c.foodAllergyStatus)?"GENERIC_CAPABILITY_ALLERGY_UNRESOLVED":"GENERIC_CAPABILITY_ALLERGY_INELIGIBLE")}
 if(c.celiacStatus!=="no")return unavailable(c.celiacStatus==="confirmed"?"GENERIC_CAPABILITY_CELIAC_CONFIRMED_INELIGIBLE":"GENERIC_CAPABILITY_CELIAC_UNRESOLVED");
 if(!T.GENERIC_PATTERNS.includes(c.dietaryPattern as never))return unavailable("GENERIC_CAPABILITY_DIETARY_PATTERN_UNSUPPORTED");
 if(!v)return unavailable("GENERIC_CAPABILITY_CATALOG_UNAVAILABLE");if(v.status==="invalid")return unavailable("GENERIC_CAPABILITY_CATALOG_INVALID");if(v.status==="valid_empty")return unavailable("GENERIC_CAPABILITY_CATALOG_EMPTY");
 return deepFreeze({status:"generic_examples_available",warningCodes:order(["GENERIC_EXAMPLES_NOT_ALLERGY_ASSESSED","GENERIC_EXAMPLES_NOT_CELIAC_ASSESSED","GENERIC_EXAMPLES_NO_CROSS_CONTACT_ASSESSMENT","GENERIC_CATALOG_LIMITED","GENERIC_CLIENT_SIDE_FILTERING_ONLY","GENERIC_NO_PORTIONS","GENERIC_NO_MACRO_MATCHING","GENERIC_NO_MENUS"],T.GENERIC_WARNING_CODES),errorCodes:[],ruleIds:[...T.GENERIC_RULE_IDS]});
}
