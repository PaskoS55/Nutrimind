import { BODY_WEIGHT_MAX_KG, BODY_WEIGHT_MIN_KG, addLocalCalendarDays, parseLocalDate } from "./policy.ts";
import { ACTUAL_TRAINING_VALUES, ADHERENCE_VALUES, ATYPICAL_CONTEXT_VALUES, CALIBRATION_CONSENT_VERSION, CALIBRATION_ENTRY_SCHEMA, CALIBRATION_JOURNAL_SCHEMA, DAY_TYPES, RECOVERY_VALUES, SLEEP_VALUES, THREE_LEVEL_VALUES, TRAINING_QUALITY_VALUES, WEIGHT_CONDITIONS, WELLBEING_VALUES, type CalibrationEntry, type CalibrationJournal } from "./types.ts";

type ParseResult = { ok: true; value: CalibrationJournal } | { ok: false; reason: string };
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const keysAre = (value: Record<string, unknown>, required: string[], optional: string[] = []) => {
  const keys = Object.keys(value);
  return required.every((key) => keys.includes(key)) && keys.every((key) => required.includes(key) || optional.includes(key));
};
const member = <T extends readonly string[]>(values: T, value: unknown): value is T[number] => typeof value === "string" && values.includes(value as T[number]);
const isoTimestamp = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));

export function isCalibrationEntry(value: unknown): value is CalibrationEntry {
  if (!isObject(value) || !keysAre(value, ["schemaVersion", "date", "dayType", "adherence"], ["actualTraining", "bodyWeightKg", "weightCondition", "hunger", "energy", "sleep", "recovery", "trainingQuality", "overallWellbeing", "atypicalContext"])) return false;
  if (value.schemaVersion !== CALIBRATION_ENTRY_SCHEMA || typeof value.date !== "string" || !parseLocalDate(value.date) || !member(DAY_TYPES, value.dayType) || !member(ADHERENCE_VALUES, value.adherence)) return false;
  if (value.actualTraining !== undefined && !member(ACTUAL_TRAINING_VALUES, value.actualTraining)) return false;
  if (value.bodyWeightKg !== undefined && (typeof value.bodyWeightKg !== "number" || !Number.isFinite(value.bodyWeightKg) || value.bodyWeightKg < BODY_WEIGHT_MIN_KG || value.bodyWeightKg > BODY_WEIGHT_MAX_KG)) return false;
  if (value.weightCondition !== undefined && !member(WEIGHT_CONDITIONS, value.weightCondition)) return false;
  for (const key of ["hunger", "energy"] as const) if (value[key] !== undefined && !member(THREE_LEVEL_VALUES, value[key])) return false;
  if (value.sleep !== undefined && !member(SLEEP_VALUES, value.sleep)) return false;
  if (value.recovery !== undefined && !member(RECOVERY_VALUES, value.recovery)) return false;
  if (value.trainingQuality !== undefined && !member(TRAINING_QUALITY_VALUES, value.trainingQuality)) return false;
  if (value.overallWellbeing !== undefined && !member(WELLBEING_VALUES, value.overallWellbeing)) return false;
  return value.atypicalContext === undefined || member(ATYPICAL_CONTEXT_VALUES, value.atypicalContext);
}

export function parseCalibrationJournal(value: unknown, today: string): ParseResult {
  if (!isObject(value) || !keysAre(value, ["schemaVersion", "journalId", "status", "consentVersion", "startDate", "endDate", "expiresAt", "timeZone", "createdAt", "updatedAt", "source", "entries"])) return { ok: false, reason: "invalid_shape" };
  if (value.schemaVersion !== CALIBRATION_JOURNAL_SCHEMA || value.consentVersion !== CALIBRATION_CONSENT_VERSION) return { ok: false, reason: "unsupported_schema" };
  if (typeof value.journalId !== "string" || !value.journalId || !member(["collecting", "ready_for_summary", "observation_complete", "safety_context_changed", "expired"] as const, value.status)) return { ok: false, reason: "invalid_identity" };
  if (typeof value.startDate !== "string" || typeof value.endDate !== "string" || typeof value.expiresAt !== "string" || !parseLocalDate(value.startDate) || value.endDate !== addLocalCalendarDays(value.startDate, 13) || value.expiresAt !== addLocalCalendarDays(value.startDate, 30)) return { ok: false, reason: "invalid_calendar_window" };
  if (typeof value.timeZone !== "string" || !value.timeZone || !isoTimestamp(value.createdAt) || !isoTimestamp(value.updatedAt)) return { ok: false, reason: "invalid_metadata" };
  const source = value.source;
  if (!isObject(source) || !keysAre(source, ["sourceSchemaVersion", "sourceStatus", "profileKind", "goal", "availableDayTypes"]) || typeof source.sourceSchemaVersion !== "string" || source.sourceStatus !== "calculated" || !member(["ordinary", "athlete"] as const, source.profileKind) || typeof source.goal !== "string" || !Array.isArray(source.availableDayTypes) || !source.availableDayTypes.length || !source.availableDayTypes.every((item) => member(DAY_TYPES, item)) || new Set(source.availableDayTypes).size !== source.availableDayTypes.length) return { ok: false, reason: "invalid_source" };
  if (!Array.isArray(value.entries) || !value.entries.every(isCalibrationEntry)) return { ok: false, reason: "invalid_entries" };
  const dates = value.entries.map((entry) => entry.date);
  if (new Set(dates).size !== dates.length || dates.some((date) => date < value.startDate! || date > value.endDate! || date > today)) return { ok: false, reason: "invalid_entry_date" };
  return { ok: true, value: value as unknown as CalibrationJournal };
}
