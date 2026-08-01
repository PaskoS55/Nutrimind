import { validateSurveyInput } from "./validation.ts";
import { CALCULATION_CORE_VERSION, ORDINARY_ACTIVITIES, hydrationContext, runPhase2C2, runPhase2D1, type BeverageIntakeBand, type OrdinaryActivity, type Phase2D1Result } from "./calculation/index.ts";

export const QUESTIONNAIRE_SECTION_TITLES = [
  "Профиль", "Исходные данные", "Спорт и цель", "Безопасность", "Текущее питание",
  "Режим вокруг нагрузки", "Самочувствие", "Гидратация", "Анализы и контекст",
] as const;
export const QUESTIONNAIRE_GOALS = ["weight_loss", "maintenance", "muscle_gain", "performance_recovery", "habits_wellbeing"] as const;
export const QUESTIONNAIRE_FIELD_SECTION = { userType: 1, ageGroup: 1, ageYears: 2, sexForFormula: 2, heightCm: 2, weightKg: 2, guardianRole: 2, goal: 3, sportType: 3, sportLevel: 3, sessionsPerWeek: 3, typicalSessionMinutes: 3, doubleTrainingDays: 3, dailyActivity: 3 } as const;
export type QuestionnaireGoal = typeof QUESTIONNAIRE_GOALS[number];
export { ORDINARY_ACTIVITIES };

export interface QuestionnaireAnswers {
  selections: number[];
  userType?: "athlete" | "general_user"; ageGroup?: "adult" | "minor";
  guardianRole?: "parent" | "legal_guardian" | "athlete_with_parent"; goal?: QuestionnaireGoal;
  sportType?: string; sportLevel?: "professional" | "competitive" | "amateur";
  sessionsPerWeek?: "1_2" | "3_4" | "5_6" | "7_plus"; typicalSessionMinutes?: number;
  doubleTrainingDays?: boolean; dailyActivity?: OrdinaryActivity | "low" | "moderate" | "high";
  ageYears?: number; sexForFormula?: "female" | "male"; heightCm?: number; weightKg?: number; informationalConsent?: boolean;
}

export function adaptQuestionnaireAnswers(raw: QuestionnaireAnswers) {
  const athlete = (raw.userType ?? (raw.selections[0] === 0 ? "athlete" : "general_user")) === "athlete";
  const ageGroup = raw.ageGroup ?? (typeof raw.ageYears === "number" && raw.ageYears < 18 ? "minor" : "adult");
  const restriction = raw.selections[3];
  const input = {
    surveySpecVersion: "0.1.1-draft", userType: athlete ? "athlete" : "general_user", ageGroup,
    ageYears: raw.ageYears, sexForFormula: raw.sexForFormula, heightCm: raw.heightCm, weightKg: raw.weightKg,
    ...(ageGroup === "minor" ? { guardianRole: raw.guardianRole } : {}),
    ...(athlete ? { sportLevel: raw.sportLevel, sessionsPerWeek: raw.sessionsPerWeek, typicalSessionMinutes: raw.typicalSessionMinutes, doubleTrainingDays: raw.doubleTrainingDays } : { dailyActivity: raw.dailyActivity }),
    allergies: restriction === 0 ? ["other"] : ["none"], ...(restriction === 0 ? { otherAllergy: "неуточнённый аллерген" } : {}),
    intolerances: restriction === 1 ? ["other"] : ["none"], medicalRestrictions: restriction === 2 ? ["celiac"] : ["none"],
    availableLabs: raw.selections[8] === 0 ? ["numeric_results_declared"] : ["none_recent"], informationalConsent: raw.informationalConsent,
  };
  return { raw, validation: validateSurveyInput(input) };
}

const hydrationBands: Record<number, Exclude<BeverageIntakeBand, "not_provided">> = { 0: "under_1_5_l", 1: "between_1_5_and_2_l", 2: "over_2_l" };

export function runQuestionnairePipeline(raw: QuestionnaireAnswers): Phase2D1Result {
  const adapted = adaptQuestionnaireAnswers(raw);
  const athlete = raw.userType === "athlete";
  const activity = athlete ? { kind: "athlete" as const, sportLevel: raw.sportLevel!, typicalSessionMinutes: raw.typicalSessionMinutes!, sessionsPerWeek: raw.sessionsPerWeek, doubleTrainingDays: raw.doubleTrainingDays, dayType: "training" as const } : { kind: "general_user" as const, dailyActivity: raw.dailyActivity as OrdinaryActivity, dayType: "rest" as const };
  const phase2c2 = runPhase2C2(adapted.validation, { calculationCoreVersion: CALCULATION_CORE_VERSION, activity: { vocabulary: "phase_2_canonical", value: activity, sourceValue: { audience: raw.userType ?? null, activity: raw.dailyActivity ?? null, level: raw.sportLevel ?? null, sessionDurationMin: raw.typicalSessionMinutes ?? null, sessionsPerWeek: raw.sessionsPerWeek ?? null, doubleDays: raw.doubleTrainingDays ?? null } }, goal: { vocabulary: "phase_2_canonical", value: raw.goal!, sourceValue: raw.goal ?? null } });
  const hydrationSelection = raw.selections[7];
  if (hydrationSelection !== undefined && !Object.hasOwn(hydrationBands, hydrationSelection)) return runPhase2D1(phase2c2, { unsupportedHydrationValue: hydrationSelection });
  const band = hydrationSelection === undefined ? "not_provided" : hydrationBands[hydrationSelection];
  return runPhase2D1(phase2c2, { hydrationInputContext: hydrationContext(band), athlete, trainingDurationMinutes: athlete ? raw.typicalSessionMinutes : undefined, doubleTrainingDay: athlete && raw.doubleTrainingDays === true });
}
