import type { EaeuUmbrellaId, FoodAllergenCode, PresentationGroupId } from "./types.ts";
import { ALLERGEN_TAXONOMY_VERSION } from "./types.ts";

export const PRESENTATION_GROUPS: readonly { id: PresentationGroupId; label: string; order: number; allergenCodes: readonly FoodAllergenCode[] }[] = [
  { id: "gluten_cereals", label: "Злаки, содержащие глютен", order: 1, allergenCodes: ["wheat", "rye", "barley", "oats", "other_gluten_cereal"] },
  { id: "nuts_peanuts_sesame", label: "Орехи, арахис и кунжут", order: 2, allergenCodes: ["tree_nuts", "peanuts", "sesame"] },
  { id: "fish_and_seafood", label: "Рыба и морепродукты", order: 3, allergenCodes: ["fish", "crustaceans", "molluscs"] },
  { id: "milk_and_eggs", label: "Молоко и яйца", order: 4, allergenCodes: ["milk", "eggs"] },
  { id: "other_allergens", label: "Другие аллергены", order: 5, allergenCodes: ["soybeans", "celery", "mustard", "lupin"] },
] as const;

const labels: Record<FoodAllergenCode, string> = {
  wheat: "Пшеница", rye: "Рожь", barley: "Ячмень", oats: "Овёс",
  other_gluten_cereal: "Другой злак, содержащий глютен", tree_nuts: "Орехи",
  peanuts: "Арахис", sesame: "Кунжут", fish: "Рыба", crustaceans: "Ракообразные",
  molluscs: "Моллюски", milk: "Молоко", eggs: "Яйца", soybeans: "Соя",
  celery: "Сельдерей", mustard: "Горчица", lupin: "Люпин",
};
const umbrella: Record<FoodAllergenCode, EaeuUmbrellaId> = {
  wheat: "eaeu_gluten_cereals", rye: "eaeu_gluten_cereals", barley: "eaeu_gluten_cereals",
  oats: "eaeu_gluten_cereals", other_gluten_cereal: "eaeu_gluten_cereals",
  tree_nuts: "eaeu_tree_nuts", peanuts: "eaeu_peanuts", sesame: "eaeu_sesame",
  fish: "eaeu_fish", crustaceans: "eaeu_crustaceans", molluscs: "eaeu_molluscs",
  milk: "eaeu_milk", eggs: "eaeu_eggs", soybeans: "eaeu_soybeans", celery: "eaeu_celery",
  mustard: "eaeu_mustard", lupin: "eaeu_lupin",
};

export const ALLERGEN_CODES = PRESENTATION_GROUPS.flatMap((group) => group.allergenCodes) as FoodAllergenCode[];
export const ALLERGEN_TAXONOMY = ALLERGEN_CODES.map((code, index) => {
  const group = PRESENTATION_GROUPS.find((candidate) => candidate.allergenCodes.includes(code))!;
  return { taxonomyVersion: ALLERGEN_TAXONOMY_VERSION, code, label: labels[code], displayOrder: index + 1, presentationGroupId: group.id, eaeuUmbrellaId: umbrella[code] } as const;
});
export const isFoodAllergenCode = (value: string): value is FoodAllergenCode => ALLERGEN_CODES.includes(value as FoodAllergenCode);
