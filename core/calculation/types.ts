import type {
  MedicalGatewayState,
  NormalizedUserProfile,
  RecommendationEligibility,
  SafetyFlag,
  ValidationIssue,
  ValidationResult,
} from "../types.ts";

export const CALCULATION_CORE_VERSION = "0.1.1-draft" as const;

export type CalculationCoreVersion = typeof CALCULATION_CORE_VERSION;
export type DayType = "rest" | "training" | "double";
export type GoalKind = "maintenance" | "weight_loss" | "weight_gain" | "recomposition";
export type CalculationResultStatus = "admitted" | "blocked" | "specialist_review" | "invalid_input";
export type CalculationStage = "normalization" | "admission" | "result";
export type CalculationSeverity = "error" | "warning";

export interface CalculationVersions {
  surveySpecVersion: string;
  calculationCoreVersion: CalculationCoreVersion;
}

export interface AthleteActivityInput {
  kind: "athlete";
  sportLevel: "professional" | "competitive" | "amateur";
  typicalSessionMinutes: number;
  dayType: DayType;
}

export interface GeneralUserActivityInput {
  kind: "general_user";
  dailyActivity: "low" | "moderate" | "high";
  dayType: DayType;
}

export type CanonicalActivityInput = AthleteActivityInput | GeneralUserActivityInput;

export interface ExplicitCanonicalValue<T> {
  vocabulary: "phase_2_canonical";
  value: T;
  /** The caller-supplied value from which the canonical value was obtained. */
  sourceValue: TraceValue;
}

export interface SurveyVocabularyValue {
  vocabulary: "survey";
  value: TraceValue;
}

export interface Phase2ACalculationRequest {
  calculationCoreVersion: CalculationCoreVersion | string;
  activity: ExplicitCanonicalValue<CanonicalActivityInput> | SurveyVocabularyValue;
  goal: ExplicitCanonicalValue<GoalKind> | SurveyVocabularyValue;
  /** Metadata only. It is copied verbatim and is never generated or parsed by the core. */
  timestamp?: string;
}

export interface NormalizedCalculationInput {
  versions: CalculationVersions;
  profile: NormalizedUserProfile;
  safety: RecommendationEligibility;
  demographics: {
    ageYears: number;
    sexForFormula: "female" | "male";
    heightCm: number;
    weightKg: number;
    ageGroup: "adult" | "minor";
  };
  activity: CanonicalActivityInput;
  goal: GoalKind;
  source: {
    activity: TraceValue;
    goal: TraceValue;
  };
}

export type CalculationIssueCode =
  | "CALCULATION_INPUT_NOT_VALIDATED"
  | "CALCULATION_INPUT_INCOMPLETE"
  | "UNSUPPORTED_CALCULATION_VERSION"
  | "ACTIVITY_MAPPING_AMBIGUOUS"
  | "GOAL_MAPPING_AMBIGUOUS"
  | "ACTIVITY_INPUT_UNSUPPORTED"
  | "GOAL_INPUT_UNSUPPORTED"
  | "PROFILE_ACTIVITY_MISMATCH"
  | "MINOR_NUMERIC_OUTPUT_BLOCKED"
  | "MEDICAL_GATEWAY_BLOCKED"
  | "MEDICAL_SPECIALIST_REVIEW_REQUIRED"
  | "NUMERIC_OUTPUT_NOT_ELIGIBLE"
  | "SOURCE_VALUE_PRESERVED";

export interface CalculationIssue {
  code: CalculationIssueCode;
  severity: CalculationSeverity;
  stage: CalculationStage;
  path?: string;
  message: string;
  ruleId: string;
}

export type CalculationError = CalculationIssue & { severity: "error" };
export type CalculationWarning = CalculationIssue & { severity: "warning" };

export type TraceValue = string | number | boolean | null | TraceValue[] | { [key: string]: TraceValue };

export const TRACE_STEP_IDS = {
  normalization: "phase2a.normalization.v1",
  admission: "phase2a.admission.v1",
  result: "phase2a.result.v1",
} as const;

export type CalculationTraceStepId = (typeof TRACE_STEP_IDS)[keyof typeof TRACE_STEP_IDS];

export interface CalculationTraceEntry {
  sequence: number;
  stepId: CalculationTraceStepId;
  stage: CalculationStage;
  rule: { id: string; version: CalculationCoreVersion };
  inputs: { path: string; value: TraceValue }[];
  outputs: { path: string; value: TraceValue }[];
  appliedRules: string[];
  warnings: CalculationIssueCode[];
  blockedDecisions: CalculationIssueCode[];
}

export interface CalculationAdmission {
  admitted: boolean;
  numericOutputAllowed: boolean;
  medicalGateway: MedicalGatewayState;
  safetyFlags: SafetyFlag[];
  validationIssues: ValidationIssue[];
  reasons: CalculationIssue[];
}

export interface Phase2AResult {
  status: CalculationResultStatus;
  versions: CalculationVersions;
  timestamp?: string;
  admission: CalculationAdmission;
  normalizedInput: NormalizedCalculationInput | null;
  errors: CalculationError[];
  warnings: CalculationWarning[];
  trace: CalculationTraceEntry[];
}

export interface Phase2AInput {
  validation: ValidationResult;
  request: Phase2ACalculationRequest;
}
