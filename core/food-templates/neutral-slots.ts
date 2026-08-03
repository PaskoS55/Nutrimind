import type { NeutralFoodGroupSlot } from "./types.ts";

export const FOOD_TEMPLATE_POLICY_IDS = [
  "FOOD_TEMPLATE.ABSTRACT_GROUPS_ONLY.001", "FOOD_TEMPLATE.NO_CONCRETE_FOODS.001",
  "FOOD_TEMPLATE.NO_PORTIONS.001", "FOOD_TEMPLATE.NO_MACRO_MATCH_CLAIM.001",
  "FOOD_TEMPLATE.RESTRICTIONS_REQUIRE_PRODUCT_CHECK.001", "FOOD_TEMPLATE.PHASE3A_NUMBERS_UNCHANGED.001",
  "FOOD_TEMPLATE.TIMING_INDEPENDENT.001", "FOOD_TEMPLATE.NOT_PERSONALIZED_SAFETY.001",
] as const;

const slots: readonly NeutralFoodGroupSlot[] = Object.freeze([
  Object.freeze({ id: "protein_source", label: "Источник белка", displayOrder: 1 }),
  Object.freeze({ id: "carbohydrate_source", label: "Источник углеводов", displayOrder: 2 }),
  Object.freeze({ id: "vegetables_fruit_berries", label: "Овощи, фрукты или ягоды", displayOrder: 3 }),
  Object.freeze({ id: "fat_source", label: "Источник жиров", displayOrder: 4 }),
]);

export function getNeutralFoodGroupSlots(): readonly NeutralFoodGroupSlot[] { return slots; }
