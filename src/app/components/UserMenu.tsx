"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Popover from "@mui/material/Popover";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { useAuth } from "../../lib/auth-context";
import { palette } from "../theme";

const UserMenuInner = function UserMenu() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const closingRef = useRef(false);

  const onOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchor(e.currentTarget);
  }, []);
  const onClose = useCallback(() => {
    setAnchor(null);
  }, []);

  const onSignOut = useCallback(async () => {
    closingRef.current = true;
    setAnchor(null);
    try {
      await signOutUser();
      router.replace("/login");
    } finally {
      closingRef.current = false;
    }
  }, [signOutUser, router]);

  const initials = useMemo(() => {
    if (!user) return "?";
    const source =
      user.displayName?.trim() ||
      user.email?.split("@")[0]?.trim() ||
      "U";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user]);

  if (!user) return null;

  const photo = user.photoURL;

  return (
    <>
      <Box
        component="button"
        onClick={onOpen}
        aria-label="Open account menu"
        sx={{
          all: "unset",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          pl: 0.5,
          pr: 1,
          py: 0.5,
          borderRadius: 999,
          border: `1px solid ${palette.border}`,
          backgroundColor: palette.surfaceLow,
          transition: "all 160ms ease",
          "&:hover": { borderColor: palette.mint, backgroundColor: palette.mintWash },
          "&:focus-visible": {
            outline: "none",
            boxShadow: `0 0 0 3px ${palette.mint}33`,
          },
        }}
      >
        {photo ? (
          <Box
            component="img"
            src={photo}
            alt=""
            sx={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              objectFit: "cover",
              border: `1px solid ${palette.border}`,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              backgroundColor: palette.mint,
              color: palette.ink,
              display: "grid",
              placeItems: "center",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {initials}
          </Box>
        )}
        <Typography
          sx={{
            fontSize: 12,
            color: palette.text,
            fontWeight: 500,
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user.displayName || user.email}
        </Typography>
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 16, color: palette.textDim }} />
      </Box>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 220,
              backgroundColor: palette.surface,
              border: `1px solid ${palette.borderHi}`,
              borderRadius: 2,
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: 10.5, color: palette.textDim, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, mb: 0.5 }}>
            Signed in as
          </Typography>
          <Typography sx={{ fontSize: 13, color: palette.text, fontWeight: 600, wordBreak: "break-all" }}>
            {user.email}
          </Typography>
        </Box>
        <Box sx={{ borderTop: `1px solid ${palette.border}` }}>
          <Box
            component="button"
            onClick={onSignOut}
            sx={{
              all: "unset",
              cursor: "pointer",
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1.25,
              fontSize: 13,
              fontWeight: 500,
              color: palette.text,
              transition: "background-color 140ms ease",
              "&:hover": { backgroundColor: palette.coralWash, color: palette.coral },
              "&:focus-visible": { backgroundColor: palette.coralWash, color: palette.coral, outline: "none" },
            }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 16 }} />
            Sign out
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export const UserMenu = memo(UserMenuInner);