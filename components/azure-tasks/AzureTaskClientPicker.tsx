"use client"

/**
 * AzureTaskClientPicker — choose which client the Export Pack is for.
 *
 * Clients are the agents in the Azure DevOps agent pools (one agent per
 * client server). Each option shows when THIS user last exported for it;
 * the full list lives in the Export history tab. Selecting a client is
 * handled by the export store (the page moves the date range to "since
 * last export").
 */

import * as React from "react"
import { AlertTriangle } from "lucide-react"

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
    <div className={cn("flex items-center gap-1.5", className)}>
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
      {warning ? (
        <span className="inline-flex items-center text-amber-600" title={warning} aria-label={warning}>
          <AlertTriangle className="w-4 h-4" />
        </span>
      ) : null}
    </div>
  )
}
