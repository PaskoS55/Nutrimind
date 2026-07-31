import { validateSurveyInput } from "./validation.ts";
import { CALCULATION_CORE_VERSION, runPhase2B, type Phase2BResult, type TraceValue } from "./calculation/index.ts";

export const QUESTIONNAIRE_SECTION_TITLES = [
  "Профиль", "Исходные данные", "Спорт и цель", "Безопасность", "Текущее питание",
  "Режим вокруг нагрузки", "Самочувствие", "Гидратация", "Анализы и контекст",
] as const;

export const QUESTIONNAIRE_GOALS = [
  "weight_loss", "maintenance", "muscle_gain", "performance_recovery", "habits_wellbeing",
] as const;
export const QUESTIONNAIRE_FIELD_SECTION = {
  userType: 1, ageGroup: 1, ageYears: 2, sexForFormula: 2, heightCm: 2, weightKg: 2, guardianRole: 2,
  goal: 3, sportType: 3, sportLevel: 3, sessionsPerWeek: 3, typicalSessionMinutes: 3, doubleTrainingDays: 3, dailyActivity: 3,
} as const;
export type QuestionnaireGoal = typeof QUESTIONNAIRE_GOALS[number];

export interface QuestionnaireAnswers {
  selections: number[];
  userType?: "athlete" | "general_user";
  ageGroup?: "adult" | "minor";
  guardianRole?: "parent" | "legal_guardian" | "athlete_with_parent";
  goal?: QuestionnaireGoal;
  sportType?: string;
  sportLevel?: "professional" | "competitive" | "amateur";
  sessionsPerWeek?: "1_2" | "3_4" | "5_6" | "7_plus";
  typicalSessionMinutes?: number;
  doubleTrainingDays?: boolean;
  dailyActivity?: "low" | "moderate" | "high";
  ageYears?: number; sexForFormula?: "female" | "male"; heightCm?: number; weightKg?: number;
  informationalConsent?: boolean;
}

export function adaptQuestionnaireAnswers(raw: QuestionnaireAnswers) {
  const athlete = (raw.userType ?? (raw.selections[0] === 0 ? "athlete" : "general_user")) === "athlete";
  const ageGroup = raw.ageGroup ?? (typeof raw.ageYears === "number" && raw.ageYears < 18 ? "minor" : "adult");
  const restriction = raw.selections[3];
  const input = {
    surveySpecVersion: "0.1.1-draft", userType: athlete ? "athlete" : "general_user",
    ageGroup,
    ageYears: raw.ageYears, sexForFormula: raw.sexForFormula, heightCm: raw.heightCm, weightKg: raw.weightKg,
    ...(ageGroup === "minor" ? { guardianRole: raw.guardianRole } : {}),
    ...(athlete ? { sportLevel: raw.sportLevel, sessionsPerWeek: raw.sessionsPerWeek, typicalSessionMinutes: raw.typicalSessionMinutes } : { dailyActivity: raw.dailyActivity }),
    allergies: restriction === 0 ? ["other"] : ["none"],
    ...(restriction === 0 ? { otherAllergy: "неуточнённый аллерген" } : {}),
    intolerances: restriction === 1 ? ["other"] : ["none"],
    medicalRestrictions: restriction === 2 ? ["celiac"] : ["none"],
    availableLabs: raw.selections[8] === 0 ? ["numeric_results_declared"] : ["none_recent"],
    informationalConsent: raw.informationalConsent,
  };
  return { raw, validation: validateSurveyInput(input) };
}

export function runQuestionnairePipeline(raw: QuestionnaireAnswers): Phase2BResult {
  const adapted = adaptQuestionnaireAnswers(raw);
  return runPhase2B(adapted.validation, {
    calculationCoreVersion: CALCULATION_CORE_VERSION, scope: "ree",
    activity: { vocabulary: "survey", value: (raw.selections[3] ?? null) as TraceValue },
    goal: { vocabulary: "survey", value: (raw.goal ?? null) as TraceValue },
  });
}
