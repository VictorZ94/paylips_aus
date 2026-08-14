"use client";

import { useSyncExternalStore } from "react";
import type { Payslip } from "./types";
import { SAMPLE_PAYSLIPS } from "./sample";
import { indexedDb } from "./indexeddb";

const listeners = new Set<() => void>();
let cache: Payslip[] | null = null;
let inflight: Promise<void> | null = null;

function notify(): void {
  listeners.forEach((l) => l());
}

async function ensureLoaded(): Promise<void> {
  if (cache) return;
  if (inflight) return inflight;
  inflight = indexedDb
    .getAll()
    .then((rows) => {
      cache = rows.length > 0 ? rows : SAMPLE_PAYSLIPS;
      notify();
    })
    .catch(() => {
      cache = SAMPLE_PAYSLIPS;
      notify();
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function getCachedSnapshot(): Payslip[] {
  if (cache) return cache;
  void ensureLoaded();
  return SAMPLE_PAYSLIPS;
}

export function subscribe(notifyFn: () => void): () => void {
  listeners.add(notifyFn);
  if (!cache) {
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
  return SAMPLE_PAYSLIPS;
}

export async function commitSnapshot(rows: Payslip[]): Promise<void> {
  cache = rows;
  notify();
  try {
    await indexedDb.putAll(rows);
  } catch {
    // ignore — already updated in cache
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