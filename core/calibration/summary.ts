import { deriveJournalStatus, elapsedCalendarDays, enumerateLocalDates } from "./policy.ts";
import { CALIBRATION_SUMMARY_SCHEMA, type CalibrationJournal, type CalibrationSummary } from "./types.ts";

export function deriveCalibrationSummary(journal: CalibrationJournal, today: string): CalibrationSummary {
  const journalStatus = deriveJournalStatus(journal, today);
  const effectiveEnd = today < journal.endDate ? today : journal.endDate;
  const observedDates = effectiveEnd < journal.startDate ? [] : enumerateLocalDates(journal.startDate, effectiveEnd);
  const entries = [...journal.entries].sort((a, b) => a.date.localeCompare(b.date));
  const logged = new Set(entries.map((entry) => entry.date));
  const fields = ["dayType", "adherence", "actualTraining", "weightCondition", "hunger", "energy", "sleep", "recovery", "trainingQuality", "overallWellbeing", "atypicalContext"] as const;
  const categoryCounts: Record<string, Record<string, number>> = {};
  for (const field of fields) {
    categoryCounts[field] = {};
    for (const entry of entries) {
      const value = entry[field] ?? "not_provided";
      categoryCounts[field][String(value)] = (categoryCounts[field][String(value)] ?? 0) + 1;
    }
  }
  let status: CalibrationSummary["status"] = "collecting";
  if (journalStatus === "safety_context_changed") status = "safety_context_changed";
  else if (journalStatus === "expired") status = "expired";
  else if (today >= journal.endDate) status = entries.length ? "observation_complete" : "insufficient_data";
  const atypicalContextDays = entries.filter((entry) => entry.atypicalContext && !["none", "not_provided"].includes(entry.atypicalContext)).length;
  return {
    schemaVersion: CALIBRATION_SUMMARY_SCHEMA,
    journalId: journal.journalId,
    status,
    elapsedDays: elapsedCalendarDays(journal.startDate, effectiveEnd),
    loggedDays: entries.length,
    missingDates: observedDates.filter((date) => !logged.has(date)),
    categoryCounts,
    weights: entries.filter((entry) => entry.bodyWeightKg !== undefined).map((entry) => ({ date: entry.date, bodyWeightKg: entry.bodyWeightKg!, condition: entry.weightCondition ?? "not_provided" })),
    atypicalContextDays,
    warnings: ["observation_only", ...(entries.length < observedDates.length ? ["missing_days_are_not_interpreted"] : []), ...(atypicalContextDays ? ["atypical_context_present"] : []), ...(entries.some((entry) => entry.bodyWeightKg !== undefined) ? ["weight_values_are_not_trend_analysis"] : [])],
    appliedPolicy: { policyId: "nutrimind.phase2d2a.observation-only.v1", ruleIds: ["calendar_days_only", "no_automatic_adjustment", "no_trend_interpretation", "missing_days_are_neutral"] },
  };
}
