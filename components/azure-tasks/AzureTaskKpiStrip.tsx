"use client"

/**
 * AzureTaskKpiStrip — compact inline KPI tiles for the panel header.
 *
 * The previous "Work item overview" card lived as its own block below
 * the controls. It's been promoted into a strip that runs across the
 * right side of the panel header — same numbers (Total / Active /
 * Completed / Overdue) but at a glance, with the Azure Tasks title
 * and subtitle on the left.
 *
 * Fits 4 tiles in a row at >=md viewports; collapses to a single row
 * of icon-on-label at <md so the title doesn't get squeezed.
 */

import * as React from "react"
import { AlertCircle, CheckCircle2, Clock, ListChecks } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AzureWorkItemSummary } from "./types"

interface AzureTaskKpiStripProps {
  summary: AzureWorkItemSummary | null
  isLoading?: boolean
  /** Extra className for the outer wrapper. */
  className?: string
}

interface KpiTileProps {
  label: string
  value: number
  icon: React.ReactNode
  iconClassName: string
  /** Optional small caption shown beneath the value (skipped when loading). */
  sub?: string
}

function KpiTile({ label, value, icon, iconClassName, sub }: KpiTileProps) {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl border bg-white/80 px-3 py-1.5 transition-all",
        "border-gray-200 hover:border-gray-300 hover:bg-white hover:shadow-sm",
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0",
          iconClassName,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold leading-tight">
          {label}
        </div>
        <div className="text-base font-bold text-gray-900 leading-tight tabular-nums">
          {value.toLocaleString()}
        </div>
      </div>
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white/80 px-3 py-1.5 animate-pulse">
      <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
      <div className="space-y-1">
        <div className="h-2 w-10 bg-gray-100 rounded" />
        <div className="h-3 w-8 bg-gray-100 rounded" />
      </div>
    </div>
  )
}

export function AzureTaskKpiStrip({
  summary,
  isLoading,
  className,
}: AzureTaskKpiStripProps) {
  const showSkeleton = isLoading && !summary
  return (
    <div
      className={cn(
        // `flex-wrap` so the tiles reflow below the title on narrow
        // screens instead of overflowing.
        "flex items-center gap-2 flex-wrap",
        className,
      )}
    >
      {showSkeleton ? (
        <>
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </>
      ) : (
        <>
          <KpiTile
            label="Total"
            value={summary?.total ?? 0}
            icon={<ListChecks className="w-3.5 h-3.5" />}
            iconClassName="text-blue-600"
          />
          <KpiTile
            label="Active"
            value={summary?.active ?? 0}
            icon={<Clock className="w-3.5 h-3.5" />}
            iconClassName="text-amber-600"
          />
          <KpiTile
            label="Completed"
            value={summary?.completed ?? 0}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            iconClassName="text-emerald-600"
          />
          <KpiTile
            label="Overdue"
            value={summary?.overdue ?? 0}
            icon={<AlertCircle className="w-3.5 h-3.5" />}
            iconClassName="text-red-600"
          />
        </>
      )}
    </div>
  )
}
