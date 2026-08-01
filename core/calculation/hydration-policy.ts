import type { BeverageIntakeBand, HydrationInputContext } from "./types.ts";

export const HYDRATION_POLICY_ID = "hydration.phase2d1.v1" as const;
export const HYDRATION_RULE_IDS = [
  "HYDRATION.BASELINE.EFSA.ADULT_TOTAL_WATER.001",
  "HYDRATION.INPUT.BEVERAGE_CONTEXT_ONLY.001",
  "HYDRATION.EXERCISE.GENERAL_RANGE.001",
  "HYDRATION.EXERCISE.NO_AUTOMATIC_SUM.001",
  "HYDRATION.EXERCISE.DOUBLE_DURATION_REQUIRED.001",
  "ROUND.FIFTY_ML.TIES_EVEN.001",
  "HYDRATION.SAFETY.NON_CALCULATED_NO_NUMBERS.001",
] as const;

const labels: Record<BeverageIntakeBand, HydrationInputContext["displayLabel"]> = {
  under_1_5_l: "До 1,5 л", between_1_5_and_2_l: "1,5–2 л", over_2_l: "Более 2 л", not_provided: "Не указано",
};

export function hydrationContext(band: BeverageIntakeBand): HydrationInputContext {
  return { beverageIntakeBand: band, displayLabel: labels[band], directlyComparableToBaseline: false };
}

export function roundToNearest50MlTiesToEven(value: number): number {
  const units = value / 50;
  const floor = Math.floor(units);
  const fraction = units - floor;
  if (Math.abs(fraction - 0.5) < 1e-10) return (floor % 2 === 0 ? floor : floor + 1) * 50;
  return Math.round(units) * 50;
}
