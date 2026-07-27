"use client"

/**
 * AzureTaskSummaryCards — KPI tile grid for the Azure Tasks panel.
 *
 * Supports two layouts:
 *   - `horizontal` (default): 2-col → 4-col tile grid. Fits a wide main
 *     panel (md+).
 *   - `vertical`: single-column tile list. Fits a narrow sidebar (the
 *     left-rail filters panel) where 4 columns would each be ≈80px wide
 *     and either clip content or break the divider lines.
 *
 * Colour conventions match the rest of the app:
 *   - blue-600    — total
 *   - amber-600   — active
 *   - emerald-600 — completed
 *   - red-600     — overdue
 */

import * as React from "react"
import { AlertCircle, CheckCircle2, Clock, ListChecks } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AzureWorkItemSummary } from "./types"

interface AzureTaskSummaryCardsProps {
  summary: AzureWorkItemSummary | null
  isLoading?: boolean
  /**
   * Visual layout.
   *   - "horizontal" (default): 2-col mobile, 4-col md+ (wide container)
   *   - "vertical": stacked rows (narrow sidebar)
   */
  layout?: "horizontal" | "vertical"
}

interface TileProps {
  label: string
  value: number
  icon: React.ReactNode
  iconClassName: string
  sub?: string
}

function Tile({ label, value, icon, iconClassName, sub }: TileProps) {
  return (
    <div className="flex items-center gap-3 p-3.5">
      <div
        className={cn(
          "w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0",
          iconClassName,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
          {label}
        </div>
        <div className="text-lg font-semibold text-gray-900 truncate">
          {value.toLocaleString()}
        </div>
        {sub ? (
          <div className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</div>
        ) : null}
      </div>
    </div>
  )
}

function SkeletonTile({ layout }: { layout: "horizontal" | "vertical" }) {
  if (layout === "vertical") {
    return (
      <div className="flex items-center gap-3 p-3.5">
        <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 p-3.5 md:p-5">
      <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        <div className="h-5 w-12 bg-gray-100 rounded animate-pulse" />
      </div>
    </div>
  )
}

export function AzureTaskSummaryCards({
  summary,
  isLoading,
  layout = "horizontal",
}: AzureTaskSummaryCardsProps) {
  const isVertical = layout === "vertical"

  // Vertical layout: stack the tiles with horizontal dividers between
  // them. Horizontal layout: 2-col → 4-col grid with vertical dividers.
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">
          Work item overview
        </h2>
        <p className="text-[11px] text-gray-500">Pulled live from Azure DevOps</p>
      </div>

      {isVertical ? (
        <div className="divide-y divide-gray-100">
          {isLoading && !summary ? (
            <>
              <SkeletonTile layout="vertical" />
              <SkeletonTile layout="vertical" />
              <SkeletonTile layout="vertical" />
              <SkeletonTile layout="vertical" />
            </>
          ) : (
            <>
              <Tile
                label="Total"
                value={summary?.total ?? 0}
                icon={<ListChecks className="w-5 h-5" />}
                iconClassName="text-blue-600"
              />
              <Tile
                label="Active"
                value={summary?.active ?? 0}
                icon={<Clock className="w-5 h-5" />}
                iconClassName="text-amber-600"
              />
              <Tile
                label="Completed"
                value={summary?.completed ?? 0}
                icon={<CheckCircle2 className="w-5 h-5" />}
                iconClassName="text-emerald-600"
              />
              <Tile
                label="Overdue"
                value={summary?.overdue ?? 0}
                icon={<AlertCircle className="w-5 h-5" />}
                iconClassName="text-red-600"
              />
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
          {isLoading && !summary ? (
            <>
              <SkeletonTile layout="horizontal" />
              <SkeletonTile layout="horizontal" />
              <SkeletonTile layout="horizontal" />
              <SkeletonTile layout="horizontal" />
            </>
          ) : (
            <>
              <Tile
                label="Total"
                value={summary?.total ?? 0}
                icon={<ListChecks className="w-5 h-5" />}
                iconClassName="text-blue-600"
              />
              <Tile
                label="Active"
                value={summary?.active ?? 0}
                icon={<Clock className="w-5 h-5" />}
                iconClassName="text-amber-600"
              />
              <Tile
                label="Completed"
                value={summary?.completed ?? 0}
                icon={<CheckCircle2 className="w-5 h-5" />}
                iconClassName="text-emerald-600"
              />
              <Tile
                label="Overdue"
                value={summary?.overdue ?? 0}
                icon={<AlertCircle className="w-5 h-5" />}
                iconClassName="text-red-600"
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}