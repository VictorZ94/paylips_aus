"use client";

import { useSyncExternalStore } from "react";
import type { Payslip } from "./types";
import { indexedDb } from "./indexeddb";

// Single stable reference for the not-yet-loaded state. Returning a fresh
// `[]` on every call would trigger an infinite loop in useSyncExternalStore.
const EMPTY: Payslip[] = [];

const listeners = new Set<() => void>();
let cache: Payslip[] | null = null;
let inflight: Promise<void> | null = null;

function notify(): void {
  listeners.forEach((l) => l());
}

async function ensureLoaded(): Promise<void> {
  if (cache !== null) return;
  if (inflight) return inflight;
  inflight = indexedDb
    .getAll()
    .then((rows) => {
      cache = rows;
      notify();
    })
    .catch(() => {
      cache = [];
      notify();
    })
    .finally(() => {
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

export function subscribe(notifyFn: () => void): () => void {
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
  cache = rows;
  notify();
  try {
    await indexedDb.putAll(rows);
  } catch {
    // cache already updated; IDB write will be retried on next commit
  }
}

export async function resetSnapshot(): Promise<void> {
  cache = [];
  notify();
  try {
    await indexedDb.clear();
  } catch {
    // ignore
  }
}

export function usePayslips(): Payslip[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}