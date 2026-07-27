"use client";

/**
 * AzureTaskFilters — controlled filter bar for the Azure Tasks panel.
 *
 * Renders:
 *   - "From" / "To" date inputs
 *   - Assignee, state, and type dropdowns (options derived from loaded
 *     data so we don't need a separate identities endpoint)
 *   - Reset button (only visible when any filter is active)
 *
 * The bar is fully controlled: parent owns `value` and we report changes
 * via `onChange`. Search lives in the merged result-summary strip
 * (left half) — `q` is still part of `value` but it's edited there so
 * the bar can stay focused on structured choices.
 *
 * The dropdowns use the custom <FilterPopoverSelect /> (searchable
 * listbox with a typeahead input) instead of the previous native
 * <select>-behind-chrome wrapper. The popover is what makes the
 * assignee list usable once you have more than ~10 distinct people.
 */

import * as React from "react";
import { Calendar, Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AzureWorkItem, AzureWorkItemQuery } from "./types";
import {
  FilterPopoverSelect,
  type FilterPopoverSelectOption,
} from "./FilterPopoverSelect";

interface AzureTaskFiltersProps {
  value: AzureWorkItemQuery;
  onChange: (next: AzureWorkItemQuery) => void;
  onReset: () => void;
  options: {
    assignees: string[];
    states: string[];
    types: string[];
  };
  /**
   * Items already loaded in the panel — used to compute the
   * "count" hint badges shown to the right of each dropdown option.
   * Optional; without it, we just render the option labels.
   */
  items?: AzureWorkItem[];
  /** Extra className for the outer wrapper. */
  className?: string;
}

const dateInputClass =
  "h-10 w-full rounded-xl text-sm border border-gray-200 bg-white pl-9 pr-3 py-2 shadow-sm transition-all hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100/60 disabled:opacity-50";

/** Format an ISO datetime string for an `<input type="date">` value. */
const isoToDateInput = (iso: string | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

/** Format a `<input type="date">` value back to ISO. */
const dateInputToIso = (v: string): string | undefined => {
  if (!v) return undefined;
  return new Date(`${v}T00:00:00.000Z`).toISOString();
};

export function AzureTaskFilters({
  value,
  onChange,
  onReset,
  options,
  items,
  className,
}: AzureTaskFiltersProps) {
  const hasActiveFilters = Boolean(
    value.from || value.to || value.assignee || value.state || value.type,
  );

  // Items is optional; only count when we have loaded data to count over.
  const assigneeOptions = React.useMemo<FilterPopoverSelectOption[]>(
    () =>
      options.assignees.map((a) => ({
        value: a,
        label: a,
        hint: items ? `${countByAssignee(items, a)}` : undefined,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.assignees, items],
  );
  const stateOptions = React.useMemo<FilterPopoverSelectOption[]>(
    () =>
      options.states.map((s) => ({
        value: s,
        label: s,
        hint: items ? `${countByState(items, s)}` : undefined,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.states, items],
  );
  const typeOptions = React.useMemo<FilterPopoverSelectOption[]>(
    () =>
      options.types.map((t) => ({
        value: t,
        label: t,
        hint: items ? `${countByType(items, t)}` : undefined,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.types, items],
  );

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-2xl shadow-sm p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3 flex-wrap xl:flex-nowrap">
        {/* Filter Label */}
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 shrink-0">
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </div>

        {/* From Date */}
        <div className="relative min-w-[170px] flex-1">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="date"
            aria-label="Changed from"
            value={isoToDateInput(value.from)}
            onChange={(e) =>
              onChange({ ...value, from: dateInputToIso(e.target.value) })
            }
            className={dateInputClass}
          />
        </div>

        {/* To Date */}
        <div className="relative min-w-[170px] flex-1">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="date"
            aria-label="Changed to"
            value={isoToDateInput(value.to)}
            onChange={(e) =>
              onChange({ ...value, to: dateInputToIso(e.target.value) })
            }
            className={dateInputClass}
          />
        </div>

        {/* Assignee (searchable — long lists) */}
        <div className="min-w-[200px] flex-[1.2]">
          <FilterPopoverSelect
            label="Assignee"
            value={value.assignee}
            options={assigneeOptions}
            placeholder="All assignees"
            searchable
            onChange={(v) => onChange({ ...value, assignee: v })}
          />
        </div>

        {/* State */}
        <div className="min-w-[180px] flex-1">
          <FilterPopoverSelect
            label="State"
            value={value.state}
            options={stateOptions}
            placeholder="All states"
            onChange={(v) => onChange({ ...value, state: v })}
          />
        </div>

        {/* Type */}
        <div className="min-w-[180px] flex-1">
          <FilterPopoverSelect
            label="Type"
            value={value.type}
            options={typeOptions}
            placeholder="All types"
            onChange={(v) => onChange({ ...value, type: v })}
          />
        </div>

        {/* Active-filter pills (visible when set) */}
        <ActiveFilterPills
          value={value}
          onChange={onChange}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Reset */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="shrink-0 text-gray-500 hover:text-gray-900"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * ActiveFilterPills — small chips next to the dropdowns that surface
 * each filter value as a removable pill. Improves the "what filters
 * are currently applied" affordance without re-opening the popover.
 */
function ActiveFilterPills({
  value,
  onChange,
  hasActiveFilters,
}: {
  value: AzureWorkItemQuery
  onChange: (next: AzureWorkItemQuery) => void
  hasActiveFilters: boolean
}) {
  if (!hasActiveFilters) return null
  const pills: Array<{
    label: string
    onClear: () => void
  }> = []
  if (value.state) {
    pills.push({
      label: `State · ${value.state}`,
      onClear: () => onChange({ ...value, state: undefined }),
    })
  }
  if (value.type) {
    pills.push({
      label: `Type · ${value.type}`,
      onClear: () => onChange({ ...value, type: undefined }),
    })
  }
  if (value.assignee) {
    pills.push({
      label: `Assignee · ${value.assignee}`,
      onClear: () => onChange({ ...value, assignee: undefined }),
    })
  }
  if (value.from) {
    pills.push({
      label: `From · ${new Date(value.from).toISOString().slice(0, 10)}`,
      onClear: () => onChange({ ...value, from: undefined }),
    })
  }
  if (value.to) {
    pills.push({
      label: `To · ${new Date(value.to).toISOString().slice(0, 10)}`,
      onClear: () => onChange({ ...value, to: undefined }),
    })
  }
  if (pills.length === 0) return null
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {pills.map((p) => (
        <span
          key={p.label}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-800"
        >
          {p.label}
          <button
            type="button"
            onClick={p.onClear}
            aria-label={`Remove ${p.label}`}
            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-blue-600 hover:text-white hover:bg-blue-600"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )
}

function countByAssignee(items: AzureWorkItem[], name: string): number {
  let n = 0
  for (const it of items) {
    if (it.assignedTo?.displayName === name) n += 1
  }
  return n
}

function countByState(items: AzureWorkItem[], state: string): number {
  let n = 0
  for (const it of items) if (it.state === state) n += 1
  return n
}

function countByType(items: AzureWorkItem[], type: string): number {
  let n = 0
  for (const it of items) if (it.type === type) n += 1
  return n
}

/** Derive the dropdown options from the items already in memory. */
export function deriveFilterOptions(items: AzureWorkItem[]) {
  const assignees = new Set<string>();
  const states = new Set<string>();
  const types = new Set<string>();
  for (const it of items) {
    if (it.assignedTo?.displayName) assignees.add(it.assignedTo.displayName);
    if (it.state) states.add(it.state);
    if (it.type) types.add(it.type);
  }
  return {
    assignees: Array.from(assignees).sort((a, b) => a.localeCompare(b)),
    states: Array.from(states).sort((a, b) => a.localeCompare(b)),
    types: Array.from(types).sort((a, b) => a.localeCompare(b)),
  };
}
