import { evaluateSafety } from "../safety.ts";
import { admitCalculation } from "./admission.ts";
import { normalizeCalculationInput } from "./normalization.ts";
import { createTraceEntry } from "./trace.ts";
import {
  CALCULATION_CORE_VERSION,
  type CalculationError,
  type CalculationWarning,
  type Phase2AInput,
  type Phase2AResult,
  type TraceValue,
} from "./types.ts";

const traceValue = (value: unknown): TraceValue => value as TraceValue;

export function runPhase2A(input: Phase2AInput): Phase2AResult {
  const validation = input?.validation ?? { valid: false, errors: [], warnings: [] };
  const request = input?.request;
  const safety = evaluateSafety(validation);
  const normalized = normalizeCalculationInput(validation, safety, request);
  const decision = admitCalculation(validation, safety, normalized.errors);
  const errors = decision.issues.filter((issue): issue is CalculationError => issue.severity === "error");
  const warnings = normalized.warnings.filter((issue): issue is CalculationWarning => issue.severity === "warning");
  const versions = {
    surveySpecVersion: validation.profile?.surveySpecVersion ?? "unknown",
    calculationCoreVersion: CALCULATION_CORE_VERSION,
  };
  const trace = [
    createTraceEntry(1, "normalization", [
      { path: "request.calculationCoreVersion", value: traceValue(request?.calculationCoreVersion ?? null) },
      { path: "request.activity", value: traceValue(request?.activity ?? null) },
      { path: "request.goal", value: traceValue(request?.goal ?? null) },
    ], [
      { path: "normalized", value: normalized.input !== null },
    ], ["NORMALIZE.STRUCTURE.001", "NORMALIZE.ACTIVITY.NO_INFERENCE.001", "NORMALIZE.GOAL.NO_INFERENCE.001"], [...normalized.errors, ...warnings]),
    createTraceEntry(2, "admission", [
      { path: "validation.valid", value: validation.valid },
      { path: "safety.medicalGateway", value: safety.medicalGateway },
      { path: "safety.capabilities.numericKbju", value: safety.capabilities.numericKbju },
      { path: "profile.isMinor", value: validation.profile?.isMinor ?? null },
    ], [
      { path: "admission.admitted", value: decision.admission.admitted },
      { path: "status", value: decision.status },
    ], ["ADMISSION.PHASE1.VALID.001", "ADMISSION.MEDICAL.BLOCK.001", "ADMISSION.MEDICAL.REVIEW.001", "ADMISSION.AGE.MINOR.001"], decision.issues),
    createTraceEntry(3, "result", [
      { path: "status", value: decision.status },
    ], [
      { path: "numericResultScaffolded", value: false },
    ], ["RESULT.PHASE2A.SCAFFOLD.001"], []),
  ];
  return {
    status: decision.status,
    versions,
    ...(request?.timestamp === undefined ? {} : { timestamp: request.timestamp }),
    admission: decision.admission,
    normalizedInput: normalized.input,
    errors,
    warnings,
    trace,
  };
}
