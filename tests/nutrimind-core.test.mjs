import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSafety, validateSurveyInput } from "../core/index.ts";

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
