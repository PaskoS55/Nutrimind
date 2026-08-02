import type { TimingMealDescriptor, TrainingBoundary } from "./types.ts";

function genitive(label: string): string {
  if (label === "Перекус") return "перекуса";
  if (label.startsWith("Основной приём ")) return label.replace("Основной приём ", "основного приёма ");
  if (label.startsWith("Приём пищи ")) return label.replace("Приём пищи ", "приёма пищи ");
  return label.toLocaleLowerCase("ru-RU");
}

function instrumental(label: string): string {
  if (label === "Перекус") return "перекусом";
  if (label.startsWith("Основной приём ")) return label.replace("Основной приём ", "основным приёмом ");
  if (label.startsWith("Приём пищи ")) return label.replace("Приём пищи ", "приёмом пищи ");
  return label.toLocaleLowerCase("ru-RU");
}

export function buildTrainingBoundaries(meals: readonly TimingMealDescriptor[]): TrainingBoundary[] {
  if (meals.length === 0) return [];
  return Array.from({ length: meals.length + 1 }, (_, position) => {
    if (position === 0) return { id: "boundary_0", position, label: `Тренировка до ${genitive(meals[0].displayLabel)}` };
    if (position === meals.length) return { id: `boundary_${position}`, position, label: `Тренировка после ${genitive(meals[position - 1].displayLabel)}` };
    return { id: `boundary_${position}`, position, label: `Тренировка между ${instrumental(meals[position - 1].displayLabel)} и ${instrumental(meals[position].displayLabel)}` };
  });
}
