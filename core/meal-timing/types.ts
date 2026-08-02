export const PHASE3A2_CONTEXT_SCHEMA_VERSION = "nutrimind.phase3a2.context.v1" as const;
export const PHASE3A2_CONTEXT_STORAGE_KEY = "nutrimind.phase3a2.context" as const;

export type TrainingTimeContext = "morning" | "daytime" | "evening";
export type Phase3A2Context =
  | { schemaVersion: typeof PHASE3A2_CONTEXT_SCHEMA_VERSION; status: "available"; trainingTimeContext: TrainingTimeContext; displayLabel: "утром" | "днём" | "вечером" }
  | { schemaVersion: typeof PHASE3A2_CONTEXT_SCHEMA_VERSION; status: "not_provided" }
  | { schemaVersion: typeof PHASE3A2_CONTEXT_SCHEMA_VERSION; status: "unsupported"; errorCode: "QUESTIONNAIRE_UNSUPPORTED_TRAINING_TIME_VALUE" };

export interface TimingMealDescriptor { mealId: string; displayLabel: string }
export interface TrainingBoundary { id: string; position: number; label: string }
export type MealRelationLabel = "Обычный приём пищи" | "Приём пищи перед тренировкой" | "Следующий приём после тренировки";
export interface MealRelation { mealId: string; label: MealRelationLabel }
export interface TrainingRelationView {
  boundaryId: string;
  markerPosition: number;
  markerLabel: "Тренировка до первого приёма" | "Тренировка проходит между этими приёмами" | "Тренировка после последнего приёма";
  meals: MealRelation[];
}
