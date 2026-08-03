"use client";

import { createTheme } from "@mui/material/styles";

export const palette = {
  ink: "#0A0E1A",
  inkDeep: "#06080F",
  surface: "#131826",
  surfaceHi: "#1A2030",
  surfaceLow: "#0E1320",
  border: "#22293A",
  borderHi: "#2E3650",
  mint: "#C8FF6E",
  mintDim: "#9FE03D",
  mintWash: "#C8FF6E14",
  coral: "#FF6B6B",
  coralWash: "#FF6B6B14",
  amber: "#FFB454",
  text: "#E8EAF2",
  textMute: "#8C92A8",
  textDim: "#5B6478",
};

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  defaultColorScheme: "dark",
  colorSchemes: {
    dark: {
      palette: {
        mode: "dark",
        background: { default: palette.ink, paper: palette.surface },
        divider: palette.border,
        text: {
          primary: palette.text,
          secondary: palette.textMute,
          disabled: palette.textDim,
        },
        primary: { main: palette.mint, contrastText: palette.ink },
        secondary: { main: palette.coral, contrastText: palette.ink },
        error: { main: palette.coral },
        warning: { main: palette.amber },
        success: { main: palette.mint },
      },
    },
  },
  typography: {
    fontFamily:
      'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 600,
      letterSpacing: "-0.04em",
      fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
      lineHeight: 1.02,
    },
    h2: { fontWeight: 600, letterSpacing: "-0.03em" },
    h3: { fontWeight: 600, letterSpacing: "-0.02em" },
    h4: { fontWeight: 600, letterSpacing: "-0.01em" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.72rem" },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    body1: { lineHeight: 1.55 },
    body2: { lineHeight: 1.55, color: palette.textMute },
    overline: { letterSpacing: "0.16em", fontWeight: 600 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFeatureSettings: '"ss01", "cv11"',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 14,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: false },
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 600 },
        outlined: {
          borderColor: palette.borderHi,
          "&:hover": { borderColor: palette.mint, backgroundColor: palette.mintWash },
        },
        contained: {
          backgroundColor: palette.mint,
          color: palette.ink,
          "&:hover": { backgroundColor: palette.mintDim },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: palette.textMute,
          "&:hover": { color: palette.mint, backgroundColor: palette.mintWash },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.surfaceHi,
          border: `1px solid ${palette.borderHi}`,
          fontSize: 12,
          padding: "8px 10px",
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: palette.surfaceLow,
          "& fieldset": { borderColor: palette.border },
          "&:hover fieldset": { borderColor: palette.borderHi },
          "&.Mui-focused fieldset": { borderColor: palette.mint },
        },
        input: { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: palette.textMute, "&.Mui-focused": { color: palette.mint } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          letterSpacing: 0,
        },
      },
    },
  },
});

export default theme;