"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useDeferredValue } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import { palette } from "./theme";
import { Brand } from "./components/Brand";
import { FilterBar } from "./components/FilterBar";
import { KpiRow } from "./components/KpiRow";
import { BreakdownCard, EarningsChartCard } from "./components/ChartCards";
import { PayslipTable } from "./components/PayslipTable";
import { EmptyState } from "./components/EmptyState";
import { UploadCard } from "./components/UploadCard";
import { mergeByPeriod } from "../lib/csv";
import {
  commitSnapshot,
  getServerSnapshot,
  getSnapshot,
  resetSnapshot,
  subscribe,
} from "../lib/storage";
import { computeSummary, filterPayslips } from "../lib/summary";
import { fmtRange, isoToday } from "../lib/format";
import type { Filters, Payslip } from "../lib/types";

const DEFAULT_FILTERS: Filters = {
  preset: "all",
  start: "",
  end: "",
};

export default function Dashboard() {
  const payslips = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [, startTransition] = useTransition();

  const deferredFilters = useDeferredValue(filters);
  const filtered = useMemo(
    () => filterPayslips(payslips, deferredFilters),
    [payslips, deferredFilters],
  );
  const summary = useMemo(
    () => computeSummary(payslips, deferredFilters),
    [payslips, deferredFilters],
  );

  const onFiltersChange = useCallback((next: Filters) => {
    startTransition(() => setFilters(next));
  }, []);

  const onMerge = useCallback(
    (rows: Payslip[]) => {
      const { merged } = mergeByPeriod(payslips, rows);
      commitSnapshot(merged);
    },
    [payslips],
  );

  const onClearAll = useCallback(() => {
    resetSnapshot();
    setConfirmClear(false);
  }, []);

  const onExportCsv = useCallback(() => {
    if (filtered.length === 0) return;
    const header = [
      "start",
      "end",
      "hoursPerWeek",
      "earns",
      "allowances",
      "taxWithheld",
      "superRate",
      "totalEarned",
    ];
    const rows = filtered.map((r) =>
      [
        r.startDate,
        r.endDate,
        r.hoursPerWeek,
        r.earns,
        r.allowances,
        r.taxWithheld,
        r.superRate,
        r.totalEarned,
      ].join(","),
    );
    const csv = `${header.join(",")}\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `paylips_${isoToday()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const onUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onUploadFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = "";
    const { parseCsv, isLikelyCsv } = await import("../lib/csv");
    if (!isLikelyCsv(file)) {
      window.alert("PDF parsing is coming soon. Please upload a CSV file for now.");
      return;
    }
    const text = await file.text();
    const { rows } = parseCsv(text);
    if (rows.length === 0) {
      window.alert("No rows found. Make sure the CSV has a header row.");
      return;
    }
    const { merged } = mergeByPeriod(payslips, rows);
    commitSnapshot(merged);
  }, [payslips]);

  const isEmpty = payslips.length === 0;

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        maxWidth: 1280,
        mx: "auto",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          rowGap: 2,
        }}
      >
        <Brand />
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Tooltip title="Export filtered rows to CSV">
            <span>
              <IconButton
                size="small"
                onClick={onExportCsv}
                disabled={filtered.length === 0}
                aria-label="Export CSV"
              >
                <FileDownloadRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Clear all stored payslips">
            <span>
              <IconButton
                size="small"
                onClick={() => setConfirmClear(true)}
                disabled={payslips.length === 0}
                aria-label="Clear all"
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Reset filters to default">
            <span>
              <IconButton
                size="small"
                onClick={() => setFilters(DEFAULT_FILTERS)}
                aria-label="Reset filters"
              >
                <RestartAltRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {isEmpty ? (
        <EmptyState onPick={onUploadClick} />
      ) : (
        <>
          <Box className="fade-up">
            <UploadCard onMerged={onMerge} />
          </Box>

          <Box className="fade-up" sx={{ animationDelay: "60ms" }}>
            <FilterBar
              filters={filters}
              onChange={onFiltersChange}
              rangeStart={summary.rangeStart}
              rangeEnd={summary.rangeEnd}
              totalPeriods={summary.periodCount}
            />
          </Box>

          <Box className="fade-up" sx={{ animationDelay: "120ms" }}>
            <KpiRow summary={summary} weekly={summary.weekly} />
          </Box>

          <Box
            className="fade-up"
            sx={{
              animationDelay: "180ms",
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", lg: "1.65fr 1fr" },
            }}
          >
            <EarningsChartCard
              weekly={summary.weekly}
              rangeStart={summary.rangeStart}
              rangeEnd={summary.rangeEnd}
            />
            <BreakdownCard slices={summary.breakdown} />
          </Box>

          <Box className="fade-up" sx={{ animationDelay: "240ms" }}>
            <PayslipTable rows={filtered} />
          </Box>
        </>
      )}

      <Box
        component="footer"
        sx={{
          mt: 4,
          pt: 2,
          borderTop: `1px solid ${palette.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: palette.textDim,
          fontSize: 11,
          letterSpacing: "0.04em",
        }}
      >
        <Typography sx={{ fontSize: 11, color: palette.textDim }}>
          {payslips.length} period{payslips.length === 1 ? "" : "s"} on file ·{" "}
          {fmtRange(summary.rangeStart, summary.rangeEnd)}
        </Typography>
        <Typography sx={{ fontSize: 11, color: palette.textDim }}>
          data stays on this device · v1
        </Typography>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={onUploadFile}
        style={{ display: "none" }}
        aria-hidden
      />

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: palette.surface,
              border: `1px solid ${palette.borderHi}`,
            },
          },
        }}
      >
        <DialogTitle sx={{ color: palette.text, fontWeight: 600 }}>
          Clear all stored payslips?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: palette.textMute, fontSize: 14 }}>
            This removes every payslip from this browser. You can re-upload a CSV
            any time.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmClear(false)}>Cancel</Button>
          <Button
            onClick={onClearAll}
            variant="contained"
            sx={{ backgroundColor: palette.coral, color: palette.ink }}
          >
            Clear all
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}