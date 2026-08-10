"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import GoogleIcon from "@mui/icons-material/Google";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { palette } from "../theme";
import { useAuth } from "../../lib/auth-context";

function mapAuthError(code: string | undefined): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with that email already exists. Try signing in.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/popup-closed-by-user":
      return "Sign-up popup was closed before completing.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const RegisterFormInner = function RegisterForm() {
  const router = useRouter();
  const { registerWithEmail, signInWithGoogle } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState<null | "email" | "google">(null);
  const [error, setError] = useState<string | null>(null);

  const pwStrength = useMemo(() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const strengthColor =
    pwStrength <= 1 ? palette.coral : pwStrength <= 3 ? palette.amber : palette.mint;

  const disabled = busy !== null;

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!email || !password || !confirm) {
        setError("All fields are required.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      setBusy("email");
      try {
        await registerWithEmail(email, password, displayName.trim() || undefined);
        router.replace("/");
      } catch (err) {
        setError(mapAuthError((err as { code?: string }).code));
      } finally {
        setBusy(null);
      }
    },
    [email, password, confirm, displayName, registerWithEmail, router],
  );

  const onGoogle = useCallback(async () => {
    setError(null);
    setBusy("google");
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user") {
        setError(mapAuthError(code));
      }
    } finally {
      setBusy(null);
    }
  }, [signInWithGoogle, router]);

  const buttonSx = useMemo(
    () => ({
      backgroundColor: palette.mint,
      color: palette.ink,
      fontWeight: 700,
      "&:hover": { backgroundColor: palette.mintDim },
      "&.Mui-disabled": { backgroundColor: palette.surfaceHi, color: palette.textDim },
    }),
    [],
  );

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      {error && (
        <Alert
          severity="error"
          variant="outlined"
          sx={{
            backgroundColor: palette.coralWash,
            borderColor: palette.coral,
            color: palette.text,
            fontSize: 13,
            py: 0.5,
          }}
        >
          {error}
        </Alert>
      )}
      <Stack spacing={1.5}>
        <TextField
          label="Display name (optional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          fullWidth
          disabled={disabled}
        />
        <TextField
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          fullWidth
          disabled={disabled}
        />
        <TextField
          type={showPw ? "text" : "password"}
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          fullWidth
          disabled={disabled}
          slotProps={{
            input: {
              endAdornment: (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    color: palette.textDim,
                    px: 0.5,
                    "&:hover": { color: palette.mint },
                  }}
                >
                  {showPw ? (
                    <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                  )}
                </Box>
              ),
            },
          }}
        />
        <Box sx={{ mt: -0.5 }}>
          <Box
            sx={{
              height: 3,
              borderRadius: 999,
              backgroundColor: palette.surfaceLow,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                width: `${Math.min(pwStrength * 20, 100)}%`,
                backgroundColor: strengthColor,
                transition: "width 200ms ease",
              }}
            />
          </Box>
        </Box>
        <TextField
          type={showPw ? "text" : "password"}
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          fullWidth
          disabled={disabled}
          error={confirm.length > 0 && confirm !== password}
          helperText={
            confirm.length > 0 && confirm !== password ? "Passwords do not match" : " "
          }
        />
      </Stack>
      <Button
        type="submit"
        variant="contained"
        disabled={disabled}
        sx={{ ...buttonSx, py: 1.25, fontSize: 13, letterSpacing: "0.02em" }}
      >
        {busy === "email" ? "Creating account…" : "Create account"}
      </Button>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, my: 0.5 }}>
        <Box sx={{ flex: 1, height: 1, backgroundColor: palette.border }} />
        <Typography sx={{ fontSize: 10.5, color: palette.textDim, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>
          or
        </Typography>
        <Box sx={{ flex: 1, height: 1, backgroundColor: palette.border }} />
      </Box>
      <Button
        type="button"
        variant="outlined"
        onClick={onGoogle}
        disabled={disabled}
        startIcon={<GoogleIcon sx={{ fontSize: 18 }} />}
        sx={{
          borderColor: palette.borderHi,
          color: palette.text,
          py: 1.25,
          fontSize: 13,
          fontWeight: 600,
          "&:hover": { borderColor: palette.mint, backgroundColor: palette.mintWash, color: palette.mint },
        }}
      >
        {busy === "google" ? "Opening Google…" : "Sign up with Google"}
      </Button>
      <Typography sx={{ fontSize: 12.5, color: palette.textMute, textAlign: "center", mt: 1 }}>
        Already have an account?{" "}
        <Box
          component={Link}
          href="/login"
          sx={{
            color: palette.mint,
            fontWeight: 600,
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Sign in
        </Box>
      </Typography>
      {busy !== null && (
        <LinearProgress
          sx={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 0,
            height: 2,
            backgroundColor: palette.surfaceLow,
            "& .MuiLinearProgress-bar": { backgroundColor: palette.mint },
          }}
        />
      )}
    </Box>
  );
};

export const RegisterForm = memo(RegisterFormInner);