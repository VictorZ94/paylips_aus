"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import { palette } from "./theme";
import { ConfirmedCard } from "./components/ConfirmedCard";
import { mergeByPeriod } from "../lib/csv";
import { commitSnapshot, getSnapshot } from "../lib/storage";
import type { Payslip } from "../lib/types";

const MAX_PAGES = 6;
const RENDER_SCALE = 1.5;

async function renderPdfToBase64(
  file: File,
  onProgress: (page: number, total: number) => void,
) {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buffer = await file.arrayBuffer();
  const doc = await getDocument({ data: buffer }).promise;
  const totalPages = Math.min(doc.numPages, MAX_PAGES);
  const images: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress(i, totalPages);
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob returned null"));
      }, "image/png");
    });
    const ab = await blob.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let binary = "";
    for (let j = 0; j < bytes.byteLength; j++) {
      binary += String.fromCharCode(bytes[j]);
    }
    images.push(btoa(binary));
    page.cleanup();
  }

  return images;
}

export default function AiUploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{
    page: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    rows: Payslip[];
    fileName: string;
    fileSize: number;
    parseTimeMs: number;
    skipped: number;
    added: number;
    updated: number;
  } | null>(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ingest = useCallback(async (file: File) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    const start = performance.now();
    try {
      setProgress({ page: 0, total: 0 });
      const images = await renderPdfToBase64(file, (page, total) =>
        setProgress({ page, total }),
      );

      const form = new FormData();
      for (let i = 0; i < images.length; i++) {
        const blob = await fetch(`data:image/png;base64,${images[i]}`).then(
          (r) => r.blob(),
        );
        form.append("images", blob, `page-${i + 1}.png`);
      }

      const res = await fetch("/api/ai-extract", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error ?? `Server returned ${res.status}`;
        throw new Error(msg);
      }
      const body = (await res.json()) as { payslips: Payslip[] };
      const ms = Math.round(performance.now() - start);
      const overlay = {
        rows: body.payslips,
        fileName: file.name,
        fileSize: file.size,
        parseTimeMs: ms,
        skipped: 0,
        added: body.payslips.length,
        updated: 0,
      };
      setStats(overlay);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, []);

  const commit = useCallback(async (rows: Payslip[]) => {
    const current = getSnapshot();
    const { merged } = mergeByPeriod(current, rows);
    await commitSnapshot(merged);
  }, []);

  const onReplace = useCallback(() => {
    setStats(null);
    setError(null);
  }, []);

  const onPick = useCallback(() => fileInputRef.current?.click(), []);
  const onPickFromIdle = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      await ingest(files[0]);
      e.target.value = "";
    },
    [ingest],
  );

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

  const dropLabel = useMemo(() => {
    if (busy) {
      if (progress) return `Rendering page ${progress.page}/${progress.total}…`;
      return "Preparing PDF…";
    }
    if (isDragging) return "Release to scan";
    return "Drop a payslip PDF anywhere on this page";
  }, [busy, isDragging, progress]);

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
          Read a payslip with AI
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
          Drop a PDF. We render each page to an image and send it to
          gemma4:cloud for structured extraction. Nothing leaves your browser.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          variant="outlined"
          onClose={() => setError(null)}
          sx={{
            backgroundColor: palette.coralWash,
            borderColor: palette.coral,
            color: palette.text,
            fontSize: 13,
          }}
        >
          {error}
        </Alert>
      )}

      {stats ? (
        <Box className="fade-up">
          <ConfirmedCard
            stats={stats}
            onReplace={onReplace}
            commitAction={commit}
            helperText="Original PDF stays on your device. Re-upload to update or replace periods."
          />
        </Box>
      ) : (
        <Box
          role="button"
          tabIndex={0}
          aria-label="Upload payslip PDF"
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
              <AutoAwesomeRoundedIcon sx={{ fontSize: 28 }} />
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
              {dropLabel}
            </Typography>
            <Typography
              sx={{
                color: palette.textMute,
                fontSize: 12.5,
                mt: 0.5,
                letterSpacing: "0.02em",
              }}
            >
              {busy
                ? "Rendering PDF pages, querying gemma4:cloud"
                : "Or click to pick a file. Up to 6 pages per upload."}
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
            {busy ? "Working…" : "Choose a PDF file"}
          </Box>
          {busy && progress && (
            <LinearProgress
              variant="determinate"
              value={(progress.page / Math.max(progress.total, 1)) * 100}
              sx={{
                width: 240,
                borderRadius: 2,
                position: "relative",
                zIndex: 1,
                backgroundColor: palette.surfaceLow,
                "& .MuiLinearProgress-bar": {
                  backgroundColor: palette.mint,
                  borderRadius: 2,
                },
              }}
            />
          )}
          <Typography
            sx={{
              fontSize: 11,
              color: palette.textDim,
              letterSpacing: "0.04em",
              position: "relative",
              zIndex: 1,
            }}
          >
            PDF stays on this device. API key is on the server.
          </Typography>
        </Box>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={onPickFromIdle}
        style={{ display: "none" }}
        aria-hidden
      />
    </Box>
  );
}