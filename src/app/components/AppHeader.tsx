"use client";

import { memo } from "react";
import Box from "@mui/material/Box";
import { Brand } from "./Brand";
import { NavigationTabs } from "./NavigationTabs";
import { palette } from "../theme";

const AppHeaderInner = function AppHeader() {
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
        <NavigationTabs />
      </Box>
    </Box>
  );
};

export const AppHeader = memo(AppHeaderInner);