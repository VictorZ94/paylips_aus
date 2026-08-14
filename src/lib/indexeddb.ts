"use client";

import type { Payslip } from "./types";

const DB_NAME = "paylips_aus";
const DB_VERSION = 1;
const STORE_NAME = "payslips";
const LEGACY_LS_KEY = "paylips_aus.v1";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable on server"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("byStartDate", "startDate", { unique: false });
        store.createIndex("byEndDate", "endDate", { unique: false });
      }
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
  return dbPromise;
}

function wipeLegacyStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_LS_KEY);
  } catch {
    // ignore
  }
}

async function getAllRows(): Promise<Payslip[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      wipeLegacyStorage();
      const rows = (req.result as Payslip[] | undefined) ?? [];
      rows.sort((a, b) => a.startDate.localeCompare(b.startDate));
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

async function putAllRows(rows: Payslip[]): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const row of rows) {
      store.put(row);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function clearAllRows(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export const indexedDb = {
  getAll: getAllRows,
  putAll: putAllRows,
  clear: clearAllRows,
};