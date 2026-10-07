"use client"

/**
 * AzureTaskExportIsland — the floating, minimisable "notch" for Export pack.
 *
 *   • It is NOT a modal: no backdrop, nothing is blocked. The export runs
 *     in the background (see use-export-pack.ts) while you keep filtering,
 *     searching and opening tasks.
 *   • Collapsed  = a small pill at the top centre: progress ring + what it
 *                  is doing right now. Click it to expand.
 *   • Expanded   = the same pill morphs into a card with details, the
 *                  Skip-Gemini / Cancel buttons, and — when finished — the
 *                  summary, warnings, Retry Gemini and a key preview.
 *   • Done       = the pill turns green, a toast fires, and (if the tab is
 *                  in the background and permission was granted) a browser
 *                  notification appears. The zip downloads automatically.
 */

import * as React from "react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Download,
  PackageOpen,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { downloadBlob, type PackProgress } from "./export-pack"
import type { ExportPackController } from "./use-export-pack"

/** Ask once (from a click) so a "pack ready" notification can reach you in another tab. */
export function requestNotifyPermission(): void {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission()
    }
  } catch {
    /* unsupported */
  }
}

function overallPct(p: PackProgress | null, status: ExportPackController["status"]): number | null {
  if (status === "done") return 100
  if (!p) return null
  const span: Record<PackProgress["phase"], [number, number]> = {
    details: [0, 30],
    attachments: [30, 60],
    ai: [60, 92],
    zip: [92, 99],
    done: [100, 100],
  }
  const [a, b] = span[p.phase]
  if (p.total <= 0) return a
  return Math.round(a + (b - a) * Math.min(1, p.done / p.total))
}

function Ring({ pct, tone }: { pct: number | null; tone: "run" | "done" | "error" }) {
  const r = 11
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center">
      <svg viewBox="0 0 28 28" className={cn("h-7 w-7 -rotate-90", pct == null && tone === "run" && "animate-spin")}>
        <circle cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <circle
          cx="14"
          cy="14"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - (pct ?? 25) / 100)}
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        {tone === "done" ? (
          <Check className="h-3.5 w-3.5" />
        ) : tone === "error" ? (
          <AlertTriangle className="h-3.5 w-3.5" />
        ) : (
          <PackageOpen className="h-3 w-3 opacity-90" />
        )}
      </span>
    </span>
  )
}

interface Props {
  pack: ExportPackController
  /** The island is shown at all. */
  visible: boolean
  expanded: boolean
  onExpandedChange: (v: boolean) => void
  /** Hide the island (also resets a finished / failed run). */
  onDismiss: () => void
  /** The user answered the "use Gemini?" question — start now. */
  onStart: (useGemini: boolean) => void
  hasDateRange: boolean
  totalCount: number
  rangeLabel: string
}

export function AzureTaskExportIsland({
  pack,
  visible,
  expanded,
  onExpandedChange,
  onDismiss,
  onStart,
  hasDateRange,
  totalCount,
  rangeLabel,
}: Props) {
  const { status, progress, result, error } = pack
  const pct = overallPct(progress, status)
  const [now, setNow] = React.useState(() => Date.now())
  const [copied, setCopied] = React.useState(false)
  const prevStatus = React.useRef(status)

  // Elapsed-time ticker only while running.
  React.useEffect(() => {
    if (status !== "running") return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [status])

  // Tab title shows progress when you are in another tab.
  React.useEffect(() => {
    if (status !== "running") return
    const original = document.title
    document.title = `⏳ ${pct ?? 0}% · Export pack`
    return () => {
      document.title = original
    }
  }, [status, pct])

  // Notify when the run finishes / fails.
  React.useEffect(() => {
    const was = prevStatus.current
    prevStatus.current = status
    if (was !== "running") return
    if (status === "done" && result) {
      const body = `${result.taskCount} tasks · ${result.attachmentsDownloaded} files · ${result.keyChanges.length} keys · ${result.sqlScripts.length} SQL`
      toast.success("Export pack is ready", {
        description: `${body} — downloaded.`,
        duration: 9000,
        action: { label: "Download again", onClick: () => downloadBlob(result.blob, result.fileName) },
      })
      try {
        if (document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Export pack is ready", { body })
        }
      } catch {
        /* ignore */
      }
    } else if (status === "error") {
      toast.error("Export pack failed", { description: error ?? undefined })
    }
  }, [status, result, error])

  if (!visible) return null

  const tone: "run" | "done" | "error" = status === "done" ? "done" : status === "error" ? "error" : "run"
  const elapsed = pack.startedAt ? Math.max(0, Math.round(((pack.finishedAt ?? now) - pack.startedAt) / 1000)) : 0
  const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`

  const headline =
    status === "running"
      ? (progress?.message ?? "Working…")
      : status === "done" && result
        ? `Pack ready · ${result.taskCount} tasks`
        : status === "error"
          ? "Export failed"
          : "Export pack"
  const sub =
    status === "running"
      ? `${pct ?? 0}% · ${mmss}`
      : status === "done" && result
        ? `${result.attachmentsDownloaded} files · ${result.keyChanges.length} keys · ${result.sqlScripts.length} SQL`
        : status === "error"
          ? "Tap for details"
          : hasDateRange
            ? rangeLabel.replace("_to_", " → ")
            : "All tasks"

  return (
    <>
      <style>{`
        @keyframes azIslandIn { from { opacity: 0; transform: translate(-50%, -14px) scale(.92); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        @keyframes azIslandPop { 0% { transform: translate(-50%, 0) scale(1); } 40% { transform: translate(-50%, 0) scale(1.07); } 100% { transform: translate(-50%, 0) scale(1); } }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        style={{
          width: expanded ? 440 : 320,
          maxWidth: "calc(100vw - 24px)",
          borderRadius: expanded ? 28 : 24,
          animation: status === "done" && !expanded ? "azIslandPop 600ms ease-out" : "azIslandIn 350ms cubic-bezier(.2,.9,.3,1.2)",
          transition: "width 320ms cubic-bezier(.2,.8,.2,1), border-radius 320ms, background-color 300ms",
        }}
        className={cn(
          "fixed left-1/2 top-[76px] z-40 -translate-x-1/2 overflow-hidden text-white shadow-2xl ring-1 ring-white/10",
          status === "done" ? "bg-emerald-700" : status === "error" ? "bg-red-700" : "bg-gray-950",
        )}
      >
        {/* Header = the collapsed pill */}
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          className="flex h-12 w-full items-center gap-3 px-3 text-left hover:bg-white/5"
          aria-expanded={expanded}
        >
          <Ring pct={pct} tone={tone} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold leading-tight">{headline}</span>
            <span className="block truncate text-[11px] leading-tight text-white/65">{sub}</span>
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-white/70"
            style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 300ms" }}
          />
        </button>

        {/* Body — slides open */}
        <div style={{ display: "grid", gridTemplateRows: expanded ? "1fr" : "0fr", transition: "grid-template-rows 320ms cubic-bezier(.2,.8,.2,1)" }}>
          <div className="overflow-hidden">
            <div className="space-y-3 px-4 pb-4 pt-1 text-[13px] text-white/90">
              {/* ---------------- idle: ask, then start ---------------- */}
              {status === "idle" ? (
                <>
                  <p className="text-white/80">
                    Export <b className="text-white">{totalCount.toLocaleString()}</b> task{totalCount === 1 ? "" : "s"}
                    {hasDateRange ? <> ({rangeLabel.replace("_to_", " → ")})</> : " (all dates)"}: attachments, keys, SQL and a
                    deployment checklist in one zip. It runs in the background — keep using the app.
                  </p>
                  {!hasDateRange ? (
                    <div className="rounded-xl bg-amber-400/15 px-3 py-2 text-amber-100">
                      No date range is selected, so ALL {totalCount.toLocaleString()} tasks will be exported. Pick a range first
                      (From / To or a quick chip) if you only need recent ones.
                    </div>
                  ) : null}
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-blue-500" checked={pack.includeAttachments} onChange={(e) => pack.setIncludeAttachments(e.target.checked)} />
                    Download all attachments (one folder per task)
                  </label>
                  <div className="rounded-2xl bg-white/10 p-3">
                    <div className="flex items-center gap-1.5 font-semibold text-white">
                      <Sparkles className="h-4 w-4 text-indigo-300" /> Use Gemini to find keys &amp; SQL?
                    </div>
                    <p className="mt-1 text-[12px] leading-snug text-white/65">
                      <b className="text-white/90">Yes</b> — understands any wording, but uses your Gemini quota and takes longer.
                      <br />
                      <b className="text-white/90">No</b> — instant; finds the standard patterns only (results Gemini gave earlier are still reused).
                    </p>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onStart(false)}
                        disabled={totalCount === 0}
                        className="rounded-full bg-white/15 px-4 py-1.5 font-semibold text-white hover:bg-white/25 disabled:opacity-50"
                      >
                        No Gemini
                      </button>
                      <button
                        type="button"
                        onClick={() => onStart(true)}
                        disabled={totalCount === 0}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-1.5 font-semibold text-white hover:bg-blue-400 disabled:opacity-50"
                      >
                        <Sparkles className="h-4 w-4" /> Use Gemini
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={onDismiss} className="rounded-full px-3 py-1 text-[12px] text-white/60 hover:bg-white/10">
                      Cancel
                    </button>
                  </div>
                </>
              ) : null}

              {/* ---------------- running ---------------- */}
              {status === "running" ? (
                <>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${pct ?? 4}%`, transition: "width 400ms ease" }} />
                  </div>
                  <p className="text-white/70">
                    {progress?.message}
                    {progress && progress.total > 0 ? ` ${progress.done}/${progress.total}` : ""}
                  </p>
                  {progress?.detail ? (
                    <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-amber-400/15 p-2 text-[11px] text-amber-100">
                      {progress.detail}
                    </pre>
                  ) : null}
                  <p className="text-[12px] text-white/55">You can minimise this and keep working — you will be notified when it is done.</p>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {progress?.phase === "ai" ? (
                      <button type="button" onClick={pack.skipAi} className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">
                        Skip Gemini
                      </button>
                    ) : null}
                    <button type="button" onClick={pack.cancel} className="rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20">
                      Cancel
                    </button>
                    <button type="button" onClick={() => onExpandedChange(false)} className="rounded-full bg-white px-3 py-1.5 font-semibold text-gray-900 hover:bg-gray-100">
                      Minimise
                    </button>
                  </div>
                </>
              ) : null}

              {/* ---------------- done ---------------- */}
              {status === "done" && result ? (
                <>
                  <p>
                    {result.taskCount} tasks · {result.attachmentsDownloaded}/{result.attachmentCount} attachments ·{" "}
                    {result.keyChanges.length} key change{result.keyChanges.length === 1 ? "" : "s"} ·{" "}
                    {result.sqlScripts.length} SQL script{result.sqlScripts.length === 1 ? "" : "s"}
                    {result.reusedFromCache > 0 ? ` · ${result.reusedFromCache} reused from the last Gemini run` : ""}. The zip
                    was downloaded ({mmss}).
                  </p>
                  {result.localTaskCount > 0 ? (
                    <div className="flex items-start justify-between gap-3 rounded-xl bg-white/15 px-3 py-2">
                      <span>
                        {pack.usedGemini
                          ? `Gemini was busy for ${result.localTaskCount} task${result.localTaskCount === 1 ? "" : "s"}; they were only read with simple pattern matching.`
                          : `${result.localTaskCount} task${result.localTaskCount === 1 ? " was" : "s were"} read without Gemini (your choice).`}{" "}
                        {pack.usedGemini ? "Retry" : "Running Gemini"} sends just {result.localTaskCount === 1 ? "that task" : "those tasks"}.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onExpandedChange(false)
                          pack.retry()
                        }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 font-semibold text-gray-900 hover:bg-gray-100"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> {pack.usedGemini ? "Retry Gemini" : "Run Gemini"}
                      </button>
                    </div>
                  ) : null}
                  {result.conflictCount > 0 || result.supersededSql > 0 ? (
                    <div className="rounded-xl bg-amber-400/20 px-3 py-2 text-amber-50">
                      {result.conflictCount > 0 ? `${result.conflictCount} key${result.conflictCount === 1 ? " is" : "s are"} set to different values in different tasks — newest value used (see ATTENTION in deployment-checklist.txt). ` : ""}
                      {result.supersededSql > 0 ? `${result.supersededSql} older version${result.supersededSql === 1 ? "" : "s"} of the same stored procedure / function / view dropped.` : ""}
                    </div>
                  ) : null}
                  {result.errors.length > 0 ? (
                    <details className="rounded-xl bg-white/10 px-3 py-2">
                      <summary className="cursor-pointer">
                        {result.errors.length} note{result.errors.length === 1 ? "" : "s"} (also in _errors.txt)
                      </summary>
                      <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-[11px] text-white/80 break-words">
                        {result.errors.slice(0, 12).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                  {result.keyChanges.length > 0 ? (
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/60">key-changes.txt</span>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard?.writeText(result.keyChangesTxt).then(() => {
                              setCopied(true)
                              setTimeout(() => setCopied(false), 1500)
                            })
                          }}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
                        >
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-black/25 p-2.5 text-[11px] text-white/90">
                        {result.keyChangesTxt}
                      </pre>
                    </div>
                  ) : null}
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onDismiss} className="rounded-full px-3 py-1.5 text-white/80 hover:bg-white/10">
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadBlob(result.blob, result.fileName)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 font-semibold text-gray-900 hover:bg-gray-100"
                    >
                      <Download className="h-4 w-4" /> Download again
                    </button>
                  </div>
                </>
              ) : null}

              {/* ---------------- error ---------------- */}
              {status === "error" ? (
                <>
                  <p className="break-words rounded-xl bg-black/25 p-2.5 text-[12px]">{error}</p>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={onDismiss} className="rounded-full px-3 py-1.5 text-white/80 hover:bg-white/10">
                      Dismiss
                    </button>
                    <button type="button" onClick={pack.retry} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 font-semibold text-gray-900 hover:bg-gray-100">
                      <RotateCcw className="h-4 w-4" /> Try again
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Small dismiss for finished / failed pills */}
        {(status === "done" || status === "error") && !expanded ? (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            className="absolute right-9 top-3.5 rounded-full p-1 text-white/70 hover:bg-white/15 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </>
  )
}
