import type { Phase2D1Result } from "../calculation/types.ts";
import type { CalibrationSource, DayType } from "./types.ts";

const dayTypeByLabel = {
  "day.typical": "other",
  "day.rest": "rest",
  "day.training": "single_training",
  "day.double_training": "double_training",
} as const;

export function sourceFromPhase2D1(result: Phase2D1Result): CalibrationSource | null {
  if (result.status !== "calculated") return null;
  const availableDayTypes = [...new Set(result.phase2c2.scenarios.map((scenario) => dayTypeByLabel[scenario.labelCode]))] as DayType[];
  return {
    sourceSchemaVersion: result.schemaVersion,
    sourceStatus: "calculated",
    profileKind: availableDayTypes.includes("rest") ? "athlete" : "ordinary",
    goal: result.phase2c2.selectedGoal,
    availableDayTypes,
  };
}
