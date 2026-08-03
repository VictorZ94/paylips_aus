const aud = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 2,
});

const audWhole = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const num2 = new Intl.NumberFormat("en-AU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num4 = new Intl.NumberFormat("en-AU", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const pct = new Intl.NumberFormat("en-AU", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function fmtAud(n: number): string {
  return aud.format(Number.isFinite(n) ? n : 0);
}

export function fmtAudWhole(n: number): string {
  return audWhole.format(Number.isFinite(n) ? n : 0);
}

export function fmtNum2(n: number): string {
  return num2.format(Number.isFinite(n) ? n : 0);
}

export function fmtNum4(n: number): string {
  return num4.format(Number.isFinite(n) ? n : 0);
}

export function fmtPct(fraction: number): string {
  return pct.format(Number.isFinite(fraction) ? fraction : 0);
}

export function fmtSigned(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0.0%";
  const sign = n > 0 ? "+" : "−";
  return `${sign}${pct.format(Math.abs(n))}`;
}

export function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateShort(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  });
}

export function fmtRange(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return "—";
  const s = new Date(startIso + "T00:00:00");
  const e = new Date(endIso + "T00:00:00");
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "—";
  const sameYear = s.getFullYear() === e.getFullYear();
  const optsStart: Intl.DateTimeFormatOptions = sameYear
    ? { day: "2-digit", month: "short" }
    : { day: "2-digit", month: "short", year: "numeric" };
  const startStr = s.toLocaleDateString("en-AU", optsStart);
  const endStr = e.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${startStr} → ${endStr}`;
}

export function isoToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isoAddDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isoYearStartAU(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const m = d.getMonth();
  const y = d.getFullYear();
  const fyStartYear = m >= 6 ? y : y - 1;
  return `${fyStartYear}-07-01`;
}