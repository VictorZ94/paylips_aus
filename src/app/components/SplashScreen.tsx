"use client";

import { memo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { palette } from "../theme";

const SplashScreen = memo(function SplashScreen({
  message,
}: {
  message?: string;
}) {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "grid",
        placeItems: "center",
        gap: 2.5,
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          position: "relative",
          background: `linear-gradient(135deg, ${palette.mint} 0%, ${palette.mintDim} 100%)`,
          boxShadow: `0 0 24px ${palette.mint}55`,
          animation: "splash-pulse 1.4s ease-in-out infinite",
          "@keyframes splash-pulse": {
            "0%, 100%": {
              transform: "scale(1)",
              boxShadow: `0 0 24px ${palette.mint}55`,
            },
            "50%": {
              transform: "scale(1.08)",
              boxShadow: `0 0 36px ${palette.mint}88`,
            },
          },
        }}
      />
      {message && (
        <Typography
          sx={{
            color: palette.textDim,
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
});

export default SplashScreen;