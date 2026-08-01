import type { CalibrationJournal, CalibrationSource, JournalStatus } from "./types.ts";
import { CALIBRATION_CONSENT_VERSION, CALIBRATION_JOURNAL_SCHEMA } from "./types.ts";

export const BODY_WEIGHT_MIN_KG = 10;
export const BODY_WEIGHT_MAX_KG = 500;

export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return formatLocalDate(date) === value ? date : null;
}

export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function todayLocalDate(now = new Date()): string { return formatLocalDate(now); }

export function addLocalCalendarDays(value: string, days: number): string {
  const date = parseLocalDate(value);
  if (!date || !Number.isInteger(days)) throw new Error("invalid_local_date");
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

export function enumerateLocalDates(start: string, end: string): string[] {
  if (!parseLocalDate(start) || !parseLocalDate(end) || start > end) return [];
  const dates: string[] = [];
  for (let cursor = start; cursor <= end; cursor = addLocalCalendarDays(cursor, 1)) dates.push(cursor);
  return dates;
}

export function elapsedCalendarDays(start: string, today: string, maximum = 14): number {
  if (today < start) return 0;
  let count = 0;
  for (let cursor = start; cursor <= today && count < maximum; cursor = addLocalCalendarDays(cursor, 1)) count += 1;
  return count;
}

export function deriveJournalStatus(journal: CalibrationJournal, today: string): JournalStatus {
  if (today > journal.expiresAt) return "expired";
  if (journal.status === "safety_context_changed") return journal.status;
  if (today >= journal.endDate) return journal.entries.length ? "observation_complete" : "ready_for_summary";
  return "collecting";
}

export function createCalibrationJournal(source: CalibrationSource, input: { journalId: string; startDate: string; timeZone: string; nowIso: string }): CalibrationJournal {
  return {
    schemaVersion: CALIBRATION_JOURNAL_SCHEMA,
    journalId: input.journalId,
    status: "collecting",
    consentVersion: CALIBRATION_CONSENT_VERSION,
    startDate: input.startDate,
    endDate: addLocalCalendarDays(input.startDate, 13),
    expiresAt: addLocalCalendarDays(input.startDate, 30),
    timeZone: input.timeZone,
    createdAt: input.nowIso,
    updatedAt: input.nowIso,
    source,
    entries: [],
  };
}
