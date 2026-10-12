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
  CalendarRange,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileCode2,
  KeyRound,
  ListChecks,
  Loader2,
  PackageOpen,
  Paperclip,
  RotateCcw,
  Search,
  Server,
  Sparkles,
  X,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { AzureClientOption } from "@/hooks/use-azure-clients"
import { downloadBlob, type PackProgress } from "./export-pack"
import type { ExportPackController } from "./use-export-pack"

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
  /** Client selected for this pack; the export is recorded against it. */
  client?: string
  /** Clients to choose from (Azure DevOps agents) with this user's last export. */
  clients: AzureClientOption[]
  clientsLoading: boolean
  onClientChange: (client: string | undefined) => void
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
  client,
  clients,
  clientsLoading,
  onClientChange,
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
          ? error?.startsWith("The export was interrupted")
            ? "Export interrupted"
            : "Export failed"
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
          width: expanded ? 500 : 320,
          maxWidth: "calc(100vw - 24px)",
          borderRadius: expanded ? 28 : 24,
          animation: status === "done" && !expanded ? "azIslandPop 600ms ease-out" : "azIslandIn 350ms cubic-bezier(.2,.9,.3,1.2)",
          transition: "width 320ms cubic-bezier(.2,.8,.2,1), border-radius 320ms, background-color 300ms",
        }}
        className={cn(
          "fixed left-1/2 top-[76px] z-[70] -translate-x-1/2 overflow-hidden text-white shadow-2xl ring-1 ring-white/10",
          status === "done"
            ? "bg-emerald-700"
            : status === "error"
              ? "bg-red-700"
              : "bg-gradient-to-b from-slate-900 via-slate-950 to-black",
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
            <div className="max-h-[calc(100vh-150px)] overflow-y-auto space-y-3 px-4 pb-4 pt-1 text-[13px] text-white/90 [scrollbar-width:thin]">
              {/* ---------------- idle: ask, then start ---------------- */}
              {status === "idle" ? (
                <IdlePrompt
                  totalCount={totalCount}
                  hasDateRange={hasDateRange}
                  rangeLabel={rangeLabel}
                  includeAttachments={pack.includeAttachments}
                  onIncludeAttachments={pack.setIncludeAttachments}
                  client={client}
                  clients={clients}
                  clientsLoading={clientsLoading}
                  onClientChange={onClientChange}
                  onStart={onStart}
                  onCancel={onDismiss}
                />
              ) : null}

              {/* ---------------- running ---------------- */}
              {status === "running" ? (
                <>
                  <PhaseSteps phase={progress?.phase ?? "details"} />
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400"
                      style={{ width: `${pct ?? 4}%`, transition: "width 400ms ease" }}
                    />
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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

/**
 * The "ready to export" body: what's in the pack, which client it's for,
 * options, Gemini vs quick mode, and one prominent Export button.
 */
function IdlePrompt({
  totalCount,
  hasDateRange,
  rangeLabel,
  includeAttachments,
  onIncludeAttachments,
  client,
  clients,
  clientsLoading,
  onClientChange,
  onStart,
  onCancel,
}: {
  totalCount: number
  hasDateRange: boolean
  rangeLabel: string
  includeAttachments: boolean
  onIncludeAttachments: (v: boolean) => void
  client: string | undefined
  clients: AzureClientOption[]
  clientsLoading: boolean
  onClientChange: (client: string | undefined) => void
  onStart: (useGemini: boolean) => void
  onCancel: () => void
}) {
  const [useGemini, setUseGemini] = React.useState(true)
  const range = hasDateRange ? rangeLabel.replace("_to_", " → ") : "All dates"

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-white/50">Ready to export</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular-nums text-white">{totalCount.toLocaleString()}</span>
              <span className="text-white/70">task{totalCount === 1 ? "" : "s"}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-1 text-[12px] font-medium text-blue-200 ring-1 ring-blue-400/30">
            <CalendarRange className="h-3.5 w-3.5" />
            {range}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            { icon: Paperclip, label: "Attachments" },
            { icon: KeyRound, label: "Key changes" },
            { icon: FileCode2, label: "SQL scripts" },
            { icon: ListChecks, label: "Checklist" },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-1 rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] text-white/70">
              <Icon className="h-3 w-3" />
              {label}
            </span>
          ))}
        </div>
        {!hasDateRange ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-400/15 px-3 py-2 text-[12px] text-amber-100">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            No date range is selected, so all {totalCount.toLocaleString()} tasks will be exported. Pick a range or a client first if you only need recent ones.
          </div>
        ) : null}
      </div>

      {/* Client */}
      <div>
        <SectionLabel>Client</SectionLabel>
        <ClientCombobox client={client} clients={clients} loading={clientsLoading} onChange={onClientChange} />
      </div>

      {/* Options */}
      <div>
        <SectionLabel>Mode</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <ModeCard
            active={useGemini}
            onClick={() => setUseGemini(true)}
            icon={Sparkles}
            title="Smart"
            text="Gemini reads any wording. Slower, uses quota."
          />
          <ModeCard
            active={!useGemini}
            onClick={() => setUseGemini(false)}
            icon={Zap}
            title="Quick"
            text="Standard patterns only. Instant; earlier Gemini results reused."
          />
        </div>
        <label className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white/[0.05] px-3 py-2.5 ring-1 ring-white/10 hover:bg-white/[0.08]">
          <span className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-white/60" />
            Download all attachments
            <span className="text-[11px] text-white/45">one folder per task</span>
          </span>
          <DarkSwitch checked={includeAttachments} onChange={onIncludeAttachments} label="Download all attachments" />
        </label>
      </div>

      {/* Action */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => onStart(useGemini)}
          disabled={totalCount === 0}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-[15px] font-semibold text-white shadow-lg shadow-indigo-900/40 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:hover:brightness-100"
        >
          <PackageOpen className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
          Export {totalCount.toLocaleString()} task{totalCount === 1 ? "" : "s"}
          {client ? <span className="font-normal text-white/80">for {client}</span> : null}
        </button>
        <div className="flex items-center justify-between text-[11px] text-white/45">
          <span>Runs in the background — keep using the app.</span>
          <button type="button" onClick={onCancel} className="rounded-full px-2 py-0.5 text-white/60 hover:bg-white/10 hover:text-white">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">{children}</div>
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  text,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "rounded-xl p-3 text-left ring-1 transition-colors",
        active ? "bg-indigo-500/20 ring-indigo-400/70" : "bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]",
      )}
    >
      <span className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-semibold text-white">
          <Icon className={cn("h-4 w-4", active ? "text-indigo-300" : "text-white/60")} />
          {title}
        </span>
        <span
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full ring-1",
            active ? "bg-indigo-400 ring-indigo-300" : "ring-white/30",
          )}
        >
          {active ? <Check className="h-3 w-3 text-white" /> : null}
        </span>
      </span>
      <span className="mt-1 block text-[11px] leading-snug text-white/60">{text}</span>
    </button>
  )
}

function DarkSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault()
        onChange(!checked)
      }}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-indigo-500" : "bg-white/20",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[3px]",
        )}
      />
    </button>
  )
}

/**
 * Searchable client picker for the dark island. It opens inline (not as a
 * floating popover) because the island clips overflow. Keyboard: type to
 * filter, ↑/↓ to move, Enter to pick, Esc to close.
 */
function ClientCombobox({
  client,
  clients,
  loading,
  onChange,
}: {
  client: string | undefined
  clients: AzureClientOption[]
  loading: boolean
  onChange: (client: string | undefined) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLUListElement>(null)
  const selected = clients.find((c) => c.name === client)

  // "No client" first, then matches — exported ones (newest) before never-exported.
  const options = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = clients
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.lastExport && b.lastExport) return b.lastExport.at.localeCompare(a.lastExport.at)
        if (a.lastExport) return -1
        if (b.lastExport) return 1
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      })
    return q ? matches : [null, ...matches]
  }, [clients, query])

  React.useEffect(() => {
    setActive(0)
  }, [query, open])
  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active])

  const pick = (c: AzureClientOption | null) => {
    onChange(c?.name)
    setOpen(false)
    setQuery("")
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (options[active] !== undefined) pick(options[active])
    } else if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className={cn("rounded-xl ring-1 transition-colors", open ? "bg-white/[0.07] ring-blue-400/60" : "bg-white/[0.05] ring-white/10")}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.04]"
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            selected ? "bg-blue-500/20 text-blue-200" : "bg-white/10 text-white/50",
          )}
        >
          <Server className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-white">
            {selected ? selected.name : loading && clients.length === 0 ? "Loading clients…" : "Select a client"}
          </span>
          <span className="block truncate text-[11px] text-white/55">
            {selected
              ? selected.lastExport
                ? `Your last export ${fmtDate(selected.lastExport.at)} · ${selected.lastExport.taskCount} tasks · range starts there`
                : "First export for this client — pick a date range"
              : "Optional — remembers when you last exported for it"}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/60 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="border-t border-white/10 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search clients…"
              aria-label="Search clients"
              className="h-9 w-full rounded-lg bg-black/30 pl-8 pr-3 text-[13px] text-white placeholder:text-white/40 ring-1 ring-white/10 focus:outline-none focus:ring-blue-400/60"
            />
          </div>
          <ul ref={listRef} role="listbox" className="mt-2 max-h-56 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
            {loading && clients.length === 0 ? (
              <li className="flex items-center justify-center gap-2 py-4 text-[12px] text-white/55">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading clients…
              </li>
            ) : options.length === 0 ? (
              <li className="py-4 text-center text-[12px] text-white/55">No clients match “{query}”.</li>
            ) : (
              options.map((c, i) => {
                const isSel = (c?.name ?? undefined) === client
                return (
                  <li key={c?.name ?? "__none"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      data-idx={i}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(c)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px]",
                        i === active ? "bg-white/10" : "hover:bg-white/[0.06]",
                      )}
                    >
                      {c ? (
                        <span
                          className={cn("h-2 w-2 shrink-0 rounded-full", c.online ? "bg-emerald-400" : "bg-white/25")}
                          title={c.pool ? (c.online ? "Agent online" : "Agent offline") : "Agent removed"}
                        />
                      ) : (
                        <X className="h-3 w-3 shrink-0 text-white/40" />
                      )}
                      <span className={cn("min-w-0 flex-1 truncate", c ? "text-white" : "text-white/60")}>
                        {c ? c.name : "No client (don't track)"}
                        {c && !c.pool ? <span className="text-white/40"> · removed</span> : null}
                      </span>
                      {c ? (
                        <span className={cn("shrink-0 text-[11px]", c.lastExport ? "text-white/55" : "text-white/35")}>
                          {c.lastExport ? fmtDate(c.lastExport.at) : "never"}
                        </span>
                      ) : null}
                      {isSel ? <Check className="h-3.5 w-3.5 shrink-0 text-blue-300" /> : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

const PHASES: Array<{ id: PackProgress["phase"]; label: string }> = [
  { id: "details", label: "Tasks" },
  { id: "attachments", label: "Files" },
  { id: "ai", label: "Keys & SQL" },
  { id: "zip", label: "Zip" },
]

/** Four-step indicator for a running export. */
function PhaseSteps({ phase }: { phase: PackProgress["phase"] }) {
  const current = phase === "done" ? PHASES.length : PHASES.findIndex((p) => p.id === phase)
  return (
    <ol className="flex items-center gap-1.5">
      {PHASES.map((p, i) => {
        const done = i < current
        const now = i === current
        return (
          <li key={p.id} className="flex flex-1 items-center gap-1.5">
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                done ? "bg-emerald-400 text-emerald-950" : now ? "bg-blue-400 text-blue-950" : "bg-white/10 text-white/40",
              )}
            >
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className={cn("truncate text-[11px]", now ? "font-semibold text-white" : done ? "text-white/70" : "text-white/40")}>
              {p.label}
            </span>
            {i < PHASES.length - 1 ? <span className={cn("h-px flex-1", done ? "bg-emerald-400/60" : "bg-white/15")} /> : null}
          </li>
        )
      })}
    </ol>
  )
}
