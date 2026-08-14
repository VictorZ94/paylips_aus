"use client";

import { memo, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingFlatRoundedIcon from "@mui/icons-material/TrendingFlatRounded";
import { palette } from "../theme";
import { fmtAud, fmtAudWhole, fmtSigned } from "../../lib/format";
import { Sparkline } from "./charts";
import type { Summary, WeeklyPoint } from "../../lib/types";

type Variant = "net" | "tax" | "hours" | "super";

interface KpiCardProps {
  variant: Variant;
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  spark: number[];
  sparkColor?: string;
}

const KpiCardInner = function KpiCard({
  label,
  value,
  sub,
  delta,
  spark,
  sparkColor,
}: KpiCardProps) {
  const deltaTone =
    delta == null || delta === 0
      ? palette.textDim
      : delta > 0
        ? palette.mint
        : palette.coral;
  const DeltaIcon =
    delta == null
      ? null
      : delta > 0
        ? TrendingUpRoundedIcon
        : delta < 0
          ? TrendingDownRoundedIcon
          : TrendingFlatRoundedIcon;

  return (
    <Box
      sx={{
        position: "relative",
        p: 2.25,
        borderRadius: 3,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        overflow: "hidden",
        transition: "border-color 200ms ease, transform 200ms ease",
        "&:hover": {
          borderColor: palette.borderHi,
        },
      }}
    >
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", minHeight: 22 }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: palette.textMute,
          }}
        >
          {label}
        </Typography>
        {delta != null && DeltaIcon && (
          <Tooltip
            title={
              delta === 0
                ? "No change vs previous window"
                : `${delta > 0 ? "Up" : "Down"} ${fmtSigned(delta)} vs previous window`
            }
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 0.85,
                py: 0.25,
                borderRadius: 999,
                backgroundColor:
                  delta > 0
                    ? palette.mintWash
                    : delta < 0
                      ? palette.coralWash
                      : palette.surfaceHi,
                color: deltaTone,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              <DeltaIcon sx={{ fontSize: 13 }} />
              {delta === 0 ? "Flat" : fmtSigned(delta)}
            </Box>
          </Tooltip>
        )}
      </Stack>

      <Typography
        className="kpi-value"
        sx={{
          color: palette.text,
          textShadow:
            value.length > 6 ? `0 0 24px ${palette.mint}22` : "none",
        }}
      >
        {value}
      </Typography>

      {sub && (
        <Typography
          sx={{
            fontSize: 12,
            color: palette.textDim,
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          {sub}
        </Typography>
      )}

      <Box sx={{ mt: 0.5, mb: -1.25, mx: -2.25 }}>
        <Sparkline values={spark} color={sparkColor} height={56} />
      </Box>
    </Box>
  );
};

const KpiCard = memo(KpiCardInner);

export const KpiRow = memo(function KpiRow({
  summary,
  weekly,
}: {
  summary: Summary;
  weekly: WeeklyPoint[];
}) {
  const spark = useMemo(
    () => weekly.map((w) => w.totalEarned),
    [weekly],
  );
  const taxSpark = useMemo(
    () => weekly.map((w) => w.tax),
    [weekly],
  );
  const hoursSpark = useMemo(
    () => weekly.map((w) => w.hours),
    [weekly],
  );
  const superSpark = useMemo(
    () => weekly.map((w) => w.super),
    [weekly],
  );

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
      }}
    >
      <KpiCard
        variant="net"
        label="Total earned"
        value={fmtAud(summary.totalEarned)}
        sub={`${summary.periodCount} period${summary.periodCount === 1 ? "" : "s"} · ${fmtAudWhole(
          summary.avgPerWeek,
        )}/wk avg`}
        delta={summary.prevWindowDelta}
        spark={spark}
        sparkColor={palette.mint}
      />
      <KpiCard
        variant="tax"
        label="Tax withheld"
        value={fmtAud(summary.taxWithheld)}
        sub={`${summary.totalEarned > 0 ? ((summary.taxWithheld / summary.totalEarned) * 100).toFixed(1) : "0.0"}% of gross`}
        spark={taxSpark}
        sparkColor={palette.coral}
      />
      <KpiCard
        variant="hours"
        label="Hours worked"
        value={summary.hours.toFixed(2)}
        sub={`${summary.periodCount > 0 ? (summary.hours / summary.periodCount).toFixed(2) : "0.00"} h / period`}
        spark={hoursSpark}
        sparkColor={palette.mintDim}
      />
      <KpiCard
        variant="super"
        label="Super accrued"
        value={fmtAud(summary.superTotal)}
        sub="contributions in window"
        spark={superSpark}
        sparkColor={palette.amber}
      />
    </Box>
  );
});

import Stack from "@mui/material/Stack";