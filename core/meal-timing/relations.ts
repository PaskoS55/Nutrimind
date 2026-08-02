import { buildTrainingBoundaries } from "./boundaries.ts";
import type { TimingMealDescriptor, TrainingRelationView } from "./types.ts";

export function buildTrainingRelations(meals: readonly TimingMealDescriptor[], boundaryId: string): TrainingRelationView | null {
  const boundary = buildTrainingBoundaries(meals).find((item) => item.id === boundaryId);
  if (!boundary) return null;
  const last = meals.length;
  return {
    boundaryId,
    markerPosition: boundary.position,
    markerLabel: boundary.position === 0 ? "Тренировка до первого приёма" : boundary.position === last ? "Тренировка после последнего приёма" : "Тренировка проходит между этими приёмами",
    meals: meals.map((meal, index) => ({
      mealId: meal.mealId,
      label: index === boundary.position - 1 ? "Приём пищи перед тренировкой" : index === boundary.position ? "Следующий приём после тренировки" : "Обычный приём пищи",
    })),
  };
}
