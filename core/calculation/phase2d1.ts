import { HYDRATION_POLICY_ID, HYDRATION_RULE_IDS, roundToNearest50MlTiesToEven } from "./hydration-policy.ts";
import { PHASE2D1_RESULT_SCHEMA_VERSION, type CalculationIssue, type HydrationWarningId, type Phase2C2Result, type Phase2D1HydrationInput, type Phase2D1Result } from "./types.ts";

function numberFree(upstream: Phase2C2Result, status = upstream.status, extraIssues: CalculationIssue[] = []): Phase2D1Result {
  return { status: status as Exclude<typeof status, "calculated">, versions: upstream.versions, schemaVersion: PHASE2D1_RESULT_SCHEMA_VERSION, engineVersion: upstream.engineVersion, issues: [...upstream.issues, ...extraIssues], nextStepCode: status === "invalid_input" ? "CORRECT_QUESTIONNAIRE" : upstream.nextStepCode, trace: upstream.trace } as Phase2D1Result;
}

export function runPhase2D1(upstream: Phase2C2Result, input: Phase2D1HydrationInput | { unsupportedHydrationValue: unknown }): Phase2D1Result {
  if ("unsupportedHydrationValue" in input) {
    return numberFree(upstream, "invalid_input", [{ code: "QUESTIONNAIRE_UNSUPPORTED_HYDRATION_VALUE" as CalculationIssue["code"], severity: "error", stage: "normalization", path: "selections[7]", message: "Unsupported hydration answer; complete the questionnaire again.", ruleId: "HYDRATION.INPUT.FAIL_CLOSED.001" }]);
  }
  if (upstream.status !== "calculated") return numberFree(upstream);
  const baselineTotalWater = { source: "EFSA NDA Panel 2010" as const, sexBasis: upstream.ree.inputs.sexForFormula, totalWaterMl: (upstream.ree.inputs.sexForFormula === "female" ? 2000 : 2500) as 2000 | 2500, scope: "all_beverages_plus_food_water_per_day" as const, includesFoodWater: true as const, isIndividualRequirement: false as const };
  const durationAvailable = input.athlete && typeof input.trainingDurationMinutes === "number" && Number.isFinite(input.trainingDurationMinutes) && input.trainingDurationMinutes > 0;
  const rawLowerMl = durationAvailable ? input.trainingDurationMinutes! * 400 / 60 : undefined;
  const rawUpperMl = durationAvailable ? input.trainingDurationMinutes! * 800 / 60 : undefined;
  const traceDurationMinutes = durationAvailable ? input.trainingDurationMinutes! : null;
  const exerciseFluidGuidance = durationAvailable ? { status: "range_calculated" as const, durationMinutes: input.trainingDurationMinutes!, lowerMl: roundToNearest50MlTiesToEven(rawLowerMl!), upperMl: roundToNearest50MlTiesToEven(rawUpperMl!), scope: "during_single_training_session" as const, personalized: false as const, sweatRateAvailable: false as const } : { status: input.athlete ? "duration_unavailable" as const : "not_applicable" as const, scope: "during_single_training_session" as const, personalized: false as const, sweatRateAvailable: false as const };
  const warnings: HydrationWarningId[] = [];
  if (input.hydrationInputContext.beverageIntakeBand === "not_provided") warnings.push("hydration_intake_not_provided");
  else warnings.push("beverage_intake_not_comparable_to_total_water");
  if (durationAvailable) warnings.push("exercise_range_not_personalized", "sweat_rate_not_available");
  else if (input.athlete) warnings.push("training_duration_unavailable");
  if (input.doubleTrainingDay) warnings.push("double_session_duration_missing");
  return {
    status: "calculated", versions: upstream.versions, schemaVersion: PHASE2D1_RESULT_SCHEMA_VERSION, engineVersion: upstream.engineVersion, issues: upstream.issues, nextStepCode: "REVIEW_HYDRATION_GUIDANCE", trace: upstream.trace,
    phase2c2: upstream, hydrationInputContext: input.hydrationInputContext, baselineTotalWater, exerciseFluidGuidance,
    doubleSessionGuidance: { status: input.doubleTrainingDay ? "second_duration_missing" : "not_applicable", numericTotalAvailable: false }, warnings,
    appliedPolicy: { policyId: HYDRATION_POLICY_ID, ruleIds: [...HYDRATION_RULE_IDS] },
    calculationTrace: [
      { step: 1, operation: "baseline_reference", inputs: { sexBasis: baselineTotalWater.sexBasis }, outputs: { totalWaterMl: baselineTotalWater.totalWaterMl }, ruleIds: [HYDRATION_RULE_IDS[0]] },
      { step: 2, operation: "exercise_range", inputs: { durationMinutes: traceDurationMinutes }, outputs: { rawLowerMl: rawLowerMl ?? null, rawUpperMl: rawUpperMl ?? null, lowerMl: exerciseFluidGuidance.status === "range_calculated" ? exerciseFluidGuidance.lowerMl : null, upperMl: exerciseFluidGuidance.status === "range_calculated" ? exerciseFluidGuidance.upperMl : null }, ruleIds: [HYDRATION_RULE_IDS[2], HYDRATION_RULE_IDS[5]] },
      { step: 3, operation: "separation_guard", inputs: { baselineScope: baselineTotalWater.scope, exerciseScope: exerciseFluidGuidance.scope }, outputs: { combinedDailyWaterTargetCreated: false }, ruleIds: [HYDRATION_RULE_IDS[3]] },
    ],
  };
}
