"use client";

import { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { palette } from "../theme";
import type { BreakdownSlice, ChartTheme, WeeklyPoint } from "../../lib/types";
import { fmtDateShort, fmtAudWhole } from "../../lib/format";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <ChartSkeleton height={280} />,
});

function ChartSkeleton({ height }: { height: number }) {
  return (
    <Box
      sx={{
        height,
        borderRadius: 2,
        background: `linear-gradient(90deg, ${palette.surfaceLow} 0%, ${palette.surfaceHi} 50%, ${palette.surfaceLow} 100%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s linear infinite",
        "@keyframes shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      }}
    />
  );
}

function useChartTheme(): ChartTheme {
  const theme = useTheme();
  return useMemo(
    () => ({
      mint: theme.palette.primary.main,
      mintDim: palette.mintDim,
      coral: theme.palette.secondary.main,
      amber: palette.amber,
      text: theme.palette.text.primary,
      textMute: theme.palette.text.secondary,
      textDim: palette.textDim,
      border: theme.palette.divider,
      borderHi: palette.borderHi,
      surface: theme.palette.background.paper,
      surfaceHi: palette.surfaceHi,
      ink: palette.ink,
    }),
    [theme],
  );
}

export const EarningsChart = memo(function EarningsChart({
  weekly,
  rangeStart,
  rangeEnd,
}: {
  weekly: WeeklyPoint[];
  rangeStart: string;
  rangeEnd: string;
}) {
  const t = useChartTheme();

  const { series, categories } = useMemo(() => {
    const filtered = weekly.filter((w) => {
      return w.start >= rangeStart && w.start <= rangeEnd;
    });
    const cats = filtered.map((w) => fmtDateShort(w.start));
    const data = filtered.map((w) => Number(w.totalEarned.toFixed(2)));
    return { series: [{ name: "Total earned", data }], categories: cats };
  }, [weekly, rangeStart, rangeEnd]);

  const options = useMemo(
    () => ({
      chart: {
        id: "earnings",
        type: "bar" as const,
        background: "transparent",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: {
          enabled: true,
          speed: 600,
          animateGradually: { enabled: true, delay: 30 },
        },
        fontFamily:
          'var(--font-geist-sans), -apple-system, "Segoe UI", sans-serif',
        foreColor: t.textMute,
      },
      theme: { mode: "dark" as const },
      colors: [t.mint],
      states: {
        hover: { filter: { type: "lighten" as const, value: 0.08 } },
        active: { filter: { type: "none" as const } },
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "55%",
          borderRadiusApplication: "end" as const,
          dataLabels: { position: "top" as const },
        },
      },
      grid: {
        borderColor: t.border,
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 10, right: 8, bottom: 0, left: 12 },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 0 },
      tooltip: {
        theme: "dark" as const,
        fillSeriesColor: false,
        style: { fontSize: "12px" },
        marker: { show: false },
        x: { show: true },
        y: {
          formatter: (v: number) => fmtAudWhole(v),
          title: { formatter: () => "Total earned" },
        },
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: t.textDim, fontSize: "11px", fontWeight: 500 },
          rotate: 0,
          hideOverlappingLabels: true,
        },
        axisBorder: { color: t.border },
        axisTicks: { color: t.border },
      },
      yaxis: {
        labels: {
          style: { colors: t.textDim, fontSize: "11px" },
          formatter: (v: number) =>
            v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`,
        },
      },
      legend: { show: false },
    }),
    [t, categories],
  );

  return (
    <Box sx={{ width: "100%" }}>
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={300}
      />
    </Box>
  );
});

export const BreakdownDonut = memo(function BreakdownDonut({
  slices,
}: {
  slices: BreakdownSlice[];
}) {
  const t = useChartTheme();
  const total = slices.reduce((acc, s) => acc + s.value, 0);

  const series = useMemo(() => slices.map((s) => Math.max(0, s.value)), [slices]);

  const options = useMemo(
    () => ({
      chart: {
        type: "donut" as const,
        background: "transparent",
        toolbar: { show: false },
        animations: { enabled: true, speed: 500 },
        fontFamily:
          'var(--font-geist-sans), -apple-system, "Segoe UI", sans-serif',
        foreColor: t.textMute,
      },
      theme: { mode: "dark" as const },
      labels: slices.map((s) => s.label),
      colors: slices.map((s) => s.color),
      stroke: { colors: [palette.surface], width: 3 },
      fill: { type: "gradient", gradient: { shade: "dark", stops: [0, 100] } },
      dataLabels: { enabled: false },
      legend: { show: false },
      tooltip: {
        theme: "dark" as const,
        fillSeriesColor: false,
        style: { fontSize: "12px" },
        y: { formatter: (v: number) => fmtAudWhole(v) },
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          donut: {
            size: "72%",
            background: "transparent",
            labels: {
              show: true,
              name: {
                show: true,
                color: t.textMute,
                fontSize: "12px",
                fontWeight: 500,
                offsetY: -8,
                formatter: () => "Total",
              },
              value: {
                show: true,
                color: t.text,
                fontSize: "26px",
                fontWeight: 600,
                fontFamily:
                  'var(--font-geist-mono), ui-monospace, monospace',
                offsetY: 4,
                formatter: (val: string) => fmtAudWhole(parseFloat(val)),
              },
              total: {
                show: true,
                showAlways: true,
                label: "Total",
                color: t.textMute,
                fontSize: "11px",
                fontWeight: 600,
                formatter: () => fmtAudWhole(total),
              },
            },
          },
        },
      },
      states: {
        hover: { filter: { type: "lighten" as const, value: 0.06 } },
        active: { filter: { type: "none" as const } },
      },
    }),
    // t is stable across renders via useChartTheme memo; tracking individual
    // string fields here would re-create options unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slices, total],
  );

  if (total <= 0) {
    return (
      <Box
        sx={{
          height: 260,
          display: "grid",
          placeItems: "center",
          color: "text.secondary",
        }}
      >
        <Typography variant="body2">No data in this range</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <ReactApexChart
        options={options}
        series={series}
        type="donut"
        height={260}
      />
    </Box>
  );
});

export const Sparkline = memo(function Sparkline({
  values,
  color = palette.mint,
  height = 56,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  const options = useMemo(
    () => ({
      chart: {
        type: "area" as const,
        sparkline: { enabled: true },
        toolbar: { show: false },
        animations: { enabled: true, speed: 300 },
      },
      theme: { mode: "dark" as const },
      colors: [color],
      stroke: { curve: "smooth" as const, width: 2 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0,
          stops: [0, 100],
          colorStops: [
            { offset: 0, color, opacity: 0.35 },
            { offset: 100, color, opacity: 0 },
          ],
        },
      },
      tooltip: {
        theme: "dark" as const,
        marker: { show: false },
        x: { show: false },
        y: { formatter: (v: number) => fmtAudWhole(v) },
      },
      grid: { padding: { top: 4, right: 2, bottom: 4, left: 2 } },
      xaxis: { labels: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { show: false }, axisBorder: { show: false } },
    }),
    [color],
  );

  const series = useMemo(
    () => [{ name: "trend", data: values.map((v) => Number(v.toFixed(2))) }],
    [values],
  );

  if (values.length === 0) {
    return <Box sx={{ height, opacity: 0.3 }} />;
  }

  return (
    <Box sx={{ width: "100%", height }}>
      <ReactApexChart
        options={options}
        series={series}
        type="area"
        height={height}
      />
    </Box>
  );
});