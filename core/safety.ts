import type { MedicalGatewayState, NormalizedUserProfile, RecommendationEligibility, SafetyFlag, ValidationResult } from "./types.ts";

export function evaluateSafety(validation: ValidationResult): RecommendationEligibility {
  const flags: SafetyFlag[] = [];
  const notices: string[] = [];
  const profile = validation.profile;
  if (!validation.valid || !profile) return blocked(flags, ["Survey validation failed; no personalized output is eligible."]);

  if (profile.isMinor) flags.push("minor");
  if (profile.hasAllergies) flags.push("allergy_hard_exclusions");
  if (profile.unresolvedAllergy) flags.push("unresolved_allergy");
  if (profile.strictGlutenFree) flags.push("strict_gluten_free");
  if (profile.hasMedicalRestrictions) flags.push("medical_restriction");
  if (!profile.safetyScreening) flags.push("missing_safety_screening");
  const confirmedDeficiencyEvidence = (profile.claimedDeficiencies?.length ?? 0) > 0 && profile.claimedDeficiencies!.every((claim) =>
    profile.laboratoryResults?.some((lab) => lab.analyte.toLocaleLowerCase() === claim.toLocaleLowerCase()));
  if ((profile.claimedDeficiencies?.length ?? 0) > 0 && !confirmedDeficiencyEvidence) flags.push("unconfirmed_deficiency_claim");

  let screeningBlocked = false;
  const screen = profile.safetyScreening;
  if (screen) {
    if (screen.pregnancy === "yes") { flags.push("pregnancy"); screeningBlocked = true; }
    if (screen.pregnancy === "uncertain") { flags.push("pregnancy_uncertain"); screeningBlocked = true; }
    if (screen.breastfeeding === "yes") { flags.push("breastfeeding"); screeningBlocked = true; }
    if (screen.eatingDisorderRisk === "yes") { flags.push("eating_disorder_risk"); screeningBlocked = true; }
    if (screen.eatingDisorderRisk === "prefer_not_to_answer") { flags.push("eating_disorder_answer_withheld"); screeningBlocked = true; }
    if (screen.restrictiveOrCompensatoryPractices === true) { flags.push("restrictive_or_compensatory_practices"); screeningBlocked = true; }
    if (screen.restrictiveOrCompensatoryPractices === "unknown" || screen.restrictiveOrCompensatoryPractices === "prefer_not_to_answer") { flags.push("safety_answer_uncertain"); screeningBlocked = true; }
  }

  const medicalGateway: MedicalGatewayState = screeningBlocked ? "blocked" : profile.hasMedicalRestrictions ? "specialist_review" : "allowed";
  const foodRecommendations = !profile.unresolvedAllergy && !screeningBlocked;
  const numericKbju = !profile.isMinor && medicalGateway === "allowed";
  if (profile.isMinor) notices.push("Numeric KBJU and portioned menus are unavailable for minors.");
  if (profile.hasAllergies) notices.push("Allergy exclusions are hard exclusions and must run before ranking.");
  if (profile.strictGlutenFree) notices.push("Celiac disease requires strict gluten-free handling, including cross-contact.");
  if (profile.hasMedicalRestrictions) notices.push("Medical restrictions require specialist review and must not change a therapeutic diet.");
  if (screeningBlocked) notices.push("Safety screening blocks automatic personalized nutrition output; seek specialist review.");
  if (flags.includes("unconfirmed_deficiency_claim")) notices.push("No deficiency is confirmed without numeric laboratory evidence.");

  return {
    status: medicalGateway === "blocked" ? "blocked" : medicalGateway === "specialist_review" ? "specialist_review" : (profile.isMinor || profile.unresolvedAllergy ? "limited" : "eligible"),
    medicalGateway, safetyFlags: flags,
    capabilities: { numericKbju, foodRecommendations, portionedMenus: numericKbju && foodRecommendations, automaticEnergyReduction: false, diagnosisStatements: false, confirmedDeficiencyStatements: confirmedDeficiencyEvidence },
    hardExcludedAllergens: hardExclusions(profile), notices,
  };
}

function hardExclusions(profile: NormalizedUserProfile): string[] {
  const values: string[] = profile.allergies.filter((value) => value !== "none" && value !== "other");
  if (profile.normalizedOtherAllergyCode) values.push(profile.normalizedOtherAllergyCode);
  if (profile.strictGlutenFree) values.push("gluten", "gluten_cross_contact");
  return [...new Set(values)];
}

function blocked(flags: SafetyFlag[], notices: string[]): RecommendationEligibility {
  return { status: "blocked", medicalGateway: "blocked", safetyFlags: flags,
    capabilities: { numericKbju: false, foodRecommendations: false, portionedMenus: false, automaticEnergyReduction: false, diagnosisStatements: false, confirmedDeficiencyStatements: false },
    hardExcludedAllergens: [], notices };
}
