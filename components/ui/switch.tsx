"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Small accessible on/off switch (role="switch"). Two sizes: "md" for
 * settings rows, "sm" for dense table cells.
 */
export function Switch({
  checked,
  disabled,
  onChange,
  label,
  size = "md",
  className,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
  /** Accessible name (also used as the tooltip). */
  label: string
  size?: "sm" | "md"
  className?: string
}) {
  const sm = size === "sm"
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        sm ? "h-5 w-9" : "h-7 w-12",
        checked ? "bg-gradient-to-br from-purple-600 to-indigo-600" : "bg-gray-300",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block transform rounded-full bg-white shadow-md transition-transform",
          sm ? "h-3.5 w-3.5" : "h-5 w-5",
          checked ? (sm ? "translate-x-[18px]" : "translate-x-6") : sm ? "translate-x-[3px]" : "translate-x-1",
        )}
      />
    </button>
  )
}
