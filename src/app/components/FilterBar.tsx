"use client";

import { memo, useCallback } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import { palette } from "../theme";
import { fmtRange, isoToday } from "../../lib/format";
import type { FilterPreset, Filters } from "../../lib/types";

interface FilterBarProps {
  filters: Filters;
  onChange: (next: Filters) => void;
  rangeStart: string;
  rangeEnd: string;
  totalPeriods: number;
}

const PRESETS: { id: FilterPreset; label: string; sub: string }[] = [
  { id: "7d", label: "7d", sub: "Last week" },
  { id: "30d", label: "30d", sub: "Last month" },
  { id: "ytd", label: "YTD", sub: "This FY" },
  { id: "all", label: "All", sub: "Every period" },
];

const FilterBarInner = function FilterBar({
  filters,
  onChange,
  rangeStart,
  rangeEnd,
  totalPeriods,
}: FilterBarProps) {
  const setPreset = useCallback(
    (preset: FilterPreset) => () => {
      onChange({ ...filters, preset });
    },
    [filters, onChange],
  );

  const setCustomStart = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...filters, preset: "custom", start: e.target.value });
    },
    [filters, onChange],
  );

  const setCustomEnd = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...filters, preset: "custom", end: e.target.value });
    },
    [filters, onChange],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        borderRadius: 3,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surfaceLow,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        {PRESETS.map((p) => {
          const active = filters.preset === p.id;
          return (
            <Button
              key={p.id}
              onClick={setPreset(p.id)}
              disableRipple
              sx={{
                minWidth: 0,
                px: 1.5,
                py: 0.85,
                borderRadius: 2,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.02em",
                color: active ? palette.ink : palette.textMute,
                backgroundColor: active ? palette.mint : "transparent",
                border: `1px solid ${active ? palette.mint : palette.border}`,
                "&:hover": {
                  backgroundColor: active ? palette.mintDim : palette.mintWash,
                  borderColor: palette.mint,
                  color: active ? palette.ink : palette.mint,
                },
              }}
            >
              {p.label}
            </Button>
          );
        })}
        <Button
          onClick={setPreset("custom")}
          disableRipple
          sx={{
            minWidth: 0,
            px: 1.5,
            py: 0.85,
            borderRadius: 2,
            fontSize: 12,
            fontWeight: 600,
            color: filters.preset === "custom" ? palette.ink : palette.textMute,
            backgroundColor:
              filters.preset === "custom" ? palette.mint : "transparent",
            border: `1px solid ${
              filters.preset === "custom" ? palette.mint : palette.border
            }`,
            "&:hover": {
              backgroundColor:
                filters.preset === "custom" ? palette.mintDim : palette.mintWash,
              borderColor: palette.mint,
              color:
                filters.preset === "custom" ? palette.ink : palette.mint,
            },
          }}
        >
          Custom
        </Button>
      </Stack>

      {filters.preset === "custom" ? (
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <TextField
            type="date"
            value={filters.start}
            onChange={setCustomStart}
            size="small"
            slotProps={{ input: { inputProps: { max: filters.end || isoToday() } } }}
            sx={{ minWidth: 150 }}
          />
          <Typography sx={{ color: palette.textDim, fontSize: 14 }}>→</Typography>
          <TextField
            type="date"
            value={filters.end}
            onChange={setCustomEnd}
            size="small"
            slotProps={{ input: { inputProps: { min: filters.start, max: isoToday() } } }}
            sx={{ minWidth: 150 }}
          />
        </Stack>
      ) : (
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <CalendarMonthRoundedIcon
            fontSize="small"
            sx={{ color: palette.textDim }}
          />
          <Typography
            className="tabular"
            sx={{
              fontSize: 12.5,
              color: palette.text,
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            {fmtRange(rangeStart, rangeEnd)}
          </Typography>
          <Chip
            label={`${totalPeriods} period${totalPeriods === 1 ? "" : "s"}`}
            size="small"
            sx={{
              backgroundColor: palette.surfaceHi,
              color: palette.textMute,
              border: `1px solid ${palette.border}`,
              fontWeight: 600,
              fontSize: 11,
              height: 22,
            }}
          />
        </Stack>
      )}
    </Box>
  );
};

export const FilterBar = memo(FilterBarInner);