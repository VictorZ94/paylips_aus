export interface Payslip {
  id: string;
  startDate: string;
  endDate: string;
  hoursWorked: number;
  earns: number;
  laundryAllowances: number;
  taxWithheld: number;
  super: number;
  totalEarned: number;
  pdfUrl: string;
}

export type FilterPreset = "7d" | "30d" | "ytd" | "all" | "custom";

export interface Filters {
  preset: FilterPreset;
  start: string;
  end: string;
}

export interface BreakdownSlice {
  label: "Net" | "Tax" | "Super" | "Laundry";
  value: number;
  color: string;
}

export interface WeeklyPoint {
  start: string;
  end: string;
  totalEarned: number;
  net: number;
  tax: number;
  hours: number;
  earns: number;
  laundryAllowances: number;
  super: number;
}

export interface Summary {
  totalEarned: number;
  netPay: number;
  hours: number;
  taxWithheld: number;
  superTotal: number;
  allowancesTotal: number;
  periodCount: number;
  avgPerWeek: number;
  prevWindowDelta: number | null;
  weekly: WeeklyPoint[];
  breakdown: BreakdownSlice[];
  rangeStart: string;
  rangeEnd: string;
}

export interface ChartTheme {
  mint: string;
  mintDim: string;
  coral: string;
  amber: string;
  text: string;
  textMute: string;
  textDim: string;
  border: string;
  borderHi: string;
  surface: string;
  surfaceHi: string;
  ink: string;
}