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
import {
  buildExportPack,
  downloadBlob,
  type PackProgress,
  type PackResult,
  type QaFilterSummary,
} from "./export-pack"
import {
  clearActiveRun,
  readActiveRun,
  removeLegacySharedKeys,
  requestNotifyPermission,
  saveActiveRun,
  setLastExport,
  setStorageUser,
  userKey,
} from "./pack-state"
import type { AzureWorkItem } from "./types"

export type PackStatus = "idle" | "running" | "done" | "error"

export interface ExportJob {
  query: AzureWorkItemQuery
  /** Client-side attachments filter at click time. */
  attachments?: "with" | "without"
  rangeLabel: string
  /** true = ask Gemini; false = local pattern matching only (earlier Gemini results are still reused). */
  useGemini?: boolean
  /** Client (Azure DevOps agent) selected for this pack; the export is recorded against it. */
  client?: string
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
  /** Set when the pack downloaded but saving the client's export record failed. */
  recordError: string | null
  /** Client (Azure DevOps agent) the next pack is for — shared by the page and the island. */
  client: string | undefined
  /** Bumped each time the USER picks a client, so the page can move the date range. */
  clientPickSeq: number
}

const OPTIONS_KEY = "azure-pack-options"
/** localStorage key (per user, via userKey) for the client last picked for Export Packs. */
const CLIENT_KEY = "azure-pack-client"

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
  recordError: null,
  client: undefined,
  clientPickSeq: 0,
}

let state: StoreState = INITIAL
const listeners = new Set<() => void>()
let abortCtrl: AbortController | null = null
const skipAiRef = { current: false }
let lastJob: ExportJob | null = null

/**
 * Progress events can fire hundreds of times a second (one per attachment
 * chunk / task). Coalesce them to at most one store update per animation
 * frame so the island's ring stays smooth instead of re-rendering on every
 * event.
 */
let queuedProgress: PackProgress | null = null
let progressFrame: number | null = null
function queueProgress(p: PackProgress) {
  queuedProgress = p
  if (progressFrame != null) return
  const flush = () => {
    progressFrame = null
    if (queuedProgress && state.status === "running") set({ progress: queuedProgress })
    queuedProgress = null
  }
  progressFrame =
    typeof requestAnimationFrame === "function" && !document.hidden
      ? requestAnimationFrame(flush)
      : (setTimeout(flush, 100) as unknown as number)
}

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

/**
 * Save "this user exported this client now" on the server so the next
 * export can start from here. Never fails the pack — the zip is already
 * downloaded; returns an error message for the island to show instead.
 */
async function recordClientExport(job: ExportJob, taskCount: number): Promise<string | null> {
  try {
    const res = await fetch("/api/azure-tasks/clients", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: job.client,
        from: job.query.from,
        to: job.query.to,
        taskCount,
      }),
    })
    if (res.ok) return null
    const b = (await res.json().catch(() => ({}))) as { error?: string }
    return b.error ?? `Couldn't save the export record (${res.status}).`
  } catch {
    return "Couldn't save the export record (network error)."
  }
}

/**
 * Keep only tasks QA has passed: their id must be in the latest uploaded QA
 * sheet ("Att Plus" → "Azure Task No"). No sheet, or no match, stops the
 * export — untested work must never reach a client by accident.
 */
async function applyQaFilter(
  tasks: AzureWorkItem[],
  signal: AbortSignal,
): Promise<{ kept: AzureWorkItem[]; qa: QaFilterSummary }> {
  const res = await fetch("/api/azure-tasks/qa-sheet", { credentials: "include", signal })
  const body = (await res.json().catch(() => ({}))) as {
    sheet?: { fileName: string; uploadedAt: string; byEmail: string | null; taskIds: number[] } | null
    setupRequired?: boolean
    error?: string
  }
  if (!res.ok) throw new Error(body.error ?? `Couldn't load the QA sheet (${res.status}). Export stopped.`)
  if (body.setupRequired) throw new Error("QA sheet storage isn't set up yet (database migration pending). Export stopped.")
  if (!body.sheet) throw new Error("Upload the QA sheet first — only QA-verified tasks can be exported.")

  const passed = new Set(body.sheet.taskIds)
  const kept = tasks.filter((t) => passed.has(t.id))
  const excluded = tasks.filter((t) => !passed.has(t.id))
  const qa: QaFilterSummary = {
    fileName: body.sheet.fileName,
    uploadedAt: body.sheet.uploadedAt,
    byEmail: body.sheet.byEmail,
    matched: kept.map((t) => ({ id: t.id, title: t.title })),
    excluded: excluded.map((t) => ({ id: t.id, title: t.title })),
  }
  if (kept.length === 0) {
    throw new Error(
      `None of the ${tasks.length} task${tasks.length === 1 ? "" : "s"} in this range is in the QA sheet, so there is nothing to export. Update the QA sheet or pick another range.`,
    )
  }
  return { kept, qa }
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

let currentUser: string | null = null

/**
 * Tell the store who is signed in. Per-user state (selected client, last
 * export) is namespaced by user id, so switching accounts in the same
 * browser never carries one person's client or dates over to another.
 */
export function setUser(userId: string | null) {
  if (userId === currentUser) return
  currentUser = userId
  setStorageUser(userId)
  removeLegacySharedKeys()
  let client: string | undefined
  const key = userKey(CLIENT_KEY)
  if (key) {
    try {
      client = window.localStorage.getItem(key) ?? undefined
    } catch {
      /* ignore */
    }
  }
  set({ client })
}

/** The user picked (or cleared) the client for the next pack. */
export function selectClient(name: string | undefined) {
  set({ client: name, clientPickSeq: state.clientPickSeq + 1 })
  const key = userKey(CLIENT_KEY)
  if (!key) return
  try {
    if (name) window.localStorage.setItem(key, name)
    else window.localStorage.removeItem(key)
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
    recordError: null,
    result: null,
    finishedAt: null,
    startedAt: Date.now(),
    progress: { phase: "details", done: 0, total: 0, message: "Loading the task list…" },
    visible: true,
  })
  try {
    const tasks = await fetchAllTasks(job, ctrl.signal, (n, total) =>
      queueProgress({ phase: "details", done: n, total, message: "Loading the task list…" }),
    )
    if (tasks.length === 0) throw new Error("No tasks match the current filters.")
    set({ progress: { phase: "details", done: 0, total: tasks.length, message: "Checking tasks against the QA sheet…" } })
    const { kept, qa } = await applyQaFilter(tasks, ctrl.signal)
    const r = await buildExportPack(kept, {
      includeAttachments: state.includeAttachments,
      includeKeyChanges: true,
      rangeLabel: job.rangeLabel,
      client: job.client,
      qa,
      signal: ctrl.signal,
      skipAi: skipAiRef,
      onProgress: queueProgress,
    })
    downloadBlob(r.blob, r.fileName)
    setLastExport(new Date().toISOString())
    const recordError = job.client ? await recordClientExport(job, r.taskCount) : null
    clearActiveRun()
    set({ result: r, finishedAt: Date.now(), status: "done", recordError })
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
  void start({ ...p.job, client: state.client, useGemini })
}

/** Run the last job again with Gemini ("Retry Gemini" / "Run Gemini" / "Try again"). */
export function retry() {
  if (!lastJob) return
  set({ expanded: false })
  void start({ ...lastJob, useGemini: true })
}
