"use client";

import { useSyncExternalStore } from "react";
import type { Payslip } from "./types";
import { payslipsRepo } from "./payslips-repo";
import { getFirebaseAuth } from "./firebase/client";
import { runMigrationOnce } from "./migrate-from-indexeddb";

const EMPTY: Payslip[] = [];

const listeners = new Set<() => void>();
let cache: Payslip[] | null = null;
let inflight: Promise<void> | null = null;
let currentUid: string | null = null;

function notify(): void {
  listeners.forEach((l) => l());
}

function currentUserUid(): string | null {
  return getFirebaseAuth()?.currentUser?.uid ?? null;
}

function handleAuthChanged(): void {
  const uid = currentUserUid();
  if (uid === currentUid) return;
  currentUid = uid;
  cache = uid ? null : EMPTY;
  inflight = null;
  notify();
  if (uid) {
    void ensureLoaded();
  }
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
      await runMigrationOnce();
    } catch {
      // ignore migration failures; data still loads from Firestore
    }
    try {
      const rows = await payslipsRepo.getAll();
      cache = rows;
    } catch {
      cache = EMPTY;
    }
    notify();
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

function getCachedSnapshot(): Payslip[] {
  if (cache === null) {
    void ensureLoaded();
    return EMPTY;
  }
  return cache;
}

let authSubInitialized = false;
function initAuthWatcher(): void {
  if (authSubInitialized) return;
  if (typeof window === "undefined") return;
  authSubInitialized = true;
  const auth = getFirebaseAuth();
  if (!auth) return;
  auth.onAuthStateChanged(() => {
    handleAuthChanged();
  });
}

export function subscribe(notifyFn: () => void): () => void {
  initAuthWatcher();
  listeners.add(notifyFn);
  if (cache === null) {
    void ensureLoaded();
  }
  return () => {
    listeners.delete(notifyFn);
  };
}

export function getSnapshot(): Payslip[] {
  return getCachedSnapshot();
}

export function getServerSnapshot(): Payslip[] {
  return EMPTY;
}

export async function commitSnapshot(rows: Payslip[]): Promise<void> {
  if (!currentUserUid()) {
    cache = rows;
    notify();
    return;
  }
  cache = rows;
  notify();
  try {
    await payslipsRepo.putAll(rows);
  } catch {
    // cache already updated; Firestore write will be retried on next commit
  }
}

export async function resetSnapshot(): Promise<void> {
  if (!currentUserUid()) {
    cache = [];
    notify();
    return;
  }
  cache = [];
  notify();
  try {
    await payslipsRepo.clear();
  } catch {
    // ignore
  }
}

export function usePayslips(): Payslip[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
