"use client"

/**
 * FilterPopoverSelect — modern dropdown with a typeable option list.
 *
 * Compared to the previous wrapper-around-<select> approach:
 *   - Real popover anchored to the trigger with a typeahead input at the top
 *     so the user can narrow long option lists (assignees especially)
 *   - Keyboard navigation (ArrowDown/Up/Enter/Escape) + home/end
 *   - Active value highlighted in the trigger; count shown in the
 *     popover header
 *   - Click outside + Escape close the popover
 *   - "All" pseudo-option at the top to clear the filter
 *
 * Why not use Radix popover / shadcn? The project doesn't pull those
 * primitives and the dropdown's shape doesn't need Radix's accessibility
 * machinery (focus traps, ARIA) — a plain listbox with the same pattern
 * is enough for a panel filter.
 */

import * as React from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface FilterPopoverSelectOption {
  value: string
  label: string
  /** Optional right-aligned hint (e.g. a count badge in the trigger). */
  hint?: string
}

interface FilterPopoverSelectProps {
  label: string
  value: string | undefined
  options: FilterPopoverSelectOption[]
  /** Placeholder shown when no value is selected. */
  placeholder: string
  /** Render label above the typeahead input. Defaults to `label`. */
  popoverTitle?: string
  /** Disable the entire control. */
  disabled?: boolean
  /** Show the typeahead input (always on for `> 8` options). */
  searchable?: boolean
  onChange: (next: string | undefined) => void
  /** Extra class for the trigger. */
  className?: string
}

export function FilterPopoverSelect({
  label,
  value,
  options,
  placeholder,
  popoverTitle,
  disabled,
  searchable: searchableProp,
  onChange,
  className,
}: FilterPopoverSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const triggerRef = React.useRef<HTMLButtonElement | null>(null)
  const popoverRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const selected = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  )
  const hasValue = Boolean(selected)

  // Auto-enable typeahead when the list gets long.
  const searchable = searchableProp ?? options.length > 8

  // Reset internal state when reopening so the user sees a fresh list.
  React.useEffect(() => {
    if (open) {
      setQuery("")
      // Highlight the currently-selected option (or "All") on open.
      const idx = options.findIndex((o) => o.value === value)
      setActiveIndex(idx >= 0 ? idx + 1 : 0)
      // Defer focus so the popover is mounted when we call it.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open, options, value])

  // Filter options against the typeahead. The "All" pseudo-option at
  // index 0 is preserved regardless of the filter so the user can
  // always clear the value.
  const filtered = React.useMemo(() => {
    if (!query.trim()) return options
    const needle = query.trim().toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(needle))
  }, [options, query])

  // Treat the All option as the virtual index 0; real options shift up.
  const visibleList = [
    { __all: true, value: "", label: placeholder, hint: "" } as FilterPopoverSelectOption & {
      __all: boolean
    },
    ...filtered.map((o) => ({ ...o, __all: false })),
  ]

  const choose = React.useCallback(
    (opt: { value: string } | { __all: boolean }) => {
      if ("__all" in opt && opt.__all) {
        onChange(undefined)
      } else {
        onChange(("value" in opt ? opt.value : "") || undefined)
      }
      setOpen(false)
      triggerRef.current?.focus()
    },
    [onChange],
  )

  // Click-outside closes the popover. We attach to the document so
  // both inside and outside the panel are covered.
  React.useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        popoverRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open])

  // Keyboard handling on the trigger (Space/Enter/ArrowDown opens).
  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "group h-10 w-full inline-flex items-center justify-between gap-2 rounded-xl border bg-white pl-3 pr-2.5 text-sm shadow-sm transition-all",
          "hover:border-gray-300 hover:shadow",
          hasValue
            ? "border-blue-300 bg-blue-50/60 text-blue-900"
            : "border-gray-200 text-gray-700",
          "focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "text-[10px] uppercase tracking-wider font-semibold shrink-0",
              hasValue ? "text-blue-600" : "text-gray-400",
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "truncate font-medium",
              hasValue ? "text-blue-900" : "text-gray-500",
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          {hasValue ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Clear filter"
              onClick={(e) => {
                e.stopPropagation()
                onChange(undefined)
              }}
              className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-md text-blue-500 hover:text-blue-800 hover:bg-blue-100/80"
            >
              <X className="w-3 h-3" />
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 transition-transform",
            hasValue ? "text-blue-500" : "text-gray-400",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          ref={popoverRef}
          role="listbox"
          aria-label={popoverTitle ?? label}
          className={cn(
            "absolute z-50 mt-2 min-w-[240px] w-max max-w-[320px] left-0",
            "rounded-xl bg-white border border-gray-200 shadow-xl shadow-gray-900/5",
            "p-2",
          )}
        >
          {searchable ? (
            <div className="relative px-2 pt-2 pb-2 border-b border-gray-100 mb-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={inputRef}
                type="search"
                aria-label="Filter options"
                placeholder="Type to filter…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault()
                    setActiveIndex((i) => Math.min(i + 1, visibleList.length - 1))
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault()
                    setActiveIndex((i) => Math.max(i - 1, 0))
                  } else if (e.key === "Home") {
                    e.preventDefault()
                    setActiveIndex(0)
                  } else if (e.key === "End") {
                    e.preventDefault()
                    setActiveIndex(visibleList.length - 1)
                  } else if (e.key === "Enter") {
                    e.preventDefault()
                    const pick = visibleList[activeIndex]
                    if (pick) choose(pick)
                  } else if (e.key === "Escape") {
                    e.preventDefault()
                    setOpen(false)
                    triggerRef.current?.focus()
                  }
                }}
                className={cn(
                  "h-8 w-full pl-8 pr-2 rounded-lg border border-gray-200 bg-gray-50",
                  "text-sm text-gray-800 placeholder:text-gray-400",
                  "focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
                )}
              />
            </div>
          ) : null}

          <div className="max-h-64 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500">
                No matches.
              </div>
            ) : (
              visibleList.map((opt, idx) => {
                const isAll = "__all" in opt && opt.__all
                const isSelected =
                  !isAll && value !== undefined && opt.value === value
                const isActive = idx === activeIndex
                return (
                  <button
                    type="button"
                    key={opt.value || "__all"}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => choose(opt)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 rounded-md text-sm flex items-center gap-2",
                      isActive ? "bg-blue-50 text-blue-900" : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {opt.hint ? (
                      <span className="text-[10px] text-gray-500 tabular-nums shrink-0">
                        {opt.hint}
                      </span>
                    ) : null}
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
