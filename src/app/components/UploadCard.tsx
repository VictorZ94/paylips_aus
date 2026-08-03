"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import { palette } from "../theme";
import { isLikelyCsv, mergeByPeriod, parseCsv } from "../../lib/csv";
import type { Payslip } from "../../lib/types";

interface UploadCardProps {
  onMerged: (rows: Payslip[]) => void;
}

const UploadCardInner = function UploadCard({ onMerged }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragCounter = useRef(0);
  const onMergedRef = useRef(onMerged);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{
    severity: "success" | "info" | "warning" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    onMergedRef.current = onMerged;
  });

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const file = files[0];
      if (!isLikelyCsv(file)) {
        setToast({
          severity: "info",
          message:
            "PDF parsing is coming soon. For now, drop a CSV exported from your payroll system.",
        });
        return;
      }
      setBusy(true);
      try {
        const text = await file.text();
        const { rows, skipped } = parseCsv(text);
        if (rows.length === 0) {
          setToast({
            severity: "error",
            message:
              skipped > 0
                ? `Could not parse any rows from ${file.name}. Check the header row.`
                : `No rows found in ${file.name}.`,
          });
          return;
        }
        onMergedRef.current(rows);
        setToast({
          severity: "success",
          message: `Loaded ${rows.length} payslip${rows.length === 1 ? "" : "s"} from ${file.name}${
            skipped > 0 ? ` (${skipped} skipped)` : ""
          }.`,
        });
      } catch {
        setToast({
          severity: "error",
          message: `Failed to read ${file.name}.`,
        });
      } finally {
        setBusy(false);
      }
    },
    [],
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
        void handleFiles(Array.from(files));
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
  }, [handleFiles]);

  const onPick = useCallback(() => inputRef.current?.click(), []);
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        void handleFiles(Array.from(files));
      }
      e.target.value = "";
    },
    [handleFiles],
  );

  return (
    <>
      <Box
        onClick={onPick}
        role="button"
        tabIndex={0}
        aria-label="Upload payslip CSV"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPick();
          }
        }}
        sx={{
          position: "relative",
          cursor: busy ? "wait" : "pointer",
          borderRadius: 3,
          p: 2.25,
          display: "flex",
          alignItems: "center",
          gap: 2,
          border: `1px dashed ${
            isDragging ? palette.mint : palette.borderHi
          }`,
          backgroundColor: isDragging ? palette.mintWash : "transparent",
          transition: "all 180ms ease",
          outline: "none",
          "&:hover": {
            borderColor: palette.mint,
            backgroundColor: palette.mintWash,
          },
          "&:focus-visible": {
            borderColor: palette.mint,
            boxShadow: `0 0 0 3px ${palette.mint}33`,
          },
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor: isDragging ? palette.mint : palette.surfaceHi,
            color: isDragging ? palette.ink : palette.mint,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            transition: "all 180ms ease",
          }}
        >
          {busy ? (
            <HourglassEmptyRoundedIcon fontSize="small" />
          ) : (
            <CloudUploadRoundedIcon fontSize="small" />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: palette.text,
            }}
          >
            {busy ? "Reading file…" : "Drop CSV or click to upload"}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: palette.textDim,
              letterSpacing: "0.04em",
            }}
          >
            .csv · dedupes by period · stays on this device
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DescriptionRoundedIcon fontSize="small" />}
            onClick={(e) => {
              e.stopPropagation();
              onPick();
            }}
            disabled={busy}
            sx={{ display: { xs: "none", sm: "inline-flex" } }}
          >
            Choose file
          </Button>
        </Stack>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onChange}
          style={{ display: "none" }}
          aria-hidden
        />
        {busy && (
          <LinearProgress
            sx={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 6,
              borderRadius: 1,
              height: 2,
              backgroundColor: palette.surfaceLow,
              "& .MuiLinearProgress-bar": { backgroundColor: palette.mint },
            }}
          />
        )}
      </Box>
      <Snackbar
        open={!!toast}
        autoHideDuration={4500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        action={
          <IconButton
            size="small"
            onClick={() => setToast(null)}
            sx={{ color: palette.textMute }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        }
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            variant="outlined"
            onClose={() => setToast(null)}
            sx={{
              backgroundColor: palette.surfaceHi,
              borderColor: palette.borderHi,
              color: palette.text,
            }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
};

export const UploadCard = memo(UploadCardInner);

export { mergeByPeriod };