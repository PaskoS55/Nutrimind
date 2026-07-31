import type { NormalizedCalculationInput, ReeResult } from "./types.ts";
import { mifflinStJeorFemale, mifflinStJeorMale, roundToNearest5Kcal } from "./ree-formula.ts";

export function calculateApprovedAdultRee(input: NormalizedCalculationInput): ReeResult {
  const d = input.demographics;
  if (d.ageGroup !== "adult" || d.ageYears < 18) throw new Error("REE_POPULATION_UNAPPROVED");
  if (![d.ageYears, d.heightCm, d.weightKg].every(Number.isFinite) || d.heightCm < 50 || d.heightCm > 250 || d.weightKg < 10 || d.weightKg > 500 || d.ageYears > 120)
    throw new Error("REE_INPUT_INVALID");
  const formulaId = d.sexForFormula === "male" ? "mifflin_st_jeor_adult_male" : "mifflin_st_jeor_adult_female";
  const values = { ageYears: d.ageYears, heightCm: d.heightCm, weightKg: d.weightKg };
  const raw = d.sexForFormula === "male" ? mifflinStJeorMale(values) : mifflinStJeorFemale(values);
  return { formulaId, inputs: { ...values, sexForFormula: d.sexForFormula, units: { height: "cm", weight: "kg" } }, unroundedKcalPerDay: raw, displayKcalPerDay: roundToNearest5Kcal(raw), roundingRuleId: "nearest_5_kcal" };
}
