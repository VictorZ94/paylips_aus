"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import { palette } from "../theme";

interface TabDef {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
}

const TABS: TabDef[] = [
  { href: "/", label: "Dashboard", match: (p) => p === "/" },
  { href: "/upload", label: "Upload", match: (p) => p.startsWith("/upload") },
];

const NavigationTabsInner = function NavigationTabs() {
  const pathname = usePathname();
  return (
    <Box
      role="navigation"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        p: 0.5,
        borderRadius: 999,
        backgroundColor: palette.surfaceLow,
        border: `1px solid ${palette.border}`,
      }}
    >
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            style={{ textDecoration: "none" }}
          >
            <Box
              sx={{
                px: 1.75,
                py: 0.75,
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.02em",
                color: active ? palette.ink : palette.textMute,
                backgroundColor: active ? palette.mint : "transparent",
                transition: "all 160ms ease",
                cursor: "pointer",
                "&:hover": {
                  color: active ? palette.ink : palette.mint,
                  backgroundColor: active ? palette.mintDim : palette.mintWash,
                },
              }}
            >
              {t.label}
            </Box>
          </Link>
        );
      })}
    </Box>
  );
};

export const NavigationTabs = memo(NavigationTabsInner);