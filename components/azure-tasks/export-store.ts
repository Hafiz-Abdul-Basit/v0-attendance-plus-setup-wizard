"use client"

/**
 * export-store — the export run lives HERE, outside React.
 *
 * A module-level store is not tied to any page or component, so moving
 * between pages (Azure Tasks → wizard → back) cannot reset or stop it:
 * client-side navigation keeps JavaScript modules loaded. The floating
 * island is rendered from its own React root (see ExportPackProvider.tsx),
 * so it is not removed when a page unmounts either.
 *
 * Only a HARD reload / closing the tab ends a run. That case is detected on
 * the next load and shown as "Export interrupted — Try again".
 */

import { buildCacheKey } from "@/hooks/use-azure-tasks"
import type { AzureWorkItemQuery } from "@/lib/azure-devops/client-safe"
import { buildExportPack, downloadBlob, type PackProgress, type PackResult } from "./export-pack"
import { clearActiveRun, readActiveRun, requestNotifyPermission, saveActiveRun, setLastExport } from "./pack-state"
import type { AzureWorkItem } from "./types"

export type PackStatus = "idle" | "running" | "done" | "error"

export interface ExportJob {
  query: AzureWorkItemQuery
  /** Client-side attachments filter at click time. */
  attachments?: "with" | "without"
  rangeLabel: string
  /** true = ask Gemini; false = local pattern matching only (earlier Gemini results are still reused). */
  useGemini?: boolean
}

export interface PendingExport {
  job: ExportJob
  meta: { hasDateRange: boolean; totalCount: number }
}

export interface StoreState {
  status: PackStatus
  progress: PackProgress | null
  result: PackResult | null
  error: string | null
  startedAt: number | null
  finishedAt: number | null
  includeAttachments: boolean
  usedGemini: boolean
  visible: boolean
  expanded: boolean
  pending: PendingExport | null
}

const OPTIONS_KEY = "azure-pack-options"

const INITIAL: StoreState = {
  status: "idle",
  progress: null,
  result: null,
  error: null,
  startedAt: null,
  finishedAt: null,
  includeAttachments: true,
  usedGemini: true,
  visible: false,
  expanded: false,
  pending: null,
}

let state: StoreState = INITIAL
const listeners = new Set<() => void>()
let abortCtrl: AbortController | null = null
const skipAiRef = { current: false }
let lastJob: ExportJob | null = null

function set(patch: Partial<StoreState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
export const getSnapshot = () => state
export const getServerSnapshot = () => INITIAL

/* ------------------------------ setup (client) ------------------------------ */

function warnBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault()
  e.returnValue = ""
}

if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem(OPTIONS_KEY)
    if (raw) {
      const o = JSON.parse(raw) as { a?: boolean }
      if (typeof o.a === "boolean") state = { ...state, includeAttachments: o.a }
    }
  } catch {
    /* ignore */
  }
  // A run that was active when the page was reloaded / closed is lost; say so.
  const active = readActiveRun<{ job: ExportJob; startedAt: number }>()
  if (active && Date.now() - active.startedAt < 12 * 3600 * 1000) {
    lastJob = active.job
    state = {
      ...state,
      status: "error",
      error:
        "The export was interrupted because the page was reloaded or closed. Press “Try again” — Gemini results already received are reused.",
      startedAt: active.startedAt,
      finishedAt: Date.now(),
      visible: true,
    }
  } else if (active) {
    clearActiveRun()
  }
}

/* ------------------------------ fetching ------------------------------ */

async function fetchAllTasks(job: ExportJob, signal: AbortSignal, onCount: (n: number, total: number) => void): Promise<AzureWorkItem[]> {
  const out: AzureWorkItem[] = []
  for (let page = 1; page <= 50; page++) {
    const url = buildCacheKey({ ...job.query, page, pageSize: 200 })
    const res = await fetch(url, { credentials: "include", signal })
    if (!res.ok) {
      let msg = `Could not load the task list (${res.status})`
      try {
        const b = (await res.json()) as { error?: string }
        if (b?.error) msg = b.error
      } catch {
        /* ignore */
      }
      throw new Error(msg)
    }
    const data = (await res.json()) as { tasks: AzureWorkItem[]; hasMore: boolean; total: number }
    out.push(...data.tasks)
    onCount(out.length, data.total)
    if (!data.hasMore) break
  }
  const seen = new Set<number>()
  return out.filter((t) => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    if (job.attachments === "with" && !(t.attachmentCount > 0)) return false
    if (job.attachments === "without" && t.attachmentCount > 0) return false
    return true
  })
}

/* ------------------------------ actions ------------------------------ */

export function setIncludeAttachments(v: boolean) {
  set({ includeAttachments: v })
  try {
    window.localStorage.setItem(OPTIONS_KEY, JSON.stringify({ a: v }))
  } catch {
    /* ignore */
  }
}

/** Keep the prompt in sync with the filters currently on screen. */
export function syncPending(p: PendingExport) {
  const cur = state.pending
  if (cur && JSON.stringify(cur) === JSON.stringify(p)) return
  set({ pending: p })
}

export function setExpanded(v: boolean) {
  set({ expanded: v })
}

/** Idle → open the "use Gemini?" prompt. Otherwise show / hide the island. */
export function openOrToggle() {
  if (state.status === "idle") {
    set({ visible: true, expanded: true })
    return
  }
  set({ visible: true, expanded: state.visible ? !state.expanded : true })
}

export function closePromptIfIdle() {
  if (state.status === "idle") set({ visible: false, expanded: false })
}

export function reset() {
  clearActiveRun()
  set({ status: "idle", progress: null, result: null, error: null })
}

export function dismiss() {
  if (state.status !== "running") reset()
  set({ visible: false, expanded: false })
}

export function cancel() {
  abortCtrl?.abort()
}

export function skipAi() {
  skipAiRef.current = true
}

export async function start(job: ExportJob) {
  if (state.status === "running") return
  lastJob = job
  const ctrl = new AbortController()
  abortCtrl = ctrl
  skipAiRef.current = job.useGemini === false
  saveActiveRun({ job, startedAt: Date.now() })
  window.addEventListener("beforeunload", warnBeforeUnload)
  set({
    status: "running",
    usedGemini: job.useGemini !== false,
    error: null,
    result: null,
    finishedAt: null,
    startedAt: Date.now(),
    progress: { phase: "details", done: 0, total: 0, message: "Loading the task list…" },
    visible: true,
  })
  try {
    const tasks = await fetchAllTasks(job, ctrl.signal, (n, total) =>
      set({ progress: { phase: "details", done: n, total, message: "Loading the task list…" } }),
    )
    if (tasks.length === 0) throw new Error("No tasks match the current filters.")
    const r = await buildExportPack(tasks, {
      includeAttachments: state.includeAttachments,
      includeKeyChanges: true,
      rangeLabel: job.rangeLabel,
      signal: ctrl.signal,
      skipAi: skipAiRef,
      onProgress: (p) => set({ progress: p }),
    })
    downloadBlob(r.blob, r.fileName)
    setLastExport(new Date().toISOString())
    clearActiveRun()
    set({ result: r, finishedAt: Date.now(), status: "done" })
  } catch (e) {
    clearActiveRun()
    if ((e as Error).name === "AbortError") {
      set({ status: "idle", progress: null })
    } else {
      set({ error: (e as Error).message || "Export failed", finishedAt: Date.now(), status: "error" })
    }
  } finally {
    window.removeEventListener("beforeunload", warnBeforeUnload)
  }
}

/** The user answered "use Gemini?" in the prompt. */
export function startPending(useGemini: boolean) {
  const p = state.pending
  if (!p) return
  requestNotifyPermission()
  set({ expanded: false })
  void start({ ...p.job, useGemini })
}

/** Run the last job again with Gemini ("Retry Gemini" / "Run Gemini" / "Try again"). */
export function retry() {
  if (!lastJob) return
  set({ expanded: false })
  void start({ ...lastJob, useGemini: true })
}
