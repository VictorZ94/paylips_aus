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
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a moment.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completing.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    case "auth/email-already-in-use":
      return "An account with that email already exists. Try signing in.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const LoginFormInner = function LoginForm() {
  const router = useRouter();
  const { signInWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState<null | "email" | "google" | "reset">(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const disabled = busy !== null;

  const onSubmitEmail = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setInfo(null);
      if (!email || !password) {
        setError("Email and password are required.");
        return;
      }
      setBusy("email");
      try {
        await signInWithEmail(email, password);
        router.replace("/");
      } catch (err) {
        setError(mapAuthError((err as { code?: string }).code));
      } finally {
        setBusy(null);
      }
    },
    [email, password, signInWithEmail, router],
  );

  const onGoogle = useCallback(async () => {
    setError(null);
    setInfo(null);
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

  const onForgot = useCallback(async () => {
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Enter your email first, then click forgot password.");
      return;
    }
    setBusy("reset");
    try {
      await resetPassword(email);
      setInfo(`Password reset email sent to ${email}.`);
    } catch (err) {
      setError(mapAuthError((err as { code?: string }).code));
    } finally {
      setBusy(null);
    }
  }, [email, resetPassword]);

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
      onSubmit={onSubmitEmail}
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
      {info && (
        <Alert
          severity="success"
          variant="outlined"
          sx={{
            backgroundColor: palette.mintWash,
            borderColor: palette.mint,
            color: palette.text,
            fontSize: 13,
            py: 0.5,
          }}
        >
          {info}
        </Alert>
      )}
      <Stack spacing={1.5}>
        <TextField
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          fullWidth
          disabled={disabled}
          slotProps={{
            input: { sx: { fontFamily: 'var(--font-geist-sans)' } },
          }}
        />
        <TextField
          type={showPw ? "text" : "password"}
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
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
      </Stack>
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Box
          component="button"
          type="button"
          onClick={onForgot}
          disabled={busy === "reset"}
          sx={{
            all: "unset",
            cursor: busy === "reset" ? "wait" : "pointer",
            fontSize: 12,
            color: palette.textDim,
            "&:hover": { color: palette.mint },
          }}
        >
          Forgot password?
        </Box>
      </Box>
      <Button
        type="submit"
        variant="contained"
        disabled={disabled}
        sx={{
          ...buttonSx,
          py: 1.25,
          fontSize: 13,
          letterSpacing: "0.02em",
          position: "relative",
        }}
      >
        {busy === "email" ? "Signing in…" : "Sign in"}
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
        {busy === "google" ? "Opening Google…" : "Sign in with Google"}
      </Button>
      <Typography sx={{ fontSize: 12.5, color: palette.textMute, textAlign: "center", mt: 1 }}>
        New here?{" "}
        <Box
          component={Link}
          href="/register"
          sx={{
            color: palette.mint,
            fontWeight: 600,
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Create an account
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

export const LoginForm = memo(LoginFormInner);