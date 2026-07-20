"use client"

/**
 * MenuTree — modern card-based tree view for managing menu items.
 *
 * Renders each item as a row with:
 *   - chevron toggle
 *   - folder / link / leaf icon
 *   - name, count badge, claims badge
 *   - hover-revealed admin actions: Add child / Edit / Delete
 *
 * Key improvements vs the previous version:
 *   - "Expand all" recursively collects every keyPath so deep nodes
 *     open too (the old version only toggled top level).
 *   - Cleaner spacing, soft gradient borders, depth indicator lines.
 *   - The whole tree is now a single rounded card with subtle dividers
 *     between depth levels, instead of an indented list.
 */
import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Plus,
  Download,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MenuItem } from "./types"
import { MenuTreeItem } from "./MenuTreeItem"

interface MenuTreeProps {
  items: MenuItem[]
  /** Optional admin callbacks. Pass all three to enable editing. */
  onEdit?: (keyPath: string) => void
  onDelete?: (keyPath: string) => void
  onAddChild?: (parentKeyPath: string) => void
  /** Optional — top-level "Add item" button (admin only). */
  onAddTopLevel?: () => void
  /** Optional — "Download JSON" / "Copy JSON" buttons in header. */
  onDownloadJson?: () => void
  onCopyJson?: () => void
}

/**
 * Recursively filter an item tree by a search query. An item matches
 * if its own Name matches OR any descendant matches; matched parents
 * are kept (with all their children preserved) so the user can see
 * the matching item's path.
 */
function filterTree(items: MenuItem[], query: string): MenuItem[] {
  if (!query.trim()) return items
  const q = query.toLowerCase()
  const matches = (item: MenuItem): boolean => {
    if (item.Name?.toLowerCase().includes(q)) return true
    if (item.DisplayName?.toLowerCase().includes(q)) return true
    if (item.routerLink?.toLowerCase().includes(q)) return true
    return false
  }
  const walk = (item: MenuItem): MenuItem | null => {
    const kids = (item.Children ?? []).map(walk).filter(Boolean) as MenuItem[]
    if (matches(item) || kids.length > 0) {
      return { ...item, Children: kids }
    }
    return null
  }
  return items.map(walk).filter(Boolean) as MenuItem[]
}

/**
 * Walk the tree and collect every keyPath (i.e. every parent that
 * has children). Used by "Expand all" so deep nodes open too.
 */
function collectAllExpandKeys(items: MenuItem[]): Set<string> {
  const keys = new Set<string>()
  const walk = (xs: MenuItem[], parentPath: string) => {
    xs.forEach((item, i) => {
      const path = parentPath ? `${parentPath}/${i}` : `${i}`
      const hasChildren = (item.Children ?? []).length > 0
      if (hasChildren) {
        keys.add(`d:${path}`)
        walk(item.Children ?? [], path)
      }
    })
  }
  walk(items, "")
  return keys
}

export function MenuTree({
  items,
  onEdit,
  onDelete,
  onAddChild,
  onAddTopLevel,
  onDownloadJson,
  onCopyJson,
}: MenuTreeProps) {
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(
    () => new Set(),
  )
  const [query, setQuery] = React.useState("")

  const editable = Boolean(onEdit || onDelete || onAddChild)

  // Auto-expand the first level on mount so the user sees structure
  // immediately. They can collapse to navigate.
  React.useEffect(() => {
    const first = items.map((_, i) => `d:${i}`)
    setExpandedKeys((prev) => {
      if (prev.size > 0) return prev
      return new Set(first)
    })
  }, [items])

  const onToggle = React.useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // Recursively expand every parent so the whole tree is visible.
  const expandAll = () => {
    setExpandedKeys(collectAllExpandKeys(items))
  }
  const collapseAll = () => setExpandedKeys(new Set())

  // When a search is active, expand every visible parent so matches
  // are reachable without extra clicks.
  const visibleItems = filterTree(items, query)
  React.useEffect(() => {
    if (!query.trim()) return
    setExpandedKeys(collectAllExpandKeys(visibleItems))
  }, [query, visibleItems])

  return (
    <div className="space-y-3">
      {/* Header / controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu items, links, names…"
            className="pl-9 h-9 text-sm border-2 border-gray-200 focus:border-indigo-500"
          />
          {query && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-indigo-100 text-indigo-600"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={expandAll}
          className="gap-1 text-xs h-9 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Expand all
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={collapseAll}
          className="gap-1 text-xs h-9 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <ChevronRight className="w-3.5 h-3.5" />
          Collapse all
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <div className="text-xs text-gray-500 hidden sm:block">
            {visibleItems.length} top-level item{visibleItems.length !== 1 ? "s" : ""}
            {query && visibleItems.length === 0 && (
              <span className="ml-2 text-amber-600">— no matches</span>
            )}
          </div>
          {onDownloadJson && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDownloadJson}
              className="gap-1 text-xs h-9 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              title="Download menu as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </Button>
          )}
          {onAddTopLevel && (
            <Button
              size="sm"
              onClick={onAddTopLevel}
              className="gap-1 text-xs h-9 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add top-level item
            </Button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div
        className={cn(
          "rounded-2xl border border-indigo-100 bg-white shadow-sm",
          "max-h-[70vh] overflow-y-auto overflow-x-visible p-2",
        )}
      >
        {visibleItems.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            {query ? (
              <>No menu items match “{query}”.</>
            ) : (
              <>
                <p className="font-medium text-gray-700">No items yet</p>
                <p className="text-xs text-gray-500 mt-1">Add a top-level item to get started.</p>
              </>
            )}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {visibleItems.map((item, i) => (
              <MenuTreeItem
                key={`${i}-${item.Name}`}
                item={item}
                depth={0}
                keyPath={`${i}`}
                expandedKeys={expandedKeys}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </ul>
        )}
      </div>

      {editable && (
        <p className="text-xs text-gray-500 px-1">
          <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
            <PencilHint /> Tip:
          </span>{" "}
          hover a row to reveal <kbd className="px-1 py-0.5 rounded bg-gray-100 text-[10px] font-mono">+</kbd>
          {" "}add child, <kbd className="px-1 py-0.5 rounded bg-gray-100 text-[10px] font-mono">✎</kbd> edit, and{" "}
          <kbd className="px-1 py-0.5 rounded bg-gray-100 text-[10px] font-mono">🗑</kbd> delete.
        </p>
      )}
    </div>
  )
}

// Tiny inline hint icon for the "editable" tag in the header.
function PencilHint() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}
