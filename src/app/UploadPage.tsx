"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import { palette } from "./theme";
import { ConfirmedCard } from "./components/ConfirmedCard";
import { useSyncExternalStore } from "react";
import { commitSnapshot, getServerSnapshot, getSnapshot, subscribe } from "../lib/storage";
import { isLikelyCsv, mergeByPeriod, parseCsv } from "../lib/csv";
import type { Payslip } from "../lib/types";

const SAMPLE_PREVIEW = [
  ["20/04/2026", "26/04/2026", "3.4833", "$137.51", "$1.25", "22", "16.5", "$116.76"],
  ["13/04/2026", "19/04/2026", "6.0000", "$236.40", "$1.25", "36", "16.5", "$201.65"],
  ["06/04/2026", "12/04/2026", "14.800", "$588.75", "$5.00", "97", "16.5", "$496.75"],
];

interface CommittedStats {
  rows: Payslip[];
  fileName: string;
  fileSize: number;
  parseTimeMs: number;
  skipped: number;
  added: number;
  updated: number;
}

export default function UploadPage() {
  const router = useRouter();
  const currentPayslips = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [stats, setStats] = useState<CommittedStats | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ingest = useCallback(
    async (file: File) => {
      if (!isLikelyCsv(file)) {
        window.alert(
          "PDF parsing is coming soon. Please drop a CSV file exported from your payroll system.",
        );
        return;
      }
      setBusy(true);
      try {
        const start = performance.now();
        const text = await file.text();
        const { rows, skipped } = parseCsv(text);
        const ms = Math.round(performance.now() - start);
        if (rows.length === 0) {
          window.alert(
            skipped > 0
              ? `Could not parse any rows from ${file.name} (${skipped} skipped). Check the header row.`
              : `No rows found in ${file.name}.`,
          );
          return;
        }
        const { merged, added, updated } = mergeByPeriod(currentPayslips, rows);
        commitSnapshot(merged);
        setStats({
          rows,
          fileName: file.name,
          fileSize: file.size,
          parseTimeMs: ms,
          skipped,
          added,
          updated,
        });
      } finally {
        setBusy(false);
      }
    },
    [currentPayslips],
  );

  const onPickFromIdle = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = "";
    await ingest(file);
  }, [ingest]);

  const onPick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onReplace = useCallback(() => {
    setStats(null);
  }, []);

  const onUseSample = useCallback(() => {
    import("../lib/sample").then(({ SAMPLE_PAYSLIPS }) => {
      commitSnapshot(SAMPLE_PAYSLIPS);
      router.push("/");
    });
  }, [router]);

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes("Files")) return;
      dragCounter.current += 1;
      setIsDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (!e.relatedTarget) {
        dragCounter.current = 0;
        setIsDragging(false);
        return;
      }
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) setIsDragging(false);
    };
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        void ingest(files[0]);
      }
    };
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver, { passive: false });
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [ingest]);

  useEffect(() => {
    if (stats) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [stats]);

  return (
    <Box
      sx={{
        maxWidth: 960,
        mx: "auto",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: palette.mint,
              mb: 1,
            }}
          >
            Upload
          </Typography>
          <Typography
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.04em",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              lineHeight: 1.05,
              color: palette.text,
            }}
          >
            Drop a payslip CSV
          </Typography>
          <Typography
            sx={{
              mt: 1,
              color: palette.textMute,
              fontSize: 13.5,
              maxWidth: 560,
              lineHeight: 1.55,
            }}
          >
            Your file is parsed in the browser. We auto-load it into the dashboard
            (de-duping by period) and show you a preview of what was read.
          </Typography>
        </Box>
        <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
          <Button
            onClick={onUseSample}
            startIcon={<DescriptionRoundedIcon fontSize="small" />}
            sx={{
              color: palette.textMute,
              border: `1px solid ${palette.borderHi}`,
              "&:hover": {
                borderColor: palette.mint,
                color: palette.mint,
                backgroundColor: palette.mintWash,
              },
            }}
          >
            Use sample data
          </Button>
        </Stack>
      </Stack>

      {stats ? (
        <Box className="fade-up">
          <ConfirmedCard stats={stats} onReplace={onReplace} />
        </Box>
      ) : (
        <Box
          className="fade-up"
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" },
          }}
        >
          <Box
            role="button"
            tabIndex={0}
            aria-label="Upload payslip CSV"
            onClick={onPick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPick();
              }
            }}
            sx={{
              borderRadius: 4,
              border: `1px dashed ${isDragging ? palette.mint : palette.borderHi}`,
              backgroundColor: isDragging ? palette.mintWash : palette.surface,
              p: 4,
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: 360,
              position: "relative",
              overflow: "hidden",
              cursor: busy ? "wait" : "pointer",
              transition: "all 200ms ease",
              outline: "none",
              "&:hover": {
                borderColor: palette.mint,
                backgroundColor: palette.mintWash,
              },
              "&:focus-visible": {
                boxShadow: `0 0 0 3px ${palette.mint}33`,
              },
            }}
          >
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(500px 240px at 50% 0%, ${palette.mint}0A, transparent 60%)`,
                pointerEvents: "none",
              }}
            />
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                backgroundColor: palette.surfaceLow,
                border: `1px solid ${palette.border}`,
                color: palette.mint,
                display: "grid",
                placeItems: "center",
                boxShadow: `0 0 32px ${palette.mint}33`,
                position: "relative",
                zIndex: 1,
              }}
            >
              {busy ? (
                <HourglassEmptyRoundedIcon sx={{ fontSize: 28 }} />
              ) : (
                <CloudUploadRoundedIcon sx={{ fontSize: 28 }} />
              )}
            </Box>
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                sx={{
                  color: palette.text,
                  fontWeight: 600,
                  fontSize: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                {busy
                  ? "Reading & parsing…"
                  : isDragging
                    ? "Release to upload"
                    : "Drop a CSV anywhere on this page"}
              </Typography>
              <Typography
                sx={{
                  color: palette.textMute,
                  fontSize: 12.5,
                  mt: 0.5,
                  letterSpacing: "0.02em",
                }}
              >
                Or click to pick a file. PDF parsing is coming soon.
              </Typography>
            </Box>
            <Box
              sx={{
                px: 2.5,
                py: 1,
                borderRadius: 2,
                backgroundColor: palette.mint,
                color: palette.ink,
                fontWeight: 600,
                fontSize: 13,
                boxShadow: `0 0 24px ${palette.mint}44`,
                position: "relative",
                zIndex: 1,
              }}
            >
              {busy ? "Parsing…" : "Choose a CSV file"}
            </Box>
            <Typography
              sx={{
                fontSize: 11,
                color: palette.textDim,
                letterSpacing: "0.04em",
                position: "relative",
                zIndex: 1,
              }}
            >
              Files are parsed locally. Nothing is uploaded.
            </Typography>
          </Box>

          <Box
            sx={{
              borderRadius: 3,
              border: `1px solid ${palette.border}`,
              backgroundColor: palette.surfaceLow,
              p: 2.5,
              fontFamily:
                'var(--font-geist-mono), ui-monospace, "SFMono-Regular", Menlo, monospace',
              alignSelf: "flex-start",
            }}
          >
            <Typography
              sx={{
                fontSize: 10.5,
                color: palette.textDim,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
                mb: 1.5,
              }}
            >
              Expected CSV
            </Typography>
            <Box
              sx={{
                fontSize: 11,
                color: palette.textMute,
                lineHeight: 1.7,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <Box sx={{ color: palette.text, mb: 0.5 }}>
                start,end,hours,earns,allowances,tax,super,total
              </Box>
              {SAMPLE_PREVIEW.map((row, idx) => (
                <Box
                  key={idx}
                  sx={{ color: palette.mint, opacity: 0.85 - idx * 0.18 }}
                >
                  {row.join(",")}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={onPickFromIdle}
        style={{ display: "none" }}
        aria-hidden
      />
    </Box>
  );
}