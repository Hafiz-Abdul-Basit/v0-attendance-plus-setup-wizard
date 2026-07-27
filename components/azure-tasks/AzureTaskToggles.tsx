"use client"

/**
 * AzureTaskToggles — small toolbar of feature toggles that don't fit
 * the dropdown-filter model. Currently:
 *
 *   - Only mine: restrict to work items assigned to the signed-in user
 *   - Stale:     show only work items not changed in STALE_DAYS+ days
 *
 * These are off by default — they change the *shape* of the result set
 * in a way the user has to opt into. The parent owns the state so the
 * URL-sync logic can persist them like any other filter.
 */

import * as React from "react"
import { Filter as FilterIcon, UserCircle2, Hourglass } from "lucide-react"

import { cn } from "@/lib/utils"

interface AzureTaskTogglesProps {
  onlyMine: boolean
  stale: boolean
  onChange: (next: { onlyMine?: boolean; stale?: boolean }) => void
  staleDays: number
  currentUserName?: string | null
  className?: string
}

export function AzureTaskToggles({
  onlyMine,
  stale,
  onChange,
  staleDays,
  currentUserName,
  className,
}: AzureTaskTogglesProps) {
  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2 flex items-center gap-2 flex-wrap",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider pr-2">
        <FilterIcon className="w-3.5 h-3.5" />
        Toggles
      </div>
      <Toggle
        label={
          onlyMine && currentUserName
            ? `Only mine · ${currentUserName}`
            : "Only mine"
        }
        icon={<UserCircle2 className="w-3.5 h-3.5" />}
        active={onlyMine}
        onChange={(v) => onChange({ onlyMine: v })}
      />
      <Toggle
        label={`Stale (${staleDays}d+)`}
        icon={<Hourglass className="w-3.5 h-3.5" />}
        active={stale}
        onChange={(v) => onChange({ stale: v })}
      />
    </div>
  )
}

interface ToggleProps {
  label: string
  icon: React.ReactNode
  active: boolean
  onChange: (next: boolean) => void
}

function Toggle({ label, icon, active, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onChange(!active)}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border",
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
      )}
    >
      {icon}
      {label}
    </button>
  )
}
