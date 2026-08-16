"use client";

import { memo, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { palette } from "../theme";
import { fmtAudWhole } from "../../lib/format";

const Charts = dynamic(() => import("./ChartBundle"), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: 260,
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

interface CompanyPieCardProps {
  slices: { label: string; value: number; color: string }[];
  total: number;
  onSliceClick: (label: string) => void;
}

const CompanyPieCardInner = function CompanyPieCard({
  slices,
  total,
  onSliceClick,
}: CompanyPieCardProps) {
  const onSlice = useCallback(
    (label: string) => {
      onSliceClick(label);
    },
    [onSliceClick],
  );

  const subtitle = useMemo(() => {
    const n = slices.length;
    if (n === 0) return "No employers in this range";
    const totalLabel = fmtAudWhole(total);
    if (n === 1) return `1 employer · ${totalLabel}`;
    return `${n} employers · ${totalLabel}`;
  }, [slices, total]);

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
          Income by employer
        </Typography>
        <Typography
          sx={{
            mt: 0.5,
            color: palette.text,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Charts kind="donut" slices={slices} onSliceClick={onSlice} />
      </Box>
      {slices.length > 1 && (
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            gap: 0.75,
            color: palette.textDim,
            fontSize: 11,
            letterSpacing: "0.02em",
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: palette.mint,
            }}
          />
          Click a slice to filter the dashboard to that employer
        </Stack>
      )}
    </Box>
  );
};

export const CompanyPieCard = memo(CompanyPieCardInner);