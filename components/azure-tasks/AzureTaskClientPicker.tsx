"use client"

/**
 * AzureTaskClientPicker — choose which client the Export Pack is for.
 *
 * Clients are the agents in the Azure DevOps agent pools (one agent per
 * client server). Next to the dropdown it shows when THIS user last
 * exported for the selected client, so it's obvious where the next pack
 * should start. Selecting a client is handled by the panel (it moves the
 * date range to "since last export").
 */

import * as React from "react"
import { AlertTriangle, History, Server } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AzureClientOption } from "@/hooks/use-azure-clients"
import { FilterPopoverSelect } from "./FilterPopoverSelect"

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

interface Props {
  clients: AzureClientOption[]
  value: string | undefined
  onChange: (client: string | undefined) => void
  isLoading: boolean
  /** Agents couldn't be loaded (PAT scope, config…). */
  warning: string | null
  className?: string
}

export function AzureTaskClientPicker({ clients, value, onChange, isLoading, warning, className }: Props) {
  const selected = clients.find((c) => c.name === value)
  const options = React.useMemo(
    () =>
      clients.map((c) => ({
        value: c.name,
        label: c.pool ? c.name : `${c.name} (removed)`,
        hint: c.lastExport ? shortDate(c.lastExport.at) : "never",
      })),
    [clients],
  )

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <FilterPopoverSelect
        label="Client"
        value={value}
        options={options}
        placeholder={isLoading ? "Loading clients…" : "Select client"}
        popoverTitle="Client (Azure DevOps agent)"
        disabled={isLoading && clients.length === 0}
        searchable
        onChange={onChange}
      />
      {selected ? (
        <span
          className="inline-flex items-center gap-1 text-xs text-gray-600"
          title="Your last Export Pack for this client"
        >
          <History className="w-3.5 h-3.5 text-emerald-600" />
          {selected.lastExport
            ? `Last export ${shortDate(selected.lastExport.at)} · ${selected.lastExport.taskCount} tasks`
            : "Never exported — pick a date range"}
          {selected.pool ? (
            <span
              className={cn(
                "ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                selected.online ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500",
              )}
              title={`Agent pool: ${selected.pool}`}
            >
              <Server className="w-3 h-3" />
              {selected.online ? "online" : "offline"}
            </span>
          ) : null}
        </span>
      ) : null}
      {warning ? (
        <span className="inline-flex items-center gap-1 text-xs text-amber-700" title={warning}>
          <AlertTriangle className="w-3.5 h-3.5" />
          {warning}
        </span>
      ) : null}
    </div>
  )
}
