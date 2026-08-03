"use client";

import { memo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { palette } from "../theme";

function Mark() {
  return (
    <Box
      aria-hidden
      sx={{
        width: 32,
        height: 32,
        borderRadius: 2,
        position: "relative",
        background: `linear-gradient(135deg, ${palette.mint} 0%, ${palette.mintDim} 100%)`,
        display: "grid",
        placeItems: "center",
        boxShadow: `0 0 24px ${palette.mint}55`,
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 7,
          borderRadius: 1.5,
          background: palette.ink,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: palette.mint,
          boxShadow: `0 0 12px ${palette.mint}`,
        },
      }}
    />
  );
}

export const Brand = memo(function Brand({
  subtitle = "Your money, decoded.",
}: {
  subtitle?: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Mark />
      <Box sx={{ lineHeight: 1 }}>
        <Typography
          component="div"
          sx={{
            fontWeight: 700,
            letterSpacing: "-0.04em",
            fontSize: "1.15rem",
            color: palette.text,
            display: "flex",
            alignItems: "baseline",
            gap: 0.5,
          }}
        >
          paylips<span style={{ color: palette.mint }}>.</span>aus
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: palette.textDim,
            letterSpacing: "0.04em",
            fontSize: "0.68rem",
          }}
        >
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
});