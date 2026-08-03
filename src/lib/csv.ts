import type { Payslip } from "./types";

const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;
const DATE_AU = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

function parseDate(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (DATE_ISO.test(v)) return v;
  const m = DATE_AU.exec(v);
  if (m) {
    const dd = m[1].padStart(2, "0");
    const mm = m[2].padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }
  return null;
}

function parseNumber(raw: string): number {
  const v = raw.trim().replace(/[$,\s]/g, "");
  if (v === "" || v === "-") return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += c;
      }
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else if (c === '"' && cur === "") {
      inQ = true;
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function headerIndex(header: string[]): {
  start: number;
  end: number;
  hours: number;
  earns: number;
  allowances: number;
  tax: number;
  super: number;
  total: number;
} {
  const h = header.map((x) => x.toLowerCase());
  const find = (re: RegExp): number => h.findIndex((x) => re.test(x));
  return {
    start: find(/^(start|date\s*from|period\s*start)/),
    end: find(/^(finish|end|date\s*to|period\s*end)/),
    hours: find(/(t\/h|hours?\s*per\s*week|hours?)/),
    earns: find(/^earns?$|earnings?|gross/),
    allowances: find(/allowances?/),
    tax: find(/tax/),
    super: find(/super/),
    total: find(/total.*(earned|net)|net.*total/),
  };
}

export interface CsvParseResult {
  rows: Payslip[];
  skipped: number;
}

export function parseCsv(text: string): CsvParseResult {
  if (!text) return { rows: [], skipped: 0 };
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], skipped: 0 };

  const header = parseCsvLine(lines[0]);
  const idx = headerIndex(header);

  if (idx.start < 0 || idx.end < 0 || idx.total < 0) {
    return { rows: [], skipped: lines.length - 1 };
  }

  const rows: Payslip[] = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.every((c) => c === "")) continue;
    const s = parseDate(cells[idx.start] ?? "");
    const e = parseDate(cells[idx.end] ?? "");
    if (!s || !e) {
      skipped++;
      continue;
    }
    const earns = idx.earns >= 0 ? parseNumber(cells[idx.earns] ?? "0") : 0;
    const allowances =
      idx.allowances >= 0 ? parseNumber(cells[idx.allowances] ?? "0") : 0;
    const taxWithheld = idx.tax >= 0 ? parseNumber(cells[idx.tax] ?? "0") : 0;
    const superRate = idx.super >= 0 ? parseNumber(cells[idx.super] ?? "0") : 0;
    const totalEarned = parseNumber(cells[idx.total] ?? "0");
    const hoursPerWeek =
      idx.hours >= 0 ? parseNumber(cells[idx.hours] ?? "0") : 0;
    rows.push({
      id: `${s}|${e}`,
      startDate: s,
      endDate: e,
      hoursPerWeek,
      earns,
      allowances,
      taxWithheld,
      superRate,
      totalEarned,
    });
  }

  rows.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return { rows, skipped };
}

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

export function isLikelyCsv(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return true;
  if (file.type === "text/csv") return true;
  if (file.type === "" && name.endsWith(".txt")) return true;
  return false;
}