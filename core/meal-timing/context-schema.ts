import { PHASE3A2_CONTEXT_SCHEMA_VERSION, type Phase3A2Context } from "./types.ts";

const mappings: Record<number, Extract<Phase3A2Context, { status: "available" }>> = {
  0: { schemaVersion: PHASE3A2_CONTEXT_SCHEMA_VERSION, status: "available", trainingTimeContext: "morning", displayLabel: "утром" },
  1: { schemaVersion: PHASE3A2_CONTEXT_SCHEMA_VERSION, status: "available", trainingTimeContext: "daytime", displayLabel: "днём" },
  2: { schemaVersion: PHASE3A2_CONTEXT_SCHEMA_VERSION, status: "available", trainingTimeContext: "evening", displayLabel: "вечером" },
};

export function normalizeTrainingTimeContext(value: unknown): Phase3A2Context {
  if (value === undefined || value === null || value === "") return { schemaVersion: PHASE3A2_CONTEXT_SCHEMA_VERSION, status: "not_provided" };
  if (typeof value === "number" && Object.hasOwn(mappings, value)) return { ...mappings[value] };
  return { schemaVersion: PHASE3A2_CONTEXT_SCHEMA_VERSION, status: "unsupported", errorCode: "QUESTIONNAIRE_UNSUPPORTED_TRAINING_TIME_VALUE" };
}

const exactKeys = (value: Record<string, unknown>, expected: string[]) => Object.keys(value).length === expected.length && expected.every((key) => Object.hasOwn(value, key));

export function isCompatiblePhase3A2Context(value: unknown): value is Phase3A2Context {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.schemaVersion !== PHASE3A2_CONTEXT_SCHEMA_VERSION) return false;
  if (record.status === "not_provided") return exactKeys(record, ["schemaVersion", "status"]);
  if (record.status === "unsupported") return exactKeys(record, ["schemaVersion", "status", "errorCode"]) && record.errorCode === "QUESTIONNAIRE_UNSUPPORTED_TRAINING_TIME_VALUE";
  if (record.status !== "available" || !exactKeys(record, ["schemaVersion", "status", "trainingTimeContext", "displayLabel"])) return false;
  return (record.trainingTimeContext === "morning" && record.displayLabel === "утром")
    || (record.trainingTimeContext === "daytime" && record.displayLabel === "днём")
    || (record.trainingTimeContext === "evening" && record.displayLabel === "вечером");
}
