"use client"

/**
 * /azure-tasks loading state — shown by the Next.js App Router while
 * the route segment is resolving (server-side `getServerSession`,
 * client-side bundle hydration, and the first SWR fetch).
 *
 * Why a dedicated file: without this, the user sees a flash of empty
 * viewport between the wizard page unmounting and the Azure Tasks
 * panel rendering. The skeleton below mirrors the panel's layout
 * (header, control bar, table) so the transition feels like a
 * smooth "shimmer into place" rather than a hard cut.
 */

import * as React from "react"
import { Sparkles, RefreshCw, Inbox } from "lucide-react"

import { cn } from "@/lib/utils"

export default function AzureTasksLoading() {
  return (
    // The panel uses `h-[calc(100vh-65px)]` so the loading state has to
    // match — otherwise the page will scroll-jump when the real panel
    // mounts.
    <div className="flex flex-col h-[calc(100vh-65px)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Top header — same shape as `AzureTasksPanel`. */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              Azure Tasks
            </h1>
            <p className="text-xs text-gray-500 truncate">
              Loading your work items from Azure DevOps…
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Connecting…</span>
        </div>
      </div>

      {/* Control bar skeleton (filters + chips). */}
      <div className="border-b border-gray-200 bg-white/70 backdrop-blur-sm">
        <div className="px-4 lg:px-6 py-3 space-y-3">
          {/* Quick ranges row. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`qr-${i}`} className="h-10" />
            ))}
          </div>
          {/* Filter form row. */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
            <Skeleton className="h-10 xl:col-span-1" />
            <Skeleton className="h-10 xl:col-span-1" />
            <Skeleton className="h-10 xl:col-span-1" />
            <Skeleton className="h-10 xl:col-span-1" />
            <Skeleton className="h-10 xl:col-span-1" />
          </div>
        </div>
      </div>

      {/* List section — same `flex-1 min-h-0` shape as the real panel. */}
      <div className="flex-1 min-h-0 flex flex-col p-4 lg:p-5 gap-4">
        {/* Result summary row (search + chips). */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2 flex items-center gap-3">
          <Skeleton className="h-9 w-full sm:w-72 md:w-80 lg:w-96 rounded-xl" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-16 rounded-full" />
          </div>
        </div>

        {/* Table skeleton — the focal point. Shows 8 placeholder rows
            with an `animate-pulse` shimmer so the user knows the page
            is alive without us committing to real data shapes. */}
        <div className="flex-1 min-h-0 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
          {/* Sticky-looking header row. */}
          <div className="grid grid-cols-[40px_60px_minmax(0,1fr)_100px_100px_140px_80px_120px_120px_120px] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={`th-${i}`} className="h-3 w-full" />
            ))}
          </div>
          {/* Body rows. */}
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`row-${i}`}
                className="grid grid-cols-[40px_60px_minmax(0,1fr)_100px_100px_140px_80px_120px_120px_120px] gap-2 px-4 py-3 items-center"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
          {/* Empty-state footer with centered spinner. */}
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500">
            <Inbox className="w-8 h-8 text-gray-300 animate-pulse" />
            <div className="text-sm font-medium text-gray-700">
              Fetching work items from Azure DevOps…
            </div>
            <div className="text-xs text-gray-500">
              Hang tight — first load takes a moment.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton — a single rounded grey block with a soft shimmer. Uses
 * Tailwind's `animate-pulse` for the breathing effect.
 */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-gray-100 via-gray-200/70 to-gray-100 bg-[length:200%_100%] rounded-md animate-skeleton",
        className,
      )}
    />
  )
}