"use client"

/**
 * AzureTaskExportHistory — "Export history" tab on Azure Tasks.
 *
 * The whole team's Export Pack log, newest first: client, when, who, how
 * many tasks and the date range. Search covers client and email; "Mine"
 * narrows to the signed-in user's exports. "Export new" picks the client
 * (the page then moves the range to YOUR last export for it) and opens the
 * export prompt. Data: GET /api/azure-tasks/clients/history.
 */

import * as React from "react"
import { AlertTriangle, History, Loader2, PackageOpen, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { useTeamExports, type AzureClientOption } from "@/hooks/use-azure-clients"

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  return `${days} days ago`
}

function fmtRange(from: string | null, to: string | null): string {
  if (!from && !to) return "All dates"
  const d = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" })
  return `${from ? d(from) : "start"} → ${to ? d(to) : "today"}`
}

interface Props {
  /** Agents, to show online / offline and whether a client still exists. */
  clients: AzureClientOption[]
  warning: string | null
  selectedClient: string | undefined
  onExportNew: (client: string) => void
}

export function AzureTaskExportHistory({ clients, warning, selectedClient, onExportNew }: Props) {
  const { exports, error, isLoading } = useTeamExports(true)
  const [query, setQuery] = React.useState("")
  const [mineOnly, setMineOnly] = React.useState(false)

  const agentByName = React.useMemo(
    () => new Map(clients.map((c) => [c.name.toLowerCase(), c])),
    [clients],
  )

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return exports.filter((e) => {
      if (mineOnly && !e.isMine) return false
      if (!q) return true
      return e.client.toLowerCase().includes(q) || (e.byEmail?.toLowerCase().includes(q) ?? false)
    })
  }, [exports, query, mineOnly])

  const clientCount = React.useMemo(() => new Set(exports.map((e) => e.client.toLowerCase())).size, [exports])
  const mineCount = exports.filter((e) => e.isMine).length

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-3 flex-wrap px-4 py-3 border-b border-gray-100">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client or email…"
            aria-label="Search client or email"
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div role="radiogroup" aria-label="Whose exports" className="inline-flex items-center rounded-lg bg-gray-100 p-0.5">
          {[
            { value: false, label: `Everyone ${exports.length}` },
            { value: true, label: `Mine ${mineCount}` },
          ].map((o) => (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={mineOnly === o.value}
              onClick={() => setMineOnly(o.value)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                mineOnly === o.value ? "bg-white text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {clientCount} client{clientCount === 1 ? "" : "s"} exported so far
        </span>
        {warning ? (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            {warning}
          </span>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 overflow-auto az-task-scroller">
        {isLoading && exports.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading export history…
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-red-600">{error}</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-sm text-gray-500">
            <History className="w-8 h-8 text-gray-300" />
            {exports.length === 0
              ? "No Export Packs yet. Pick a client and export to start the history."
              : mineOnly && mineCount === 0
                ? "You haven't exported for any client yet."
                : "No exports match."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Client</th>
                <th className="px-3 py-2.5 text-left font-semibold">Exported</th>
                <th className="px-3 py-2.5 text-left font-semibold">By</th>
                <th className="px-3 py-2.5 text-right font-semibold">Tasks</th>
                <th className="px-3 py-2.5 text-left font-semibold">Range</th>
                <th className="px-4 py-2.5 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((e) => {
                const agent = agentByName.get(e.client.toLowerCase())
                const isSelected = e.client === selectedClient
                return (
                  <tr key={e.id} className={cn("hover:bg-blue-50/40", isSelected && "bg-blue-50/60")}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            !agent ? "bg-gray-200" : agent.online ? "bg-emerald-500" : "bg-gray-300",
                          )}
                          title={!agent ? "Agent not found" : agent.online ? "Agent online" : "Agent offline"}
                        />
                        <span className="font-medium text-gray-900">{e.client}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" title={new Date(e.exportedAt).toLocaleString()}>
                      <div className="text-gray-800">
                        {fmtDate(e.exportedAt)} <span className="text-gray-400">{fmtTime(e.exportedAt)}</span>
                      </div>
                      <div className="text-[11px] text-gray-400">{ago(e.exportedAt)}</div>
                    </td>
                    <td className="px-3 py-2.5 max-w-[240px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate text-xs text-gray-700" title={e.byEmail ?? undefined}>
                          {e.byEmail ?? "deleted user"}
                        </span>
                        {e.isMine && (
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{e.taskCount}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtRange(e.rangeFrom, e.rangeTo)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onExportNew(e.client)}
                        disabled={!agent}
                        title={agent ? `Export for ${e.client} (from your last export)` : "This client's agent no longer exists"}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <PackageOpen className="w-3.5 h-3.5" />
                        Export new
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
