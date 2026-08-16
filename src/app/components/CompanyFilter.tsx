"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Popover from "@mui/material/Popover";
import Checkbox from "@mui/material/Checkbox";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { palette } from "../theme";

interface CompanyFilterProps {
  available: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

const CompanyFilterInner = function CompanyFilter({
  available,
  selected,
  onChange,
}: CompanyFilterProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const onOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchor(e.currentTarget);
  }, []);
  const onClose = useCallback(() => setAnchor(null), []);

  const onToggle = useCallback(
    (name: string) => () => {
      const next = selected.includes(name)
        ? selected.filter((s) => s !== name)
        : [...selected, name];
      onChange(next);
    },
    [selected, onChange],
  );

  const onClear = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const onRemoveChip = useCallback(
    (name: string) => (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      onChange(selected.filter((s) => s !== name));
    },
    [selected, onChange],
  );

  useEffect(() => {
    if (!anchor) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && rootRef.current.contains(e.target as Node)) return;
      setAnchor(null);
    };
    document.addEventListener("mousedown", onDoc, { passive: true });
    return () => document.removeEventListener("mousedown", onDoc);
  }, [anchor]);

  const label = useMemo(() => {
    if (selected.length === 0) return "All employers";
    if (selected.length === 1) return selected[0];
    return `${selected.length} employers`;
  }, [selected]);

  const disabled = available.length === 0;

  return (
    <Box ref={rootRef} sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Box
        component="button"
        type="button"
        disabled={disabled}
        onClick={onOpen}
        aria-haspopup="listbox"
        aria-expanded={!!anchor}
        sx={{
          all: "unset",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.85,
          borderRadius: 2,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.02em",
          color: selected.length > 0 ? palette.ink : palette.textMute,
          backgroundColor:
            selected.length > 0 ? palette.mint : "transparent",
          border: `1px solid ${selected.length > 0 ? palette.mint : palette.border}`,
          opacity: disabled ? 0.55 : 1,
          transition: "all 160ms ease",
          "&:hover": {
            backgroundColor:
              selected.length > 0 ? palette.mintDim : palette.mintWash,
            borderColor: palette.mint,
            color: selected.length > 0 ? palette.ink : palette.mint,
          },
        }}
      >
        <BusinessRoundedIcon sx={{ fontSize: 14 }} />
        Employer: {label}
        <KeyboardArrowDownRoundedIcon sx={{ fontSize: 14 }} />
      </Box>

      {selected.length > 0 && (
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
          {selected.map((s) => (
            <Box
              key={s}
              onClick={onRemoveChip(s)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 999,
                backgroundColor: palette.mintWash,
                border: `1px solid ${palette.mint}55`,
                color: palette.text,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 140ms ease",
                "&:hover": { borderColor: palette.mint, color: palette.mint },
              }}
            >
              {s}
              <CloseRoundedIcon sx={{ fontSize: 12 }} />
            </Box>
          ))}
        </Stack>
      )}

      <Popover
        open={!!anchor && !disabled}
        anchorEl={anchor}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 260,
              maxWidth: 340,
              maxHeight: 320,
              backgroundColor: palette.surface,
              border: `1px solid ${palette.borderHi}`,
              borderRadius: 2,
            },
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              px: 1,
              py: 0.5,
            }}
          >
            <Typography
              sx={{
                fontSize: 10.5,
                color: palette.textDim,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Employers ({available.length})
            </Typography>
            {selected.length > 0 && (
              <Box
                component="button"
                type="button"
                onClick={onClear}
                sx={{
                  all: "unset",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  color: palette.textMute,
                  "&:hover": { color: palette.mint },
                }}
              >
                Clear
              </Box>
            )}
          </Stack>
          <Box
            sx={{
              mt: 0.5,
              maxHeight: 240,
              overflowY: "auto",
              borderRadius: 1,
              border: `1px solid ${palette.border}`,
              backgroundColor: palette.surfaceLow,
            }}
          >
            {available.length === 0 ? (
              <Typography
                sx={{ fontSize: 12, color: palette.textDim, p: 1.5, textAlign: "center" }}
              >
                No employers in range
              </Typography>
            ) : (
              available.map((name) => {
                const checked = selected.includes(name);
                return (
                  <Box
                    key={name}
                    component="li"
                    role="option"
                    aria-selected={checked}
                    onClick={onToggle(name)}
                    sx={{
                      all: "unset",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1,
                      py: 0.75,
                      cursor: "pointer",
                      borderBottom: `1px solid ${palette.border}`,
                      "&:last-of-type": { borderBottom: "none" },
                      "&:hover": { backgroundColor: palette.mintWash },
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={onToggle(name)}
                      size="small"
                      sx={{
                        p: 0,
                        color: palette.textDim,
                        "&.Mui-checked": { color: palette.mint },
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        color: palette.text,
                        fontWeight: checked ? 600 : 500,
                      }}
                    >
                      {name}
                    </Typography>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export const CompanyFilter = memo(CompanyFilterInner);