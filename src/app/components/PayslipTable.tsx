"use client";

import { memo, useMemo, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import { palette } from "../theme";
import type { Payslip } from "../../lib/types";
import {
  fmtAud,
  fmtAudWhole,
  fmtDateShort,
  fmtNum2,
  fmtNum4,
} from "../../lib/format";

type SortKey =
  | "period"
  | "hours"
  | "earns"
  | "laundry"
  | "tax"
  | "super"
  | "total";

type SortDir = "asc" | "desc";

interface PayslipTableProps {
  rows: Payslip[];
}

interface ColDef {
  key: SortKey;
  label: string;
  align: "left" | "right";
  numeric: boolean;
  hint?: string;
}

const COLUMNS: ColDef[] = [
  { key: "period", label: "Period", align: "left", numeric: false },
  { key: "hours", label: "Hours", align: "right", numeric: true, hint: "Total hours worked" },
  { key: "earns", label: "Gross", align: "right", numeric: true },
  { key: "laundry", label: "Laundry", align: "right", numeric: true },
  { key: "tax", label: "Tax", align: "right", numeric: true, hint: "Tax withheld" },
  { key: "super", label: "Super", align: "right", numeric: true },
  { key: "total", label: "Net", align: "right", numeric: true, hint: "Total earned" },
];

function compare(a: Payslip, b: Payslip, key: SortKey, dir: SortDir): number {
  const sign = dir === "asc" ? 1 : -1;
  switch (key) {
    case "period":
      return sign * a.startDate.localeCompare(b.startDate);
    case "hours":
      return sign * (a.hoursWorked - b.hoursWorked);
    case "earns":
      return sign * (a.earns - b.earns);
    case "laundry":
      return sign * (a.laundryAllowances - b.laundryAllowances);
    case "tax":
      return sign * (a.taxWithheld - b.taxWithheld);
    case "super":
      return sign * (a.super - b.super);
    case "total":
      return sign * (a.totalEarned - b.totalEarned);
  }
}

function CellValue({
  row,
  keyName,
}: {
  row: Payslip;
  keyName: SortKey;
}): React.ReactElement {
  switch (keyName) {
    case "period":
      return (
        <Box>
          <Typography sx={{ fontSize: 13, color: palette.text, fontWeight: 500 }}>
            {fmtDateShort(row.startDate)}
            <Box component="span" sx={{ color: palette.textDim, mx: 0.5 }}>→</Box>
            {fmtDateShort(row.endDate)}
          </Typography>
          <Typography
            className="tabular"
            sx={{
              fontSize: 10.5,
              color: palette.textDim,
              letterSpacing: "0.04em",
            }}
          >
            {row.id}
          </Typography>
        </Box>
      );
    case "hours":
      return <>{fmtNum4(row.hoursWorked)}</>;
    case "earns":
      return <>{fmtAud(row.earns)}</>;
    case "laundry":
      return <>{row.laundryAllowances === 0 ? "—" : fmtAud(row.laundryAllowances)}</>;
    case "tax":
      return <>{fmtAud(row.taxWithheld)}</>;
    case "super":
      return <>{fmtAud(row.super)}</>;
    case "total":
      return (
        <Box sx={{ color: palette.mint, fontWeight: 600 }}>
          {fmtAud(row.totalEarned)}
        </Box>
      );
  }
}

const PayslipTableInner = function PayslipTable({ rows }: PayslipTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("period");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const onSort = useCallback(
    (key: SortKey) => () => {
      if (key === sortKey) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir(key === "period" ? "desc" : "desc");
      }
    },
    [sortKey],
  );

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => compare(a, b, sortKey, sortDir)),
    [rows, sortKey, sortDir],
  );

  const totals = useMemo(() => {
    let hours = 0;
    let earns = 0;
    let laundry = 0;
    let tax = 0;
    let sup = 0;
    let total = 0;
    for (const r of rows) {
      hours += r.hoursWorked;
      earns += r.earns;
      laundry += r.laundryAllowances;
      tax += r.taxWithheld;
      sup += r.super;
      total += r.totalEarned;
    }
    return { hours, earns, laundry, tax, sup, total };
  }, [rows]);

  if (rows.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          color: palette.textDim,
          border: `1px dashed ${palette.border}`,
          borderRadius: 3,
          backgroundColor: palette.surfaceLow,
        }}
      >
        <Typography sx={{ fontSize: 13 }}>No payslips in this range.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surface,
        overflow: "hidden",
      }}
    >
      <TableContainer sx={{ maxHeight: 520 }}>
        <Table size="small" stickyHeader aria-label="Payslip rows">
          <TableHead>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableCell
                  key={c.key}
                  align={c.align}
                  sx={{
                    backgroundColor: palette.surfaceLow,
                    borderBottom: `1px solid ${palette.border}`,
                    color: palette.textMute,
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    py: 1.25,
                  }}
                >
                  <TableSortLabel
                    active={sortKey === c.key}
                    direction={sortKey === c.key ? sortDir : "asc"}
                    onClick={onSort(c.key)}
                    sx={{
                      color: "inherit",
                      "&.Mui-active": { color: palette.mint },
                      "& .MuiTableSortLabel-icon": { color: `${palette.mint} !important` },
                    }}
                  >
                    {c.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row, idx) => (
              <TableRow
                key={row.id}
                hover
                sx={{
                  "&:hover": { backgroundColor: `${palette.mint}08 !important` },
                  "& td": {
                    borderBottom:
                      idx === sortedRows.length - 1
                        ? "none"
                        : `1px solid ${palette.border}`,
                  },
                }}
              >
                {COLUMNS.map((c) => (
                  <TableCell
                    key={c.key}
                    align={c.align}
                    sx={{
                      color: palette.text,
                      py: 1.25,
                      fontSize: 13,
                      fontFamily: c.numeric
                        ? 'var(--font-geist-mono), ui-monospace, monospace'
                        : "inherit",
                      fontVariantNumeric: c.numeric ? "tabular-nums" : "normal",
                      whiteSpace: "nowrap",
                      contentVisibility: "auto",
                    }}
                  >
                    <CellValue row={row} keyName={c.key} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          px: 2,
          py: 1.25,
          backgroundColor: palette.surfaceLow,
          borderTop: `1px solid ${palette.border}`,
        }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: 1 }}
        >
          <Typography
            sx={{
              fontSize: 10.5,
              color: palette.textDim,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Totals ({rows.length})
          </Typography>
          <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
            <SummaryStat label="Hours" value={fmtNum2(totals.hours)} />
            <SummaryStat label="Gross" value={fmtAudWhole(totals.earns)} />
            <SummaryStat label="Laundry" value={fmtAudWhole(totals.laundry)} />
            <SummaryStat label="Tax" value={fmtAudWhole(totals.tax)} />
            <SummaryStat label="Super" value={fmtAudWhole(totals.sup)} />
            <SummaryStat label="Net" value={fmtAudWhole(totals.total)} accent />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "baseline" }}>
      <Typography
        sx={{
          fontSize: 10.5,
          color: palette.textDim,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>
      <Typography
        className="tabular"
        sx={{
          fontSize: 13,
          color: accent ? palette.mint : palette.text,
          fontWeight: 600,
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export const PayslipTable = memo(PayslipTableInner);