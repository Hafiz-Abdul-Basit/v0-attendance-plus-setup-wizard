"use client"

/**
 * MenuUploader — admin-only modal for uploading a new menu JSON.
 *
 * Flow:
 *   1. Admin clicks "Upload new menu" on the page header
 *   2. Modal opens with a large textarea + an optional "name" field
 *   3. On submit: parse → validate shape → POST /api/app-menus
 *   4. On success: close modal, SWR cache is invalidated, the new
 *      menu appears in the tree view
 *
 * The server enforces admin role; this component only checks
 * `session?.user?.role === "admin"` to decide whether to render.
 */
import * as React from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Upload, FileJson, AlertTriangle } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MenuDoc } from "./types"

interface MenuUploaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: () => void
}

interface ValidationResult {
  ok: boolean
  json?: MenuDoc
  error?: string
  stats?: { items: number; depth: number }
}

const MAX_BYTES = 1_000_000 // 1 MB — generous for menu JSONs

function validateMenuText(raw: string): ValidationResult {
  if (!raw.trim()) {
    return { ok: false, error: "Paste a JSON payload first." }
  }
  if (raw.length > MAX_BYTES) {
    return {
      ok: false,
      error: `JSON is too large (${(raw.length / 1024).toFixed(0)} KB). Max is ${MAX_BYTES / 1024} KB.`,
    }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    return {
      ok: false,
      error: `Not valid JSON: ${e instanceof Error ? e.message : String(e)}`,
    }
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "Top-level value must be an object." }
  }
  const doc = parsed as Record<string, unknown>
  const items = doc.MenuItems
  if (!Array.isArray(items)) {
    return {
      ok: false,
      error: `Missing "MenuItems" array at the top level. Got: ${typeof items}.`,
    }
  }
  // Walk the tree to count items + max depth
  let count = 0
  let maxDepth = 0
  const walk = (xs: unknown[], depth: number) => {
    maxDepth = Math.max(maxDepth, depth)
    for (const x of xs) {
      if (typeof x !== "object" || x === null) continue
      count++
      const kids = (x as { Children?: unknown[] }).Children
      if (Array.isArray(kids) && kids.length > 0) walk(kids, depth + 1)
    }
  }
  walk(items, 1)
  return {
    ok: true,
    json: doc as unknown as MenuDoc,
    stats: { items: count, depth: maxDepth },
  }
}

export function MenuUploader({ open, onOpenChange, onUploaded }: MenuUploaderProps) {
  const { data: session } = useSession()
  const [name, setName] = React.useState("NextPremium menu")
  const [text, setText] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [stats, setStats] = React.useState<{ items: number; depth: number } | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const isAdmin = session?.user?.role === "admin"

  // Reset whenever the dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setError(null)
      setStats(null)
    }
  }, [open])

  const onChangeText = (next: string) => {
    setText(next)
    setError(null)
    setStats(null)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError(`File is too large (${(file.size / 1024).toFixed(0)} KB). Max is ${MAX_BYTES / 1024} KB.`)
      return
    }
    const buf = await file.text()
    setText(buf)
    onChangeText(buf)
  }

  const onValidate = () => {
    const result = validateMenuText(text)
    if (!result.ok) {
      setError(result.error ?? "Invalid JSON")
      setStats(null)
    } else {
      setError(null)
      setStats(result.stats ?? null)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = validateMenuText(text)
    if (!result.ok || !result.json) {
      setError(result.error ?? "Invalid JSON")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/app-menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Untitled menu", json: result.json }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        menu?: unknown
        error?: string
        issues?: { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
      }
      if (!res.ok) {
        // If the server sent back zod's field-level breakdown, surface
        // the first concrete reason — "Validation failed" alone is
        // useless for the operator trying to figure out what's wrong.
        const detail = data.issues
          ? [
              ...(data.issues.formErrors ?? []),
              ...Object.entries(data.issues.fieldErrors ?? {}).map(
                ([k, v]) => `${k}: ${(v as string[]).join(", ")}`,
              ),
            ].join("; ")
          : null
        throw new Error(detail ? `${data.error}: ${detail}` : data.error || `Upload failed (${res.status})`)
      }
      toast.success("Menu uploaded — it is now the active menu.")
      onUploaded()
      onOpenChange(false)
      setText("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            Upload new menu
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Paste a NextPremium menu JSON below. The previous active menu (if any) is archived.
          </p>
        </DialogHeader>

        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {!isAdmin && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>You are not signed in as an admin. The server will reject this upload.</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Menu name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NextPremium menu v1"
              maxLength={200}
              className="h-10 text-sm border-2 border-gray-200 focus:border-purple-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-gray-700">
                Menu JSON
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={onFile}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1 text-xs h-8"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  Load from file
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onValidate}
                  disabled={!text.trim()}
                  className="gap-1 text-xs h-8"
                >
                  Validate
                </Button>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              rows={16}
              placeholder='{ "_id": "...", "MenuItems": [ { "Name": "Home", "Sequence": 0, "Claims": [...], "Children": [], "routerLink": "/..." } ] }'
              className="w-full rounded-md border-2 border-gray-200 bg-white p-3 font-mono text-xs leading-relaxed focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>{text.length.toLocaleString()} chars</span>
              {stats && (
                <span className="text-green-700 font-medium">
                  ✓ {stats.items} item{stats.items !== 1 ? "s" : ""} · max depth {stats.depth}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !text.trim() || !isAdmin}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              {submitting ? "Uploading…" : "Upload menu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
