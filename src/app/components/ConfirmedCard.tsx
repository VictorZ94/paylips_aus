"use client";

import { memo, useCallback } from "react";
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
}

const ConfirmedCardInner = function ConfirmedCard({ stats, onReplace }: ConfirmedCardProps) {
  const router = useRouter();

  const onViewDashboard = useCallback(() => {
    router.push("/");
  }, [router]);

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
          The data is saved locally on this device. Drop another file to merge
          more periods, or jump to the dashboard to see trends.
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
            endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
            sx={{
              backgroundColor: palette.mint,
              color: palette.ink,
              fontWeight: 700,
              px: 2.5,
              "&:hover": { backgroundColor: palette.mintDim },
            }}
          >
            View dashboard
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export const ConfirmedCard = memo(ConfirmedCardInner);