"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { palette } from "../theme";
import type { WeeklyPoint } from "../../lib/types";
import { fmtRange } from "../../lib/format";
import { HoursBar } from "./charts";
import {
  bucketHours,
  HOURS_PER_BUCKET,
  thresholdLabel,
  type HoursMode,
} from "../../lib/hours-buckets";

const MODES: { id: HoursMode; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "fortnight", label: "Fortnight" },
  { id: "month", label: "Month" },
];

interface HoursChartCardProps {
  weekly: WeeklyPoint[];
  rangeStart: string;
  rangeEnd: string;
}

const HoursChartCardInner = function HoursChartCard({
  weekly,
  rangeStart,
  rangeEnd,
}: HoursChartCardProps) {
  const [mode, setMode] = useState<HoursMode>("week");

  const onMode = useCallback(
    (_: React.MouseEvent<HTMLElement>, next: HoursMode | null) => {
      if (next) setMode(next);
    },
    [],
  );

  const buckets = useMemo(() => bucketHours(weekly, mode), [weekly, mode]);

  const threshold = HOURS_PER_BUCKET[mode];
  const tlabel = thresholdLabel(mode);

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surface,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minHeight: 380,
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: palette.textMute,
            }}
          >
            Hours worked
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              color: palette.text,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {buckets.length} {mode}
            {buckets.length === 1 ? "" : "s"} · threshold{" "}
            <Box
              component="span"
              sx={{
                fontFamily:
                  'var(--font-geist-mono), ui-monospace, monospace',
                color: palette.coral,
                fontWeight: 600,
              }}
            >
              {tlabel}
            </Box>
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: 11,
              color: palette.textDim,
              letterSpacing: "0.04em",
            }}
          >
            {fmtRange(rangeStart, rangeEnd)}
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={onMode}
          size="small"
          aria-label="Bucket size"
          sx={{
            backgroundColor: palette.surfaceLow,
            border: `1px solid ${palette.border}`,
            borderRadius: 999,
            p: 0.25,
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: "999px !important",
              px: 1.5,
              py: 0.5,
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: palette.textMute,
              textTransform: "none",
              transition: "all 160ms ease",
              "&:hover": {
                color: palette.mint,
                backgroundColor: palette.mintWash,
              },
              "&.Mui-selected": {
                color: palette.ink,
                backgroundColor: palette.mint,
                "&:hover": {
                  color: palette.ink,
                  backgroundColor: palette.mintDim,
                },
              },
            },
          }}
        >
          {MODES.map((m) => (
            <ToggleButton key={m.id} value={m.id} aria-label={`${m.label} view`}>
              {m.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      <Box sx={{ flex: 1 }}>
        <HoursBar
          buckets={buckets}
          threshold={threshold}
          thresholdLabel={tlabel}
        />
      </Box>
    </Box>
  );
};

export const HoursChartCard = memo(HoursChartCardInner);