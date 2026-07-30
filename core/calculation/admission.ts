import type { RecommendationEligibility, ValidationResult } from "../types.ts";
import type {
  CalculationAdmission,
  CalculationError,
  CalculationIssue,
  CalculationResultStatus,
} from "./types.ts";

const reason = (
  code: CalculationError["code"],
  message: string,
  ruleId: string,
  path?: string,
): CalculationError => ({ code, message, ruleId, path, severity: "error", stage: "admission" });

export function admitCalculation(
  validation: ValidationResult,
  safety: RecommendationEligibility,
  normalizationErrors: CalculationError[],
): { admission: CalculationAdmission; status: CalculationResultStatus; issues: CalculationIssue[] } {
  const issues: CalculationIssue[] = [...normalizationErrors];
  const profile = validation.profile;

  if (!validation.valid || !profile) {
    if (!issues.some((issue) => issue.code === "CALCULATION_INPUT_NOT_VALIDATED"))
      issues.push(reason("CALCULATION_INPUT_NOT_VALIDATED", "Phase 1 validation did not produce a profile.", "ADMISSION.PHASE1.VALID.001", "validation"));
  } else if (safety.medicalGateway === "blocked") {
    issues.push(reason("MEDICAL_GATEWAY_BLOCKED", "The Phase 1 medical gateway blocked calculation.", "ADMISSION.MEDICAL.BLOCK.001", "safety.medicalGateway"));
  } else if (safety.medicalGateway === "specialist_review") {
    issues.push(reason("MEDICAL_SPECIALIST_REVIEW_REQUIRED", "Calculation requires specialist review and was not continued.", "ADMISSION.MEDICAL.REVIEW.001", "safety.medicalGateway"));
  } else if (profile.isMinor || profile.ageGroup === "minor") {
    issues.push(reason("MINOR_NUMERIC_OUTPUT_BLOCKED", "Minors cannot enter numeric KBJU calculation.", "ADMISSION.AGE.MINOR.001", "profile.ageGroup"));
  } else if (!safety.capabilities.numericKbju) {
    issues.push(reason("NUMERIC_OUTPUT_NOT_ELIGIBLE", "Phase 1 capabilities do not permit numeric KBJU calculation.", "ADMISSION.CAPABILITY.KBJU.001", "safety.capabilities.numericKbju"));
  }

  const status: CalculationResultStatus = normalizationErrors.length || !validation.valid || !profile
    ? "invalid_input"
    : safety.medicalGateway === "blocked" || profile.isMinor
      ? "blocked"
      : safety.medicalGateway === "specialist_review"
        ? "specialist_review"
        : !safety.capabilities.numericKbju
          ? "blocked"
          : "admitted";
  const admitted = status === "admitted";
  return {
    status,
    issues,
    admission: {
      admitted,
      numericOutputAllowed: admitted,
      medicalGateway: safety.medicalGateway,
      safetyFlags: [...safety.safetyFlags],
      validationIssues: [...validation.errors, ...validation.warnings],
      reasons: issues,
    },
  };
}
