"use client";

import { memo, useCallback, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { useDeferredValue } from "react";
import { useRouter } from "next/navigation";
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
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { palette } from "./theme";
import { FilterBar } from "./components/FilterBar";
import { KpiRow } from "./components/KpiRow";
import { BreakdownCard, EarningsChartCard } from "./components/ChartCards";
import { PayslipTable } from "./components/PayslipTable";
import { DashboardEmptyState } from "./components/EmptyState";
import {
  commitSnapshot,
  getServerSnapshot,
  getSnapshot,
  resetSnapshot,
  subscribe,
} from "../lib/storage";
import { computeSummary, filterPayslips } from "../lib/summary";
import { fmtRange, isoToday } from "../lib/format";
import { SAMPLE_PAYSLIPS } from "../lib/sample";
import type { Filters } from "../lib/types";

const DEFAULT_FILTERS: Filters = {
  preset: "all",
  start: "",
  end: "",
};

function DashboardView() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const payslips = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [confirmClear, setConfirmClear] = useState(false);

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

  const onClearAll = useCallback(() => {
    resetSnapshot();
    setConfirmClear(false);
  }, []);

  const onUseSample = useCallback(() => {
    commitSnapshot(SAMPLE_PAYSLIPS);
  }, []);

  const onGoUpload = useCallback(() => {
    router.push("/upload");
  }, [router]);

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

  const isEmpty = payslips.length === 0;

  return (
    <Box
      sx={{
        position: "relative",
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
          justifyContent: "flex-end",
          flexWrap: "wrap",
          rowGap: 1,
          minHeight: 6,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Tooltip title="Open upload page">
            <IconButton
              size="small"
              onClick={onGoUpload}
              aria-label="Open upload page"
            >
              <OpenInNewRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
        <DashboardEmptyState onUseSample={onUseSample} onUpload={onGoUpload} />
      ) : (
        <>
          <Box
            className="fade-up"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Button
              onClick={onGoUpload}
              startIcon={<AutoAwesomeRoundedIcon fontSize="small" />}
              sx={{
                color: palette.textMute,
                border: `1px solid ${palette.border}`,
                fontSize: 12,
                fontWeight: 600,
                px: 1.5,
                py: 0.85,
                borderRadius: 2,
                "&:hover": {
                  borderColor: palette.mint,
                  color: palette.mint,
                  backgroundColor: palette.mintWash,
                },
              }}
            >
              Import more payslips
            </Button>
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

export default memo(DashboardView);