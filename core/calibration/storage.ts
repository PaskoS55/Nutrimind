"use client";

import { deriveJournalStatus, todayLocalDate } from "./policy.ts";
import { parseCalibrationJournal } from "./schema.ts";
import type { CalibrationJournal } from "./types.ts";

const DATABASE_NAME = "nutrimind-calibration";
const DATABASE_VERSION = 1;
const STORE_NAME = "journals";
const ACTIVE_KEY = "active";

export type JournalLoadResult = { kind: "empty" } | { kind: "available"; journal: CalibrationJournal } | { kind: "expired"; journal: CalibrationJournal } | { kind: "corrupt"; reason: string } | { kind: "unavailable"; reason: string };

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("indexeddb_unavailable"));
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexeddb_open_failed"));
    request.onblocked = () => reject(new Error("indexeddb_blocked"));
  });
}

export async function loadActiveJournal(today = todayLocalDate()): Promise<JournalLoadResult> {
  try {
    const db = await openDatabase();
    const raw = await new Promise<unknown>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(ACTIVE_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (raw === undefined) return { kind: "empty" };
    const parsed = parseCalibrationJournal(raw, today);
    if (!parsed.ok) return { kind: "corrupt", reason: parsed.reason };
    const status = deriveJournalStatus(parsed.value, today);
    const journal = status === parsed.value.status ? parsed.value : { ...parsed.value, status };
    return status === "expired" ? { kind: "expired", journal } : { kind: "available", journal };
  } catch (error) { return { kind: "unavailable", reason: error instanceof Error ? error.message : "indexeddb_failed" }; }
}

export async function saveActiveJournal(journal: CalibrationJournal, today = todayLocalDate()): Promise<void> {
  const parsed = parseCalibrationJournal(journal, today);
  if (!parsed.ok) throw new Error(parsed.reason);
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(journal, ACTIVE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("indexeddb_write_failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("indexeddb_write_aborted"));
  });
  db.close();
}

export async function deleteActiveJournal(): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(ACTIVE_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("indexeddb_delete_failed"));
  });
  db.close();
}
