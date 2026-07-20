"use client"

/**
 * MenuViewSwitcher — segmented control with two options (Tree / Navbar).
 *
 * Visual style: a single rounded container with a sliding pill that
 * highlights the active option. Used at the top of the menu body to
 * toggle between the management tree and the website-style navbar.
 */
import * as React from "react"

import { cn } from "@/lib/utils"

export type MenuView = "tree" | "navbar"

interface MenuViewSwitcherProps {
  value: MenuView
  onChange: (next: MenuView) => void
  /** Optional labels, defaults to "Tree" / "Navbar". */
  options?: readonly { value: MenuView; label: string; icon?: React.ReactNode }[]
  className?: string
}

export function MenuViewSwitcher({
  value,
  onChange,
  options,
  className,
}: MenuViewSwitcherProps) {
  const opts = options ?? [
    { value: "tree" as const, label: "Tree" },
    { value: "navbar" as const, label: "Navbar" },
  ]
  return (
    <div
      role="tablist"
      aria-label="Menu view"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm",
        className,
      )}
    >
      {opts.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 h-8 rounded-md text-xs font-medium transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
              "inline-flex items-center gap-1.5",
              active
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
