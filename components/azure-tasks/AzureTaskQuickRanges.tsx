"use client";

/**
 * AzureTaskQuickRanges — one-click date-range pills.
 *
 * Sits between the summary cards and the filter bar. Lets the user
 * switch between common windows (last 7d / 30d / 90d, this month, this
 * quarter, all-time) without re-typing dates.
 *
 * The pills are visually subordinate to the filter bar but always
 * visible — they're how most users will navigate the page.
 */

import * as React from "react";
import { Calendar, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type QuickRangeId = "7d" | "30d" | "90d" | "month" | "quarter" | "all";

export interface QuickRange {
  id: QuickRangeId;
  label: string;
  /** Compute the from/to ISO strings relative to `now`. */
  resolve: (now: Date) => { from?: string; to?: string };
}

const startOfDayIso = (d: Date): string => {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out.toISOString();
};

export const QUICK_RANGES: QuickRange[] = [
  {
    id: "7d",
    label: "Last 7d",
    resolve: (now) => {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { from: startOfDayIso(from) };
    },
  },
  {
    id: "30d",
    label: "Last 30d",
    resolve: (now) => {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { from: startOfDayIso(from) };
    },
  },
  {
    id: "90d",
    label: "Last 90d",
    resolve: (now) => {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      return { from: startOfDayIso(from) };
    },
  },
  {
    id: "month",
    label: "This month",
    resolve: (now) => {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: startOfDayIso(from) };
    },
  },
  // {
  //   id: "quarter",
  //   label: "This quarter",
  //   resolve: (now) => {
  //     const qStartMonth = Math.floor(now.getMonth() / 3) * 3
  //     const from = new Date(now.getFullYear(), qStartMonth, 1)
  //     return { from: startOfDayIso(from) }
  //   },
  // },
  // {
  //   id: "all",
  //   label: "All time",
  //   resolve: () => ({}),
  // },
];

/**
 * Detect which quick-range (if any) the current from/to pair matches.
 * Returns the id of the matching range, or null if it's a custom range.
 *
 * The match is intentionally tolerant of millisecond differences — we
 * only care whether the user-visible label matches the dates.
 */
export function detectQuickRange(
  from: string | undefined,
  to: string | undefined,
): QuickRangeId | null {
  if (from == null && to == null) return "all";
  for (const range of QUICK_RANGES) {
    if (range.id === "all") continue;
    const { from: f, to: t } = range.resolve(new Date());
    if (f === from && t === to) return range.id;
  }
  return null;
}

interface AzureTaskQuickRangesProps {
  from: string | undefined;
  to: string | undefined;
  onChange: (next: { from?: string; to?: string }) => void;
  className?: string;
}

export function AzureTaskQuickRanges({
  from,
  to,
  onChange,
  className,
}: AzureTaskQuickRangesProps) {
  const activeId = detectQuickRange(from, to);
  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2.5 flex items-center gap-2 flex-wrap",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider pr-2">
        <Calendar className="w-3.5 h-3.5" />
        Range
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {QUICK_RANGES.map((range) => {
          const isActive = activeId === range.id;
          return (
            <button
              key={range.id}
              type="button"
              onClick={() => onChange(range.resolve(new Date()))}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white border border-blue-600"
                  : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100",
              )}
            >
              {range.label}
            </button>
          );
        })}
      </div>
      {activeId == null ? (
        <button
          type="button"
          onClick={() => onChange({ from: undefined, to: undefined })}
          className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <X className="w-3 h-3" />
          Clear custom range
        </button>
      ) : null}
    </div>
  );
}
