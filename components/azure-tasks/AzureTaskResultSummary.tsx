"use client";

/**
 * AzureTaskResultSummary — single horizontal strip combining the search
 * bar (left) with the result-count chips (right) and a "Refreshed … ago"
 * timestamp.
 *
 * Folding both into one row keeps the controls "single-purpose,
 * single-row" so the table below can claim as much vertical space as
 * possible.
 *
 * Layout:
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │  🔍 Search work items… [⌘K]                items · Open · Done · Overdue │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * On narrow screens the chips wrap below the search bar automatically.
 *
 * The chip counts are recomputed from the items we already have in
 * memory (no extra fetch), so they reflect what's loaded — the same
 * caveat as before. The API still returns a server-side `summary`
 * (driving the header KPI strip), which is over the full filtered set.
 */

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ListChecks,
  Search,
  Timer,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AzureWorkItem } from "./types";

interface AzureTaskResultSummaryProps {
  items: AzureWorkItem[];
  total: number;
  isLoading: boolean;
  refreshedAt?: number | null;
  /** Wire up the search bar (left side). */
  search: {
    value: string | undefined;
    onChange: (next: string | undefined) => void;
    placeholder?: string;
  };
  className?: string;
}

const DONE_STATES = new Set([
  "done",
  "closed",
  "resolved",
  "completed",
  "removed",
]);

function isOpen(state: string): boolean {
  return !DONE_STATES.has(state.toLowerCase());
}

function timeAgo(ts: number): string {
  const diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.round(diffSec / 3600)}h ago`;
  return `${Math.round(diffSec / 86_400)}d ago`;
}

export function AzureTaskResultSummary({
  items,
  total,
  isLoading,
  refreshedAt,
  search,
  className,
}: AzureTaskResultSummaryProps) {
  const { open, done, overdue } = React.useMemo(() => {
    let openCount = 0;
    let doneCount = 0;
    let overdueCount = 0;
    const now = Date.now();
    for (const it of items) {
      if (isOpen(it.state)) openCount += 1;
      else doneCount += 1;
      if (
        it.targetDate &&
        isOpen(it.state) &&
        new Date(it.targetDate).getTime() < now
      ) {
        overdueCount += 1;
      }
    }
    return { open: openCount, done: doneCount, overdue: overdueCount };
  }, [items]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [mac, setMac] = React.useState(false);

  // Platform detection for the ⌘K vs Ctrl+K hint.
  React.useEffect(() => {
    if (typeof navigator !== "undefined") {
      setMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
    }
  }, []);

  // ⌘K / Ctrl+K focuses the input from anywhere on the page. Escape
  // clears the search when the input has a value, otherwise blurs.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        if (search.value) {
          e.preventDefault();
          search.onChange(undefined);
        } else {
          inputRef.current?.blur();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [search.value, search.onChange]);

  const searchActive = Boolean(search.value);

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2",
        "flex items-center gap-3 flex-wrap text-sm",
        className,
      )}
    >
      {/* ── Left: search input ─────────────────────────────────────── */}
      <div
        className={cn(
          "group relative flex items-center w-full sm:w-96 md:w-[500px] lg:w-[650px] xl:w-[750px]",
          "bg-gray-50 border border-gray-200 rounded-xl px-2.5 transition-all",
          "focus-within:bg-white focus-within:border-blue-400 focus-within:shadow-sm focus-within:ring-4 focus-within:ring-blue-100/60",
          searchActive && "bg-blue-50/30 border-blue-300",
        )}
      >
        <Search
          className={cn(
            "w-5 h-5 shrink-0 transition-colors",
            searchActive
              ? "text-blue-600"
              : "text-gray-400 group-focus-within:text-blue-600",
          )}
        />

        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search work items"
          placeholder={
            search.placeholder ?? "Search by title, id, tag, or assignee…"
          }
          value={search.value ?? ""}
          onChange={(e) => search.onChange(e.target.value || undefined)}
          className={cn(
            "flex-1 min-w-0 bg-transparent outline-none border-0",
            "h-8 text-sm text-gray-900 placeholder:text-gray-400 px-2",
          )}
        />

        {searchActive ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              search.onChange(undefined);
              inputRef.current?.focus();
            }}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}

        <kbd
          aria-hidden
          className={cn(
            "hidden lg:inline-flex items-center px-1.5 h-5 ml-1 rounded-md border border-gray-200 bg-white text-[10px] font-mono font-semibold text-gray-500 select-none",
            searchActive && "opacity-0 pointer-events-none",
          )}
        >
          {mac ? "⌘" : "Ctrl"} K
        </kbd>
      </div>

      {/* ── Right: chips ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap ml-auto">
        <div className="flex items-center gap-1.5 text-gray-500">
          <ListChecks className="w-4 h-4" />
          <span className="font-semibold text-gray-700 tabular-nums">
            {total.toLocaleString()}
          </span>
          <span className="text-gray-500">
            {total === 1 ? "item" : "items"}
          </span>
        </div>
        <Divider />
        <Chip
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Open"
          value={open}
          tone="amber"
          loading={isLoading && items.length === 0}
        />
        <Chip
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          label="Done"
          value={done}
          tone="emerald"
          loading={isLoading && items.length === 0}
        />
        <Chip
          icon={<AlertCircle className="w-3.5 h-3.5" />}
          label="Overdue"
          value={overdue}
          tone="red"
          loading={isLoading && items.length === 0}
        />
        {refreshedAt ? (
          <div className="hidden md:inline-flex items-center gap-1 text-[11px] text-gray-400 ml-2">
            <Timer className="w-3 h-3" />
            Refreshed {timeAgo(refreshedAt)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Divider() {
  return <span className="h-4 w-px bg-gray-200" aria-hidden />;
}

interface ChipProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "amber" | "emerald" | "red";
  loading?: boolean;
}

const TONE_CLASSES: Record<ChipProps["tone"], string> = {
  amber: "text-amber-700 bg-amber-50 border-amber-200",
  emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
  red: "text-red-700 bg-red-50 border-red-200",
};

function Chip({ icon, label, value, tone, loading }: ChipProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium",
        TONE_CLASSES[tone],
      )}
    >
      {icon}
      <span>{label}</span>
      <span className="font-semibold tabular-nums">
        {loading ? "…" : value.toLocaleString()}
      </span>
    </div>
  );
}
