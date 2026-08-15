"use client";

import { memo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import { palette } from "../theme";

interface DashboardEmptyStateProps {
  onUpload: () => void;
}

const STEPS = [
  {
    icon: CloudUploadRoundedIcon,
    label: "Drop your first PDF on /ai-upload",
  },
  {
    icon: AutoAwesomeRoundedIcon,
    label: "gemma4:cloud reads each page and returns structured data",
  },
  {
    icon: CloudDoneRoundedIcon,
    label: "Original PDF is stored in Firebase Storage; rows link back to it",
  },
];

export const DashboardEmptyState = memo(function DashboardEmptyState({
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
        gap: 4,
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
      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 720 }}>
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
            lineHeight: 1.05,
            color: palette.text,
          }}
        >
          Scan your first payslip
          <Box
            component="span"
            sx={{
              color: palette.mint,
              textShadow: `0 0 32px ${palette.mint}44`,
            }}
          >
            {" to start."}
          </Box>
        </Typography>
        <Typography
          sx={{
            mt: 2,
            fontSize: 14,
            color: palette.textMute,
            maxWidth: 600,
            lineHeight: 1.55,
          }}
        >
          Drop a PDF on the upload page. We render each page to an image, ask
          gemma4:cloud to extract the rows, store the original PDF in Firebase
          Storage, and keep a download link with every row.
        </Typography>
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
            mt: 3,
            px: 2.5,
            py: 1.25,
            borderRadius: 2,
            backgroundColor: palette.mint,
            color: palette.ink,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.02em",
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
          Scan your first payslip
        </Box>
      </Box>

      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ position: "relative", zIndex: 1, gap: 2 }}
      >
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Box
              key={step.label}
              sx={{
                flex: 1,
                display: "flex",
                gap: 1.5,
                alignItems: "flex-start",
                p: 2,
                borderRadius: 2,
                border: `1px solid ${palette.border}`,
                backgroundColor: palette.surfaceLow,
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  backgroundColor: palette.mintWash,
                  color: palette.mint,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Icon sx={{ fontSize: 16, color: palette.mint, mb: 0.5 }} />
                <Typography
                  sx={{
                    fontSize: 12.5,
                    color: palette.text,
                    lineHeight: 1.45,
                    fontWeight: 500,
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
});