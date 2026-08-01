import type { ValidationResult } from "../types.ts";
import { calculateEnergyStart } from "./energy-start.ts";
import { buildPalScenarios, clampAndRoundPal, PAL_POLICY_ID } from "./pal-policy.ts";
import { runPhase2B } from "./phase2b.ts";
import { CALCULATION_CORE_VERSION, PHASE2C1_RESULT_SCHEMA_VERSION, type GoalKind, type Phase2ACalculationRequest, type Phase2C1Result } from "./types.ts";

const goalStatus = (goal: GoalKind) => goal === "weight_loss" ? "disabled_pending_safety_screen" : goal === "muscle_gain" ? "deferred_to_goal_phase" : "neutral_in_phase2c1";

export function runPhase2C1(validation: ValidationResult, request: Phase2ACalculationRequest): Phase2C1Result {
  const phase2b = runPhase2B(validation, request);
  if (phase2b.status !== "calculated") {
    const legacy = validation.errors.some((issue) => issue.code === "QUESTIONNAIRE_UNSUPPORTED_LEGACY_ACTIVITY");
    const issues = legacy ? [...phase2b.issues, { code: "QUESTIONNAIRE_UNSUPPORTED_LEGACY_ACTIVITY", severity: "error", stage: "normalization", path: "dailyActivity", message: "Legacy ordinary activity is unsupported; complete the questionnaire again.", ruleId: "PAL.LEGACY.FAIL_CLOSED.001" } as const] : phase2b.issues;
    return { ...phase2b, issues, resultSchemaVersion: PHASE2C1_RESULT_SCHEMA_VERSION, engineVersion: CALCULATION_CORE_VERSION };
  }
  const base = { ...phase2b, resultSchemaVersion: PHASE2C1_RESULT_SCHEMA_VERSION, engineVersion: CALCULATION_CORE_VERSION };
  if (request.activity?.vocabulary !== "phase_2_canonical" || request.goal?.vocabulary !== "phase_2_canonical") {
    const issues = [...phase2b.issues, { code: "PAL_INPUT_MISSING", severity: "error", stage: "result", path: "request.activity", message: "Exact PAL activity and goal inputs are required.", ruleId: "PAL.FAIL_CLOSED.001" } as const];
    const { ree: _ree, warnings: _warnings, ...numberFree } = base;
    return { ...numberFree, status: "invalid_input", nextStepCode: "CORRECT_QUESTIONNAIRE", issues };
  }
  const activity = request.activity.value;
  const selectedGoal = request.goal.value;
  const scenarios = buildPalScenarios(activity).map((policy) => {
    const palBeforeClamp = policy.base + policy.modifier;
    const palFinal = clampAndRoundPal(palBeforeClamp);
    const energy = calculateEnergyStart(phase2b.ree.unroundedKcalPerDay, palFinal);
    return { id: policy.id, labelCode: policy.labelCode, palPolicyId: PAL_POLICY_ID, palBase: policy.base, durationModifier: policy.modifier, palBeforeClamp, palFinal, energyStartRawKcal: energy.raw, energyStartKcal: energy.displayed, energyRoundingRuleId: "nearest_50_ties_to_even" as const, appliedRuleIds: [...policy.ruleIds, "PAL.CLAMP_1_40_2_40.001", "ENERGY.REE_X_PAL.001", "ROUND.NEAREST_50.TIES_EVEN.001", "GOAL.MULTIPLIER.NEUTRAL.001"], warnings: policy.warnings, trace: [{ path: "ree.unroundedKcalPerDay", value: phase2b.ree.unroundedKcalPerDay }, { path: "pal.base", value: policy.base }, { path: "pal.durationModifier", value: policy.modifier }, { path: "pal.beforeClamp", value: palBeforeClamp }, { path: "pal.final", value: palFinal }, { path: "energy.raw", value: energy.raw }, { path: "energy.rounded", value: energy.displayed }, { path: "sessionsPerWeek", value: activity.kind === "athlete" ? activity.sessionsPerWeek ?? null : null }], };
  });
  return { ...base, status: "calculated", nextStepCode: "REVIEW_STARTING_ENERGY", selectedGoal, goalStatus: goalStatus(selectedGoal), appliedGoalMultiplier: 1, scenarios, phase2c1Warnings: scenarios.flatMap((x) => x.warnings) };
}
