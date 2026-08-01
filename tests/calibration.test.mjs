import assert from "node:assert/strict";
import test from "node:test";
import { addLocalCalendarDays, createCalibrationJournal, deriveJournalStatus, elapsedCalendarDays, enumerateLocalDates, formatLocalDate, parseLocalDate } from "../core/calibration/policy.ts";
import { isCalibrationEntry, parseCalibrationJournal } from "../core/calibration/schema.ts";
import { deriveCalibrationSummary } from "../core/calibration/summary.ts";
import { CALIBRATION_ENTRY_SCHEMA } from "../core/calibration/types.ts";

const source = { sourceSchemaVersion: "nutrimind.phase2d1.result.v1", sourceStatus: "calculated", profileKind: "athlete", goal: "maintenance", availableDayTypes: ["rest", "single_training"] };
const journal = (startDate = "2026-03-20") => createCalibrationJournal(source, { journalId: "journal-1", startDate, timeZone: "Europe/Moscow", nowIso: "2026-03-20T08:00:00.000Z" });
const entry = (date = "2026-03-20", overrides = {}) => ({ schemaVersion: CALIBRATION_ENTRY_SCHEMA, date, dayType: "rest", adherence: "mostly", ...overrides });

for (const [name, input, expected] of [
  ["formats a local date", new Date(2026, 0, 2, 12), "2026-01-02"],
  ["adds across month end", ["2026-01-31", 1], "2026-02-01"],
  ["adds across leap day", ["2028-02-28", 1], "2028-02-29"],
  ["adds across spring DST calendar boundary", ["2026-03-28", 1], "2026-03-29"],
  ["adds across autumn DST calendar boundary", ["2026-10-24", 1], "2026-10-25"],
  ["subtracts a calendar day", ["2026-03-01", -1], "2026-02-28"],
]) test(name, () => assert.equal(Array.isArray(input) ? addLocalCalendarDays(...input) : formatLocalDate(input), expected));

for (const [name, value, valid] of [
  ["accepts a valid local date", "2026-08-01", true], ["rejects impossible day", "2026-02-30", false], ["rejects non-padded date", "2026-8-01", false], ["rejects timestamp as date", "2026-08-01T00:00:00Z", false],
]) test(name, () => assert.equal(Boolean(parseLocalDate(value)), valid));

test("enumerates an inclusive fourteen-day window", () => assert.equal(enumerateLocalDates("2026-03-20", "2026-04-02").length, 14));
test("rejects reversed enumeration", () => assert.deepEqual(enumerateLocalDates("2026-04-02", "2026-03-20"), []));
test("counts the start as elapsed day one", () => assert.equal(elapsedCalendarDays("2026-03-20", "2026-03-20"), 1));
test("caps elapsed days at fourteen", () => assert.equal(elapsedCalendarDays("2026-03-20", "2026-05-20"), 14));
test("returns zero before start", () => assert.equal(elapsedCalendarDays("2026-03-20", "2026-03-19"), 0));
test("creates end at start plus thirteen", () => assert.equal(journal().endDate, "2026-04-02"));
test("creates expiry at start plus thirty", () => assert.equal(journal().expiresAt, "2026-04-19"));
test("consent is versioned", () => assert.equal(journal().consentVersion, "nutrimind.phase2d2a.consent.v1"));
test("new journal is collecting", () => assert.equal(journal().status, "collecting"));
test("journal contains only minimal source keys", () => assert.deepEqual(Object.keys(journal().source).sort(), ["availableDayTypes", "goal", "profileKind", "sourceSchemaVersion", "sourceStatus"].sort()));

for (const [name, override, expected] of [
  ["accepts minimal entry", {}, true], ["accepts lower weight bound", { bodyWeightKg: 10 }, true], ["accepts upper weight bound", { bodyWeightKg: 500 }, true],
  ["rejects below weight bound", { bodyWeightKg: 9.9 }, false], ["rejects above weight bound", { bodyWeightKg: 500.1 }, false], ["rejects infinite weight", { bodyWeightKg: Infinity }, false],
  ["rejects unknown day type", { dayType: "gym" }, false], ["rejects unknown adherence", { adherence: "yes" }, false], ["rejects free text field", { notes: "text" }, false],
  ["accepts all optional enums", { actualTraining: "double", weightCondition: "morning_fasted", hunger: "high", energy: "normal", sleep: "good", recovery: "fair", trainingQuality: "not_applicable", overallWellbeing: "good", atypicalContext: "travel" }, true],
]) test(name, () => assert.equal(isCalibrationEntry(entry("2026-03-20", override)), expected));

test("valid journal parses", () => assert.equal(parseCalibrationJournal(journal(), "2026-03-20").ok, true));
for (const [name, mutate, reason] of [
  ["unsupported schema fails closed", (x) => { x.schemaVersion = "v2"; }, "unsupported_schema"],
  ["wrong end date fails closed", (x) => { x.endDate = "2026-04-03"; }, "invalid_calendar_window"],
  ["wrong expiry fails closed", (x) => { x.expiresAt = "2026-04-20"; }, "invalid_calendar_window"],
  ["extra journal property fails closed", (x) => { x.secret = 1; }, "invalid_shape"],
  ["nutrition source value fails closed", (x) => { x.source.energyKcal = 2000; }, "invalid_source"],
  ["future entry fails closed", (x) => { x.entries = [entry("2026-03-21")]; }, "invalid_entry_date"],
  ["outside-window entry fails closed", (x) => { x.entries = [entry("2026-04-03")]; }, "invalid_entry_date"],
  ["duplicate date fails closed", (x) => { x.entries = [entry(), entry()]; }, "invalid_entry_date"],
]) test(name, () => { const value = structuredClone(journal()); mutate(value); const result = parseCalibrationJournal(value, "2026-03-20"); assert.equal(result.ok, false); if (!result.ok) assert.equal(result.reason, reason); });

test("status stays collecting on days one through thirteen", () => assert.equal(deriveJournalStatus(journal(), "2026-04-01"), "collecting"));
test("day fourteen with no entries is ready for summary", () => assert.equal(deriveJournalStatus(journal(), "2026-04-02"), "ready_for_summary"));
test("day fourteen with an entry is observation complete", () => { const value = journal(); value.entries = [entry()]; assert.equal(deriveJournalStatus(value, "2026-04-02"), "observation_complete"); });
test("day after expiry is expired", () => assert.equal(deriveJournalStatus(journal(), "2026-04-20"), "expired"));
test("safety stop remains frozen before expiry", () => { const value = journal(); value.status = "safety_context_changed"; assert.equal(deriveJournalStatus(value, "2026-03-21"), "safety_context_changed"); });

test("collecting summary counts elapsed missing dates", () => { const result = deriveCalibrationSummary(journal(), "2026-03-22"); assert.equal(result.status, "collecting"); assert.equal(result.elapsedDays, 3); assert.equal(result.missingDates.length, 3); });
test("zero entries after window is insufficient data", () => assert.equal(deriveCalibrationSummary(journal(), "2026-04-02").status, "insufficient_data"));
test("one entry after window completes observation", () => { const value = journal(); value.entries = [entry()]; assert.equal(deriveCalibrationSummary(value, "2026-04-02").status, "observation_complete"); });
test("same-date replacement yields one logged day", () => { const value = journal(); value.entries = [entry("2026-03-20", { adherence: "fully" })]; const replacement = entry("2026-03-20", { adherence: "partly" }); value.entries = [...value.entries.filter((x) => x.date !== replacement.date), replacement]; assert.equal(deriveCalibrationSummary(value, "2026-03-20").loggedDays, 1); });
test("summary sorts dated weights without trend", () => { const value = journal(); value.entries = [entry("2026-03-21", { bodyWeightKg: 71 }), entry("2026-03-20", { bodyWeightKg: 72, weightCondition: "morning_fasted" })]; const result = deriveCalibrationSummary(value, "2026-03-21"); assert.deepEqual(result.weights.map((x) => x.date), ["2026-03-20", "2026-03-21"]); assert.equal("trend" in result, false); });
test("summary counts categories deterministically", () => { const value = journal(); value.entries = [entry("2026-03-20", { energy: "low" }), entry("2026-03-21", { energy: "low" })]; assert.equal(deriveCalibrationSummary(value, "2026-03-21").categoryCounts.energy.low, 2); });
test("summary counts atypical context", () => { const value = journal(); value.entries = [entry("2026-03-20", { atypicalContext: "illness" }), entry("2026-03-21", { atypicalContext: "none" })]; assert.equal(deriveCalibrationSummary(value, "2026-03-21").atypicalContextDays, 1); });
test("summary is explicitly observation only", () => assert.ok(deriveCalibrationSummary(journal(), "2026-03-20").warnings.includes("observation_only")));
test("summary never contains adjustment output", () => { const result = deriveCalibrationSummary(journal(), "2026-03-20"); assert.equal("adjustment" in result, false); assert.equal("recommendation" in result, false); });
test("summary reports frozen safety state", () => { const value = journal(); value.status = "safety_context_changed"; assert.equal(deriveCalibrationSummary(value, "2026-03-21").status, "safety_context_changed"); });
test("summary reports expired state", () => assert.equal(deriveCalibrationSummary(journal(), "2026-04-20").status, "expired"));
