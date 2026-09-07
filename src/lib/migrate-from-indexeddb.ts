"use client";

import type { Payslip } from "./types";

const LEGACY_DB_NAME = "paylips_aus";
const LEGACY_STORE = "payslips";
const MIGRATION_FLAG = "paylips_aus.migratedToFirestore";

interface RawRow {
  id?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  hoursWorked?: unknown;
  earns?: unknown;
  laundryAllowances?: unknown;
  taxWithheld?: unknown;
  super?: unknown;
  totalEarned?: unknown;
  company?: unknown;
}

function openLegacyDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    let req: IDBOpenDBRequest;
    try {
      req = window.indexedDB.open(LEGACY_DB_NAME);
    } catch {
      resolve(null);
      return;
    }
    req.onerror = () => resolve(null);
    req.onsuccess = () => resolve(req.result);
  });
}

function readLegacyRows(): Promise<Payslip[]> {
  return openLegacyDb().then(
    (db) =>
      new Promise<Payslip[]>((resolve) => {
        if (!db) {
          resolve([]);
          return;
        }
        if (!db.objectStoreNames.contains(LEGACY_STORE)) {
          db.close();
          resolve([]);
          return;
        }
        let tx: IDBTransaction;
        try {
          tx = db.transaction(LEGACY_STORE, "readonly");
        } catch {
          db.close();
          resolve([]);
          return;
        }
        const store = tx.objectStore(LEGACY_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          db.close();
          const rows: Payslip[] = [];
          for (const raw of (req.result as RawRow[] | undefined) ?? []) {
            if (!raw || typeof raw.id !== "string") continue;
            rows.push({
              id: raw.id,
              startDate: String(raw.startDate ?? ""),
              endDate: String(raw.endDate ?? ""),
              hoursWorked: Number(raw.hoursWorked ?? 0),
              earns: Number(raw.earns ?? 0),
              laundryAllowances: Number(raw.laundryAllowances ?? 0),
              taxWithheld: Number(raw.taxWithheld ?? 0),
              super: Number(raw.super ?? 0),
              totalEarned: Number(raw.totalEarned ?? 0),
              company:
                typeof raw.company === "string" && raw.company
                  ? raw.company
                  : "Unknown",
            });
          }
          resolve(rows);
        };
        req.onerror = () => {
          db.close();
          resolve([]);
        };
      }),
  );
}

function wipeLegacyDb(): Promise<void> {
  return openLegacyDb().then(
    (db) =>
      new Promise<void>((resolve) => {
        if (!db) {
          resolve();
          return;
        }
        if (!db.objectStoreNames.contains(LEGACY_STORE)) {
          db.close();
          resolve();
          return;
        }
        try {
          const tx = db.transaction(LEGACY_STORE, "readwrite");
          tx.objectStore(LEGACY_STORE).clear();
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => {
            db.close();
            resolve();
          };
        } catch {
          db.close();
          resolve();
        }
      }),
  );
}

function isMigrated(): boolean {
  try {
    return window.localStorage.getItem(MIGRATION_FLAG) === "1";
  } catch {
    return true;
  }
}

function setMigrated(): void {
  try {
    window.localStorage.setItem(MIGRATION_FLAG, "1");
  } catch {
    // ignore
  }
}

export async function runMigrationOnce(): Promise<void> {
  if (typeof window === "undefined") return;
  if (isMigrated()) return;
  const rows = await readLegacyRows();
  if (rows.length === 0) {
    setMigrated();
    return;
  }
  const { payslipsRepo } = await import("./payslips-repo");
  try {
    await payslipsRepo.putAll(rows);
    await wipeLegacyDb();
  } catch {
    return;
  }
  setMigrated();
}
