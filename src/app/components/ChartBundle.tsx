"use client";

import { BreakdownDonut, EarningsChart } from "./charts";
import type { BreakdownSlice, WeeklyPoint } from "../../lib/types";

type EarningsProps = {
  kind: "earnings";
  weekly: WeeklyPoint[];
  rangeStart: string;
  rangeEnd: string;
};

type DonutProps = {
  kind: "donut";
  slices: BreakdownSlice[];
  onSliceClick?: (label: string) => void;
};

export type ChartBundleProps = EarningsProps | DonutProps;

export default function ChartBundle(props: ChartBundleProps) {
  if (props.kind === "earnings") {
    const { kind: _kind, weekly, rangeStart, rangeEnd } = props;
    void _kind;
    return <EarningsChart weekly={weekly} rangeStart={rangeStart} rangeEnd={rangeEnd} />;
  }
  const { kind: _kind, slices, onSliceClick } = props;
  void _kind;
  return <BreakdownDonut slices={slices} onSliceClick={onSliceClick} />;
}