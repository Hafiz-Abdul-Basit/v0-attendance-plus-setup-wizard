"use client"

/**
 * AzureTaskExportHistory — "Export history" tab on Azure Tasks.
 *
 * One row per client (Azure DevOps agent) with the signed-in user's last
 * Export Pack for it. "Export new" selects the client (which moves the
 * page's range to "since that export") and opens the export prompt.
 * History is per user; see /api/azure-tasks/clients.
 */

import * as React from "react"
import { AlertTriangle, History, Loader2, PackageOpen, Search, Server } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AzureClientOption } from "@/hooks/use-azure-clients"

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

function daysAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  return `${days} days ago`
}

interface Props {
  clients: AzureClientOption[]
  isLoading: boolean
  warning: string | null
  selectedClient: string | undefined
  onExportNew: (client: string) => void
}

export function AzureTaskExportHistory({ clients, isLoading, warning, selectedClient, onExportNew }: Props) {
  const [query, setQuery] = React.useState("")

  // Exported clients first (most recent on top), then never-exported A→Z.
  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.lastExport && b.lastExport) return b.lastExport.at.localeCompare(a.lastExport.at)
        if (a.lastExport) return -1
        if (b.lastExport) return 1
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      })
  }, [clients, query])
  const exportedCount = clients.filter((c) => c.lastExport).length

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-3 flex-wrap px-4 py-3 border-b border-gray-100">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients…"
            aria-label="Search clients"
            className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <span className="text-xs text-gray-500">
          You've exported for {exportedCount} of {clients.length} client{clients.length === 1 ? "" : "s"}
        </span>
        {warning ? (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            {warning}
          </span>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 overflow-auto az-task-scroller">
        {isLoading && clients.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading clients…
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-sm text-gray-500">
            <History className="w-8 h-8 text-gray-300" />
            {clients.length === 0 ? "No clients found in the Azure DevOps agent pools." : "No clients match."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Client</th>
                <th className="px-3 py-2.5 text-left font-semibold">Agent</th>
                <th className="px-3 py-2.5 text-left font-semibold">Your last export</th>
                <th className="px-3 py-2.5 text-left font-semibold">Exported by</th>
                <th className="px-3 py-2.5 text-right font-semibold">Tasks</th>
                <th className="px-4 py-2.5 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((c) => {
                const isSelected = c.name === selectedClient
                return (
                  <tr key={c.name} className={cn("hover:bg-blue-50/40", isSelected && "bg-blue-50/60")}>
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {c.name}
                      {isSelected && (
                        <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {c.pool ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                            c.online ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500",
                          )}
                          title={`Agent pool: ${c.pool}`}
                        >
                          <Server className="w-3 h-3" />
                          {c.online ? "online" : "offline"}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">removed</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {c.lastExport ? (
                        <>
                          <div className="text-gray-800">{fmtDate(c.lastExport.at)}</div>
                          <div className="text-[11px] text-gray-400">{daysAgo(c.lastExport.at)}</div>
                        </>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[220px] truncate" title={c.lastExport?.byEmail}>
                      {c.lastExport ? c.lastExport.byEmail : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                      {c.lastExport ? c.lastExport.taskCount : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onExportNew(c.name)}
                        disabled={!c.pool}
                        title={c.lastExport ? `Export tasks changed since ${fmtDate(c.lastExport.at)}` : "Pick a range, then export"}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <PackageOpen className="w-3.5 h-3.5" />
                        {c.lastExport ? "Export new" : "Export"}
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
