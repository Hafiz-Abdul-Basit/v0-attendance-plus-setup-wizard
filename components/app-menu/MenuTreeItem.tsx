"use client"

/**
 * MenuTreeItem — a single row in the menu tree.
 *
 * Recursive: when the item has `Children`, it renders a chevron toggle
 * and renders `MenuTreeItem` again for each child at a deeper indent.
 *
 * Visual layout (modern card style):
 *   [depth guide] [chevron] [folder/link icon] [Name] [Count] [Claims]   [actions]
 *
 * Edit affordances (admin only — when callbacks are provided):
 *   - + Add child → calls onAddChild(this)
 *   - ✎ Edit       → calls onEdit(this)
 *   - 🗑 Delete    → calls onDelete(this)
 *
 * The parent owns all editing state (which keyPath is being edited,
 * the updated items array, the save handler). This component is a
 * pure renderer: it just paints icons and dispatches events.
 */
import * as React from "react"
import {
  ChevronRight,
  ExternalLink,
  Folder,
  FolderOpen,
  Link2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { MenuItem } from "./types"

interface MenuTreeItemProps {
  item: MenuItem
  /** Visual indent for this depth. Top-level items use 0. */
  depth: number
  /**
   * Stable path key. The parent uses this to find the item in the
   * tree when applying edits. Format: "0/2/1" — slashes separate
   * each depth level.
   */
  keyPath: string
  /**
   * All expanded keys from the parent, so a freshly-mounted child
   * doesn't collapse itself when its parent re-renders. Keys are
   * `d:${keyPath}` — stable enough for human menu structures.
   */
  expandedKeys: Set<string>
  onToggle: (key: string) => void
  /** Optional admin callbacks. When any of these are present, the
   *  add/edit/delete controls are rendered. */
  onEdit?: (keyPath: string) => void
  onDelete?: (keyPath: string) => void
  onAddChild?: (parentKeyPath: string) => void
}

const expansionKey = (keyPath: string) => `d:${keyPath}`

export function MenuTreeItem({
  item,
  depth,
  keyPath,
  expandedKeys,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
}: MenuTreeItemProps) {
  const expKey = expansionKey(keyPath)
  const children = item.Children ?? []
  const hasChildren = children.length > 0
  const isExpanded = expandedKeys.has(expKey)
  const hasLink = Boolean(item.routerLink)
  const editable = Boolean(onEdit || onDelete || onAddChild)

  const toggle = () => {
    if (hasChildren) onToggle(expKey)
    else if (hasLink && item.routerLink) {
      // Open in a new tab so the wizard stays put.
      window.open(item.routerLink, "_blank", "noopener,noreferrer")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <li className="select-none">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={hasChildren ? isExpanded : undefined}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative flex items-center gap-2 py-2 pr-2 rounded-lg cursor-pointer",
          "hover:bg-gradient-to-r hover:from-indigo-50/70 hover:to-purple-50/40 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
        )}
        // Left padding combines depth indent (24px per level) + a
        // little baseline + space for the depth guide line.
        style={{ paddingLeft: `${depth * 22 + 8}px` }}
      >
        {/* Depth guide line */}
        {depth > 0 && (
          <span
            aria-hidden
            className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-indigo-200/60 to-purple-200/40"
            style={{ left: `${depth * 22 - 3}px` }}
          />
        )}

        {/* Chevron or spacer */}
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-gray-500">
          {hasChildren ? (
            <ChevronRight
              className={cn(
                "w-4 h-4 transition-transform text-indigo-500",
                isExpanded && "rotate-90",
              )}
            />
          ) : null}
        </span>

        {/* Folder / link icon */}
        <span
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-md flex-shrink-0 shadow-sm",
            hasChildren
              ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
              : hasLink
                ? "bg-sky-100 text-sky-700"
                : "bg-gray-100 text-gray-500",
          )}
        >
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5" />
            ) : (
              <Folder className="w-3.5 h-3.5" />
            )
          ) : hasLink ? (
            <Link2 className="w-3.5 h-3.5" />
          ) : (
            <Folder className="w-3.5 h-3.5" />
          )}
        </span>

        {/* Name */}
        <span
          className={cn(
            "truncate",
            hasChildren ? "text-gray-900 font-semibold" : "text-gray-800 font-medium",
          )}
        >
          {item.DisplayName || item.Name}
        </span>

        {/* Count badge */}
        {item.Count != null && item.Count !== "" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5">
            {String(item.Count)}
          </span>
        )}

        {/* Claims badge */}
        {item.Claims && item.Claims.length > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5"
            title={item.Claims.join(", ")}
          >
            <Users className="w-3 h-3" />
            {item.Claims.length}
          </span>
        )}

        {/* External-link affordance (only for leaves with a link) */}
        {hasLink && !hasChildren && (
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" />
        )}

        {/* Edit controls (admin only) — appear on hover, on the far right */}
        {editable && (
          <div
            // Stop the parent row's click handler from firing when
            // clicking any of the icon buttons below.
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center gap-0.5 ml-auto pl-2",
              "opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity",
            )}
          >
            {onAddChild && (
              <IconButton
                title="Add child"
                aria-label="Add child item"
                onClick={() => onAddChild(keyPath)}
                className="text-emerald-600 hover:bg-emerald-50"
              >
                <Plus className="w-3.5 h-3.5" />
              </IconButton>
            )}
            {onEdit && (
              <IconButton
                title="Edit"
                aria-label="Edit item"
                onClick={() => onEdit(keyPath)}
                className="text-indigo-600 hover:bg-indigo-50"
              >
                <Pencil className="w-3.5 h-3.5" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                title="Delete"
                aria-label="Delete item"
                onClick={() => onDelete(keyPath)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </IconButton>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <ul className="space-y-0.5">
          {children.map((child, i) => (
            <MenuTreeItem
              key={`${keyPath}/${i}-${child.Name}`}
              item={child}
              depth={depth + 1}
              keyPath={`${keyPath}/${i}`}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

function IconButton({
  children,
  onClick,
  title,
  className,
  ...rest
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  "aria-label": string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "w-6 h-6 rounded-md flex items-center justify-center",
        "hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
