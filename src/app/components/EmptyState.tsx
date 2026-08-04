"use client";

import { memo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import { palette } from "../theme";

interface DashboardEmptyStateProps {
  onUseSample: () => void;
  onUpload: () => void;
}

const SAMPLE_PREVIEW = [
  ["20/04/2026", "26/04/2026", "3.4833", "$137.51", "$1.25", "22", "16.5", "$116.76"],
  ["13/04/2026", "19/04/2026", "6.0000", "$236.40", "$1.25", "36", "16.5", "$201.65"],
  ["06/04/2026", "12/04/2026", "14.800", "$588.75", "$5.00", "97", "16.5", "$496.75"],
];

export const DashboardEmptyState = memo(function DashboardEmptyState({
  onUseSample,
  onUpload,
}: DashboardEmptyStateProps) {
  return (
    <Box
      sx={{
        borderRadius: 4,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surface,
        p: { xs: 4, md: 6 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(600px 280px at 80% 0%, ${palette.mint}10, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={4}
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: palette.mint,
              mb: 2,
            }}
          >
            No data yet
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.04em",
              fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
              lineHeight: 1.02,
              color: palette.text,
            }}
          >
            See every dollar,
            <br />
            <Box
              component="span"
              sx={{ color: palette.mint, textShadow: `0 0 32px ${palette.mint}44` }}
            >
              every tax dollar,
            </Box>
            <br />
            every super dollar.
          </Typography>
          <Typography
            sx={{
              mt: 2,
              fontSize: 14,
              color: palette.textMute,
              maxWidth: 540,
              lineHeight: 1.55,
            }}
          >
            Drop a CSV on the upload page to see your income, tax withheld and
            super in real time. Or start with our sample data to explore the
            dashboard. Nothing leaves your device.
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mt: 3, flexWrap: "wrap", rowGap: 1.5 }}
          >
            <Box
              role="button"
              tabIndex={0}
              onClick={onUseSample}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onUseSample();
                }
              }}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                border: `1px solid ${palette.borderHi}`,
                color: palette.text,
                backgroundColor: palette.surfaceLow,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                outline: "none",
                transition: "all 160ms ease",
                "&:hover": {
                  borderColor: palette.mint,
                  color: palette.mint,
                  backgroundColor: palette.mintWash,
                },
                "&:focus-visible": {
                  boxShadow: `0 0 0 3px ${palette.mint}33`,
                },
              }}
            >
              <DescriptionRoundedIcon fontSize="small" />
              Use sample data
            </Box>
            <Box
              role="button"
              tabIndex={0}
              onClick={onUpload}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onUpload();
                }
              }}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                backgroundColor: palette.mint,
                color: palette.ink,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                outline: "none",
                transition: "all 160ms ease",
                "&:hover": {
                  backgroundColor: palette.mintDim,
                  transform: "translateY(-1px)",
                },
                "&:focus-visible": {
                  boxShadow: `0 0 0 3px ${palette.mint}33`,
                },
              }}
            >
              <CloudUploadRoundedIcon fontSize="small" />
              Upload a CSV
            </Box>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 2,
                py: 1,
                borderRadius: 2,
                color: palette.textMute,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              or just drop it on /upload
            </Box>
          </Stack>
        </Box>
        <Box
          sx={{
            flex: { xs: 1, md: 0 },
            minWidth: 280,
            maxWidth: { md: 360 },
            borderRadius: 3,
            border: `1px solid ${palette.border}`,
            backgroundColor: palette.surfaceLow,
            p: 2,
            fontFamily:
              'var(--font-geist-mono), ui-monospace, "SFMono-Regular", Menlo, monospace',
          }}
        >
          <Typography
            sx={{
              fontSize: 10.5,
              color: palette.textDim,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 700,
              mb: 1.5,
            }}
          >
            Expected CSV
          </Typography>
          <Box
            sx={{
              fontSize: 11,
              color: palette.textMute,
              lineHeight: 1.7,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <Box sx={{ color: palette.text, mb: 0.5 }}>
              start,end,hours,earns,allowances,tax,super,total
            </Box>
            {SAMPLE_PREVIEW.map((row, idx) => (
              <Box key={idx} sx={{ color: palette.mint, opacity: 0.85 - idx * 0.18 }}>
                {row.join(",")}
              </Box>
            ))}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
});