import type { CanonicalActivityInput, EnergyScenario, ScenarioId } from "./types.ts";

export const PAL_POLICY_ID = "pal.demo.phase2c1.v1" as const;
const ordinary = {
  mostly_sitting: { typical_day: 1.4 },
  lots_of_walking: { typical_day: 1.55 },
  physically_active_work: { typical_day: 1.7 },
  fitness_2_4_week: { typical_day: 1.5, training: 1.65 },
} as const;
const athlete = {
  amateur: { rest: 1.5, training: 1.7, double_training: 1.9 },
  competitive: { rest: 1.55, training: 1.85, double_training: 2.1 },
  professional: { rest: 1.6, training: 2, double_training: 2.25 },
} as const;

export interface PalScenarioPolicy { id: ScenarioId; labelCode: EnergyScenario["labelCode"]; base: number; modifier: number; warnings: string[]; ruleIds: string[] }
const label = (id: ScenarioId): EnergyScenario["labelCode"] => {
  if (id === "typical_day") return "day.typical";
  if (id === "rest") return "day.rest";
  if (id === "training") return "day.training";
  return "day.double_training";
};
export const athleteDurationModifier = (minutes: number) => minutes <= 45 ? -0.05 : minutes <= 90 ? 0 : 0.1;
export const clampAndRoundPal = (value: number) => Number(Math.min(2.4, Math.max(1.4, value)).toFixed(2));

export function buildPalScenarios(activity: CanonicalActivityInput): PalScenarioPolicy[] {
  if (activity.kind === "general_user") {
    const row = ordinary[activity.dailyActivity];
    return Object.entries(row).map(([id, base]) => ({ id: id as ScenarioId, labelCode: label(id as ScenarioId), base, modifier: 0, warnings: [], ruleIds: ["PAL.ORDINARY.EXACT.001"] }));
  }
  const row = athlete[activity.sportLevel];
  const ids: ("rest" | "training" | "double_training")[] = activity.doubleTrainingDays === true ? ["rest", "training", "double_training"] : ["rest", "training"];
  return ids.map((id) => ({
    id, labelCode: label(id), base: row[id],
    modifier: id === "training" ? athleteDurationModifier(activity.typicalSessionMinutes) : 0,
    warnings: id === "double_training" ? ["double_duration_unknown"] : [],
    ruleIds: ["PAL.ATHLETE.LEVEL.001", ...(id === "training" ? ["PAL.ATHLETE.DURATION.001"] : []), ...(id === "double_training" ? ["PAL.DOUBLE.DURATION.UNKNOWN.001"] : [])],
  }));
}
