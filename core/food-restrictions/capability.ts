import { WARNING_CODES, type RestrictionStatus, type WarningCode } from "./types.ts";

const BASE_WARNINGS: WarningCode[] = WARNING_CODES.slice(0, 5);
const statusWarning: Partial<Record<RestrictionStatus, WarningCode>> = {
  unresolved: "RESTRICTION_CONTEXT_UNRESOLVED", not_provided: "RESTRICTION_CONTEXT_NOT_PROVIDED",
  unsupported: "RESTRICTION_CONTEXT_UNSUPPORTED", malformed: "RESTRICTION_CONTEXT_MALFORMED",
};
export function warningsForStatus(status: RestrictionStatus): WarningCode[] {
  const values = [...BASE_WARNINGS, ...(statusWarning[status] ? [statusWarning[status]!] : [])];
  return WARNING_CODES.filter((code) => values.includes(code));
}
export const getRestrictionCapability = () => "abstract_only" as const;
