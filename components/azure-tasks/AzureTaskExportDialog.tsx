"use client"

/**
 * AzureTaskExportDialog — "Export pack" modal.
 *
 * Takes the tasks that match the CURRENT filters (date range, assignee,
 * attachments…) and, on one click, downloads a single zip with every
 * attachment + description/comments + Gemini-extracted key changes.
 * See export-pack.ts for the zip layout.
 *
 * Lazy loading stays untouched: the full list is only fetched when the
 * user presses "Create pack" (via `loadAllTasks`).
 */

import * as React from "react"
import { Download, Loader2, PackageOpen, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  buildExportPack,
  downloadBlob,
  type PackProgress,
  type PackResult,
} from "./export-pack"
import type { AzureWorkItem } from "./types"

interface Props {
  open: boolean
  onClose: () => void
  /** Human label for the active range, e.g. "2026-07-01_to_2026-09-30". */
  rangeLabel: string
  hasDateRange: boolean
  /** Total matching tasks as reported by the server (may exceed what's loaded). */
  totalCount: number
  /** Loads every remaining page, then resolves with the final filtered list. */
  loadAllTasks: () => Promise<AzureWorkItem[]>
}

export function AzureTaskExportDialog({
  open,
  onClose,
  rangeLabel,
  hasDateRange,
  totalCount,
  loadAllTasks,
}: Props) {
  const [includeAttachments, setIncludeAttachments] = React.useState(true)
  const [includeKeyChanges, setIncludeKeyChanges] = React.useState(true)
  const [running, setRunning] = React.useState(false)
  const [progress, setProgress] = React.useState<PackProgress | null>(null)
  const [result, setResult] = React.useState<PackResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    if (!open) {
      abortRef.current?.abort()
      setRunning(false)
      setProgress(null)
      setResult(null)
      setError(null)
    }
  }, [open])

  if (!open) return null

  const start = async () => {
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      setProgress({ phase: "details", done: 0, total: 0, message: "Loading the full task list…" })
      const tasks = await loadAllTasks()
      if (tasks.length === 0) throw new Error("No tasks match the current filters.")
      const r = await buildExportPack(tasks, {
        includeAttachments,
        includeKeyChanges,
        rangeLabel,
        signal: ctrl.signal,
        onProgress: setProgress,
      })
      setResult(r)
      downloadBlob(r.blob, r.fileName)
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message || "Export failed")
    } finally {
      setRunning(false)
    }
  }

  const pct =
    progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <PackageOpen className="w-5 h-5 text-blue-600" /> Export pack
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => (running ? abortRef.current?.abort() : onClose())}
            className="p-1 rounded text-gray-500 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 text-sm text-gray-700">
          <p>
            Creates one zip for the <b>{totalCount.toLocaleString()}</b> tasks matching the current filters: all
            their attachments, plus a <code>key-changes.txt</code> with the <b>key add / update</b> changes Gemini finds in
            descriptions and comments.
          </p>
          {!hasDateRange ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              No date range is selected, so all {totalCount.toLocaleString()} tasks will be exported. Pick From / To
              or a quick range such as Last 90d first.
            </div>
          ) : (
            <div className="text-xs text-gray-500">Range: {rangeLabel.replace("_to_", " → ")}</div>
          )}

          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={includeAttachments} disabled={running}
              onChange={(e) => setIncludeAttachments(e.target.checked)} />
            <span><b>Attachments</b>: download them all (one folder per task)</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={includeKeyChanges} disabled={running}
              onChange={(e) => setIncludeKeyChanges(e.target.checked)} />
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> <b>Gemini</b>: extract key add / update changes
            </span>
          </label>

          {running && progress ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-blue-800">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {progress.message} {progress.total > 0 ? `${progress.done}/${progress.total}` : ""}
              </div>
              <div className="h-1.5 rounded bg-gray-100 overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct ?? 5}%` }} />
              </div>
            </div>
          ) : null}

          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">{error}</div> : null}

          {result ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-900">
                Zip downloaded: {result.taskCount} tasks · {result.attachmentsDownloaded}/{result.attachmentCount} attachments
                · {result.keyChanges.length} key change{result.keyChanges.length === 1 ? "" : "s"}.
              </div>
              {result.errors.length > 0 ? (
                <details className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                  <summary className="cursor-pointer">
                    {result.errors.length} item{result.errors.length === 1 ? "" : "s"} could not be fetched
                    (also listed in _errors.txt inside the zip)
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs break-words">
                    {result.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {result.keyChanges.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    key-changes.txt
                  </div>
                  <pre className="max-h-64 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800 whitespace-pre-wrap break-all">
                    {result.keyChangesTxt}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
          {result ? (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => downloadBlob(result.blob, result.fileName)}>
              <Download className="w-4 h-4" /> Download again
            </Button>
          ) : null}
          {running ? (
            <Button variant="outline" size="sm" onClick={() => abortRef.current?.abort()}>Cancel</Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white disabled:border-blue-300 disabled:bg-blue-300 disabled:text-white"
                onClick={start}
                disabled={totalCount === 0}
              >
                <Download className="w-4 h-4" /> Create pack
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
