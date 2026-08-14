"use client";

import { memo, useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { palette } from "../theme";
import { fmtAudWhole, fmtNum2, fmtNum4, fmtDateShort } from "../../lib/format";
import type { Payslip } from "../../lib/types";

export const DETECTED_COLUMNS: { key: keyof Payslip | "start" | "end"; label: string }[] = [
  { key: "start", label: "start date" },
  { key: "end", label: "end date" },
  { key: "hoursWorked", label: "hours worked" },
  { key: "earns", label: "earns" },
  { key: "laundryAllowances", label: "laundry allowances" },
  { key: "taxWithheld", label: "tax withheld" },
  { key: "super", label: "super" },
  { key: "totalEarned", label: "total earned" },
];

export interface ParseStats {
  rows: Payslip[];
  fileName: string;
  fileSize: number;
  parseTimeMs: number;
  skipped: number;
  added: number;
  updated: number;
}

interface ParsePreviewProps {
  stats: ParseStats;
  live?: boolean;
}

const ParsePreviewInner = function ParsePreview({ stats, live }: ParsePreviewProps) {
  const { rows, fileName, fileSize, parseTimeMs, skipped, added, updated } = stats;

  const totals = useMemo(() => {
    let totalEarned = 0;
    let hours = 0;
    let taxWithheld = 0;
    let superTotal = 0;
    let allowancesTotal = 0;
    for (const r of rows) {
      totalEarned += r.totalEarned;
      hours += r.hoursWorked;
      taxWithheld += r.taxWithheld;
      superTotal += r.super;
      allowancesTotal += r.laundryAllowances;
    }
    const taxPct = totalEarned > 0 ? (taxWithheld / totalEarned) * 100 : 0;
    return { totalEarned, hours, taxWithheld, superTotal, allowancesTotal, taxPct };
  }, [rows]);

  const detected = useMemo(() => {
    const present = new Set<keyof Payslip | "start" | "end">();
    if (rows.length > 0) {
      const r = rows[0];
      if (r.startDate) present.add("start");
      if (r.endDate) present.add("end");
      if (rows.some((x) => x.hoursWorked > 0)) present.add("hoursWorked");
      if (rows.some((x) => x.earns > 0)) present.add("earns");
      if (rows.some((x) => x.laundryAllowances > 0)) present.add("laundryAllowances");
      if (rows.some((x) => x.taxWithheld > 0)) present.add("taxWithheld");
      if (rows.some((x) => x.super > 0)) present.add("super");
      if (rows.some((x) => x.totalEarned > 0)) present.add("totalEarned");
    }
    return present;
  }, [rows]);

  const preview = useMemo(() => rows.slice(0, 3), [rows]);

  return (
    <Box
      sx={{
        borderRadius: 4,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surface,
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          backgroundColor: palette.surfaceLow,
          borderBottom: `1px solid ${palette.border}`,
          flexWrap: "wrap",
          rowGap: 1,
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: live ? palette.mint : palette.textDim,
              boxShadow: live ? `0 0 10px ${palette.mint}` : "none",
              animation: live ? "blink 1.6s ease-in-out infinite" : "none",
              "@keyframes blink": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.35 },
              },
            }}
          />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.text }}>
            {fileName}
          </Typography>
          <Typography
            className="tabular"
            sx={{
              fontSize: 11,
              color: palette.textDim,
              letterSpacing: "0.04em",
            }}
          >
            {formatBytes(fileSize)} · parsed in {parseTimeMs} ms
          </Typography>
        </Stack>
        {live && (
          <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
            <CheckCircleRoundedIcon sx={{ fontSize: 14, color: palette.mint }} />
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: palette.mint,
              }}
            >
              Live in dashboard
            </Typography>
          </Stack>
        )}
      </Stack>

      <Stack
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          p: 3,
        }}
      >
        <Stat label="Periods" value={String(rows.length)} sub={skipped > 0 ? `${skipped} skipped` : undefined} />
        <Stat
          label="Total earned"
          value={fmtAudWhole(totals.totalEarned)}
          sub={`net of tax`}
        />
        <Stat
          label="Tax"
          value={fmtAudWhole(totals.taxWithheld)}
          sub={`${totals.taxPct.toFixed(1)}% of net`}
          tone="coral"
        />
        <Stat
          label="Super"
          value={fmtAudWhole(totals.superTotal)}
          sub={`@ avg rate`}
          tone="amber"
        />
      </Stack>

      <Box sx={{ px: 3, pb: 1 }}>
        <Typography
          sx={{
            fontSize: 10.5,
            color: palette.textDim,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
            mb: 1,
          }}
        >
          Columns detected ({detected.size}/{DETECTED_COLUMNS.length})
        </Typography>
        <Stack
          direction="row"
          sx={{ flexWrap: "wrap", gap: 0.75 }}
        >
          {DETECTED_COLUMNS.map((c) => {
            const present = detected.has(c.key);
            return (
              <Tooltip
                key={c.key}
                title={present ? "Found in file" : "Not present"}
              >
                <Box
                  sx={{
                    px: 1,
                    py: 0.4,
                    borderRadius: 1,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    color: present ? palette.ink : palette.textDim,
                    backgroundColor: present ? palette.mint : palette.surfaceLow,
                    border: `1px solid ${present ? palette.mint : palette.border}`,
                    opacity: present ? 1 : 0.7,
                  }}
                >
                  {c.label}
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{ px: 3, py: 2 }}>
        <Typography
          sx={{
            fontSize: 10.5,
            color: palette.textDim,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
            mb: 1,
          }}
        >
          Preview · first {preview.length} of {rows.length}
        </Typography>
        <Box
          sx={{
            borderRadius: 2,
            border: `1px solid ${palette.border}`,
            backgroundColor: palette.surfaceLow,
            overflow: "hidden",
            fontFamily:
              'var(--font-geist-mono), ui-monospace, "SFMono-Regular", Menlo, monospace',
            fontSize: 11.5,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1.4fr 0.6fr 0.7fr 0.7fr 0.5fr 0.8fr",
              px: 1.5,
              py: 1,
              borderBottom: `1px solid ${palette.border}`,
              color: palette.textDim,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontSize: 9.5,
            }}
          >
            <span>Period</span>
            <span style={{ textAlign: "right" }}>Hours</span>
            <span style={{ textAlign: "right" }}>Earns</span>
            <span style={{ textAlign: "right" }}>Tax</span>
            <span style={{ textAlign: "right" }}>Super</span>
            <span style={{ textAlign: "right" }}>Net</span>
          </Box>
          {preview.map((r, idx) => (
            <Box
              key={r.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "1.4fr 0.6fr 0.7fr 0.7fr 0.5fr 0.8fr",
                px: 1.5,
                py: 0.9,
                borderBottom:
                  idx === preview.length - 1 ? "none" : `1px solid ${palette.border}`,
                color: palette.text,
                "& > span": { fontVariantNumeric: "tabular-nums" },
              }}
            >
              <span>
                {fmtDateShort(r.startDate)} → {fmtDateShort(r.endDate)}
              </span>
              <span style={{ textAlign: "right" }}>{fmtNum4(r.hoursWorked)}</span>
              <span style={{ textAlign: "right" }}>{fmtAudWhole(r.earns)}</span>
              <span style={{ textAlign: "right" }}>{fmtAudWhole(r.taxWithheld)}</span>
              <span style={{ textAlign: "right" }}>{fmtAudWhole(r.super)}</span>
              <span style={{ textAlign: "right", color: palette.mint, fontWeight: 600 }}>
                {fmtAudWhole(r.totalEarned)}
              </span>
            </Box>
          ))}
        </Box>
      </Box>

      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2,
          backgroundColor: palette.surfaceLow,
          borderTop: `1px solid ${palette.border}`,
          flexWrap: "wrap",
          rowGap: 1,
        }}
      >
        <Typography
          className="tabular"
          sx={{
            fontSize: 11,
            color: palette.textMute,
            letterSpacing: "0.04em",
          }}
        >
          {added > 0 ? `${added} added` : ""}
          {added > 0 && updated > 0 ? " · " : ""}
          {updated > 0 ? `${updated} updated` : ""}
          {added === 0 && updated === 0 ? "no changes" : ""}
        </Typography>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Typography
            sx={{
              fontSize: 11,
              color: palette.textDim,
              letterSpacing: "0.04em",
            }}
          >
            Hours: {fmtNum2(totals.hours)}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "coral" | "amber";
}) {
  const accent = tone === "coral" ? palette.coral : tone === "amber" ? palette.amber : palette.mint;
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${palette.border}`,
        backgroundColor: palette.surfaceLow,
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}
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
          {label}
        </Typography>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: accent,
            boxShadow: `0 0 8px ${accent}66`,
          }}
        />
      </Stack>
      <Typography
        className="kpi-value"
        sx={{
          color: palette.text,
          fontSize: "1.4rem",
        }}
      >
        {value}
      </Typography>
      {sub && (
        <Typography
          sx={{
            fontSize: 11,
            color: palette.textDim,
            letterSpacing: "0.02em",
            mt: 0.5,
          }}
        >
          {sub}
        </Typography>
      )}
    </Box>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export const ParsePreview = memo(ParsePreviewInner);