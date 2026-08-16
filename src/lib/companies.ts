import type { BreakdownSlice, Payslip } from "./types";
import { palette } from "../app/theme";

export const UNKNOWN_COMPANY = "Unknown";

export function distinctCompanies(rows: Payslip[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const c = r.company?.trim();
    if (c) set.add(c);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const COMPANY_PALETTE = [
  palette.mint,
  palette.coral,
  palette.amber,
  palette.mintDim,
];

export function colorForCompany(name: string): string {
  if (name === UNKNOWN_COMPANY) return palette.textDim;
  const idx = hashString(name) % COMPANY_PALETTE.length;
  return COMPANY_PALETTE[idx];
}

export function incomeByCompany(rows: Payslip[]): BreakdownSlice[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.company?.trim() || UNKNOWN_COMPANY;
    map.set(key, (map.get(key) ?? 0) + r.totalEarned);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({
      label,
      value,
      color: colorForCompany(label),
    }))
    .sort((a, b) => b.value - a.value);
}