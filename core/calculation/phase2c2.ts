import type { ValidationResult } from "../types.ts";
import { macroProfileCategory } from "./macro-policy.ts";
import { buildMacroScenarios } from "./macro-scenarios.ts";
import { runPhase2C1 } from "./phase2c.ts";
import { PHASE2C2_RESULT_SCHEMA_VERSION, type Phase2ACalculationRequest, type Phase2C2Result } from "./types.ts";

export function runPhase2C2(validation: ValidationResult, request: Phase2ACalculationRequest): Phase2C2Result {
  const phase2c1 = runPhase2C1(validation, request);
  if (phase2c1.status !== "calculated") return { ...phase2c1, resultSchemaVersion: PHASE2C2_RESULT_SCHEMA_VERSION };
  const base = { ...phase2c1, resultSchemaVersion: PHASE2C2_RESULT_SCHEMA_VERSION };
  if (request.activity?.vocabulary !== "phase_2_canonical") {
    const { ree: _ree, warnings: _warnings, scenarios: _scenarios, selectedGoal: _goal, goalStatus: _goalStatus, appliedGoalMultiplier: _multiplier, phase2c1Warnings: _p1, ...numberFree } = base;
    return { ...numberFree, status: "invalid_input", nextStepCode: "CORRECT_QUESTIONNAIRE" };
  }
  const category = macroProfileCategory(request.activity.value);
  const scenarios = phase2c1.scenarios.map((scenario) => ({ ...scenario, macroScenarios: buildMacroScenarios(scenario.energyStartKcal, phase2c1.ree.inputs.weightKg, category) }));
  return { ...base, scenarios, phase2c2Warnings: scenarios.flatMap((day) => day.macroScenarios.filter((macro) => macro.status === "needs_review").flatMap((macro) => macro.issues)), nextStepCode: "REVIEW_MACRO_SCENARIOS" };
}
