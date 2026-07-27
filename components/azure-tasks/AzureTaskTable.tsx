"use client"

/**
 * AzureTaskTable — sortable, paginated table of Azure work items.
 *
 * Mirrors the table styling in `components/admin/AdminPanel.tsx`:
 *   - `overflow-x-auto` wrapper, `w-full text-sm`
 *   - `bg-gray-50` header row, uppercase tracking-wider text
 *   - `divide-y divide-gray-100` body, `hover:bg-gray-50` on rows
 *
 * Sort is client-side (the data is already ≤ pageSize, so this is
 * trivial). The header cells are buttons that toggle the sort key
 * and direction via the controlled `onSortChange` callback.
 *
 * Row expansion: when a row's id matches `expandedTaskId`, the row
 * renders an inline expansion beneath it (no modal). The expansion
 * pulls from `expandedTasks[id]` if available (single-item fetch with
 * relations), otherwise shows a placeholder while loading.
 *
 * Empty and loading states are handled inline so the parent can keep
 * the panel composition simple.
 */

import * as React from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronRight, Inbox, Loader2, Paperclip } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AzureWorkItem } from "./types"
import {
  AzureTaskRowExpansion,
  AzureTaskRowExpansionPlaceholder,
} from "./AzureTaskRowExpansion"

export type AzureTaskSortKey =
  | "id"
  | "title"
  | "type"
  | "state"
  | "assignedTo"
  | "changedDate"
  | "createdDate"
  | "priority"
  | "targetDate"
  | "iteration"

export type SortDir = "asc" | "desc"

export interface AzureTaskSort {
  key: AzureTaskSortKey
  dir: SortDir
}

export interface AzureTaskExpansionState {
  /** Which row is currently expanded (null = none). */
  expandedTaskId: number | null
  /** Single-item (relations-expanded) fetches keyed by id. */
  expandedTasks: Record<number, AzureWorkItem>
  /** True while the single-item fetch is in flight. */
  isExpansionLoading: boolean
  /** True if the latest single-item fetch failed. */
  isExpansionError: boolean
  /** Last expansion error (if any). */
  expansionError: unknown
  /** Trigger a refetch of the currently-expanded work item. */
  onExpansionRetry: () => void
}

interface AzureTaskTableProps {
  tasks: AzureWorkItem[]
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  sort: AzureTaskSort
  onSortChange: (next: AzureTaskSort) => void
  expansion: AzureTaskExpansionState
  onRowToggle: (task: AzureWorkItem) => void
  onRetry?: () => void
  /**
   * Lazy-load sentinel — rendered as the last child of the scroll
   * container. The parent IntersectionObserver watches this element.
   * Should be a no-op element (e.g. an empty `<div>`) when there's
   * nothing to load; the parent decides.
   */
  scrollSentinel?: React.ReactNode
  /**
   * End-of-list "all caught up" footer — rendered after the sentinel.
   * The parent decides whether it's visible (typically when
   * `hasMore === false` and we have at least one row).
   */
  caughtUp?: React.ReactNode
}

const columnHeaderClass =
  "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider select-none"

const cellClass = "px-4 py-3 text-sm text-gray-900 align-top"

function stateChipClass(state: string): string {
  const s = state.toLowerCase()
  if (s === "done" || s === "closed" || s === "resolved" || s === "completed") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200"
  }
  if (s === "active" || s === "in progress") {
    return "bg-blue-100 text-blue-800 border-blue-200"
  }
  if (s === "new" || s === "to do") {
    return "bg-gray-100 text-gray-700 border-gray-200"
  }
  if (s === "blocked" || s === "impediment") {
    return "bg-red-100 text-red-800 border-red-200"
  }
  return "bg-indigo-100 text-indigo-800 border-indigo-200"
}

function priorityChipClass(priority: number | null): string {
  if (priority == null) return "bg-gray-100 text-gray-500 border-gray-200"
  if (priority <= 1) return "bg-red-100 text-red-800 border-red-200"
  if (priority === 2) return "bg-amber-100 text-amber-800 border-amber-200"
  return "bg-gray-100 text-gray-700 border-gray-200"
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/** True if the state represents a not-done outcome. */
function isOpenState(state: string): boolean {
  const s = state.toLowerCase()
  return !(s === "done" || s === "closed" || s === "resolved" || s === "completed")
}

/**
 * Returns "Overdue", "Due today", "Due in Nd" for open work items, or null
 * otherwise. Helps a row reader see urgency without opening the dialog.
 */
function overdueLabel(targetIso: string, state: string): string | null {
  if (!isOpenState(state)) return null
  const target = new Date(targetIso)
  if (Number.isNaN(target.getTime())) return null
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfTarget = new Date(target)
  startOfTarget.setHours(0, 0, 0, 0)
  const diffDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000,
  )
  if (diffDays < 0) return `Overdue ${Math.abs(diffDays)}d`
  if (diffDays === 0) return "Due today"
  if (diffDays <= 14) return `Due in ${diffDays}d`
  return null
}

/**
 * Azure iteration paths look like `MyProject\\Team\\Sprint 23`.
 * For table display we drop the leading project/team segment(s) so
 * the column stays narrow. Hover shows the full path.
 */
function iterationShort(path: string): string {
  const parts = path.split("\\").filter(Boolean)
  if (parts.length <= 1) return path
  return parts.slice(-2).join("\\")
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  const diffMs = d.getTime() - Date.now()
  const absSec = Math.round(Math.abs(diffMs) / 1000)
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), "second")
  if (absSec < 3600) return rtf.format(Math.round(diffMs / 60_000), "minute")
  if (absSec < 86_400) return rtf.format(Math.round(diffMs / 3_600_000), "hour")
  if (absSec < 604_800) return rtf.format(Math.round(diffMs / 86_400_000), "day")
  return rtf.format(Math.round(diffMs / 604_800_000), "week")
}

function sortItems(
  items: AzureWorkItem[],
  key: AzureTaskSortKey,
  dir: SortDir,
): AzureWorkItem[] {
  const sorted = [...items]
  const factor = dir === "asc" ? 1 : -1
  sorted.sort((a, b) => {
    const av = valueFor(a, key)
    const bv = valueFor(b, key)
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor
    return String(av).localeCompare(String(bv)) * factor
  })
  return sorted
}

function valueFor(item: AzureWorkItem, key: AzureTaskSortKey): unknown {
  switch (key) {
    case "id":
      return item.id
    case "title":
      return item.title
    case "type":
      return item.type
    case "state":
      return item.state
    case "assignedTo":
      return item.assignedTo?.displayName ?? ""
    case "changedDate":
      return item.changedDate ? new Date(item.changedDate).getTime() : null
    case "createdDate":
      return item.createdDate ? new Date(item.createdDate).getTime() : null
    case "priority":
      return item.priority ?? 9999
    case "targetDate":
      return item.targetDate ? new Date(item.targetDate).getTime() : null
    case "iteration":
      return item.iterationPath ?? ""
    default:
      return null
  }
}

export function AzureTaskTable({
  tasks,
  isLoading,
  isError,
  errorMessage,
  sort,
  onSortChange,
  expansion,
  onRowToggle,
  onRetry,
  scrollSentinel,
  caughtUp,
}: AzureTaskTableProps) {
  const sorted = React.useMemo(
    () => sortItems(tasks, sort.key, sort.dir),
    [tasks, sort.key, sort.dir],
  )

  if (isError) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl shadow-sm p-6 text-sm text-red-700">
        <div className="font-medium mb-1">Could not load work items</div>
        <div className="text-red-600 mb-3">
          {errorMessage || "An unexpected error occurred while talking to Azure DevOps."}
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className={cn(columnHeaderClass, "w-10")} aria-label="Expand" />
              <SortableHeader
                label="ID"
                sortKey="id"
                sort={sort}
                onSortChange={onSortChange}
                className="w-16"
              />
              <SortableHeader
                label="Title"
                sortKey="title"
                sort={sort}
                onSortChange={onSortChange}
              />
              <SortableHeader
                label="Type"
                sortKey="type"
                sort={sort}
                onSortChange={onSortChange}
                className="hidden md:table-cell"
              />
              <SortableHeader
                label="State"
                sortKey="state"
                sort={sort}
                onSortChange={onSortChange}
                className="hidden md:table-cell"
              />
              <SortableHeader
                label="Assignee"
                sortKey="assignedTo"
                sort={sort}
                onSortChange={onSortChange}
                className="hidden lg:table-cell"
              />
              <SortableHeader
                label="Priority"
                sortKey="priority"
                sort={sort}
                onSortChange={onSortChange}
                className="hidden lg:table-cell"
              />
              <SortableHeader
                label="Changed"
                sortKey="changedDate"
                sort={sort}
                onSortChange={onSortChange}
                className="hidden md:table-cell"
              />
              <SortableHeader
                label="Target"
                sortKey="targetDate"
                sort={sort}
                onSortChange={onSortChange}
                className="hidden lg:table-cell"
              />
              <SortableHeader
                label="Iteration"
                sortKey="iteration"
                sort={sort}
                onSortChange={onSortChange}
                className="hidden xl:table-cell"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && tasks.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td
                      key={j}
                      className={cn(cellClass, "hidden md:table-cell")}
                    >
                      <div className="h-4 w-16 bg-gray-100 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="w-8 h-8 text-gray-300" />
                    <div className="font-medium text-gray-700">No work items match these filters</div>
                    <div className="text-xs text-gray-500">
                      Try clearing filters or expanding the date range.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((task) => {
                const isExpanded = expansion.expandedTaskId === task.id
                const expandedData = expansion.expandedTasks[task.id]
                const showExpansionError =
                  isExpanded && expansion.isExpansionError && !expandedData
                const showExpansionLoading =
                  isExpanded &&
                  (expansion.isExpansionLoading ||
                    (!expandedData && !expansion.isExpansionError))
                return (
                  <React.Fragment key={task.id}>
                    <tr
                      className={cn(
                        "transition-colors cursor-pointer",
                        isExpanded
                          ? "bg-blue-50/60 hover:bg-blue-50"
                          : "hover:bg-gray-50",
                      )}
                      onClick={() => onRowToggle(task)}
                    >
                      <td className={cn(cellClass, "w-10 text-gray-500")}>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className={cn(cellClass, "font-mono text-gray-600")}>
                        {task.id}
                      </td>
                      <td className={cellClass}>
                        <div className="font-medium text-gray-900 line-clamp-2">
                          {task.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {task.attachmentCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                              <Paperclip className="w-3 h-3" />
                              {task.attachmentCount}
                            </span>
                          ) : null}
                          {task.tags.length > 0 ? (
                            <>
                              {task.tags.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600"
                                >
                                  {t}
                                </span>
                              ))}
                              {task.tags.length > 3 ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500">
                                  +{task.tags.length - 3}
                                </span>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </td>
                      <td className={cn(cellClass, "hidden md:table-cell text-gray-700")}>
                        {task.type}
                      </td>
                      <td className={cn(cellClass, "hidden md:table-cell")}>
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                            stateChipClass(task.state),
                          )}
                        >
                          {task.state}
                        </span>
                      </td>
                      <td className={cn(cellClass, "hidden lg:table-cell text-gray-700")}>
                        {task.assignedTo?.displayName ?? (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className={cn(cellClass, "hidden lg:table-cell")}>
                        {task.priority != null ? (
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                              priorityChipClass(task.priority),
                            )}
                          >
                            P{task.priority}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className={cn(cellClass, "hidden md:table-cell text-gray-600")}>
                        <div>{formatRelative(task.changedDate)}</div>
                        <div className="text-[11px] text-gray-400">
                          {formatDate(task.changedDate)}
                        </div>
                      </td>
                      <td className={cn(cellClass, "hidden lg:table-cell text-gray-700")}>
                        {task.targetDate ? (
                          <div className="flex flex-col">
                            <span>{formatDate(task.targetDate)}</span>
                            {overdueLabel(task.targetDate, task.state) ? (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                                {overdueLabel(task.targetDate, task.state)}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td
                        className={cn(
                          cellClass,
                          "hidden xl:table-cell text-gray-700 max-w-[14rem]",
                        )}
                        title={task.iterationPath ?? ""}
                      >
                        {task.iterationPath ? (
                          <span className="truncate inline-block max-w-full align-middle">
                            {iterationShort(task.iterationPath)}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr>
                        <td colSpan={10} className="p-0">
                          {showExpansionLoading || showExpansionError ? (
                            <AzureTaskRowExpansionPlaceholder
                              taskId={task.id}
                              isLoading={showExpansionLoading}
                              isError={showExpansionError}
                              onRetry={expansion.onExpansionRetry}
                            />
                          ) : (
                            <AzureTaskRowExpansion task={expandedData} />
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {isLoading && tasks.length > 0 ? (
        <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Refreshing…
        </div>
      ) : null}
      {/* Lazy-load sentinel + end-of-list footer. Rendered *inside* the
          scroll container (the parent panel's `az-task-scroller` div)
          so the IntersectionObserver watching `scrollSentinel` triggers
          on internal scroll, not page scroll. The parent decides which
          of these is currently active. */}
      {scrollSentinel}
      {caughtUp}
    </div>
  )
}

interface SortableHeaderProps {
  label: string
  sortKey: AzureTaskSortKey
  sort: AzureTaskSort
  onSortChange: (next: AzureTaskSort) => void
  className?: string
}

function SortableHeader({
  label,
  sortKey,
  sort,
  onSortChange,
  className,
}: SortableHeaderProps) {
  const isActive = sort.key === sortKey
  const icon = !isActive ? (
    <ArrowUpDown className="w-3 h-3 opacity-40" />
  ) : sort.dir === "asc" ? (
    <ArrowUp className="w-3 h-3" />
  ) : (
    <ArrowDown className="w-3 h-3" />
  )
  return (
    <th className={cn(columnHeaderClass, className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 hover:text-gray-900 transition-colors",
          isActive && "text-gray-900",
        )}
        onClick={() =>
          onSortChange({
            key: sortKey,
            dir: isActive && sort.dir === "desc" ? "asc" : "desc",
          })
        }
      >
        {label}
        {icon}
      </button>
    </th>
  )
}