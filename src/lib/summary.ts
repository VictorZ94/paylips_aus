import type {
  BreakdownSlice,
  Filters,
  Payslip,
  Summary,
  WeeklyPoint,
} from "./types";
import { isoAddDays, isoToday, isoYearStartAU } from "./format";
import { palette } from "../app/theme";

function toDate(iso: string): number {
  return new Date(iso + "T00:00:00").getTime();
}

export function resolveRange(
  filters: Filters,
  all: Payslip[],
): { start: string; end: string } {
  if (all.length === 0) {
    const t = isoToday();
    return { start: t, end: t };
  }
  const earliest = all[0].startDate;
  const latest = all[all.length - 1].endDate;
  const today = isoToday();
  const end = latest > today ? today : latest;

  switch (filters.preset) {
    case "7d":
      return { start: isoAddDays(end, -6), end };
    case "30d":
      return { start: isoAddDays(end, -29), end };
    case "ytd":
      return { start: isoYearStartAU(end), end };
    case "custom": {
      const s = filters.start || earliest;
      const e = filters.end || end;
      return s <= e ? { start: s, end: e } : { start: e, end: s };
    }
    case "all":
    default:
      return { start: earliest, end };
  }
}

export function filterPayslips(
  payslips: Payslip[],
  filters: Filters,
): Payslip[] {
  const { start, end } = resolveRange(filters, payslips);
  const sMs = toDate(start);
  const eMs = toDate(end);
  return payslips.filter((p) => {
    const pMs = toDate(p.startDate);
    return pMs >= sMs && pMs <= eMs;
  });
}

export function computeSummary(
  payslips: Payslip[],
  filters: Filters,
): Summary {
  const { start, end } = resolveRange(filters, payslips);
  const filtered = filterPayslips(payslips, filters);

  let totalEarned = 0;
  let hours = 0;
  let taxWithheld = 0;
  let superTotal = 0;
  let allowancesTotal = 0;

  const weekly: WeeklyPoint[] = [];
  for (const p of filtered) {
    totalEarned += p.totalEarned;
    hours += p.hoursWorked;
    taxWithheld += p.taxWithheld;
    superTotal += p.super;
    allowancesTotal += p.laundryAllowances;
    weekly.push({
      start: p.startDate,
      end: p.endDate,
      totalEarned: p.totalEarned,
      net: p.totalEarned,
      tax: p.taxWithheld,
      hours: p.hoursWorked,
      earns: p.earns,
      laundryAllowances: p.laundryAllowances,
      super: p.super,
    });
  }

  const rangeMs = toDate(end) - toDate(start);
  const weeks = Math.max(rangeMs / (7 * 24 * 60 * 60 * 1000), 1);
  const avgPerWeek = totalEarned / weeks;

  const prevEnd = isoAddDays(start, -1);
  const prevStart =
    filters.preset === "all"
      ? isoAddDays(prevEnd, -Math.max(rangeMs / 86400000, 1))
      : filters.preset === "ytd"
        ? isoYearStartAU(prevEnd)
        : filters.preset === "7d"
          ? isoAddDays(prevEnd, -6)
          : filters.preset === "30d"
            ? isoAddDays(prevEnd, -29)
            : isoAddDays(prevEnd, -Math.max(rangeMs / 86400000, 1));
  const psMs = toDate(prevStart);
  const peMs = toDate(prevEnd);
  let prevTotal = 0;
  for (const p of payslips) {
    const pMs = toDate(p.startDate);
    if (pMs >= psMs && pMs <= peMs) prevTotal += p.totalEarned;
  }
  const prevWindowDelta =
    prevTotal > 0 ? (totalEarned - prevTotal) / prevTotal : null;

  const breakdown: BreakdownSlice[] = [
    { label: "Net", value: totalEarned, color: palette.mint },
    { label: "Tax", value: taxWithheld, color: palette.coral },
    { label: "Super", value: superTotal, color: palette.amber },
    { label: "Laundry", value: allowancesTotal, color: palette.mintDim },
  ];

  return {
    totalEarned,
    netPay: totalEarned,
    hours,
    taxWithheld,
    superTotal,
    allowancesTotal,
    periodCount: filtered.length,
    avgPerWeek,
    prevWindowDelta,
    weekly,
    breakdown,
    rangeStart: start,
    rangeEnd: end,
  };
}

export function computePreviousSummary(
  payslips: Payslip[],
  filters: Filters,
): Summary {
  const shifted: Filters = { ...filters };
  if (filters.preset === "custom") {
    const rangeMs = toDate(filters.end) - toDate(filters.start);
    const spanDays = Math.max(rangeMs / 86400000, 1);
    shifted.start = isoAddDays(filters.start, -Math.ceil(spanDays) - 1);
    shifted.end = isoAddDays(filters.start, -1);
  } else {
    shifted.preset = filters.preset;
  }
  return computeSummary(payslips, shifted);
}