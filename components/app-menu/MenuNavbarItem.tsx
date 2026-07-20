"use client"

/**
 * MenuNavbarItem — single top-level (or nested) item in MenuNavbar.
 *
 * KEY FIXES from previous version:
 *   1. Portal uses position:fixed + z-index:9999 to escape overflow containers
 *   2. Proper flex layout in navbar — no more cramped wrapping
 *   3. Dropdown panel has max-height with scroll for long lists
 *   4. Badge numbers styled inline with text, not floating right
 *   5. Bridge spans ensure hover continuity across gaps
 */
import * as React from "react"
import { createPortal } from "react-dom"
import { ChevronDown, ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import type { MenuItem } from "./types"

interface MenuNavbarItemProps {
  item: MenuItem
  keyPath: string
  depth: number
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  nestedOpenKey: string | null
  setNestedOpenKey: (k: string | null) => void
}

const BRIDGE_GAP = 8

export function MenuNavbarItem({
  item,
  keyPath,
  depth,
  isOpen,
  onOpen,
  onClose,
  nestedOpenKey,
  setNestedOpenKey,
}: MenuNavbarItemProps) {
  const children = item.Children ?? []
  const hasChildren = children.length > 0
  const hasLink = Boolean(item.routerLink)

  if (depth === 0) {
    const triggerRef = React.useRef<HTMLButtonElement>(null)
    const onClick = () => {
      if (hasLink && !hasChildren) {
        window.open(item.routerLink!, "_blank", "noopener,noreferrer")
        return
      }
      if (isOpen) onClose()
      else onOpen()
    }
    return (
      <li
        className="relative shrink-0"
        data-menu-trigger={keyPath}
        onMouseEnter={() => {
          if (!hasChildren) return
          if (!isOpen) onOpen()
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup={hasChildren ? "menu" : undefined}
          aria-expanded={hasChildren ? isOpen : undefined}
          onClick={onClick}
          className={cn(
            "h-9 px-3 inline-flex items-center gap-1.5 text-sm font-medium rounded-md whitespace-nowrap",
            "transition-colors duration-150",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50",
            isOpen
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
          )}
        >
          <span className="truncate max-w-[180px]">{item.DisplayName || item.Name}</span>
          {hasChildren && (
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform flex-shrink-0",
                isOpen && "rotate-180",
              )}
            />
          )}
          {hasLink && !hasChildren && (
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
          )}
        </button>

        {/* Bridge span fills gap between trigger and dropdown */}
        {hasChildren && (
          <span
            aria-hidden
            className="absolute left-0 right-0 pointer-events-auto z-50"
            style={{ top: "100%", height: `${BRIDGE_GAP}px` }}
          />
        )}

        {hasChildren && isOpen && (
          <PortalDropdown triggerRef={triggerRef} align="below-left">
            {children.map((child, i) => (
              <NestedRow
                key={`${keyPath}-${i}-${child.Name}`}
                item={child}
                keyPath={`${keyPath}-${i}`}
                depth={1}
                nestedOpenKey={nestedOpenKey}
                setNestedOpenKey={setNestedOpenKey}
                onParentClose={onClose}
              />
            ))}
          </PortalDropdown>
        )}
      </li>
    )
  }

  return (
    <NestedRow
      item={item}
      keyPath={keyPath}
      depth={depth}
      nestedOpenKey={nestedOpenKey}
      setNestedOpenKey={setNestedOpenKey}
      onParentClose={onClose}
    />
  )
}

/**
 * PortalDropdown — CRITICAL: uses position:fixed with high z-index
 * to escape ANY overflow:hidden/overflow:auto ancestor clipping.
 * 
 * The panel is portaled to document.body so it's outside all
 * parent stacking contexts.
 */
function PortalDropdown({
  triggerRef,
  align,
  children,
}: {
  triggerRef: React.RefObject<HTMLElement | null>
  align: "below-left" | "right"
  children: React.ReactNode
}) {
  const [mounted, setMounted] = React.useState(false)
  const [style, setStyle] = React.useState<React.CSSProperties>({
    position: "fixed",
    top: -9999,
    left: -9999,
    opacity: 0,
  })
  const panelRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => setMounted(true), [])

  const measure = React.useCallback(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return

    const tr = trigger.getBoundingClientRect()
    const pw = panel.offsetWidth || 220
    const ph = panel.offsetHeight || 300
    const vw = window.innerWidth
    const vh = window.innerHeight

    let top: number
    let left: number

    if (align === "below-left") {
      top = tr.bottom + BRIDGE_GAP
      left = tr.left
      // Right-edge guard
      if (left + pw > vw - 12) {
        left = Math.max(12, vw - pw - 12)
      }
      // Bottom-edge guard: flip up if needed
      if (top + ph > vh - 12) {
        top = Math.max(12, tr.top - ph - BRIDGE_GAP)
      }
    } else {
      // "right" — nested flyout
      top = tr.top
      left = tr.right + BRIDGE_GAP
      if (left + pw > vw - 12) {
        left = Math.max(12, tr.left - pw - BRIDGE_GAP)
      }
      if (top + ph > vh - 12) {
        top = Math.max(12, vh - ph - 12)
      }
    }

    setStyle({
      position: "fixed",
      top,
      left,
      zIndex: 9999,
      opacity: 1,
    })
  }, [align, triggerRef])

  // Measure immediately on mount and when children change
  React.useLayoutEffect(() => {
    if (!mounted) return
    // Small delay to let content render first
    requestAnimationFrame(() => measure())
  }, [measure, mounted, children])

  // Re-measure on scroll/resize
  React.useEffect(() => {
    if (!mounted) return
    const onScroll = () => measure()
    const onResize = () => measure()
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onResize)
    }
  }, [measure, mounted])

  // Observe trigger resize
  React.useEffect(() => {
    if (!mounted) return
    const trigger = triggerRef.current
    if (!trigger || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => measure())
    ro.observe(trigger)
    return () => ro.disconnect()
  }, [measure, mounted, triggerRef])

  if (!mounted) return null

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      data-menu-portal
      style={style}
      className={cn(
        "min-w-[200px] max-w-[320px] rounded-lg border border-gray-200",
        "bg-white shadow-xl",
        "py-1",
        "max-h-[70vh] overflow-y-auto",
        "animate-in fade-in duration-100",
      )}
    >
      {children}
    </div>,
    document.body,
  )
}

function NestedRow({
  item,
  keyPath,
  depth,
  nestedOpenKey,
  setNestedOpenKey,
  onParentClose,
}: {
  item: MenuItem
  keyPath: string
  depth: number
  nestedOpenKey: string | null
  setNestedOpenKey: (k: string | null) => void
  onParentClose: () => void
}) {
  const children = item.Children ?? []
  const hasChildren = children.length > 0
  const hasLink = Boolean(item.routerLink)
  const isOpen = nestedOpenKey === keyPath
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const onClick = () => {
    if (hasLink && !hasChildren) {
      window.open(item.routerLink!, "_blank", "noopener,noreferrer")
      onParentClose()
      return
    }
    if (hasChildren) setNestedOpenKey(isOpen ? null : keyPath)
  }

  return (
    <div
      className="relative"
      data-menu-trigger={keyPath}
      onMouseEnter={() => {
        if (hasChildren) setNestedOpenKey(keyPath)
      }}
      onMouseLeave={() => {
        if (hasChildren) setNestedOpenKey(null)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        role="menuitem"
        aria-haspopup={hasChildren ? "menu" : undefined}
        aria-expanded={hasChildren ? isOpen : undefined}
        onClick={onClick}
        className={cn(
          "w-full text-left flex items-center gap-2 px-3 py-2 text-sm rounded-md",
          "transition-colors duration-100",
          isOpen
            ? "bg-gray-100 text-gray-900"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
        )}
      >
        <span className="flex-1 truncate font-medium">{item.DisplayName || item.Name}</span>

        {/* Inline badges — kept compact */}
        {item.Count != null && item.Count !== "" && (
          <span className="text-[10px] font-semibold rounded-full bg-gray-100 text-gray-500 px-1.5 py-0.5 flex-shrink-0">
            {String(item.Count)}
          </span>
        )}
        {item.Claims && item.Claims.length > 0 && (
          <span
            className="text-[10px] font-semibold rounded-full bg-gray-100 text-gray-500 px-1.5 py-0.5 flex-shrink-0"
            title={item.Claims.join(", ")}
          >
            {item.Claims.length}
          </span>
        )}

        {hasLink && !hasChildren && (
          <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
        )}
        {hasChildren && (
          <ChevronDown
            className={cn(
              "w-4 h-4 -rotate-90 text-gray-400 flex-shrink-0 transition-transform",
              isOpen && "rotate-0 text-gray-900",
            )}
          />
        )}
      </button>

      {/* Right-side bridge for nested flyouts */}
      {hasChildren && (
        <span
          aria-hidden
          className="absolute top-0 bottom-0 pointer-events-auto z-50"
          style={{ left: "100%", width: `${BRIDGE_GAP}px` }}
        />
      )}

      {hasChildren && isOpen && (
        <PortalDropdown triggerRef={triggerRef} align="right">
          {children.map((child, i) => (
            <NestedRow
              key={`${keyPath}-${i}-${child.Name}`}
              item={child}
              keyPath={`${keyPath}-${i}`}
              depth={depth + 1}
              nestedOpenKey={nestedOpenKey}
              setNestedOpenKey={setNestedOpenKey}
              onParentClose={onParentClose}
            />
          ))}
        </PortalDropdown>
      )}
    </div>
  )
}