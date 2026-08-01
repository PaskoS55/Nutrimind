import assert from "node:assert/strict";
import test from "node:test";
import { FAT_COEFFICIENTS, MACRO_ENERGY_FACTORS, MACRO_SCENARIO_IDS, ORDINARY_ACTIVITIES, PHASE2C2_RESULT_SCHEMA_VERSION, PROTEIN_COEFFICIENTS, QUESTIONNAIRE_FIELD_SECTION, QUESTIONNAIRE_GOALS, QUESTIONNAIRE_SECTION_TITLES, athleteDurationModifier, buildMacroScenarios, buildPalScenarios, calculateEnergyStart, clampAndRoundPal, evaluateSafety, isCompatiblePhase2C2Payload, roundToNearest50TiesToEven, roundToOneDecimalTiesToEven, runPhase2A, runPhase2B, runQuestionnairePipeline, validateSurveyInput } from "../core/index.ts";

const adult = (changes = {}) => ({
  surveySpecVersion: "0.1.1-draft", userType: "general_user", ageGroup: "adult",
  ageYears: 30, sexForFormula: "female", heightCm: 170, weightKg: 65,
  dailyActivity: "mostly_sitting", allergies: ["none"], intolerances: ["none"],
  medicalRestrictions: ["none"], informationalConsent: true,
  safetyScreening: { pregnancy: "not_applicable", breastfeeding: "not_applicable", eatingDisorderRisk: "no", restrictiveOrCompensatoryPractices: false },
  ...changes,
});

const assess = (input) => {
  const validation = validateSurveyInput(input);
  return { validation, eligibility: evaluateSafety(validation) };
};

const phase2Request = (changes = {}) => ({
  calculationCoreVersion: "0.1.1-draft",
  activity: {
    vocabulary: "phase_2_canonical",
    value: { kind: "general_user", dailyActivity: "mostly_sitting", dayType: "rest" },
    sourceValue: { dailyActivity: "mostly_sitting", suppliedBy: "caller" },
  },
  goal: { vocabulary: "phase_2_canonical", value: "maintenance", sourceValue: "balance_nutrition" },
  ...changes,
});

const phase2 = (survey = adult(), request = phase2Request()) =>
  runPhase2A({ validation: validateSurveyInput(survey), request });

test("valid adult input is normalized and eligible", () => {
  const { validation, eligibility } = assess(adult());
  assert.equal(validation.valid, true);
  assert.equal(validation.profile.isMinor, false);
  assert.equal(eligibility.status, "eligible");
  assert.equal(eligibility.medicalGateway, "allowed");
  assert.equal(eligibility.capabilities.automaticEnergyReduction, false);
  assert.equal(eligibility.capabilities.diagnosisStatements, false);
});

test("non-object and missing inputs return structured errors", () => {
  assert.deepEqual(validateSurveyInput(null).errors[0], { code: "INPUT_NOT_OBJECT", path: "$", message: "Survey input must be an object.", severity: "error" });
  const result = validateSurveyInput({});
  assert.equal(result.valid, false);
  assert.ok(result.errors.every((issue) => issue.code && issue.path && issue.severity === "error"));
});

test("numeric anthropometry rejects NaN, infinity and out-of-range values", () => {
  for (const value of [NaN, Infinity, 0, 501]) {
    const result = validateSurveyInput(adult({ weightKg: value }));
    assert.ok(result.errors.some((issue) => issue.code === "INVALID_NUMBER" && issue.path === "weightKg"));
  }
});

test("unsupported contract version is rejected", () => {
  assert.ok(validateSurveyInput(adult({ surveySpecVersion: "0.1.0" })).errors.some((x) => x.code === "UNSUPPORTED_SURVEY_VERSION"));
});

test("none conflicts are errors and never silently normalized", () => {
  for (const field of ["allergies", "intolerances", "medicalRestrictions"]) {
    const result = validateSurveyInput(adult({ [field]: ["none", field === "allergies" ? "peanut" : "other"] }));
    assert.ok(result.errors.some((x) => x.code === "SURVEY_CONFLICT_NONE_WITH_VALUE" && x.path === field));
  }
});

test("empty safety multi-answers and declined consent are rejected", () => {
  assert.ok(validateSurveyInput(adult({ allergies: [] })).errors.some((x) => x.code === "INVALID_VALUE" && x.path === "allergies"));
  assert.ok(validateSurveyInput(adult({ informationalConsent: false })).errors.some((x) => x.code === "CONSENT_REQUIRED"));
});

test("minor requires a guardian and receives no numeric KBJU or portioned menu", () => {
  const missingGuardian = assess(adult({ ageGroup: "minor", ageYears: 15 }));
  assert.ok(missingGuardian.validation.errors.some((x) => x.code === "GUARDIAN_REQUIRED"));
  const { eligibility } = assess(adult({ ageGroup: "minor", ageYears: 15, guardianRole: "athlete_with_parent" }));
  assert.equal(eligibility.capabilities.numericKbju, false);
  assert.equal(eligibility.capabilities.portionedMenus, false);
  assert.ok(eligibility.safetyFlags.includes("minor"));
});

test("age group and age cannot contradict each other", () => {
  assert.ok(validateSurveyInput(adult({ ageGroup: "adult", ageYears: 15 })).errors.some((x) => x.code === "AGE_GROUP_MISMATCH"));
});

test("branch-specific required fields are validated", () => {
  assert.ok(validateSurveyInput(adult({ dailyActivity: undefined })).errors.some((x) => x.code === "GENERAL_BRANCH_INCOMPLETE"));
  const athlete = adult({ userType: "athlete", dailyActivity: undefined });
  assert.ok(validateSurveyInput(athlete).errors.some((x) => x.code === "ATHLETE_BRANCH_INCOMPLETE"));
  assert.equal(validateSurveyInput({ ...athlete, sportLevel: "amateur", sessionsPerWeek: "3_4", typicalSessionMinutes: 60 }).valid, true);
});

test("allergies become hard exclusions", () => {
  const { eligibility } = assess(adult({ allergies: ["peanut", "sesame"] }));
  assert.deepEqual(eligibility.hardExcludedAllergens, ["peanut", "sesame"]);
  assert.ok(eligibility.safetyFlags.includes("allergy_hard_exclusions"));
});

test("unresolved other allergy blocks food recommendations and menus", () => {
  const { validation, eligibility } = assess(adult({ allergies: ["other"], otherAllergy: "неизвестный компонент" }));
  assert.equal(validation.valid, true);
  assert.ok(validation.warnings.some((x) => x.code === "ALLERGY_UNRESOLVED"));
  assert.equal(eligibility.capabilities.foodRecommendations, false);
  assert.equal(eligibility.capabilities.portionedMenus, false);
});

test("other allergy description is required", () => {
  assert.ok(validateSurveyInput(adult({ allergies: ["other"] })).errors.some((x) => x.code === "OTHER_ALLERGY_DETAILS_REQUIRED"));
});

test("normalized other allergy is a hard exclusion", () => {
  const { eligibility } = assess(adult({ allergies: ["other"], otherAllergy: "горчица", normalizedOtherAllergyCode: "mustard" }));
  assert.equal(eligibility.capabilities.foodRecommendations, true);
  assert.ok(eligibility.hardExcludedAllergens.includes("mustard"));
});

test("celiac disease enables strict gluten-free and cross-contact exclusions", () => {
  const { eligibility } = assess(adult({ medicalRestrictions: ["celiac"] }));
  assert.equal(eligibility.medicalGateway, "specialist_review");
  assert.ok(eligibility.safetyFlags.includes("strict_gluten_free"));
  assert.ok(eligibility.hardExcludedAllergens.includes("gluten_cross_contact"));
});

test("each medical restriction requires specialist review", () => {
  for (const restriction of ["carbohydrate_metabolism", "kidney", "gastrointestinal", "lipid_metabolism", "high_blood_pressure", "other"]) {
    const { eligibility } = assess(adult({ medicalRestrictions: [restriction] }));
    assert.equal(eligibility.medicalGateway, "specialist_review");
    assert.equal(eligibility.capabilities.numericKbju, false);
  }
});

test("medical gateway exposes at least allowed, blocked and specialist_review", () => {
  const states = new Set([
    assess(adult()).eligibility.medicalGateway,
    assess(adult({ medicalRestrictions: ["kidney"] })).eligibility.medicalGateway,
    assess(adult({ safetyScreening: { pregnancy: "yes", breastfeeding: "not_applicable", eatingDisorderRisk: "no", restrictiveOrCompensatoryPractices: false } })).eligibility.medicalGateway,
  ]);
  assert.deepEqual([...states].sort(), ["allowed", "blocked", "specialist_review"]);
});

test("pregnancy yes or uncertain blocks personalized output", () => {
  for (const pregnancy of ["yes", "uncertain"]) {
    const { eligibility } = assess(adult({ safetyScreening: { pregnancy, breastfeeding: "not_applicable", eatingDisorderRisk: "no", restrictiveOrCompensatoryPractices: false } }));
    assert.equal(eligibility.status, "blocked");
    assert.equal(eligibility.capabilities.numericKbju, false);
    assert.equal(eligibility.capabilities.foodRecommendations, false);
  }
});

test("breastfeeding blocks personalized output", () => {
  const { eligibility } = assess(adult({ safetyScreening: { pregnancy: "no", breastfeeding: "yes", eatingDisorderRisk: "no", restrictiveOrCompensatoryPractices: false } }));
  assert.equal(eligibility.medicalGateway, "blocked");
  assert.ok(eligibility.safetyFlags.includes("breastfeeding"));
});

test("eating-disorder risk and withheld answer both block", () => {
  for (const eatingDisorderRisk of ["yes", "prefer_not_to_answer"]) {
    const { eligibility } = assess(adult({ safetyScreening: { pregnancy: "not_applicable", breastfeeding: "not_applicable", eatingDisorderRisk, restrictiveOrCompensatoryPractices: false } }));
    assert.equal(eligibility.medicalGateway, "blocked");
  }
});

test("restrictive or compensatory practices block", () => {
  const { eligibility } = assess(adult({ safetyScreening: { pregnancy: "not_applicable", breastfeeding: "not_applicable", eatingDisorderRisk: "no", restrictiveOrCompensatoryPractices: true } }));
  assert.ok(eligibility.safetyFlags.includes("restrictive_or_compensatory_practices"));
  assert.equal(eligibility.status, "blocked");
});

test("missing safety screening is explicit and reduction remains disabled", () => {
  const { validation, eligibility } = assess(adult({ safetyScreening: undefined }));
  assert.ok(validation.warnings.some((x) => x.code === "SAFETY_SCREENING_MISSING"));
  assert.ok(eligibility.safetyFlags.includes("missing_safety_screening"));
  assert.equal(eligibility.capabilities.automaticEnergyReduction, false);
});

test("partially missing safety answers return machine-readable warnings", () => {
  const result = validateSurveyInput(adult({ safetyScreening: { pregnancy: "no" } }));
  assert.equal(result.valid, true);
  assert.ok(result.warnings.some((x) => x.code === "ANSWER_UNCERTAIN" && x.path === "safetyScreening.breastfeeding"));
});

test("unsupported safety answers are validation errors", () => {
  const result = validateSurveyInput(adult({ safetyScreening: { pregnancy: "maybe", breastfeeding: "no", eatingDisorderRisk: "no", restrictiveOrCompensatoryPractices: false } }));
  assert.ok(result.errors.some((x) => x.code === "INVALID_VALUE" && x.path === "safetyScreening.pregnancy"));
});

test("uncertain restrictive-practice answer is conservatively blocked", () => {
  const { eligibility } = assess(adult({ safetyScreening: { pregnancy: "no", breastfeeding: "no", eatingDisorderRisk: "no", restrictiveOrCompensatoryPractices: "unknown" } }));
  assert.equal(eligibility.medicalGateway, "blocked");
  assert.ok(eligibility.safetyFlags.includes("safety_answer_uncertain"));
});

test("named labs and deficiency claims without values remain unconfirmed", () => {
  const { validation, eligibility } = assess(adult({ availableLabs: ["ferritin_iron"], claimedDeficiencies: ["iron"] }));
  assert.ok(validation.warnings.some((x) => x.code === "UNCONFIRMED_DEFICIENCY_CLAIM"));
  assert.equal(eligibility.capabilities.confirmedDeficiencyStatements, false);
  assert.ok(eligibility.safetyFlags.includes("unconfirmed_deficiency_claim"));
});

test("matching numeric laboratory evidence is distinct from a named analysis", () => {
  const { validation, eligibility } = assess(adult({ claimedDeficiencies: ["ferritin"], laboratoryResults: [{ analyte: "ferritin", value: 24, unit: "ng/mL" }] }));
  assert.equal(validation.profile.hasNumericLaboratoryResults, true);
  assert.equal(eligibility.capabilities.confirmedDeficiencyStatements, true);
  assert.equal(eligibility.capabilities.diagnosisStatements, false);
});

test("an unrelated numeric lab cannot confirm a deficiency claim", () => {
  const { validation, eligibility } = assess(adult({ claimedDeficiencies: ["ferritin"], laboratoryResults: [{ analyte: "glucose", value: 5, unit: "mmol/L" }] }));
  assert.ok(validation.warnings.some((x) => x.code === "UNCONFIRMED_DEFICIENCY_CLAIM"));
  assert.equal(eligibility.capabilities.confirmedDeficiencyStatements, false);
});

test("incomplete or non-finite laboratory results are errors", () => {
  const result = validateSurveyInput(adult({ laboratoryResults: [{ analyte: "ferritin", value: NaN }] }));
  assert.ok(result.errors.some((x) => x.code === "LAB_RESULT_INCOMPLETE" && x.path === "laboratoryResults.0"));
});

test("invalid input suppresses every output capability", () => {
  const eligibility = evaluateSafety(validateSurveyInput(adult({ allergies: ["none", "peanut"] })));
  assert.equal(eligibility.status, "blocked");
  assert.deepEqual(eligibility.capabilities, { numericKbju: false, foodRecommendations: false, portionedMenus: false, automaticEnergyReduction: false, diagnosisStatements: false, confirmedDeficiencyStatements: false });
});

test("Phase 2A admits an allowed adult without calculating KBJU", () => {
  const result = phase2();
  assert.equal(result.status, "admitted");
  assert.equal(result.admission.admitted, true);
  assert.equal(result.normalizedInput.demographics.heightCm, 170);
  assert.deepEqual(result.normalizedInput.source.goal, "balance_nutrition");
});

test("Phase 2A blocks a blocked medical state", () => {
  const result = phase2(adult({ safetyScreening: { pregnancy: "yes", breastfeeding: "not_applicable", eatingDisorderRisk: "no", restrictiveOrCompensatoryPractices: false } }));
  assert.equal(result.status, "blocked");
  assert.equal(result.admission.medicalGateway, "blocked");
  assert.ok(result.errors.some((issue) => issue.code === "MEDICAL_GATEWAY_BLOCKED"));
});

test("Phase 2A returns specialist review without calculating through it", () => {
  const result = phase2(adult({ medicalRestrictions: ["kidney"] }));
  assert.equal(result.status, "specialist_review");
  assert.equal(result.admission.admitted, false);
  assert.ok(result.errors.some((issue) => issue.code === "MEDICAL_SPECIALIST_REVIEW_REQUIRED"));
});

test("Phase 2A suppresses minors from numeric calculation", () => {
  const result = phase2(adult({ ageGroup: "minor", ageYears: 15, guardianRole: "athlete_with_parent" }));
  assert.equal(result.status, "blocked");
  assert.equal(result.admission.numericOutputAllowed, false);
  assert.ok(result.errors.some((issue) => issue.code === "MINOR_NUMERIC_OUTPUT_BLOCKED"));
});

test("Phase 2A rejects structurally incomplete calculation input", () => {
  const request = phase2Request();
  delete request.activity;
  const result = phase2(adult(), request);
  assert.equal(result.status, "invalid_input");
  assert.ok(result.errors.some((issue) => issue.code === "CALCULATION_INPUT_INCOMPLETE" && issue.path === "request.activity"));
});

test("Phase 2A rejects ambiguous survey activity mapping", () => {
  const result = phase2(adult(), phase2Request({ activity: { vocabulary: "survey", value: "moderate" } }));
  assert.equal(result.status, "invalid_input");
  assert.ok(result.errors.some((issue) => issue.code === "ACTIVITY_MAPPING_AMBIGUOUS"));
});

test("Phase 2A rejects ambiguous survey goal mapping", () => {
  const result = phase2(adult(), phase2Request({ goal: { vocabulary: "survey", value: "balance_nutrition" } }));
  assert.equal(result.status, "invalid_input");
  assert.ok(result.errors.some((issue) => issue.code === "GOAL_MAPPING_AMBIGUOUS"));
});

test("Phase 2A trace is deeply deterministic", () => {
  const first = phase2();
  const second = phase2();
  assert.deepEqual(first, second);
  assert.deepEqual(first.trace.map((entry) => entry.stepId), [
    "phase2a.normalization.v1", "phase2a.admission.v1", "phase2a.result.v1",
  ]);
});

test("Phase 2A only includes a caller-supplied timestamp", () => {
  const omitted = phase2();
  assert.equal(Object.hasOwn(omitted, "timestamp"), false);
  const supplied = phase2(adult(), phase2Request({ timestamp: "2026-07-30T12:00:00+03:00" }));
  assert.equal(supplied.timestamp, "2026-07-30T12:00:00+03:00");
  assert.equal(supplied.trace.some((entry) => JSON.stringify(entry).includes("2026-07-30")), false);
});

test("Phase 2A results expose no numeric KBJU result fields", () => {
  for (const result of [
    phase2(),
    phase2(adult({ medicalRestrictions: ["kidney"] })),
    phase2(adult({ ageGroup: "minor", ageYears: 15, guardianRole: "parent" })),
    phase2(adult(), phase2Request({ goal: { vocabulary: "survey", value: "energy" } })),
  ]) {
    for (const key of ["ree", "pal", "energyStart", "calorieTarget", "macros", "macroScenarios", "hydration", "calibration"]) {
      assert.equal(Object.hasOwn(result, key), false, `${result.status} unexpectedly contains ${key}`);
    }
  }
});

test("Phase 2B calculates approved male and female adult Mifflin branches", () => {
  const request = { ...phase2Request(), scope: "ree" };
  const male = runPhase2B(validateSurveyInput(adult({ sexForFormula: "male", ageYears: 28, heightCm: 189, weightKg: 86 })), request);
  const female = runPhase2B(validateSurveyInput(adult()), request);
  assert.equal(male.status, "calculated");
  assert.equal(male.ree.formulaId, "mifflin_st_jeor_adult_male");
  assert.equal(male.ree.unroundedKcalPerDay, 1906.25);
  assert.equal(male.ree.displayKcalPerDay, 1905);
  assert.equal(female.status, "calculated");
  assert.equal(female.ree.formulaId, "mifflin_st_jeor_adult_female");
});

test("Phase 2B is deterministic and adult boundary is admitted", () => {
  const validation = validateSurveyInput(adult({ ageYears: 18 }));
  const first = runPhase2B(validation, { ...phase2Request(), scope: "ree" });
  assert.deepEqual(first, runPhase2B(validation, { ...phase2Request(), scope: "ree" }));
  assert.equal(first.status, "calculated");
  assert.equal(first.trace.at(-1).stepId, "phase2b.ree.v1");
});

test("Phase 2B non-calculated variants contain no forbidden numeric result fields", () => {
  const cases = [
    runPhase2B(validateSurveyInput(adult({ ageYears: 15, ageGroup: "minor", guardianRole: "parent" })), { ...phase2Request(), scope: "ree" }),
    runPhase2B(validateSurveyInput(adult({ medicalRestrictions: ["kidney"] })), { ...phase2Request(), scope: "ree" }),
    runPhase2B(validateSurveyInput(adult({ safetyScreening: { pregnancy: "yes", breastfeeding: "not_applicable", eatingDisorderRisk: "no", restrictiveOrCompensatoryPractices: false } })), { ...phase2Request(), scope: "ree" }),
    runPhase2B(validateSurveyInput(adult({ heightCm: 0 })), { ...phase2Request(), scope: "ree" }),
  ];
  assert.deepEqual(cases.map((x) => x.status), ["minor_suppressed", "specialist_review", "blocked", "invalid_input"]);
  for (const result of cases) for (const key of ["ree", "calories", "macros", "energyStart"]) assert.equal(Object.hasOwn(result, key), false);
});

test("questionnaire adapter runs the production Phase 2C2 pipeline", () => {
  const result = runQuestionnairePipeline({ selections: [1, 0, 0, 3, 1, 0, 0, 0, 1], userType: "general_user", ageGroup: "adult", goal: "maintenance", dailyActivity: "mostly_sitting", ageYears: 30, sexForFormula: "female", heightCm: 170, weightKg: 65, informationalConsent: true });
  assert.equal(result.status, "calculated");
  assert.equal(result.resultSchemaVersion, PHASE2C2_RESULT_SCHEMA_VERSION);
  assert.equal(result.scenarios[0].palFinal, 1.4);
  assert.doesNotMatch(JSON.stringify(result), /demo-report|daily calorie target/i);
  assert.equal(JSON.parse(JSON.stringify(result)).status, "calculated");
});

test("questionnaire exposes exactly the approved nine-section order", () => {
  assert.deepEqual(QUESTIONNAIRE_SECTION_TITLES, ["Профиль", "Исходные данные", "Спорт и цель", "Безопасность", "Текущее питание", "Режим вокруг нагрузки", "Самочувствие", "Гидратация", "Анализы и контекст"]);
});

test("anthropometric fields belong to section 2 and not profile section 1", () => {
  for (const field of ["ageYears", "sexForFormula", "heightCm", "weightKg"]) assert.equal(QUESTIONNAIRE_FIELD_SECTION[field], 2);
  assert.equal(QUESTIONNAIRE_FIELD_SECTION.userType, 1);
  assert.equal(QUESTIONNAIRE_FIELD_SECTION.ageGroup, 1);
});

test("all five questionnaire goals are accepted and cannot change REE", () => {
  assert.deepEqual(QUESTIONNAIRE_GOALS, ["weight_loss", "maintenance", "muscle_gain", "performance_recovery", "habits_wellbeing"]);
  const results = QUESTIONNAIRE_GOALS.map((goal) => runQuestionnairePipeline({ selections: [1, 0, 0, 3, 1, 0, 0, 0, 1], userType: "general_user", ageGroup: "adult", goal, dailyActivity: "mostly_sitting", ageYears: 30, sexForFormula: "female", heightCm: 170, weightKg: 65, informationalConsent: true }));
  assert.ok(results.every((result) => result.status === "calculated"));
  assert.ok(results.every((result) => result.ree.unroundedKcalPerDay === results[0].ree.unroundedKcalPerDay));
  assert.equal(Object.hasOwn(results[0], "deficit"), false, "weight_loss must not apply a deficit");
  assert.equal(Object.hasOwn(results[2], "surplus"), false, "muscle_gain must not apply a surplus");
  for (const [index, result] of results.entries()) assert.ok(JSON.stringify(result.trace).includes(QUESTIONNAIRE_GOALS[index]));
});

test("questionnaire minor still receives no numeric result", () => {
  const result = runQuestionnairePipeline({ selections: [1, 0, 0, 3, 1, 0, 0, 0, 1], userType: "general_user", ageGroup: "minor", guardianRole: "parent", goal: "maintenance", dailyActivity: "mostly_sitting", ageYears: 15, sexForFormula: "female", heightCm: 160, weightKg: 50, informationalConsent: true });
  assert.equal(result.status, "minor_suppressed");
  assert.equal(Object.hasOwn(result, "ree"), false);
});

const questionnaire = (changes = {}) => ({ selections: [1,0,0,3,1,0,0,0,1], userType: "general_user", ageGroup: "adult", goal: "maintenance", dailyActivity: "mostly_sitting", ageYears: 30, sexForFormula: "female", heightCm: 170, weightKg: 65, informationalConsent: true, ...changes });
const athleteQuestionnaire = (changes = {}) => questionnaire({ selections: [0,0,0,3,1,0,0,0,1], userType: "athlete", dailyActivity: undefined, sportType: "hockey", sportLevel: "professional", sessionsPerWeek: "5_6", typicalSessionMinutes: 90, doubleTrainingDays: false, sexForFormula: "male", ageYears: 28, heightCm: 189, weightKg: 86, goal: "performance_recovery", ...changes });

test("Phase 2C1 exposes exactly four approved ordinary activities", () => {
  assert.deepEqual(ORDINARY_ACTIVITIES, ["mostly_sitting", "lots_of_walking", "physically_active_work", "fitness_2_4_week"]);
  assert.ok(ORDINARY_ACTIVITIES.every((x) => !["low", "moderate", "high"].includes(x)));
});

test("legacy ordinary activities fail closed without numeric output", () => {
  for (const dailyActivity of ["low", "moderate", "high"]) {
    const result = runQuestionnairePipeline(questionnaire({ dailyActivity }));
    assert.equal(result.status, "invalid_input");
    assert.ok(result.issues.some((x) => x.code === "QUESTIONNAIRE_UNSUPPORTED_LEGACY_ACTIVITY"));
    for (const key of ["ree", "scenarios", "pal", "energyStart"]) assert.equal(Object.hasOwn(result, key), false);
  }
});

test("ordinary PAL mappings and scenario order are exact", () => {
  const expected = { mostly_sitting: [["typical_day",1.4]], lots_of_walking: [["typical_day",1.55]], physically_active_work: [["typical_day",1.7]], fitness_2_4_week: [["typical_day",1.5],["training",1.65]] };
  for (const activity of ORDINARY_ACTIVITIES) {
    const result = runQuestionnairePipeline(questionnaire({ dailyActivity: activity }));
    assert.equal(result.status, "calculated");
    assert.deepEqual(result.scenarios.map((x) => [x.id,x.palFinal]), expected[activity]);
    assert.ok(result.scenarios.every((x) => x.durationModifier === 0 && x.id !== "double_training"));
  }
});

test("athlete PAL levels, duration boundaries, and double warning are exact", () => {
  assert.deepEqual([45,46,90,91].map(athleteDurationModifier), [-0.05,0,0,0.1]);
  const expected = { amateur: [1.5,1.7,1.9], competitive: [1.55,1.85,2.1], professional: [1.6,2,2.25] };
  for (const sportLevel of Object.keys(expected)) {
    const scenarios = buildPalScenarios({ kind:"athlete", sportLevel, typicalSessionMinutes:90, dayType:"training", doubleTrainingDays:true });
    assert.deepEqual(scenarios.map((x) => x.base), expected[sportLevel]);
    assert.deepEqual(scenarios.map((x) => x.id), ["rest","training","double_training"]);
    assert.equal(scenarios[2].modifier, 0);
    assert.ok(scenarios[2].warnings.includes("double_duration_unknown"));
  }
  assert.equal(runQuestionnairePipeline(athleteQuestionnaire({ sportLevel:"amateur", typicalSessionMinutes:40 })).scenarios[1].palFinal, 1.65);
  assert.equal(runQuestionnairePipeline(athleteQuestionnaire({ sportLevel:"competitive", typicalSessionMinutes:120 })).scenarios[1].palFinal, 1.95);
});

test("approved energy examples use unrounded REE and ties-to-even nearest 50", () => {
  const professional = runQuestionnairePipeline(athleteQuestionnaire({ doubleTrainingDays:true }));
  assert.equal(professional.status, "calculated");
  assert.equal(professional.ree.unroundedKcalPerDay, 1906.25);
  assert.equal(professional.scenarios[1].energyStartRawKcal, 3812.5);
  assert.equal(professional.scenarios[1].energyStartKcal, 3800);
  assert.equal(professional.scenarios[2].energyStartRawKcal, 4289.0625);
  assert.equal(professional.scenarios[2].energyStartKcal, 4300);
  assert.equal(roundToNearest50TiesToEven(3812.5), 3800);
  assert.deepEqual(calculateEnergyStart(1906.25,2), { raw:3812.5, displayed:3800 });
});

test("PAL clamp and two decimal policy are deterministic", () => {
  assert.equal(clampAndRoundPal(1.399), 1.4);
  assert.equal(clampAndRoundPal(2.405), 2.4);
  assert.equal(clampAndRoundPal(1.856), 1.86);
});

test("goal policy stays neutral for energy", () => {
  const results = QUESTIONNAIRE_GOALS.map((goal) => runQuestionnairePipeline(questionnaire({ goal })));
  assert.deepEqual(results.map((x) => x.scenarios.map((s) => s.energyStartKcal)), Array(5).fill(results[0].scenarios.map((s) => s.energyStartKcal)));
  assert.ok(results.every((x) => x.appliedGoalMultiplier === 1));
  assert.equal(results[0].goalStatus, "disabled_pending_safety_screen");
  assert.equal(results[2].goalStatus, "deferred_to_goal_phase");
});

test("Phase 2C1 is deterministic and sessions frequency is context only", () => {
  const first = runQuestionnairePipeline(athleteQuestionnaire({ sessionsPerWeek:"1_2" }));
  const second = runQuestionnairePipeline(athleteQuestionnaire({ sessionsPerWeek:"7_plus" }));
  assert.deepEqual(first.scenarios.map((x) => x.palFinal), second.scenarios.map((x) => x.palFinal));
  assert.deepEqual(first, runQuestionnairePipeline(athleteQuestionnaire({ sessionsPerWeek:"1_2" })));
  assert.ok(JSON.stringify(second.scenarios).includes("7_plus"));
});

test("Phase 2C1 non-calculated JSON has no numeric nutrition fields", () => {
  const cases = [runQuestionnairePipeline(questionnaire({ ageGroup:"minor", ageYears:15, guardianRole:"parent" })), runQuestionnairePipeline(questionnaire({ selections:[1,0,0,2,1,0,0,0,1] })), runQuestionnairePipeline(questionnaire({ dailyActivity:undefined }))];
  for (const result of cases) {
    const serialized = JSON.parse(JSON.stringify(result));
    for (const key of ["ree","scenarios","pal","energyStart","macros","protein","fat","carbohydrates"]) assert.equal(Object.hasOwn(serialized,key), false);
  }
});

test("Phase 2C2 preserves Phase 2C1 days and attaches ordered macro scenarios", () => {
  const result = runQuestionnairePipeline(athleteQuestionnaire({ doubleTrainingDays: true }));
  assert.equal(result.status, "calculated");
  assert.equal(result.resultSchemaVersion, PHASE2C2_RESULT_SCHEMA_VERSION);
  assert.deepEqual(result.scenarios.map((x) => x.id), ["rest", "training", "double_training"]);
  assert.deepEqual(result.scenarios.map((x) => [x.palFinal, x.durationModifier, x.energyStartKcal]), [[1.6,0,3050],[2,0,3800],[2.25,0,4300]]);
  assert.ok(result.scenarios.every((day) => JSON.stringify(day.macroScenarios.map((x) => x.id)) === JSON.stringify(MACRO_SCENARIO_IDS)));
});

test("Phase 2C2 policy tables are exact and fitness remains ordinary", () => {
  assert.deepEqual(MACRO_ENERGY_FACTORS, { lower:0.94, central:1, upper:1.06 });
  assert.deepEqual(FAT_COEFFICIENTS, { lower:0.9, central:1, upper:1.1 });
  assert.deepEqual(PROTEIN_COEFFICIENTS, {
    ordinary_adult:{ lower:1.2, central:1.4, upper:1.6 }, athlete_amateur:{ lower:1.6, central:1.7, upper:1.8 },
    athlete_competitive:{ lower:1.7, central:1.85, upper:2 }, athlete_professional:{ lower:1.8, central:1.9, upper:2 },
  });
  const fitness = runQuestionnairePipeline(questionnaire({ dailyActivity:"fitness_2_4_week" }));
  assert.deepEqual(fitness.scenarios.flatMap((day) => day.macroScenarios.map((x) => x.status === "calculated" && x.trace.proteinCoefficient)), [1.2,1.4,1.6,1.2,1.4,1.6]);
});

test("decimal one-place ties-to-even boundaries are deterministic", () => {
  assert.deepEqual([1.04,1.05,1.06,1.15,2.25,2.35].map(roundToOneDecimalTiesToEven), [1,1,1.1,1.2,2.2,2.4]);
});

test("approved professional macro fixture matches exactly", () => {
  const result = runQuestionnairePipeline(athleteQuestionnaire());
  const macros = result.scenarios.find((x) => x.id === "training").macroScenarios;
  assert.deepEqual(macros.map((x) => x.status === "calculated" && [x.energyKcal,x.trace.proteinCoefficient,x.proteinG,x.trace.fatCoefficient,x.fatG,x.carbohydrateG,x.macroEnergyKcal,x.deviationKcal]), [
    [3550,1.8,154.8,0.9,78.9,555.2,3550.1,0.1], [3800,1.9,163.4,1,86,593.1,3800,0], [4050,2,172,1.1,94.6,627.7,4050.2,0.2],
  ]);
});

test("fat source, carbohydrate remainder and closure use displayed rounded grams", () => {
  const weightWins = buildMacroScenarios(1500,100,"ordinary_adult")[0];
  const energyWins = buildMacroScenarios(5000,86,"athlete_professional")[1];
  assert.equal(weightWins.trace.fatFloorSource, "weight_based");
  assert.equal(energyWins.trace.fatFloorSource, "energy_20_percent");
  for (const macro of buildMacroScenarios(3800,86,"athlete_professional")) {
    assert.equal(macro.status, "calculated");
    assert.ok(Math.abs(macro.deviationKcal) <= 0.5);
    assert.equal(macro.macroEnergyKcal, roundToOneDecimalTiesToEven(macro.proteinG*4 + macro.fatG*9 + macro.carbohydrateG*4));
  }
});

test("negative carbohydrate fails closed without public macro targets", () => {
  const macro = buildMacroScenarios(100,200,"athlete_professional")[0];
  assert.deepEqual(macro, { status:"needs_review", id:"lower", energyKcal:100, issues:["macro_scenario_needs_review"] });
  for (const key of ["proteinG","fatG","carbohydrateG","trace"]) assert.equal(Object.hasOwn(JSON.parse(JSON.stringify(macro)),key), false);
});

test("goal and contextual day data cannot change macro coefficients", () => {
  const goalResults = QUESTIONNAIRE_GOALS.map((goal) => runQuestionnairePipeline(questionnaire({ goal })));
  assert.ok(goalResults.every((x) => JSON.stringify(x.scenarios.map((d) => d.macroScenarios)) === JSON.stringify(goalResults[0].scenarios.map((d) => d.macroScenarios))));
  assert.ok(goalResults.every((x) => x.appliedGoalMultiplier === 1));
});

test("Phase 2C2 non-calculated variants serialize no nutrition numbers", () => {
  const cases = [runQuestionnairePipeline(questionnaire({ ageGroup:"minor", ageYears:15, guardianRole:"parent" })), runQuestionnairePipeline(questionnaire({ selections:[1,0,0,2,1,0,0,0,1] })), runQuestionnairePipeline(questionnaire({ dailyActivity:undefined }))];
  for (const result of cases) { const json = JSON.stringify(result); for (const key of ["ree","scenarios","proteinG","fatG","carbohydrateG","energyStartKcal"]) assert.equal(json.includes(`\"${key}\"`), false); }
});

test("Phase 2C2 session compatibility rejects old and incomplete payloads", () => {
  const result = runQuestionnairePipeline(questionnaire());
  assert.equal(isCompatiblePhase2C2Payload(JSON.parse(JSON.stringify(result))), true);
  assert.equal(isCompatiblePhase2C2Payload({ ...result, resultSchemaVersion:"nutrimind.phase2c1.result.v1" }), false);
  const incomplete = JSON.parse(JSON.stringify(result)); delete incomplete.scenarios[0].macroScenarios[2];
  assert.equal(isCompatiblePhase2C2Payload(incomplete), false);
  assert.equal(isCompatiblePhase2C2Payload("malformed"), false);
});
