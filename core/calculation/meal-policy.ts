import type { MealStructureDescriptor } from "./types.ts";

export const MEAL_POLICY_ID = "meal.phase3a1.v1" as const;
export const MEAL_RULE_IDS = [
  "MEAL.STRUCTURE.USER_SELECTION_REQUIRED.001",
  "MEAL.ALLOCATION.PROPORTIONAL.001",
  "MEAL.ALLOCATION.DAILY_TOTALS_UNCHANGED.001",
  "MEAL.ALLOCATION.RECONCILIATION.001",
  "MEAL.CONTEXT.DISPLAY_ONLY.001",
  "MEAL.SAFETY.NON_CALCULATED_NO_NUMBERS.001",
  "ROUND.MEAL.ENERGY.WHOLE.TIES_EVEN.001",
  "ROUND.MEAL.MACRO.ONE_DECIMAL.TIES_EVEN.001",
] as const;

export const MEAL_STRUCTURES: readonly MealStructureDescriptor[] = [
  {
    id: "three_meals", label: "Три приёма пищи", reconciliationMealId: "meal_3",
    meals: [
      { mealId: "meal_1", displayLabel: "Приём пищи 1", weight: 1 },
      { mealId: "meal_2", displayLabel: "Приём пищи 2", weight: 1 },
      { mealId: "meal_3", displayLabel: "Приём пищи 3", weight: 1 },
    ],
  },
  {
    id: "three_meals_plus_snack", label: "Три основных приёма и небольшой перекус", reconciliationMealId: "main_3",
    meals: [
      { mealId: "main_1", displayLabel: "Основной приём 1", weight: 3 },
      { mealId: "main_2", displayLabel: "Основной приём 2", weight: 3 },
      { mealId: "snack", displayLabel: "Перекус", weight: 1 },
      { mealId: "main_3", displayLabel: "Основной приём 3", weight: 3 },
    ],
  },
  {
    id: "four_occasions", label: "Четыре приёма пищи", reconciliationMealId: "meal_4",
    meals: [
      { mealId: "meal_1", displayLabel: "Приём пищи 1", weight: 1 },
      { mealId: "meal_2", displayLabel: "Приём пищи 2", weight: 1 },
      { mealId: "meal_3", displayLabel: "Приём пищи 3", weight: 1 },
      { mealId: "meal_4", displayLabel: "Приём пищи 4", weight: 1 },
    ],
  },
] as const;
