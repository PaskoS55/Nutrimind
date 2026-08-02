import assert from "node:assert/strict";
import test from "node:test";
import {
  MEAL_STRUCTURES, PHASE3A_RESULT_SCHEMA_VERSION, allocateDailyMacros,
  isCompatiblePhase3APayload, normalizeCurrentMealPattern, runPhase3A,
  runQuestionnairePipeline,
} from "../core/index.ts";

const answers = (changes = {}) => ({
  selections: [1, 0, 0, 3, 1, 0, 0, 1, 1], userType: "general_user", ageGroup: "adult",
  goal: "maintenance", dailyActivity: "mostly_sitting", ageYears: 30, sexForFormula: "female",
  heightCm: 170, weightKg: 65, informationalConsent: true, ...changes,
});
const parent = (changes = {}) => runQuestionnairePipeline(answers(changes));
const sumUnits = (meals, key, scale) => meals.reduce((sum, meal) => sum + Math.round(meal[key] * scale), 0);
const forbiddenNumericNutrition = (value) => /energyKcal|proteinG|fatG|carbohydrateG|totalWaterMl|lowerMl|upperMl/.test(JSON.stringify(value));

test("approved meal structures and weights are exact and equally available", () => {
  assert.deepEqual(MEAL_STRUCTURES.map(({ id, meals, reconciliationMealId }) => ({ id, weights: meals.map((meal) => meal.weight), reconciliationMealId })), [
    { id: "three_meals", weights: [1, 1, 1], reconciliationMealId: "meal_3" },
    { id: "three_meals_plus_snack", weights: [3, 3, 1, 3], reconciliationMealId: "main_3" },
    { id: "four_occasions", weights: [1, 1, 1, 1], reconciliationMealId: "meal_4" },
  ]);
});

test("all three structures reconcile every displayed daily total exactly", () => {
  const totals = { energyKcal: 2347, proteinG: 123.7, fatG: 78.4, carbohydrateG: 287.9 };
  for (const structure of MEAL_STRUCTURES) {
    const plan = allocateDailyMacros(totals, structure.id);
    assert.equal(sumUnits(plan.meals, "energyKcal", 1), totals.energyKcal);
    assert.equal(sumUnits(plan.meals, "proteinG", 10), Math.round(totals.proteinG * 10));
    assert.equal(sumUnits(plan.meals, "fatG", 10), Math.round(totals.fatG * 10));
    assert.equal(sumUnits(plan.meals, "carbohydrateG", 10), Math.round(totals.carbohydrateG * 10));
    assert.ok(plan.meals.every((meal) => Object.values(meal).every((value) => typeof value !== "number" || value >= 0)));
  }
});

test("ties round to even before deterministic reconciliation", () => {
  const plan = allocateDailyMacros({ energyKcal: 10, proteinG: 1, fatG: 1, carbohydrateG: 1 }, "four_occasions");
  assert.deepEqual(plan.trace.values.energyKcal.roundedBeforeReconciliation, [2, 2, 2, 2]);
  assert.deepEqual(plan.trace.values.proteinG.roundedBeforeReconciliation, [0.2, 0.2, 0.2, 0.2]);
  assert.deepEqual(plan.meals.map((meal) => meal.energyKcal), [2, 2, 2, 4]);
  assert.deepEqual(plan.meals.map((meal) => meal.proteinG), [0.2, 0.2, 0.2, 0.4]);
});

test("snack is proportional and never receives reconciliation residual", () => {
  const plan = allocateDailyMacros({ energyKcal: 2001, proteinG: 100.1, fatG: 70.1, carbohydrateG: 250.1 }, "three_meals_plus_snack");
  assert.equal(plan.trace.reconciliationMealId, "main_3");
  assert.notEqual(plan.trace.reconciliationMealId, "snack");
  assert.equal(plan.meals.find((meal) => meal.mealId === "snack").weight, 1);
});

test("unsupported or over-precise totals fail instead of guessing", () => {
  assert.throws(() => allocateDailyMacros({ energyKcal: -1, proteinG: 1, fatG: 1, carbohydrateG: 1 }, "three_meals"), /invalid_daily_total/);
  assert.throws(() => allocateDailyMacros({ energyKcal: 1.5, proteinG: 1, fatG: 1, carbohydrateG: 1 }, "three_meals"), /daily_total_precision_unsupported/);
  assert.throws(() => allocateDailyMacros({ energyKcal: 1, proteinG: 1.11, fatG: 1, carbohydrateG: 1 }, "three_meals"), /daily_total_precision_unsupported/);
});

test("current production meal-pattern indices normalize without judging or selecting structure", () => {
  assert.deepEqual([0, 1, 2].map((value) => normalizeCurrentMealPattern(value)), [
    { ok: true, context: { currentMealPattern: "one_or_two" } },
    { ok: true, context: { currentMealPattern: "three" } },
    { ok: true, context: { currentMealPattern: "four_or_more" } },
  ]);
  assert.deepEqual(normalizeCurrentMealPattern(undefined), { ok: true, context: { currentMealPattern: "not_provided" } });
});

test("unknown non-empty meal pattern fails closed without nutrition numbers", () => {
  const result = runPhase3A(parent(), normalizeCurrentMealPattern(9));
  assert.equal(result.status, "invalid_input");
  assert.equal(result.issues[0].code, "QUESTIONNAIRE_UNSUPPORTED_MEAL_PATTERN_VALUE");
  assert.equal(forbiddenNumericNutrition(result), false);
});

test("calculated Phase3A preserves its Phase2D1 parent byte-for-byte", () => {
  const phase2d1 = parent(); const before = JSON.stringify(phase2d1);
  const result = runPhase3A(phase2d1, normalizeCurrentMealPattern(1));
  assert.equal(result.status, "calculated");
  assert.equal(result.schemaVersion, PHASE3A_RESULT_SCHEMA_VERSION);
  assert.equal(JSON.stringify(result.parent), before);
  assert.equal(JSON.stringify(phase2d1), before);
  assert.equal(Object.hasOwn(result, "selectedStructure"), false);
  assert.equal(Object.hasOwn(result, "mealAllocations"), false);
});

test("every available day and lower central upper scenario allocates exactly", () => {
  for (const profile of [
    answers(),
    answers({ dailyActivity: "fitness_2_4_week" }),
    answers({ selections: [0,0,0,3,1,0,0,1,1], userType: "athlete", dailyActivity: undefined, sportLevel: "amateur", sessionsPerWeek: "3_4", typicalSessionMinutes: 60, doubleTrainingDays: false }),
    answers({ selections: [0,0,0,3,1,0,0,1,1], userType: "athlete", dailyActivity: undefined, sportLevel: "competitive", sessionsPerWeek: "5_6", typicalSessionMinutes: 90, doubleTrainingDays: true }),
    answers({ selections: [0,0,0,3,1,0,0,1,1], userType: "athlete", dailyActivity: undefined, sportLevel: "professional", sessionsPerWeek: "7_plus", typicalSessionMinutes: 120, doubleTrainingDays: true, goal: "performance_recovery" }),
  ]) {
    const phase3a = runPhase3A(runQuestionnairePipeline(profile), normalizeCurrentMealPattern(profile.selections[4]));
    assert.equal(phase3a.status, "calculated");
    for (const day of phase3a.parent.phase2c2.scenarios) for (const scenario of day.macroScenarios) {
      assert.equal(scenario.status, "calculated");
      const plan = allocateDailyMacros(scenario, "three_meals");
      assert.equal(sumUnits(plan.meals, "energyKcal", 1), scenario.energyKcal);
      assert.equal(sumUnits(plan.meals, "proteinG", 10), Math.round(scenario.proteinG * 10));
      assert.equal(sumUnits(plan.meals, "fatG", 10), Math.round(scenario.fatG * 10));
      assert.equal(sumUnits(plan.meals, "carbohydrateG", 10), Math.round(scenario.carbohydrateG * 10));
    }
  }
});

test("goal and athlete level do not alter allocation for identical totals", () => {
  const totals = { energyKcal: 2000, proteinG: 120, fatG: 70, carbohydrateG: 222.5 };
  const expected = allocateDailyMacros(totals, "three_meals_plus_snack");
  for (const _context of ["weight_loss", "maintenance", "muscle_gain", "performance_recovery", "habits_wellbeing", "amateur", "competitive", "professional"]) assert.deepEqual(allocateDailyMacros(totals, "three_meals_plus_snack"), expected);
});

test("missing and all non-calculated parents remain number-free", () => {
  const missing = runPhase3A(null, normalizeCurrentMealPattern(1));
  assert.equal(missing.status, "invalid_input");
  const statuses = ["minor_suppressed", "blocked", "specialist_review", "invalid_input"];
  for (const status of statuses) {
    const result = runPhase3A({ status, versions: { surveySpecVersion: "x", calculationCoreVersion: "0.1.1-draft" }, schemaVersion: "nutrimind.phase2d1.result.v1", engineVersion: "0.1.1-draft", issues: [], nextStepCode: "SAFE", trace: [] }, normalizeCurrentMealPattern(1));
    assert.equal(result.status, status);
    assert.equal(forbiddenNumericNutrition(result), false);
    assert.equal(Object.hasOwn(result, "parent"), false);
  }
});

test("Phase3A runtime validator accepts exact schema and rejects old or malformed payloads", () => {
  const valid = runPhase3A(parent(), normalizeCurrentMealPattern(1));
  assert.equal(isCompatiblePhase3APayload(valid), true);
  assert.equal(isCompatiblePhase3APayload({ ...valid, schemaVersion: "nutrimind.phase3a.result.v0" }), false);
  assert.equal(isCompatiblePhase3APayload({ ...valid, availableMealStructures: [] }), false);
  assert.equal(isCompatiblePhase3APayload({ ...valid, normalizedMealContext: { currentMealPattern: "legacy" } }), false);
});

test("Phase3A contract contains no product supplement training-relative or journal fields", () => {
  const serialized = JSON.stringify(runPhase3A(parent(), normalizeCurrentMealPattern(1)));
  assert.doesNotMatch(serialized, /product|supplement|pre.?workout|post.?workout|relationToTraining|calibrationJournal|indexedDB/i);
});
