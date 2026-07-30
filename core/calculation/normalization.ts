import type { RecommendationEligibility, ValidationResult } from "../types.ts";
import {
  CALCULATION_CORE_VERSION,
  type CalculationError,
  type CalculationWarning,
  type CanonicalActivityInput,
  type GoalKind,
  type NormalizedCalculationInput,
  type Phase2ACalculationRequest,
  type TraceValue,
} from "./types.ts";

const goals: readonly GoalKind[] = ["maintenance", "weight_loss", "weight_gain", "recomposition"];
const dayTypes = ["rest", "training", "double"] as const;
const sportLevels = ["professional", "competitive", "amateur"] as const;
const dailyActivities = ["low", "moderate", "high"] as const;

const error = (code: CalculationError["code"], path: string, message: string, ruleId: string): CalculationError =>
  ({ code, path, message, ruleId, severity: "error", stage: "normalization" });

const warning = (path: string): CalculationWarning => ({
  code: "SOURCE_VALUE_PRESERVED", path, severity: "warning", stage: "normalization",
  message: "Caller-supplied source value was preserved without interpretation.", ruleId: "NORMALIZE.SOURCE.PRESERVE.001",
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isTraceValue = (value: unknown): value is TraceValue => {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return typeof value !== "number" || Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isTraceValue);
  return isRecord(value) && Object.values(value).every(isTraceValue);
};

function activityValue(value: unknown): value is CanonicalActivityInput {
  if (!isRecord(value) || !dayTypes.includes(value.dayType as typeof dayTypes[number])) return false;
  if (value.kind === "athlete") return sportLevels.includes(value.sportLevel as typeof sportLevels[number]) &&
    typeof value.typicalSessionMinutes === "number" && Number.isFinite(value.typicalSessionMinutes) && value.typicalSessionMinutes > 0;
  return value.kind === "general_user" && dailyActivities.includes(value.dailyActivity as typeof dailyActivities[number]);
}

export function normalizeCalculationInput(
  validation: ValidationResult,
  safety: RecommendationEligibility,
  request: Phase2ACalculationRequest,
): { input: NormalizedCalculationInput | null; errors: CalculationError[]; warnings: CalculationWarning[] } {
  const errors: CalculationError[] = [];
  const warnings: CalculationWarning[] = [];
  if (!validation.valid || !validation.profile) {
    errors.push(error("CALCULATION_INPUT_NOT_VALIDATED", "validation", "A valid Phase 1 profile is required.", "ADMISSION.PHASE1.VALID.001"));
    return { input: null, errors, warnings };
  }
  if (!isRecord(request)) {
    errors.push(error("CALCULATION_INPUT_INCOMPLETE", "request", "Calculation request must be a complete object.", "NORMALIZE.STRUCTURE.001"));
    return { input: null, errors, warnings };
  }
  if (request.calculationCoreVersion !== CALCULATION_CORE_VERSION)
    errors.push(error("UNSUPPORTED_CALCULATION_VERSION", "request.calculationCoreVersion", "Calculation core version is unsupported.", "NORMALIZE.VERSION.001"));

  if (!isRecord(request.activity)) {
    errors.push(error("CALCULATION_INPUT_INCOMPLETE", "request.activity", "Explicit activity input is required.", "NORMALIZE.STRUCTURE.001"));
  } else if (request.activity.vocabulary === "survey") {
    errors.push(error("ACTIVITY_MAPPING_AMBIGUOUS", "request.activity", "Survey activity has no approved canonical PAL mapping.", "NORMALIZE.ACTIVITY.NO_INFERENCE.001"));
  } else if (request.activity.vocabulary !== "phase_2_canonical" || !activityValue(request.activity.value) || !isTraceValue(request.activity.sourceValue)) {
    errors.push(error("ACTIVITY_INPUT_UNSUPPORTED", "request.activity", "Activity input is unsupported or its source is not traceable.", "NORMALIZE.ACTIVITY.CANONICAL.001"));
  } else if (request.activity.value.kind !== validation.profile.userType) {
    errors.push(error("PROFILE_ACTIVITY_MISMATCH", "request.activity.value.kind", "Activity branch conflicts with the validated profile.", "NORMALIZE.ACTIVITY.BRANCH.001"));
  }

  if (!isRecord(request.goal)) {
    errors.push(error("CALCULATION_INPUT_INCOMPLETE", "request.goal", "Explicit goal input is required.", "NORMALIZE.STRUCTURE.001"));
  } else if (request.goal.vocabulary === "survey") {
    errors.push(error("GOAL_MAPPING_AMBIGUOUS", "request.goal", "Survey goal has no approved canonical goal mapping.", "NORMALIZE.GOAL.NO_INFERENCE.001"));
  } else if (request.goal.vocabulary !== "phase_2_canonical" || !goals.includes(request.goal.value as GoalKind) || !isTraceValue(request.goal.sourceValue)) {
    errors.push(error("GOAL_INPUT_UNSUPPORTED", "request.goal", "Goal input is unsupported or its source is not traceable.", "NORMALIZE.GOAL.CANONICAL.001"));
  }
  if (errors.length) return { input: null, errors, warnings };

  const activity = request.activity as Extract<typeof request.activity, { vocabulary: "phase_2_canonical" }>;
  const goal = request.goal as Extract<typeof request.goal, { vocabulary: "phase_2_canonical" }>;
  warnings.push(warning("request.activity.sourceValue"), warning("request.goal.sourceValue"));
  const profile = validation.profile;
  return {
    errors, warnings,
    input: {
      versions: { surveySpecVersion: profile.surveySpecVersion, calculationCoreVersion: CALCULATION_CORE_VERSION },
      profile,
      safety,
      demographics: {
        ageYears: profile.ageYears, sexForFormula: profile.sexForFormula, heightCm: profile.heightCm,
        weightKg: profile.weightKg, ageGroup: profile.ageGroup,
      },
      activity: activity.value,
      goal: goal.value,
      source: { activity: activity.sourceValue, goal: goal.sourceValue },
    },
  };
}
