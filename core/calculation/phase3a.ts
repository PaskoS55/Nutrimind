import { MEAL_POLICY_ID, MEAL_RULE_IDS, MEAL_STRUCTURES } from "./meal-policy.ts";
import { PHASE3A_RESULT_SCHEMA_VERSION, type CalculationIssue, type NormalizedMealContext, type Phase2D1Result, type Phase3AResult } from "./types.ts";

export const MEAL_PATTERN_VALUES = ["one_or_two", "three", "four_or_more", "not_provided"] as const;

export function normalizeCurrentMealPattern(value: unknown): { ok: true; context: NormalizedMealContext } | { ok: false; issue: CalculationIssue } {
  if (value === undefined || value === null || value === "") return { ok: true, context: { currentMealPattern: "not_provided" } };
  const mapped = value === 0 ? "one_or_two" : value === 1 ? "three" : value === 2 ? "four_or_more" : null;
  if (mapped) return { ok: true, context: { currentMealPattern: mapped } };
  return { ok: false, issue: { code: "QUESTIONNAIRE_UNSUPPORTED_MEAL_PATTERN_VALUE" as CalculationIssue["code"], severity: "error", stage: "normalization", path: "selections[4]", message: "Unsupported current meal pattern; complete the questionnaire again.", ruleId: "MEAL.CONTEXT.FAIL_CLOSED.001" } };
}

export function runPhase3A(parent: Phase2D1Result | null | undefined, normalized: ReturnType<typeof normalizeCurrentMealPattern>): Phase3AResult {
  const base = { schemaVersion: PHASE3A_RESULT_SCHEMA_VERSION, issues: [] as CalculationIssue[] };
  if (!parent) return { ...base, status: "invalid_input", nextStepCode: "COMPLETE_QUESTIONNAIRE" };
  if (!normalized.ok) return { ...base, status: "invalid_input", issues: [normalized.issue], nextStepCode: "CORRECT_QUESTIONNAIRE" };
  if (parent.status !== "calculated") return { ...base, status: parent.status, issues: [...parent.issues], nextStepCode: parent.nextStepCode };
  return {
    ...base, status: "calculated", parent, normalizedMealContext: normalized.context,
    availableMealStructures: MEAL_STRUCTURES.map((structure) => ({ ...structure, meals: structure.meals.map((meal) => ({ ...meal })) })),
    appliedPolicy: { policyId: MEAL_POLICY_ID, ruleIds: [...MEAL_RULE_IDS] }, warnings: [], nextStepCode: "SELECT_MEAL_DISTRIBUTION",
  };
}
