import type { Payslip } from "./types";

export function mergeByPeriod(
  existing: Payslip[],
  incoming: Payslip[],
): { merged: Payslip[]; added: number; updated: number } {
  const map = new Map<string, Payslip>();
  for (const row of existing) map.set(row.id, row);
  let added = 0;
  let updated = 0;
  for (const row of incoming) {
    if (map.has(row.id)) {
      map.set(row.id, row);
      updated++;
    } else {
      map.set(row.id, row);
      added++;
    }
  }
  const merged = Array.from(map.values()).sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  return { merged, added, updated };
}