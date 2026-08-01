import {
  SURVEY_SPEC_VERSION,
  type NormalizedUserProfile,
  type SurveyInput,
  type ValidationIssue,
  type ValidationResult,
} from "./types.ts";

const allowed = {
  userType: ["athlete", "general_user"], ageGroup: ["adult", "minor"],
  sexForFormula: ["female", "male"],
  allergies: ["none", "milk", "egg", "peanut", "tree_nut", "fish", "seafood", "wheat", "soy", "sesame", "other"],
  intolerances: ["none", "lactose", "gluten", "fructose", "legumes", "other"],
  medicalRestrictions: ["none", "celiac", "carbohydrate_metabolism", "kidney", "gastrointestinal", "lipid_metabolism", "high_blood_pressure", "other"],
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validateSurveyInput(input: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const issue = (severity: "error" | "warning", code: ValidationIssue["code"], path: string, message: string) =>
    (severity === "error" ? errors : warnings).push({ severity, code, path, message });

  if (!isRecord(input)) {
    issue("error", "INPUT_NOT_OBJECT", "$", "Survey input must be an object.");
    return { valid: false, errors, warnings };
  }

  for (const field of ["surveySpecVersion", "userType", "ageGroup", "ageYears", "sexForFormula", "heightCm", "weightKg", "allergies", "intolerances", "medicalRestrictions", "informationalConsent"] as const) {
    if (input[field] === undefined || input[field] === null) issue("error", "REQUIRED_FIELD_MISSING", field, `${field} is required.`);
  }
  if (input.surveySpecVersion !== undefined && input.surveySpecVersion !== SURVEY_SPEC_VERSION)
    issue("error", "UNSUPPORTED_SURVEY_VERSION", "surveySpecVersion", `Expected ${SURVEY_SPEC_VERSION}.`);
  for (const field of ["userType", "ageGroup", "sexForFormula"] as const) {
    if (input[field] !== undefined && !(allowed[field] as readonly unknown[]).includes(input[field]))
      issue("error", "INVALID_VALUE", field, `${field} has an unsupported value.`);
  }
  for (const [field, min, max] of [["ageYears", 1, 120], ["heightCm", 50, 250], ["weightKg", 10, 500]] as const) {
    const value = input[field];
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max))
      issue("error", "INVALID_NUMBER", field, `${field} must be a finite number from ${min} to ${max}.`);
  }
  if (typeof input.informationalConsent !== "boolean" && input.informationalConsent !== undefined)
    issue("error", "INVALID_VALUE", "informationalConsent", "informationalConsent must be boolean.");
  else if (input.informationalConsent === false)
    issue("error", "CONSENT_REQUIRED", "informationalConsent", "Informational consent must be accepted before processing.");

  for (const field of ["allergies", "intolerances", "medicalRestrictions"] as const) {
    const value = input[field];
    if (value !== undefined && (!Array.isArray(value) || value.length === 0 || value.some((v) => typeof v !== "string" || !(allowed[field] as readonly string[]).includes(v)))) {
      issue("error", "INVALID_VALUE", field, `${field} must contain only supported values.`);
    } else if (Array.isArray(value) && value.includes("none") && value.length > 1) {
      issue("error", "SURVEY_CONFLICT_NONE_WITH_VALUE", field, "none cannot be combined with a specific value.");
    }
  }

  if (typeof input.ageYears === "number" && (input.ageGroup === "minor") !== (input.ageYears < 18))
    issue("error", "AGE_GROUP_MISMATCH", "ageGroup", "ageGroup conflicts with ageYears.");
  if (input.ageGroup === "minor" && !input.guardianRole)
    issue("error", "GUARDIAN_REQUIRED", "guardianRole", "Guardian participation is required for a minor.");
  if (input.userType === "athlete" && (!input.sportLevel || !input.sessionsPerWeek || typeof input.typicalSessionMinutes !== "number"))
    issue("error", "ATHLETE_BRANCH_INCOMPLETE", "sport_and_goal", "Athlete level, frequency and duration are required.");
  if (input.userType === "general_user" && !input.dailyActivity)
    issue("error", "GENERAL_BRANCH_INCOMPLETE", "dailyActivity", "dailyActivity is required for a general user.");
  if (input.userType === "general_user" && ["low", "moderate", "high"].includes(String(input.dailyActivity)))
    issue("error", "QUESTIONNAIRE_UNSUPPORTED_LEGACY_ACTIVITY", "dailyActivity", "Legacy ordinary activity is unsupported; complete the questionnaire again.");
  if (input.userType === "general_user" && input.dailyActivity && !["mostly_sitting", "lots_of_walking", "physically_active_work", "fitness_2_4_week"].includes(String(input.dailyActivity)))
    issue("error", "INVALID_VALUE", "dailyActivity", "dailyActivity has an unsupported value.");

  const allergies = Array.isArray(input.allergies) ? input.allergies : [];
  if (allergies.includes("other") && (typeof input.otherAllergy !== "string" || !input.otherAllergy.trim()))
    issue("error", "OTHER_ALLERGY_DETAILS_REQUIRED", "otherAllergy", "The other allergy must be described.");
  if (allergies.includes("other") && !input.normalizedOtherAllergyCode)
    issue("warning", "ALLERGY_UNRESOLVED", "normalizedOtherAllergyCode", "Food recommendations remain blocked until the allergen is normalized.");

  if (!isRecord(input.safetyScreening)) {
    issue("warning", "SAFETY_SCREENING_MISSING", "safetyScreening", "Optional safety screening is absent; automatic energy reduction remains disabled.");
  } else {
    const screenValues = {
      pregnancy: ["yes", "no", "uncertain", "not_applicable"],
      breastfeeding: ["yes", "no", "not_applicable"],
      eatingDisorderRisk: ["yes", "no", "prefer_not_to_answer"],
      restrictiveOrCompensatoryPractices: [true, false, "unknown", "prefer_not_to_answer"],
    } as const;
    for (const key of ["pregnancy", "breastfeeding", "eatingDisorderRisk", "restrictiveOrCompensatoryPractices"] as const) {
      if (input.safetyScreening[key] === undefined) issue("warning", "ANSWER_UNCERTAIN", `safetyScreening.${key}`, "Safety answer is missing.");
      else if (!(screenValues[key] as readonly unknown[]).includes(input.safetyScreening[key]))
        issue("error", "INVALID_VALUE", `safetyScreening.${key}`, "Safety answer has an unsupported value.");
    }
  }

  if (input.laboratoryResults !== undefined) {
    if (!Array.isArray(input.laboratoryResults)) issue("error", "INVALID_VALUE", "laboratoryResults", "laboratoryResults must be an array.");
    else input.laboratoryResults.forEach((lab, index) => {
      if (!isRecord(lab) || typeof lab.analyte !== "string" || typeof lab.unit !== "string" || typeof lab.value !== "number" || !Number.isFinite(lab.value))
        issue("error", "LAB_RESULT_INCOMPLETE", `laboratoryResults.${index}`, "A numeric laboratory result requires analyte, finite value and unit.");
    });
  }
  if (Array.isArray(input.claimedDeficiencies) && input.claimedDeficiencies.some((claim) =>
    !Array.isArray(input.laboratoryResults) || !input.laboratoryResults.some((lab) => isRecord(lab) && typeof lab.analyte === "string" && lab.analyte.toLocaleLowerCase() === String(claim).toLocaleLowerCase() && typeof lab.value === "number" && Number.isFinite(lab.value))))
    issue("warning", "UNCONFIRMED_DEFICIENCY_CLAIM", "claimedDeficiencies", "Each deficiency claim requires a matching numeric laboratory result.");

  if (errors.length) return { valid: false, errors, warnings };
  const typed = input as unknown as SurveyInput;
  const profile: NormalizedUserProfile = {
    ...typed,
    allergies: [...typed.allergies], intolerances: [...typed.intolerances], medicalRestrictions: [...typed.medicalRestrictions],
    isMinor: typed.ageGroup === "minor", hasAllergies: !typed.allergies.includes("none") && typed.allergies.length > 0,
    unresolvedAllergy: typed.allergies.includes("other") && !typed.normalizedOtherAllergyCode,
    strictGlutenFree: typed.medicalRestrictions.includes("celiac"),
    hasMedicalRestrictions: !typed.medicalRestrictions.includes("none") && typed.medicalRestrictions.length > 0,
    hasNumericLaboratoryResults: (typed.laboratoryResults?.length ?? 0) > 0,
  };
  return { valid: true, errors, warnings, profile };
}
