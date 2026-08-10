"use client";

import { memo } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { palette } from "../theme";
import { RegisterForm } from "../components/RegisterForm";

const RegisterPageInner = function RegisterPage() {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: { xs: 6, md: 10 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(700px 360px at 50% 0%, ${palette.mint}10, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          borderRadius: 4,
          border: `1px solid ${palette.border}`,
          backgroundColor: palette.surface,
          p: { xs: 3, md: 4 },
          boxShadow: `0 24px 80px ${palette.ink}80`,
        }}
      >
        <Stack spacing={0.5} sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: palette.mint,
            }}
          >
            Create account
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.03em",
              fontSize: "1.65rem",
              color: palette.text,
              lineHeight: 1.1,
            }}
          >
            Start tracking your pay
          </Typography>
          <Typography sx={{ fontSize: 13, color: palette.textMute, mt: 0.5 }}>
            Set up an account with email &amp; password, or use Google in one click.
          </Typography>
        </Stack>
        <RegisterForm />
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: `1px solid ${palette.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontSize: 11, color: palette.textDim, letterSpacing: "0.04em" }}>
            By signing up you agree to keep your data local.
          </Typography>
          <Box
            component={Link}
            href="/"
            sx={{
              fontSize: 11.5,
              color: palette.textDim,
              textDecoration: "none",
              "&:hover": { color: palette.mint },
            }}
          >
            ← Back home
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export const RegisterPage = memo(RegisterPageInner);