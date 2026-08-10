"use client";

import { memo } from "react";
import Box from "@mui/material/Box";
import { Brand } from "./Brand";
import { NavigationTabs } from "./NavigationTabs";
import { UserMenu } from "./UserMenu";
import { palette } from "../theme";
import { useAuth } from "../../lib/auth-context";

const AppHeaderInner = function AppHeader() {
  const { status } = useAuth();
  const signedIn = status === "authenticated";

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(8px)",
        backgroundColor: "#0A0E1Acc",
        borderBottom: `1px solid ${palette.border}`,
      }}
    >
      <Box
        sx={{
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 2, md: 4 },
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Brand />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
            justifyContent: "flex-end",
          }}
        >
          {signedIn && <NavigationTabs />}
          {signedIn && <UserMenu />}
        </Box>
      </Box>
    </Box>
  );
};

export const AppHeader = memo(AppHeaderInner);