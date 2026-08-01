import type { CanonicalActivityInput, MacroProfileCategory, MacroScenarioId } from "./types.ts";

export const MACRO_SCENARIO_IDS = ["lower", "central", "upper"] as const;
export const MACRO_ENERGY_FACTORS: Record<MacroScenarioId, 0.94 | 1 | 1.06> = { lower: 0.94, central: 1, upper: 1.06 };
export const FAT_COEFFICIENTS: Record<MacroScenarioId, number> = { lower: 0.9, central: 1, upper: 1.1 };
export const PROTEIN_COEFFICIENTS: Record<MacroProfileCategory, Record<MacroScenarioId, number>> = {
  ordinary_adult: { lower: 1.2, central: 1.4, upper: 1.6 },
  athlete_amateur: { lower: 1.6, central: 1.7, upper: 1.8 },
  athlete_competitive: { lower: 1.7, central: 1.85, upper: 2 },
  athlete_professional: { lower: 1.8, central: 1.9, upper: 2 },
};

export function macroProfileCategory(activity: CanonicalActivityInput): MacroProfileCategory {
  return activity.kind === "general_user" ? "ordinary_adult" : `athlete_${activity.sportLevel}`;
}
