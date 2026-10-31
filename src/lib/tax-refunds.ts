"use client";

import { useSyncExternalStore } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { TaxRefund } from "./types";
import { getFirebaseAuth, getFirebaseDb } from "./firebase/client";

// Tax refunds live beside payslips at users/{uid}/taxRefunds/{id}. Unlike the
// payslip store, writes are per-document: refunds are few and added by hand.

const COLLECTION = "taxRefunds";
const EMPTY: TaxRefund[] = [];

const listeners = new Set<() => void>();
let cache: TaxRefund[] | null = null;
let inflight: Promise<void> | null = null;
let currentUid: string | null = null;

function notify(): void {
  listeners.forEach((l) => l());
}

function currentUserUid(): string | null {
  return getFirebaseAuth()?.currentUser?.uid ?? null;
}

function refundsCol(uid: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firestore is not configured.");
  return collection(db, "users", uid, COLLECTION);
}

function sortByDate(rows: TaxRefund[]): TaxRefund[] {
  return [...rows].sort((a, b) => a.date.localeCompare(b.date));
}

function coerce(raw: unknown): TaxRefund | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Partial<TaxRefund>;
  if (typeof obj.id !== "string" || typeof obj.date !== "string") return null;
  const amount = Number(obj.amount);
  if (!Number.isFinite(amount)) return null;
  return {
    id: obj.id,
    date: obj.date,
    amount,
    note: typeof obj.note === "string" ? obj.note : "",
  };
}

async function ensureLoaded(): Promise<void> {
  if (cache !== null) return;
  const uid = currentUserUid();
  if (!uid) {
    cache = EMPTY;
    notify();
    return;
  }
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const snap = await getDocs(refundsCol(uid));
      const rows: TaxRefund[] = [];
      for (const d of snap.docs) {
        const row = coerce(d.data());
        if (row) rows.push(row);
      }
      cache = sortByDate(rows);
    } catch {
      cache = EMPTY;
    }
    notify();
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

let authSubInitialized = false;
function initAuthWatcher(): void {
  if (authSubInitialized) return;
  if (typeof window === "undefined") return;
  authSubInitialized = true;
  const auth = getFirebaseAuth();
  if (!auth) return;
  auth.onAuthStateChanged(() => {
    const uid = currentUserUid();
    if (uid === currentUid) return;
    currentUid = uid;
    cache = uid ? null : EMPTY;
    inflight = null;
    notify();
    if (uid) void ensureLoaded();
  });
}

function subscribe(notifyFn: () => void): () => void {
  initAuthWatcher();
  listeners.add(notifyFn);
  if (cache === null) void ensureLoaded();
  return () => {
    listeners.delete(notifyFn);
  };
}

function getSnapshot(): TaxRefund[] {
  if (cache === null) {
    void ensureLoaded();
    return EMPTY;
  }
  return cache;
}

function getServerSnapshot(): TaxRefund[] {
  return EMPTY;
}

export function useTaxRefunds(): TaxRefund[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export async function addTaxRefund(
  input: Omit<TaxRefund, "id">,
): Promise<void> {
  const row: TaxRefund = { ...input, id: crypto.randomUUID() };
  cache = sortByDate([...(cache ?? EMPTY), row]);
  notify();
  const uid = currentUserUid();
  if (!uid) return;
  try {
    await setDoc(doc(refundsCol(uid), row.id), {
      ...row,
      uid,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // cache already updated; same optimistic policy as the payslip store
  }
}

export async function deleteTaxRefund(id: string): Promise<void> {
  cache = (cache ?? EMPTY).filter((r) => r.id !== id);
  notify();
  const uid = currentUserUid();
  if (!uid) return;
  try {
    await deleteDoc(doc(refundsCol(uid), id));
  } catch {
    // ignore
  }
}
