import {
  CALCULATION_CORE_VERSION,
  TRACE_STEP_IDS,
  type CalculationIssue,
  type CalculationStage,
  type CalculationTraceEntry,
  type TraceValue,
} from "./types.ts";

export function createTraceEntry(
  sequence: number,
  stage: CalculationStage,
  inputs: { path: string; value: TraceValue }[],
  outputs: { path: string; value: TraceValue }[],
  appliedRules: string[],
  issues: CalculationIssue[],
): CalculationTraceEntry {
  const stepId = TRACE_STEP_IDS[stage];
  return {
    sequence,
    stepId,
    stage,
    rule: { id: stepId, version: CALCULATION_CORE_VERSION },
    inputs,
    outputs,
    appliedRules: [...appliedRules],
    warnings: issues.filter((issue) => issue.severity === "warning").map((issue) => issue.code),
    blockedDecisions: issues.filter((issue) => issue.severity === "error").map((issue) => issue.code),
  };
}
