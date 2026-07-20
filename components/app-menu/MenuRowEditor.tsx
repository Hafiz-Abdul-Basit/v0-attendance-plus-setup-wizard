"use client"

/**
 * MenuRowEditor — inline edit form for a single menu item.
 *
 * Replaces the row's static label with input fields. Used in two
 * modes:
 *   - "edit"   — fields are pre-filled from the existing item
 *   - "create" — fields are blank, parent is the keyPath so we can
 *                insert at the right place on save
 *
 * Fields:
 *   Name         (required, the stable identifier)
 *   DisplayName  (optional, shown in the navbar)
 *   routerLink   (optional, e.g. /attendance/...)
 *   Claims       (comma-separated roles)
 *   Count        (optional badge value, e.g. "12" or 0)
 *
 * The parent owns the save action: we just call onSave(partial)
 * with the edited fields, and the parent merges it into the tree and
 * persists via the PATCH endpoint.
 */
import * as React from "react"
import { Save, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface MenuRowDraft {
  Name: string
  DisplayName: string
  routerLink: string
  /** Comma-separated, gets parsed to string[] on save. */
  ClaimsText: string
  CountText: string
}

interface MenuRowEditorProps {
  initial?: MenuRowDraft
  mode: "edit" | "create"
  /** Optional className for the outer container. */
  className?: string
  onSave: (draft: MenuRowDraft) => void | Promise<void>
  onCancel: () => void
}

const EMPTY_DRAFT: MenuRowDraft = {
  Name: "",
  DisplayName: "",
  routerLink: "",
  ClaimsText: "",
  CountText: "",
}

export function MenuRowEditor({
  initial,
  mode,
  className,
  onSave,
  onCancel,
}: MenuRowEditorProps) {
  const [draft, setDraft] = React.useState<MenuRowDraft>(initial ?? EMPTY_DRAFT)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const update = <K extends keyof MenuRowDraft>(key: K, value: MenuRowDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!draft.Name.trim()) {
      setError("Name is required.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
      setSaving(false)
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-purple-300 bg-purple-50/50 p-3 space-y-2",
        className,
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field label="Name *" hint="Stable identifier">
          <Input
            value={draft.Name}
            onChange={(e) => update("Name", e.target.value)}
            placeholder="e.g. Action Board"
            className="h-8 text-sm"
            autoFocus
          />
        </Field>
        <Field label="Display name" hint="Shown in the navbar">
          <Input
            value={draft.DisplayName}
            onChange={(e) => update("DisplayName", e.target.value)}
            placeholder="Optional"
            className="h-8 text-sm"
          />
        </Field>
        <Field label="Router link" hint="e.g. /actionboard/main">
          <Input
            value={draft.routerLink}
            onChange={(e) => update("routerLink", e.target.value)}
            placeholder="/path"
            className="h-8 text-sm font-mono"
          />
        </Field>
        <Field label="Count" hint="Optional badge value">
          <Input
            value={draft.CountText}
            onChange={(e) => update("CountText", e.target.value)}
            placeholder="e.g. 12"
            className="h-8 text-sm"
          />
        </Field>
        <Field
          label="Claims / roles"
          hint="Comma-separated"
          className="sm:col-span-2"
        >
          <Input
            value={draft.ClaimsText}
            onChange={(e) => update("ClaimsText", e.target.value)}
            placeholder="campusofficer, Principal"
            className="h-8 text-sm"
          />
        </Field>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
          className="h-7 px-2 text-xs gap-1"
        >
          <X className="w-3 h-3" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={saving || !draft.Name.trim()}
          className="h-7 px-2 text-xs gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          <Save className="w-3 h-3" />
          {saving ? "Saving…" : mode === "create" ? "Add" : "Save"}
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn("block space-y-1", className)}>
      <span className="block text-[11px] font-semibold text-gray-700">
        {label}
        {hint && (
          <span className="ml-1 text-[10px] font-normal text-gray-500">
            ({hint})
          </span>
        )}
      </span>
      {children}
    </label>
  )
}

/**
 * Convert a comma-separated string from the editor into a clean
 * `string[]` (trimmed, deduped, no empties). `undefined` in if empty.
 */
export function parseClaims(text: string): string[] | undefined {
  const parts = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return undefined
  return Array.from(new Set(parts))
}

/**
 * Build the initial form draft for an existing item. Accepts a
 * partial item (so callers can pass `null` / `undefined` and we
 * produce a blank draft).
 */
export function draftFromItem(
  item: Partial<{
    Name: string
    DisplayName: string | null
    routerLink: string | null
    Claims: string[]
    Count: string | number | null
  }> | null | undefined,
): MenuRowDraft {
  if (!item) return EMPTY_DRAFT
  return {
    Name: item.Name ?? "",
    DisplayName: item.DisplayName ?? "",
    routerLink: item.routerLink ?? "",
    ClaimsText: (item.Claims ?? []).join(", "),
    CountText: item.Count == null ? "" : String(item.Count),
  }
}
