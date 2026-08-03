export const FOOD_GROUP_SLOT_IDS = ["protein_source", "carbohydrate_source", "vegetables_fruit_berries", "fat_source"] as const;
export type FoodGroupSlotId = typeof FOOD_GROUP_SLOT_IDS[number];
export interface NeutralFoodGroupSlot { readonly id: FoodGroupSlotId; readonly label: string; readonly displayOrder: number }
