"use client"

/**
 * SnippetEditorModal — create / edit dialog for snippets.
 *
 * Uses the same Dialog primitive as the existing read-only snippet modal.
 * The owner-or-admin gating is enforced server-side; this component just
 * sends POST or PUT and triggers a SWR refresh on success.
 */
import * as React from "react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { ApiSnippet } from "@/hooks/use-snippets"

/**
 * Minimal shape the editor needs from an existing snippet. We accept this
 * structural subset (instead of `ApiSnippet`) so callers like the admin
 * panel can pass their own `AdminSnippet` type without a duplicate type
 * alias — both shapes have the same field names by construction.
 */
export type SnippetEditorInitial = Pick<
  ApiSnippet,
  "id" | "title" | "description" | "content" | "category" | "language" | "icon" | "color" | "tags"
>

const ICON_KEYS = [
  "Code2",
  "Database",
  "Settings",
  "Terminal",
  "FileText",
  "Users",
  "Shield",
  "UserPlus",
  "Key",
  "BookOpen",
  "Server",
  "Wrench",
  "Star",
  "Zap",
]

const COLOR_KEYS = [
  "bg-blue-600",
  "bg-green-600",
  "bg-red-600",
  "bg-purple-600",
  "bg-orange-600",
  "bg-indigo-600",
  "bg-teal-600",
  "bg-yellow-600",
  "bg-pink-600",
  "bg-cyan-600",
  "bg-gray-600",
]

interface Folder {
  name: string
}

export interface SnippetEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  folders: Record<string, Folder>
  /** Existing snippet when editing; ignored when mode === "create". */
  initial?: SnippetEditorInitial | null
  /** Called on successful save so the parent can mutate the SWR cache. */
  onSaved: (snippet: ApiSnippet) => void
}

interface FormState {
  title: string
  description: string
  category: string
  language: string
  content: string
  tagsText: string
  icon: string
  color: string
}

const emptyForm = (defaultCategory: string): FormState => ({
  title: "",
  description: "",
  category: defaultCategory,
  language: "text",
  content: "",
  tagsText: "",
  icon: "Code2",
  color: "bg-purple-600",
})

export function SnippetEditorModal({
  open,
  onOpenChange,
  mode,
  folders,
  initial,
  onSaved,
}: SnippetEditorModalProps) {
  const folderNames = React.useMemo(() => Object.keys(folders), [folders])
  const [form, setForm] = React.useState<FormState>(() =>
    emptyForm(folderNames[0] ?? ""),
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset whenever the dialog opens or the target snippet changes.
  React.useEffect(() => {
    if (!open) return
    if (mode === "edit" && initial) {
      setForm({
        title: initial.title,
        description: initial.description ?? "",
        category: initial.category,
        language: initial.language || "text",
        content: initial.content,
        tagsText: (initial.tags ?? []).join(", "),
        icon: initial.icon || "Code2",
        color: initial.color || "bg-purple-600",
      })
    } else {
      setForm(emptyForm(folderNames[0] ?? ""))
    }
    setError(null)
  }, [open, mode, initial, folderNames])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const tags = form.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        content: form.content,
        category: form.category,
        language: form.language.trim() || undefined,
        icon: form.icon,
        color: form.color,
        tags,
      }

      const url = mode === "edit" && initial ? `/api/snippets/${initial.id}` : "/api/snippets"
      const method = mode === "edit" ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Request failed" }))
        throw new Error(data.error || `Request failed (${res.status})`)
      }
      const saved = (await res.json()) as ApiSnippet
      toast.success(mode === "edit" ? "Snippet updated" : "Snippet created")
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <DialogTitle>
            {mode === "edit" ? "Edit snippet" : "Create new snippet"}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "edit"
              ? "Update the snippet content. Changes are visible to everyone immediately."
              : "Add a new code snippet to your library."}
          </p>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Frontend Web.config"
                required
                maxLength={200}
                className="h-10 text-sm border-2 border-gray-200 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="h-10 w-full rounded-md border-2 border-gray-200 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {folderNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short summary shown on the snippet card"
              maxLength={2000}
              className="h-10 text-sm border-2 border-gray-200 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Language
              </label>
              <Input
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                placeholder="text, XML, SQL…"
                maxLength={40}
                className="h-10 text-sm border-2 border-gray-200 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Icon
              </label>
              <select
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="h-10 w-full rounded-md border-2 border-gray-200 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {ICON_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_KEYS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all",
                      c,
                      form.color === c
                        ? "ring-2 ring-offset-2 ring-blue-500 border-white"
                        : "border-white/40 hover:scale-110",
                    )}
                    aria-label={`Pick color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tags <span className="text-gray-400 font-normal">(comma separated)</span>
            </label>
            <Input
              value={form.tagsText}
              onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
              placeholder="web.config, angular, iis"
              className="h-10 text-sm border-2 border-gray-200 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              rows={12}
              placeholder="Paste your snippet here…"
              className="w-full rounded-md border-2 border-gray-200 bg-white p-3 font-mono text-xs leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
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
              disabled={submitting || !form.title.trim() || !form.content.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              {submitting
                ? mode === "edit"
                  ? "Saving…"
                  : "Creating…"
                : mode === "edit"
                  ? "Save changes"
                  : "Create snippet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}