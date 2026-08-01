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
export const ORDINARY_ACTIVITIES = ["mostly_sitting", "lots_of_walking", "physically_active_work", "fitness_2_4_week"] as const;
export type OrdinaryActivity = typeof ORDINARY_ACTIVITIES[number];
export type LegacyOrdinaryActivity = "low" | "moderate" | "high";
export type DayType = "rest" | "training" | "double";
export type GoalKind = "weight_loss" | "maintenance" | "muscle_gain" | "performance_recovery" | "habits_wellbeing";
export type CalculationResultStatus = "admitted" | "blocked" | "specialist_review" | "invalid_input";
export type CalculationStage = "normalization" | "admission" | "ree" | "result";
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
  sessionsPerWeek?: "1_2" | "3_4" | "5_6" | "7_plus";
  doubleTrainingDays?: boolean;
}

export interface GeneralUserActivityInput {
  kind: "general_user";
  dailyActivity: OrdinaryActivity;
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
  /** REE does not depend on unresolved PAL or goal policy. */
  scope?: "full" | "ree";
  activity?: ExplicitCanonicalValue<CanonicalActivityInput> | SurveyVocabularyValue;
  goal?: ExplicitCanonicalValue<GoalKind> | SurveyVocabularyValue;
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
  activity?: CanonicalActivityInput;
  goal?: GoalKind;
  source: {
    activity?: TraceValue;
    goal?: TraceValue;
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
  | "REE_INPUT_INVALID"
  | "REE_POPULATION_UNAPPROVED"
  | "REE_FORMULA_AMBIGUOUS"
  | "REE_STAGE_MAPPING_DEFERRED"
  | "SOURCE_VALUE_PRESERVED"
  | "QUESTIONNAIRE_UNSUPPORTED_LEGACY_ACTIVITY"
  | "PAL_INPUT_MISSING"
  | "PAL_INPUT_INVALID";

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
  ree: "phase2b.ree.v1",
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

export type Phase2BStatus = "calculated" | "blocked" | "specialist_review" | "minor_suppressed" | "invalid_input";
export interface ReeResult {
  formulaId: "mifflin_st_jeor_adult_male" | "mifflin_st_jeor_adult_female";
  inputs: { ageYears: number; sexForFormula: "female" | "male"; heightCm: number; weightKg: number; units: { height: "cm"; weight: "kg" } };
  unroundedKcalPerDay: number;
  displayKcalPerDay: number;
  roundingRuleId: "nearest_5_kcal";
}
interface Phase2BBase { status: Phase2BStatus; versions: CalculationVersions; issues: CalculationIssue[]; nextStepCode: string; trace: CalculationTraceEntry[] }
export type Phase2BResult =
  | (Phase2BBase & { status: "calculated"; ree: ReeResult; warnings: CalculationWarning[] })
  | (Phase2BBase & { status: Exclude<Phase2BStatus, "calculated"> });

export const PHASE2C1_RESULT_SCHEMA_VERSION = "nutrimind.phase2c1.result.v1" as const;
export const PHASE2C2_RESULT_SCHEMA_VERSION = "nutrimind.phase2c2.result.v1" as const;
export type ScenarioId = "typical_day" | "rest" | "training" | "double_training";
export type ScenarioLabelCode = "day.typical" | "day.rest" | "day.training" | "day.double_training";
export type GoalStatus = "disabled_pending_safety_screen" | "deferred_to_goal_phase" | "neutral_in_phase2c1";
export interface EnergyScenario {
  id: ScenarioId;
  labelCode: ScenarioLabelCode;
  palPolicyId: "pal.demo.phase2c1.v1";
  palBase: number;
  durationModifier: number;
  palBeforeClamp: number;
  palFinal: number;
  energyStartRawKcal: number;
  energyStartKcal: number;
  energyRoundingRuleId: "nearest_50_ties_to_even";
  appliedRuleIds: string[];
  warnings: string[];
  trace: { path: string; value: TraceValue }[];
}
export type MacroScenarioId = "lower" | "central" | "upper";
export type MacroProfileCategory = "ordinary_adult" | "athlete_amateur" | "athlete_competitive" | "athlete_professional";
export interface MacroTrace {
  energyStartKcal: number; scenarioFactor: 0.94 | 1 | 1.06; energyRawKcal: number; energyKcal: number;
  energyRoundingRuleId: "nearest_50_ties_to_even"; profileCategory: MacroProfileCategory;
  proteinCoefficient: number; proteinRawG: number; proteinRoundedG: number;
  fatCoefficient: number; fatByWeightRawG: number; fatEnergyFloorRawG: number;
  fatFloorSource: "weight_based" | "energy_20_percent"; fatSelectedRawG: number; fatRoundedG: number;
  carbohydrateRawG: number; carbohydrateRoundedG: number; macroEnergyKcal: number; deviationKcal: number;
  ruleIds: string[];
}
export type MacroScenario =
  | { status: "calculated"; id: MacroScenarioId; energyKcal: number; proteinG: number; fatG: number; carbohydrateG: number; macroEnergyKcal: number; deviationKcal: number; consistencyStatus: "matched"; trace: MacroTrace }
  | { status: "needs_review"; id: MacroScenarioId; energyKcal: number; issues: ["macro_scenario_needs_review"] };
export type Phase2C2EnergyScenario = EnergyScenario & { macroScenarios: MacroScenario[] };
interface Phase2C1Base { status: Phase2BStatus; versions: CalculationVersions; resultSchemaVersion: typeof PHASE2C1_RESULT_SCHEMA_VERSION; engineVersion: CalculationCoreVersion; issues: CalculationIssue[]; nextStepCode: string; trace: CalculationTraceEntry[] }
export type Phase2C1Result =
  | (Phase2C1Base & { status: "calculated"; ree: ReeResult; selectedGoal: GoalKind; goalStatus: GoalStatus; appliedGoalMultiplier: 1; scenarios: EnergyScenario[]; warnings: CalculationWarning[]; phase2c1Warnings: string[] })
  | (Phase2C1Base & { status: Exclude<Phase2BStatus, "calculated"> });

interface Phase2C2Base { status: Phase2BStatus; versions: CalculationVersions; resultSchemaVersion: typeof PHASE2C2_RESULT_SCHEMA_VERSION; engineVersion: CalculationCoreVersion; issues: CalculationIssue[]; nextStepCode: string; trace: CalculationTraceEntry[] }
export type Phase2C2Result =
  | (Phase2C2Base & { status: "calculated"; ree: ReeResult; selectedGoal: GoalKind; goalStatus: GoalStatus; appliedGoalMultiplier: 1; scenarios: Phase2C2EnergyScenario[]; warnings: CalculationWarning[]; phase2c1Warnings: string[]; phase2c2Warnings: string[] })
  | (Phase2C2Base & { status: Exclude<Phase2BStatus, "calculated"> });

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
