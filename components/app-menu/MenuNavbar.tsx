"use client"

/**
 * MenuNavbar — modern, clean navbar wrapper.
 * 
 * KEY FIXES:
 *   1. No overflow:hidden on the navbar container — lets portals work
 *   2. Proper flex layout with wrapping rows
 *   3. Document-level pointermove to detect when cursor leaves menu zone
 *   4. Clean visual style matching modern SaaS navbars
 */
import * as React from "react"
import { Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import type { MenuItem } from "./types"
import { MenuNavbarItem } from "./MenuNavbarItem"

interface MenuNavbarProps {
  items: MenuItem[]
  brand?: string
}

export function MenuNavbar({ items, brand = "Menu" }: MenuNavbarProps) {
  const [openKey, setOpenKey] = React.useState<string | null>(null)
  const [nestedOpenKey, setNestedOpenKey] = React.useState<string | null>(null)
  const navRef = React.useRef<HTMLElement>(null)

  // Document-level pointermove: close dropdown when cursor leaves the
  // entire menu zone (triggers + portals). This is the single source of
  // truth for closing — individual items don't run their own timeouts.
  React.useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!openKey) return
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (!target) {
        setOpenKey(null)
        setNestedOpenKey(null)
        return
      }
      // Check if we're over any menu trigger or portal
      const inMenu =
        target.closest('[data-menu-trigger]') ||
        target.closest('[data-menu-portal]')
      if (!inMenu) {
        setOpenKey(null)
        setNestedOpenKey(null)
      }
    }
    document.addEventListener('pointermove', onPointerMove)
    return () => document.removeEventListener('pointermove', onPointerMove)
  }, [openKey])

  // Also close on Escape
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenKey(null)
        setNestedOpenKey(null)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <nav
      ref={navRef}
      className={cn(
        "w-full bg-white border-b border-gray-200",
        "px-4 py-2",
      )}
    >
      {/* Row 1: Brand + primary nav items */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Brand / hamburger */}
        <div className="flex items-center gap-3 mr-4 shrink-0">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
              "bg-gray-900 text-white text-sm font-semibold",
              "hover:bg-gray-800 transition-colors",
            )}
          >
            <Menu className="w-4 h-4" />
            <span className="truncate max-w-[140px]">{brand}</span>
          </button>
        </div>

        {/* Primary items */}
        <ul className="flex items-center gap-0.5 flex-wrap">
          {items.map((item, i) => (
            <MenuNavbarItem
              key={`top-${i}-${item.Name}`}
              item={item}
              keyPath={String(i)}
              depth={0}
              isOpen={openKey === String(i)}
              onOpen={() => {
                setOpenKey(String(i))
                setNestedOpenKey(null)
              }}
              onClose={() => {
                setOpenKey(null)
                setNestedOpenKey(null)
              }}
              nestedOpenKey={nestedOpenKey}
              setNestedOpenKey={setNestedOpenKey}
            />
          ))}
        </ul>
      </div>
    </nav>
  )
}