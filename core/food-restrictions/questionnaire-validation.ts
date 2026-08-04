import type { FoodAllergenCode, RawFoodAllergyStatus } from "./types.ts";

export const KNOWN_ALLERGEN_VALIDATION_MESSAGE = "Выберите хотя бы один аллерген из списка или измените ответ" as const;

export function validateQuestionnaireAllergenSelection(
  status: RawFoodAllergyStatus | "",
  codes: readonly FoodAllergenCode[],
): typeof KNOWN_ALLERGEN_VALIDATION_MESSAGE | null {
  return status === "known" && codes.length === 0 ? KNOWN_ALLERGEN_VALIDATION_MESSAGE : null;
}

export function changeQuestionnaireAllergyStatus(
  status: RawFoodAllergyStatus,
  codes: readonly FoodAllergenCode[],
): { foodAllergyStatus: RawFoodAllergyStatus; foodAllergenCodes: FoodAllergenCode[]; validationMessage: null } {
  return {
    foodAllergyStatus: status,
    foodAllergenCodes: status === "known" ? [...codes] : [],
    validationMessage: null,
  };
}
