import { MACRO_SCENARIO_IDS } from "./macro-policy.ts";
import { PHASE2C2_RESULT_SCHEMA_VERSION, type Phase2C2Result } from "./types.ts";

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const finiteNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value);

function validMacro(value: unknown, id: string): boolean {
  if (!isObject(value) || value.id !== id || !["calculated", "needs_review"].includes(String(value.status)) || !finiteNumber(value.energyKcal)) return false;
  return value.status === "needs_review" ? Array.isArray(value.issues) && value.issues.length === 1 && value.issues[0] === "macro_scenario_needs_review" :
    ["proteinG", "fatG", "carbohydrateG", "macroEnergyKcal", "deviationKcal"].every((key) => finiteNumber(value[key])) && value.consistencyStatus === "matched" && isObject(value.trace);
}

function validDay(day: unknown): boolean {
  if (!isObject(day) || !finiteNumber(day.energyStartKcal) || !Array.isArray(day.macroScenarios) || day.macroScenarios.length !== 3) return false;
  const macros: unknown[] = day.macroScenarios;
  return MACRO_SCENARIO_IDS.every((id, index) => validMacro(macros[index], id));
}

export function isCompatiblePhase2C2Payload(value: unknown): value is Phase2C2Result {
  if (!isObject(value) || value.resultSchemaVersion !== PHASE2C2_RESULT_SCHEMA_VERSION || !["calculated", "blocked", "specialist_review", "minor_suppressed", "invalid_input"].includes(String(value.status))) return false;
  if (value.status !== "calculated") return Array.isArray(value.issues) && typeof value.nextStepCode === "string";
  return isObject(value.ree) && Array.isArray(value.scenarios) && value.scenarios.length > 0 && value.scenarios.every(validDay);
}
