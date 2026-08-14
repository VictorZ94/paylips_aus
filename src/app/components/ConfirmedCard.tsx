"use client";

import { memo, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { palette } from "../theme";
import { ParsePreview } from "./ParsePreview";
import type { ParseStats } from "./ParsePreview";

interface ConfirmedCardProps {
  stats: ParseStats;
  onReplace: () => void;
  commitAction?: (rows: ParseStats["rows"]) => Promise<void> | void;
  ctaLabel?: string;
  helperText?: string;
}

const ConfirmedCardInner = function ConfirmedCard({
  stats,
  onReplace,
  commitAction,
  ctaLabel,
  helperText,
}: ConfirmedCardProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onViewDashboard = useCallback(async () => {
    if (commitAction) {
      setBusy(true);
      try {
        await commitAction(stats.rows);
      } finally {
        setBusy(false);
      }
    }
    router.push("/");
  }, [commitAction, router, stats.rows]);

  const label = ctaLabel ?? (commitAction ? "Add to dashboard" : "View dashboard");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <ParsePreview stats={stats} live />
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            color: palette.textMute,
            letterSpacing: "0.02em",
            maxWidth: 480,
          }}
        >
          {helperText ??
            "The data is saved locally on this device. Drop another file to merge more periods, or jump to the dashboard to see trends."}
        </Typography>
        <Stack direction="row" sx={{ gap: 1.25, alignItems: "center" }}>
          <Button
            onClick={onReplace}
            startIcon={<RestartAltRoundedIcon fontSize="small" />}
            sx={{
              color: palette.textMute,
              borderColor: palette.borderHi,
              border: `1px solid ${palette.borderHi}`,
              "&:hover": {
                borderColor: palette.mint,
                color: palette.mint,
                backgroundColor: palette.mintWash,
              },
            }}
          >
            Replace file
          </Button>
          <Button
            onClick={onViewDashboard}
            variant="contained"
            disabled={busy}
            endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
            sx={{
              backgroundColor: palette.mint,
              color: palette.ink,
              fontWeight: 700,
              px: 2.5,
              "&:hover": { backgroundColor: palette.mintDim },
              "&.Mui-disabled": { backgroundColor: palette.surfaceHi, color: palette.textDim },
            }}
          >
            {busy ? "Saving…" : label}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export const ConfirmedCard = memo(ConfirmedCardInner);