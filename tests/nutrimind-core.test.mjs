import assert from "node:assert/strict";
import test from "node:test";
import { QUESTIONNAIRE_FIELD_SECTION, QUESTIONNAIRE_GOALS, QUESTIONNAIRE_SECTION_TITLES, evaluateSafety, runPhase2A, runPhase2B, runQuestionnairePipeline, validateSurveyInput } from "../core/index.ts";

const adult = (changes = {}) => ({
  surveySpecVersion: "0.1.1-draft", userType: "general_user", ageGroup: "adult",
  ageYears: 30, sexForFormula: "female", heightCm: 170, weightKg: 65,
  dailyActivity: "moderate", allergies: ["none"], intolerances: ["none"],
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
    value: { kind: "general_user", dailyActivity: "moderate", dayType: "rest" },
    sourceValue: { dailyActivity: "moderate", suppliedBy: "caller" },
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

test("questionnaire adapter runs production pipeline without inventing activity or goal mapping", () => {
  const result = runQuestionnairePipeline({ selections: [1, 0, 0, 3, 1, 0, 0, 0, 1], userType: "general_user", ageGroup: "adult", goal: "maintenance", dailyActivity: "moderate", ageYears: 30, sexForFormula: "female", heightCm: 170, weightKg: 65, informationalConsent: true });
  assert.equal(result.status, "calculated");
  assert.ok(result.warnings.some((x) => x.code === "REE_STAGE_MAPPING_DEFERRED" && x.path === "request.activity"));
  assert.ok(result.warnings.some((x) => x.code === "REE_STAGE_MAPPING_DEFERRED" && x.path === "request.goal"));
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
  const results = QUESTIONNAIRE_GOALS.map((goal) => runQuestionnairePipeline({ selections: [1, 0, 0, 3, 1, 0, 0, 0, 1], userType: "general_user", ageGroup: "adult", goal, dailyActivity: "moderate", ageYears: 30, sexForFormula: "female", heightCm: 170, weightKg: 65, informationalConsent: true }));
  assert.ok(results.every((result) => result.status === "calculated"));
  assert.ok(results.every((result) => result.ree.unroundedKcalPerDay === results[0].ree.unroundedKcalPerDay));
  assert.equal(Object.hasOwn(results[0], "deficit"), false, "weight_loss must not apply a deficit");
  assert.equal(Object.hasOwn(results[2], "surplus"), false, "muscle_gain must not apply a surplus");
  for (const [index, result] of results.entries()) assert.ok(JSON.stringify(result.trace).includes(QUESTIONNAIRE_GOALS[index]));
});

test("questionnaire minor still receives no numeric result", () => {
  const result = runQuestionnairePipeline({ selections: [1, 0, 0, 3, 1, 0, 0, 0, 1], userType: "general_user", ageGroup: "minor", guardianRole: "parent", goal: "maintenance", dailyActivity: "moderate", ageYears: 15, sexForFormula: "female", heightCm: 160, weightKg: 50, informationalConsent: true });
  assert.equal(result.status, "minor_suppressed");
  assert.equal(Object.hasOwn(result, "ree"), false);
});
