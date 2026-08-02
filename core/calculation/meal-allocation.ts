import { MEAL_RULE_IDS, MEAL_STRUCTURES } from "./meal-policy.ts";
import type { MealStructureId } from "./types.ts";

export interface DailyDisplayedMacros { energyKcal: number; proteinG: number; fatG: number; carbohydrateG: number }
export interface MealAllocation {
  mealId: string; displayLabel: string; weight: number;
  energyKcal: number; proteinG: number; fatG: number; carbohydrateG: number;
}
export interface MealAllocationTraceValue { raw: number[]; roundedBeforeReconciliation: number[]; residual: number }
export interface MealAllocationPlan {
  structureId: MealStructureId;
  meals: MealAllocation[];
  totals: DailyDisplayedMacros;
  trace: {
    totalWeight: number; reconciliationMealId: string;
    values: Record<keyof DailyDisplayedMacros, MealAllocationTraceValue>;
    ruleIds: string[];
  };
}

function roundRationalTiesToEven(numerator: bigint, denominator: bigint): bigint {
  const floor = numerator / denominator;
  const twice = (numerator % denominator) * BigInt(2);
  return twice < denominator ? floor : twice > denominator ? floor + BigInt(1) : floor % BigInt(2) === BigInt(0) ? floor : floor + BigInt(1);
}

function toUnits(value: number, scale: number): bigint {
  if (!Number.isFinite(value) || value < 0) throw new Error("invalid_daily_total");
  const scaled = value * scale;
  if (Math.abs(scaled - Math.round(scaled)) > 1e-8) throw new Error("daily_total_precision_unsupported");
  return BigInt(Math.round(scaled));
}

function allocateValue(total: number, weights: number[], reconciliationIndex: number, scale: number): MealAllocationTraceValue & { values: number[] } {
  const totalUnits = toUnits(total, scale);
  const totalWeight = BigInt(weights.reduce((sum, weight) => sum + weight, 0));
  const roundedUnits = weights.map((weight) => roundRationalTiesToEven(totalUnits * BigInt(weight), totalWeight));
  const before = roundedUnits.map((value) => Number(value) / scale);
  const otherSum = roundedUnits.reduce((sum, value, index) => index === reconciliationIndex ? sum : sum + value, BigInt(0));
  const reconciled = totalUnits - otherSum;
  if (reconciled < BigInt(0)) throw new Error("negative_reconciliation_value");
  const residualUnits = reconciled - roundedUnits[reconciliationIndex];
  roundedUnits[reconciliationIndex] = reconciled;
  return {
    raw: weights.map((weight) => total * weight / Number(totalWeight)),
    roundedBeforeReconciliation: before,
    residual: Number(residualUnits) / scale,
    values: roundedUnits.map((value) => Number(value) / scale),
  };
}

export function allocateDailyMacros(totals: DailyDisplayedMacros, structureId: MealStructureId): MealAllocationPlan {
  const structure = MEAL_STRUCTURES.find((item) => item.id === structureId);
  if (!structure) throw new Error("unsupported_meal_structure");
  const reconciliationIndex = structure.meals.findIndex((meal) => meal.mealId === structure.reconciliationMealId);
  if (reconciliationIndex < 0) throw new Error("reconciliation_meal_missing");
  const weights = structure.meals.map((meal) => meal.weight);
  const energy = allocateValue(totals.energyKcal, weights, reconciliationIndex, 1);
  const protein = allocateValue(totals.proteinG, weights, reconciliationIndex, 10);
  const fat = allocateValue(totals.fatG, weights, reconciliationIndex, 10);
  const carbohydrate = allocateValue(totals.carbohydrateG, weights, reconciliationIndex, 10);
  const meals = structure.meals.map((meal, index) => ({
    ...meal, energyKcal: energy.values[index], proteinG: protein.values[index], fatG: fat.values[index], carbohydrateG: carbohydrate.values[index],
  }));
  return {
    structureId, meals, totals: { ...totals },
    trace: {
      totalWeight: weights.reduce((sum, weight) => sum + weight, 0), reconciliationMealId: structure.reconciliationMealId,
      values: { energyKcal: energy, proteinG: protein, fatG: fat, carbohydrateG: carbohydrate }, ruleIds: [...MEAL_RULE_IDS],
    },
  };
}
