export const SURVEY_SPEC_VERSION = "0.1.1-draft" as const;

export type KnownAnswer<T> = T | "unknown" | "prefer_not_to_answer";
export type UserType = "athlete" | "general_user";
export type AgeGroup = "adult" | "minor";
export type SexForFormula = "female" | "male";
export type PregnancyAnswer = "yes" | "no" | "uncertain" | "not_applicable";
export type BreastfeedingAnswer = "yes" | "no" | "not_applicable";
export type EatingDisorderRiskAnswer = "yes" | "no" | "prefer_not_to_answer";

export type AllergyCode =
  | "none" | "milk" | "egg" | "peanut" | "tree_nut" | "fish"
  | "seafood" | "wheat" | "soy" | "sesame" | "other";
export type IntoleranceCode = "none" | "lactose" | "gluten" | "fructose" | "legumes" | "other";
export type MedicalRestrictionCode =
  | "none" | "celiac" | "carbohydrate_metabolism" | "kidney"
  | "gastrointestinal" | "lipid_metabolism" | "high_blood_pressure" | "other";

export interface NumericLaboratoryResult {
  analyte: string;
  value: number;
  unit: string;
  measuredAt?: string;
  referenceRange?: { min?: number; max?: number };
}

/** Canonical Phase 1 input. It does not extend the approved survey schema. */
export interface SurveyInput {
  surveySpecVersion: string;
  userType: UserType;
  ageGroup: AgeGroup;
  ageYears: number;
  sexForFormula: SexForFormula;
  heightCm: number;
  weightKg: number;
  guardianRole?: "parent" | "legal_guardian" | "athlete_with_parent";
  sportLevel?: "professional" | "competitive" | "amateur";
  sessionsPerWeek?: "1_2" | "3_4" | "5_6" | "7_plus";
  typicalSessionMinutes?: number;
  dailyActivity?: "low" | "moderate" | "high";
  allergies: AllergyCode[];
  otherAllergy?: string;
  normalizedOtherAllergyCode?: string;
  intolerances: IntoleranceCode[];
  medicalRestrictions: MedicalRestrictionCode[];
  doctorInstructions?: string;
  informationalConsent: boolean;
  availableLabs?: string[];
  laboratoryResults?: NumericLaboratoryResult[];
  claimedDeficiencies?: string[];
  safetyScreening?: {
    pregnancy: PregnancyAnswer;
    breastfeeding: BreastfeedingAnswer;
    eatingDisorderRisk: EatingDisorderRiskAnswer;
    restrictiveOrCompensatoryPractices: KnownAnswer<boolean>;
  };
}

export interface NormalizedUserProfile extends SurveyInput {
  isMinor: boolean;
  hasAllergies: boolean;
  unresolvedAllergy: boolean;
  strictGlutenFree: boolean;
  hasMedicalRestrictions: boolean;
  hasNumericLaboratoryResults: boolean;
}

export type ValidationIssueCode =
  | "INPUT_NOT_OBJECT" | "REQUIRED_FIELD_MISSING" | "INVALID_VALUE"
  | "INVALID_NUMBER" | "UNSUPPORTED_SURVEY_VERSION"
  | "SURVEY_CONFLICT_NONE_WITH_VALUE" | "AGE_GROUP_MISMATCH"
  | "GUARDIAN_REQUIRED" | "ATHLETE_BRANCH_INCOMPLETE"
  | "GENERAL_BRANCH_INCOMPLETE" | "OTHER_ALLERGY_DETAILS_REQUIRED"
  | "ALLERGY_UNRESOLVED" | "SAFETY_SCREENING_MISSING"
  | "ANSWER_UNCERTAIN" | "LAB_RESULT_INCOMPLETE"
  | "UNCONFIRMED_DEFICIENCY_CLAIM" | "CONSENT_REQUIRED";

export interface ValidationIssue {
  code: ValidationIssueCode;
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  profile?: NormalizedUserProfile;
}

export type MedicalGatewayState = "allowed" | "blocked" | "specialist_review";
export type SafetyFlag =
  | "minor" | "allergy_hard_exclusions" | "unresolved_allergy"
  | "strict_gluten_free" | "pregnancy" | "pregnancy_uncertain"
  | "breastfeeding" | "eating_disorder_risk"
  | "eating_disorder_answer_withheld" | "restrictive_or_compensatory_practices"
  | "medical_restriction" | "missing_safety_screening"
  | "safety_answer_uncertain" | "unconfirmed_deficiency_claim";

export interface RecommendationEligibility {
  status: "eligible" | "limited" | "blocked" | "specialist_review";
  medicalGateway: MedicalGatewayState;
  safetyFlags: SafetyFlag[];
  capabilities: {
    numericKbju: boolean;
    foodRecommendations: boolean;
    portionedMenus: boolean;
    automaticEnergyReduction: false;
    diagnosisStatements: false;
    confirmedDeficiencyStatements: boolean;
  };
  hardExcludedAllergens: string[];
  notices: string[];
}
