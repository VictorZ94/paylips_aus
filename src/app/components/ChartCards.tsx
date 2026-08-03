"use client";

import { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import LinearProgress from "@mui/material/LinearProgress";
import { palette } from "../theme";
import type { BreakdownSlice, WeeklyPoint } from "../../lib/types";
import { fmtAud, fmtPct } from "../../lib/format";

const Charts = dynamic(() => import("./ChartBundle"), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: 300,
        borderRadius: 2,
        background: `linear-gradient(90deg, ${palette.surfaceLow} 0%, ${palette.surfaceHi} 50%, ${palette.surfaceLow} 100%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s linear infinite",
        "@keyframes shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      }}
    />
  ),
});

export const EarningsChartCard = memo(function EarningsChartCard({
  weekly,
  rangeStart,
  rangeEnd,
}: {
  weekly: WeeklyPoint[];
  rangeStart: string;
  rangeEnd: string;
}) {
  const periodCount = useMemo(() => weekly.length, [weekly]);
  const peak = useMemo(
    () => weekly.reduce((acc, w) => Math.max(acc, w.totalEarned), 0),
    [weekly],
  );

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minHeight: 380,
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: palette.textMute,
            }}
          >
            Weekly earnings
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              color: palette.text,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {periodCount} pay period{periodCount === 1 ? "" : "s"} · peak{" "}
            <Box component="span" className="tabular" sx={{ color: palette.mint }}>
              {fmtAud(peak)}
            </Box>
          </Typography>
        </Box>
      </Stack>
      <Box sx={{ flex: 1 }}>
        <Charts
          kind="earnings"
          weekly={weekly}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
        />
      </Box>
    </Box>
  );
});

export const BreakdownCard = memo(function BreakdownCard({
  slices,
}: {
  slices: BreakdownSlice[];
}) {
  const total = useMemo(
    () => slices.reduce((acc, s) => acc + s.value, 0),
    [slices],
  );

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minHeight: 380,
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: palette.textMute,
          }}
        >
          Where it went
        </Typography>
        <Typography
          sx={{
            mt: 0.5,
            color: palette.text,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Net · tax · super · allowances
        </Typography>
      </Box>
      <Charts kind="donut" slices={slices} />
      <Stack spacing={1.25}>
        {slices.map((s) => {
          const share = total > 0 ? s.value / total : 0;
          return (
            <Box key={s.label}>
<Stack
                  direction="row"
                  sx={{ alignItems: "center", justifyContent: "space-between", mb: 0.5 }}
                >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: s.color,
                      boxShadow: `0 0 8px ${s.color}88`,
                    }}
                  />
                  <Typography sx={{ fontSize: 12, color: palette.textMute, fontWeight: 500 }}>
                    {s.label}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "baseline" }}>
                  <Typography
                    className="tabular"
                    sx={{ fontSize: 12, fontWeight: 600, color: palette.text }}
                  >
                    {fmtAud(s.value)}
                  </Typography>
                  <Typography
                    className="tabular"
                    sx={{ fontSize: 11, color: palette.textDim, minWidth: 40, textAlign: "right" }}
                  >
                    {fmtPct(share)}
                  </Typography>
                </Stack>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(share * 100, 100)}
                sx={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: palette.surfaceLow,
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: s.color,
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
});