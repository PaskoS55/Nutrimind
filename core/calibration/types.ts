export const CALIBRATION_JOURNAL_SCHEMA = "nutrimind.phase2d2a.journal.v1" as const;
export const CALIBRATION_ENTRY_SCHEMA = "nutrimind.phase2d2a.entry.v1" as const;
export const CALIBRATION_SUMMARY_SCHEMA = "nutrimind.phase2d2a.summary.v1" as const;
export const CALIBRATION_CONSENT_VERSION = "nutrimind.phase2d2a.consent.v1" as const;

export const DAY_TYPES = ["rest", "single_training", "double_training", "other"] as const;
export const ADHERENCE_VALUES = ["fully", "mostly", "partly", "not_followed"] as const;
export const ACTUAL_TRAINING_VALUES = ["none", "single", "double", "other", "not_provided"] as const;
export const WEIGHT_CONDITIONS = ["morning_fasted", "morning_not_fasted", "other", "not_provided"] as const;
export const THREE_LEVEL_VALUES = ["low", "normal", "high", "not_provided"] as const;
export const SLEEP_VALUES = ["poor", "fair", "good", "not_provided"] as const;
export const RECOVERY_VALUES = ["poor", "fair", "good", "not_provided"] as const;
export const TRAINING_QUALITY_VALUES = ["poor", "fair", "good", "not_applicable", "not_provided"] as const;
export const WELLBEING_VALUES = ["poor", "fair", "good", "not_provided"] as const;
export const ATYPICAL_CONTEXT_VALUES = ["none", "illness", "travel", "competition", "unusual_load", "other", "not_provided"] as const;

export type DayType = typeof DAY_TYPES[number];
export type Adherence = typeof ADHERENCE_VALUES[number];
export type ActualTraining = typeof ACTUAL_TRAINING_VALUES[number];
export type WeightCondition = typeof WEIGHT_CONDITIONS[number];
export type ThreeLevel = typeof THREE_LEVEL_VALUES[number];
export type Sleep = typeof SLEEP_VALUES[number];
export type Recovery = typeof RECOVERY_VALUES[number];
export type TrainingQuality = typeof TRAINING_QUALITY_VALUES[number];
export type OverallWellbeing = typeof WELLBEING_VALUES[number];
export type AtypicalContext = typeof ATYPICAL_CONTEXT_VALUES[number];
export type JournalStatus = "collecting" | "ready_for_summary" | "observation_complete" | "safety_context_changed" | "expired";

export interface CalibrationSource {
  sourceSchemaVersion: string;
  sourceStatus: "calculated";
  profileKind: "ordinary" | "athlete";
  goal: string;
  availableDayTypes: DayType[];
}

export interface CalibrationEntry {
  schemaVersion: typeof CALIBRATION_ENTRY_SCHEMA;
  date: string;
  dayType: DayType;
  adherence: Adherence;
  actualTraining?: ActualTraining;
  bodyWeightKg?: number;
  weightCondition?: WeightCondition;
  hunger?: ThreeLevel;
  energy?: ThreeLevel;
  sleep?: Sleep;
  recovery?: Recovery;
  trainingQuality?: TrainingQuality;
  overallWellbeing?: OverallWellbeing;
  atypicalContext?: AtypicalContext;
}

export interface CalibrationJournal {
  schemaVersion: typeof CALIBRATION_JOURNAL_SCHEMA;
  journalId: string;
  status: JournalStatus;
  consentVersion: typeof CALIBRATION_CONSENT_VERSION;
  startDate: string;
  endDate: string;
  expiresAt: string;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
  source: CalibrationSource;
  entries: CalibrationEntry[];
}

export interface CalibrationSummary {
  schemaVersion: typeof CALIBRATION_SUMMARY_SCHEMA;
  journalId: string;
  status: "collecting" | "insufficient_data" | "observation_complete" | "safety_context_changed" | "expired" | "invalid_input";
  elapsedDays: number;
  loggedDays: number;
  missingDates: string[];
  categoryCounts: Record<string, Record<string, number>>;
  weights: Array<{ date: string; bodyWeightKg: number; condition: WeightCondition | "not_provided" }>;
  atypicalContextDays: number;
  warnings: string[];
  appliedPolicy: { policyId: "nutrimind.phase2d2a.observation-only.v1"; ruleIds: string[] };
}
