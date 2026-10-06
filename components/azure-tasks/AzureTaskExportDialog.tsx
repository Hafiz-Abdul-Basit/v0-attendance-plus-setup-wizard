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
import { Check, Copy, Download, Loader2, PackageOpen, Sparkles, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  buildExportPack,
  downloadBlob,
  type PackProgress,
  type PackResult,
} from "./export-pack"
import { setLastExport } from "./pack-state"
import type { AzureWorkItem } from "./types"

interface Props {
  open: boolean
  onClose: () => void
  /** Human label for the active range, e.g. "2026-07-01_to_2026-09-30". */
  rangeLabel: string
  hasDateRange: boolean
  /**
   * When true the pack starts the moment the dialog opens (1-click mode).
   * The panel sets it only when a date range is active, so an unfiltered
   * "export everything" never starts by accident.
   */
  autoStart?: boolean
  /** Called with the ISO time after a pack was built and downloaded. */
  onExported?: (iso: string) => void
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
  autoStart = false,
  onExported,
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
  const skipAiRef = React.useRef(false)

  // Remember the two checkboxes between sessions.
  const OPTIONS_KEY = "azure-pack-options"
  const optionsLoaded = React.useRef(false)
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(OPTIONS_KEY)
      if (raw) {
        const o = JSON.parse(raw) as { a?: boolean; k?: boolean }
        if (typeof o.a === "boolean") setIncludeAttachments(o.a)
        if (typeof o.k === "boolean") setIncludeKeyChanges(o.k)
      }
    } catch {
      /* ignore */
    }
    optionsLoaded.current = true
  }, [])
  React.useEffect(() => {
    if (!optionsLoaded.current) return
    try {
      window.localStorage.setItem(OPTIONS_KEY, JSON.stringify({ a: includeAttachments, k: includeKeyChanges }))
    } catch {
      /* ignore */
    }
  }, [includeAttachments, includeKeyChanges])

  // 1-click mode: start as soon as the dialog opens.
  const autoStartedRef = React.useRef(false)
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!open) {
      autoStartedRef.current = false
      return
    }
    if (autoStart && !autoStartedRef.current && !running) {
      autoStartedRef.current = true
      void start()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoStart])

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
    skipAiRef.current = false
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
        skipAi: skipAiRef,
        onProgress: setProgress,
      })
      setResult(r)
      downloadBlob(r.blob, r.fileName)
      const now = new Date().toISOString()
      setLastExport(now)
      onExported?.(now)
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
            One click, one zip, for the <b>{totalCount.toLocaleString()}</b> tasks matching the current filters: all
            their attachments, plus what Gemini finds in every description and comment: a <code>key-changes.txt</code>{" "}
            (<b>key add / update</b>), one <code>sql-scripts.sql</code> with ALL the SQL (attached .sql files plus tables / stored procedures found in the text) and a{" "}
            <code>deployment-checklist.txt</code> that lists, task by task (oldest first), every key, SQL and file to apply.
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
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                <b>Gemini</b>: extract key changes and SQL (tables, stored procedures)
              </span>
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
              {progress.detail ? (
                <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">
                  {progress.detail}
                </pre>
              ) : null}
              {progress.phase === "ai" ? (
                <button
                  type="button"
                  onClick={() => {
                    skipAiRef.current = true
                  }}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50"
                >
                  Skip Gemini — read keys &amp; SQL locally and finish now
                </button>
              ) : null}
            </div>
          ) : null}

          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">{error}</div> : null}

          {result ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-900">
                Zip downloaded: {result.taskCount} tasks · {result.attachmentsDownloaded}/{result.attachmentCount} attachments
                {" "}· {result.keyChanges.length} key change{result.keyChanges.length === 1 ? "" : "s"}
                {" "}· {result.sqlScripts.length} SQL script{result.sqlScripts.length === 1 ? "" : "s"}.
                {result.reusedFromCache > 0
                  ? ` ${result.reusedFromCache} task${result.reusedFromCache === 1 ? "" : "s"} reused from the last Gemini run (no request needed).`
                  : ""}
              </div>
              {result.localTaskCount > 0 ? (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-blue-900">
                  <span>
                    Gemini was busy for {result.localTaskCount} task{result.localTaskCount === 1 ? "" : "s"}, so
                    {result.localTaskCount === 1 ? " it was" : " they were"} only read with simple pattern matching.
                    Retrying sends just {result.localTaskCount === 1 ? "that task" : "those tasks"} — the rest are
                    reused from the last run.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                    onClick={start}
                    disabled={running}
                  >
                    Retry Gemini
                  </Button>
                </div>
              ) : null}
              {result.conflictCount > 0 || result.supersededSql > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                  {result.conflictCount > 0
                    ? `${result.conflictCount} key${result.conflictCount === 1 ? " is" : "s are"} set to different values in different tasks — the newest value is used, see the ATTENTION block in deployment-checklist.txt. `
                    : ""}
                  {result.supersededSql > 0
                    ? `${result.supersededSql} older version${result.supersededSql === 1 ? "" : "s"} of the same stored procedure / function / view were dropped (newest kept).`
                    : ""}
                </div>
              ) : null}
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
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">key-changes.txt</span>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(result.keyChangesTxt).then(() => {
                          setCopied(true)
                          setTimeout(() => setCopied(false), 1500)
                        })
                      }}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
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
