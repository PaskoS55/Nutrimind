import { MACRO_SCENARIO_IDS } from "./macro-policy.ts";
import { PHASE2C2_RESULT_SCHEMA_VERSION, PHASE2D1_RESULT_SCHEMA_VERSION, type Phase2C2Result, type Phase2D1Result } from "./types.ts";

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

const hydrationBands = ["under_1_5_l", "between_1_5_and_2_l", "over_2_l", "not_provided"];
const nonCalculatedStatuses = ["blocked", "specialist_review", "minor_suppressed", "invalid_input"];

export function isCompatiblePhase2D1Payload(value: unknown): value is Phase2D1Result {
  if (!isObject(value) || value.schemaVersion !== PHASE2D1_RESULT_SCHEMA_VERSION || !["calculated", ...nonCalculatedStatuses].includes(String(value.status))) return false;
  if (value.status !== "calculated") return !Object.hasOwn(value, "phase2c2") && !Object.hasOwn(value, "baselineTotalWater") && !Object.hasOwn(value, "exerciseFluidGuidance") && Array.isArray(value.issues) && typeof value.nextStepCode === "string";
  if (!isCompatiblePhase2C2Payload(value.phase2c2) || value.phase2c2.status !== "calculated") return false;
  const context = value.hydrationInputContext;
  const baseline = value.baselineTotalWater;
  const exercise = value.exerciseFluidGuidance;
  const doubleSession = value.doubleSessionGuidance;
  if (!isObject(context) || !hydrationBands.includes(String(context.beverageIntakeBand)) || typeof context.displayLabel !== "string" || context.directlyComparableToBaseline !== false) return false;
  if (!isObject(baseline) || ![2000, 2500].includes(Number(baseline.totalWaterMl)) || !["female", "male"].includes(String(baseline.sexBasis)) || baseline.includesFoodWater !== true || baseline.isIndividualRequirement !== false) return false;
  if (!isObject(exercise) || !["range_calculated", "duration_unavailable", "not_applicable"].includes(String(exercise.status)) || exercise.personalized !== false || exercise.sweatRateAvailable !== false) return false;
  if (exercise.status === "range_calculated") {
    if (!["durationMinutes", "lowerMl", "upperMl"].every((key) => finiteNumber(exercise[key]))) return false;
  } else if (["durationMinutes", "lowerMl", "upperMl"].some((key) => Object.hasOwn(exercise, key))) return false;
  return isObject(doubleSession) && doubleSession.numericTotalAvailable === false && Array.isArray(value.warnings) && isObject(value.appliedPolicy) && Array.isArray(value.calculationTrace);
}
