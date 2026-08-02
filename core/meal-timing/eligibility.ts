import type { Phase3A2Context } from "./types.ts";

export function isPhase3A2Eligible(input: { phase3aCalculated: boolean; planBuilt: boolean; dayId: string; context: Phase3A2Context | { status: "malformed" } }): boolean {
  return input.phase3aCalculated && input.planBuilt && input.dayId === "training" && input.context.status === "available";
}
