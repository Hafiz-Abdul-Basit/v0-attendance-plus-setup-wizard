"use client"

/**
 * AzureTaskInsights — "Insights" tab on Azure Tasks.
 *
 * Breaks the CURRENT filter result down by status and by assignee (from
 * the server summary, which covers every matching task — not just the
 * loaded page). Clicking a bar applies that status / assignee as a filter
 * and jumps back to the Tasks tab.
 */

import * as React from "react"
import { AlertCircle, CheckCircle2, Clock, ListChecks, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AzureWorkItemSummary } from "./types"

const MAX_ASSIGNEES = 12

interface Props {
  summary: AzureWorkItemSummary | null
  isLoading: boolean
  onFilterState: (state: string) => void
  onFilterAssignee: (assignee: string) => void
}

export function AzureTaskInsights({ summary, isLoading, onFilterState, onFilterAssignee }: Props) {
  if (isLoading && !summary) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading insights…
      </div>
    )
  }
  if (!summary || summary.total === 0) {
    return <div className="py-16 text-center text-sm text-gray-500">No tasks match the current filters.</div>
  }

  const byState = Object.entries(summary.byState).sort((a, b) => b[1] - a[1])
  const byAssigneeAll = Object.entries(summary.byAssignee).sort((a, b) => b[1] - a[1])
  const byAssignee = byAssigneeAll.slice(0, MAX_ASSIGNEES)
  const pct = (n: number) => Math.round((n / summary.total) * 100)

  return (
    <div className="h-full overflow-auto az-task-scroller p-4 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric icon={ListChecks} tone="text-blue-600 bg-blue-50" label="Total" value={summary.total} />
        <Metric icon={Clock} tone="text-amber-600 bg-amber-50" label="Active" value={summary.active} sub={`${pct(summary.active)}%`} />
        <Metric icon={CheckCircle2} tone="text-emerald-600 bg-emerald-50" label="Completed" value={summary.completed} sub={`${pct(summary.completed)}%`} />
        <Metric icon={AlertCircle} tone="text-red-600 bg-red-50" label="Overdue" value={summary.overdue} sub="past target date" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarCard
          title="By status"
          rows={byState}
          max={byState[0]?.[1] ?? 1}
          barClass="bg-gradient-to-r from-blue-500 to-indigo-500"
          onPick={onFilterState}
          hint="Click a status to filter the task list"
        />
        <BarCard
          title="By assignee"
          rows={byAssignee}
          max={byAssignee[0]?.[1] ?? 1}
          barClass="bg-gradient-to-r from-purple-500 to-indigo-500"
          onPick={(name) => {
            if (name !== "Unassigned") onFilterAssignee(name)
          }}
          hint={
            byAssigneeAll.length > MAX_ASSIGNEES
              ? `Top ${MAX_ASSIGNEES} of ${byAssigneeAll.length} · click to filter`
              : "Click a person to filter the task list"
          }
        />
      </div>
    </div>
  )
}

function Metric({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>
  tone: string
  label: string
  value: number
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5">
      <div className="flex items-center gap-2">
        <span className={cn("inline-flex w-8 h-8 items-center justify-center rounded-lg", tone)}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</span>
        {sub ? <span className="text-xs text-gray-400">{sub}</span> : null}
      </div>
    </div>
  )
}

function BarCard({
  title,
  rows,
  max,
  barClass,
  onPick,
  hint,
}: {
  title: string
  rows: Array<[string, number]>
  max: number
  barClass: string
  onPick: (key: string) => void
  hint: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-[11px] text-gray-400">{hint}</span>
      </div>
      <ul className="space-y-1">
        {rows.map(([name, count]) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => onPick(name)}
              className="w-full grid grid-cols-[minmax(0,9rem)_1fr_3rem] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-gray-50"
              title={`Filter by ${name}`}
            >
              <span className="truncate text-gray-700">{name}</span>
              <span className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <span
                  className={cn("block h-full rounded-full", barClass)}
                  style={{ width: `${Math.max(4, Math.round((count / max) * 100))}%` }}
                />
              </span>
              <span className="text-right tabular-nums text-gray-600">{count.toLocaleString()}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
