import type { ValidationResult } from "../types.ts";
import { runPhase2A } from "./pipeline.ts";
import { calculateApprovedAdultRee } from "./ree-policy.ts";
import { createTraceEntry } from "./trace.ts";
import { CALCULATION_CORE_VERSION, type Phase2ACalculationRequest, type Phase2BResult } from "./types.ts";

export function runPhase2B(validation: ValidationResult, request: Phase2ACalculationRequest): Phase2BResult {
  const phase2a = runPhase2A({ validation, request: { ...request, scope: "ree" } });
  const common = { versions: phase2a.versions, issues: [...phase2a.errors, ...phase2a.warnings], trace: phase2a.trace };
  if (phase2a.status !== "admitted" || !phase2a.normalizedInput) {
    const minor = validation.profile?.isMinor === true;
    const status = minor ? "minor_suppressed" : phase2a.status;
    return { ...common, status, nextStepCode: minor ? "CONSULT_GUARDIAN_AND_SPECIALIST" : status === "specialist_review" ? "CONSULT_SPECIALIST" : status === "blocked" ? "FOLLOW_SAFETY_GUIDANCE" : "CORRECT_QUESTIONNAIRE" } as Phase2BResult;
  }
  try {
    const ree = calculateApprovedAdultRee(phase2a.normalizedInput);
    const trace = [...phase2a.trace, createTraceEntry(4, "ree", [
      { path: "demographics", value: ree.inputs },
    ], [{ path: "ree.formulaId", value: ree.formulaId }, { path: "ree.unroundedKcalPerDay", value: ree.unroundedKcalPerDay }, { path: "ree.displayKcalPerDay", value: ree.displayKcalPerDay }], ["REE.MIFFLIN_ST_JEOR.ADULT.001", "ROUND.NEAREST_5_KCAL.001"], [])];
    return { ...common, status: "calculated", nextStepCode: "REVIEW_REE_ONLY", ree, warnings: phase2a.warnings, trace };
  } catch {
    return { ...common, status: "invalid_input", nextStepCode: "CORRECT_QUESTIONNAIRE" };
  }
}
