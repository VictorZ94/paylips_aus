import type { WeeklyPoint } from "./types";

export type HoursMode = "week" | "fortnight" | "month";

export interface HoursBucket {
  label: string;
  iso: string;
  hours: number;
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function dayMonthLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
}

function monthYearLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function startOfMonth(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function bucketHours(
  weekly: WeeklyPoint[],
  mode: HoursMode,
): HoursBucket[] {
  if (weekly.length === 0) return [];

  if (mode === "week") {
    return weekly.map((w) => ({
      label: dayMonthLabel(w.start),
      iso: w.start,
      hours: w.hours,
    }));
  }

  if (mode === "fortnight") {
    const out: HoursBucket[] = [];
    for (let i = 0; i < weekly.length; i += 2) {
      const a = weekly[i];
      const b = weekly[i + 1];
      const hours = a.hours + (b ? b.hours : 0);
      out.push({ label: dayMonthLabel(a.start), iso: a.start, hours });
    }
    return out;
  }

  // month
  const map = new Map<string, HoursBucket>();
  for (const w of weekly) {
    const key = monthKey(w.start);
    const iso = startOfMonth(w.start);
    const prev = map.get(key);
    if (prev) {
      prev.hours += w.hours;
    } else {
      map.set(key, { label: monthYearLabel(iso), iso, hours: w.hours });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.iso.localeCompare(b.iso));
}

export const WEEKLY_HOURS_THRESHOLD = 24;

export const HOURS_PER_BUCKET: Record<HoursMode, number> = {
  week: WEEKLY_HOURS_THRESHOLD,
  fortnight: WEEKLY_HOURS_THRESHOLD * 2,
  month: Math.round(WEEKLY_HOURS_THRESHOLD * 4.33),
};

export function thresholdLabel(mode: HoursMode): string {
  const value = HOURS_PER_BUCKET[mode];
  if (mode === "week") return `${value}h / week`;
  if (mode === "fortnight") return `${value}h / fortnight`;
  return `${value}h / month`;
}