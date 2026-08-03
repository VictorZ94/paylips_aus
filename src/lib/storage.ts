import type { Payslip } from "./types";
import { SAMPLE_PAYSLIPS } from "./sample";

const KEY = "paylips_aus.v1";
const listeners = new Set<() => void>();
let cache: Payslip[] | null = null;

function readStorageRaw(): Payslip[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.every(
      (r) =>
        r &&
        typeof r === "object" &&
        typeof r.id === "string" &&
        typeof r.startDate === "string" &&
        typeof r.endDate === "string",
    );
    return valid ? (parsed as Payslip[]) : null;
  } catch {
    return null;
  }
}

export function subscribe(notify: () => void): () => void {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

export function getSnapshot(): Payslip[] {
  if (cache === null) {
    cache = readStorageRaw() ?? SAMPLE_PAYSLIPS;
  }
  return cache;
}

export function getServerSnapshot(): Payslip[] {
  return SAMPLE_PAYSLIPS;
}

export function commitSnapshot(rows: Payslip[]): void {
  cache = rows;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(rows));
    } catch {
      // quota exceeded — ignore
    }
  }
  listeners.forEach((l) => l());
}

export function resetSnapshot(): void {
  cache = [];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  }
  listeners.forEach((l) => l());
}