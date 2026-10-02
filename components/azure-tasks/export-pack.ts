/**
 * Export Pack — one click for the tasks in the current filter:
 *
 *   1. read every task's detail + comments (description, attachments list)
 *   2. download every attachment
 *   3. ask Gemini (server route /api/azure-tasks/key-changes) to pull out
 *      "add / update key" style configuration changes
 *   4. bundle all of it into ONE .zip:
 *
 *        key-changes.txt     <- MongoDB / appsettings keys: name = value only
 *        attachments/<id> - <title>/<files…>
 *        _errors.txt         <- only when something could not be fetched
 *
 * Everything runs in the browser using the SAME endpoints the table
 * already uses, so no extra Azure DevOps plumbing is needed.
 *
 * Needs:  npm i jszip
 */

import JSZip from "jszip"

import type { AzureWorkItem } from "./types"

/* ------------------------------------------------------------------ */
/*  ⚠️ Confirm these two endpoint shapes against your API routes       */
/* ------------------------------------------------------------------ */
/** Task detail (same URL AzureTaskRowExpansion already probes). */
const DETAIL_URL = (id: number) => `/api/azure-tasks/${id}`
/**
 * Comments endpoint used by `useAzureTaskComments`. If your hook calls a
 * different path, change ONLY this line.
 */
const COMMENTS_URL = (id: number) => `/api/azure-tasks/${id}/comments`
/** Single attachment download (same URL the row expansion uses). */
const ATTACHMENT_URL = (taskId: number, attId: string | number) =>
  `/api/azure-tasks/${taskId}/attachments/${attId}`
/** Gemini extraction route (new, see app/api/azure-tasks/key-changes). */
const KEY_CHANGES_URL = "/api/azure-tasks/key-changes"

const CONCURRENCY = 4
const AI_BATCH_SIZE = 10

export type KeyChangeAction = "add" | "update" | "remove" | "other"

export interface KeyChange {
  taskId: number
  taskTitle: string
  action: KeyChangeAction
  /** e.g. "MongoDB", "appsettings.json", "SQL". */
  target: string
  /** e.g. "Setup Configuration" collection / section. */
  location: string
  key: string
  value: string
  /** One-line original instruction, trimmed. */
  note: string
  source: "description" | "comment"
}

export interface PackTaskText {
  id: number
  title: string
  state: string
  assignedTo: string
  changedDate: string
  createdDate: string
  description: string
  comments: Array<{ author: string; date: string; text: string }>
}

export interface PackProgress {
  phase: "details" | "attachments" | "ai" | "zip" | "done"
  done: number
  total: number
  message: string
}

export interface PackOptions {
  includeAttachments: boolean
  includeKeyChanges: boolean
  rangeLabel: string
  signal: AbortSignal
  onProgress: (p: PackProgress) => void
}

export interface PackResult {
  blob: Blob
  fileName: string
  taskCount: number
  attachmentCount: number
  attachmentsDownloaded: number
  keyChanges: KeyChange[]
  /** Plain-text content of key-changes.txt (also shown in the dialog). */
  keyChangesTxt: string
  errors: string[]
}

/* ------------------------------ helpers ------------------------------ */

export function htmlToText(html: string | null | undefined): string {
  if (!html) return ""
  if (typeof DOMParser === "undefined") return html
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
  const doc = new DOMParser().parseFromString(withBreaks, "text/html")
  return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim()
}

function safeName(s: string, max = 80): string {
  return (
    s
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max) || "untitled"
  )
}

function dateOnly(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10)
}

async function pool<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  signal: AbortSignal,
) {
  let next = 0
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (next < items.length) {
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError")
      const i = next++
      await worker(items[i], i)
    }
  })
  await Promise.all(runners)
}

async function getJson(url: string, signal: AbortSignal): Promise<any> {
  const res = await fetch(url, { signal, credentials: "same-origin" })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

/* ------------------------------ main ------------------------------ */

export async function buildExportPack(
  tasks: AzureWorkItem[],
  opts: PackOptions,
): Promise<PackResult> {
  const { signal, onProgress } = opts
  const errors: string[] = []
  const zip = new JSZip()
  const texts: PackTaskText[] = []
  const attachmentJobs: Array<{ taskId: number; folder: string; id: string; name: string }> = []

  /* ---- 1. details + comments ---- */
  onProgress({ phase: "details", done: 0, total: tasks.length, message: "Reading task details & comments…" })
  let detailsDone = 0
  await pool(
    tasks,
    async (t) => {
      let detail: any = null
      let comments: any[] = []
      try {
        const j = await getJson(DETAIL_URL(t.id), signal)
        detail = j?.task ?? j?.item ?? j
      } catch (e) {
        if ((e as Error).name === "AbortError") throw e
        errors.push(`#${t.id} details: ${(e as Error).message}`)
      }
      try {
        const j = await getJson(COMMENTS_URL(t.id), signal)
        comments = j?.comments ?? j?.items ?? (Array.isArray(j) ? j : [])
      } catch (e) {
        if ((e as Error).name === "AbortError") throw e
        errors.push(`#${t.id} comments: ${(e as Error).message}`)
      }

      const src = { ...t, ...(detail ?? {}) } as AzureWorkItem
      texts.push({
        id: t.id,
        title: src.title ?? t.title,
        state: src.state ?? "",
        assignedTo: src.assignedTo?.displayName ?? "",
        changedDate: src.changedDate ?? "",
        createdDate: src.createdDate ?? "",
        description: htmlToText(src.description),
        comments: comments.map((c: any) => ({
          author: c?.createdBy?.displayName ?? "Unknown",
          date: c?.createdDate ?? "",
          text: htmlToText(c?.text),
        })),
      })

      const folder = `attachments/${t.id} - ${safeName(src.title ?? t.title, 60)}`
      for (const a of src.attachments ?? []) {
        attachmentJobs.push({ taskId: t.id, folder, id: String(a.id), name: a.name })
      }
      detailsDone += 1
      onProgress({ phase: "details", done: detailsDone, total: tasks.length, message: "Reading task details & comments…" })
    },
    signal,
  )
  texts.sort((a, b) => b.changedDate.localeCompare(a.changedDate))

  /* ---- 2. attachments ---- */
  let attachmentsDownloaded = 0
  if (opts.includeAttachments && attachmentJobs.length > 0) {
    const used = new Map<string, number>()
    let done = 0
    onProgress({ phase: "attachments", done: 0, total: attachmentJobs.length, message: "Downloading attachments…" })
    await pool(
      attachmentJobs,
      async (job) => {
        try {
          const res = await fetch(ATTACHMENT_URL(job.taskId, job.id), { signal, credentials: "same-origin" })
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
          const buf = await res.arrayBuffer()
          let path = `${job.folder}/${safeName(job.name, 120)}`
          const n = used.get(path) ?? 0
          used.set(path, n + 1)
          if (n > 0) path = path.replace(/(\.[^./]+)?$/, ` (${n + 1})$1`)
          zip.file(path, buf)
          attachmentsDownloaded += 1
        } catch (e) {
          if ((e as Error).name === "AbortError") throw e
          errors.push(`#${job.taskId} attachment "${job.name}": ${(e as Error).message}`)
        }
        done += 1
        onProgress({ phase: "attachments", done, total: attachmentJobs.length, message: "Downloading attachments…" })
      },
      signal,
    )
  }

  /* ---- 3. Gemini: key add / update extraction ---- */
  let keyChanges: KeyChange[] = []
  if (opts.includeKeyChanges) {
    const withText = texts.filter((t) => t.description || t.comments.some((c) => c.text))
    const batches: PackTaskText[][] = []
    for (let i = 0; i < withText.length; i += AI_BATCH_SIZE) batches.push(withText.slice(i, i + AI_BATCH_SIZE))
    onProgress({ phase: "ai", done: 0, total: batches.length, message: "Gemini is reading descriptions & comments…" })
    for (let i = 0; i < batches.length; i++) {
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError")
      try {
        // Gemini can answer 503 ("high demand") for a while. The server
        // already retries; on top of that we retry the batch here with a
        // longer pause before giving up on it.
        let lastErr = "unknown error"
        let ok = false
        for (let attempt = 0; attempt < 3 && !ok; attempt++) {
          if (attempt > 0) {
            onProgress({ phase: "ai", done: i, total: batches.length, message: `Gemini is busy, retrying (${attempt}/2)…` })
            await new Promise((r) => setTimeout(r, attempt * 6000))
          }
          if (signal.aborted) throw new DOMException("Cancelled", "AbortError")
          const res = await fetch(KEY_CHANGES_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tasks: batches[i] }),
            signal,
          })
          const j = await res.json().catch(() => ({}))
          if (res.ok) {
            keyChanges.push(...((j.changes ?? []) as KeyChange[]))
            ok = true
          } else {
            lastErr = j?.error ?? `${res.status}`
            if (!j?.retryable) break
          }
        }
        if (!ok) throw new Error(lastErr)
      } catch (e) {
        if ((e as Error).name === "AbortError") throw e
        errors.push(`Gemini batch ${i + 1}/${batches.length}: ${(e as Error).message}`)
      }
      onProgress({ phase: "ai", done: i + 1, total: batches.length, message: "Gemini is reading descriptions & comments…" })
    }
    keyChanges = dedupeChanges(keyChanges)
  }

  /* ---- 4. key-changes.txt + zip ---- */
  onProgress({ phase: "zip", done: 0, total: 1, message: "Building zip…" })
  const keyChangesTxt = renderKeyChangesTxt(keyChanges, texts)
  if (opts.includeKeyChanges) zip.file("key-changes.txt", keyChangesTxt)
  if (errors.length) zip.file("_errors.txt", errors.join("\n"))

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" })
  const fileName = `azure-tasks-pack_${opts.rangeLabel.replace(/[^\w.-]+/g, "_")}.zip`
  onProgress({ phase: "done", done: 1, total: 1, message: "Done" })

  return {
    blob,
    fileName,
    taskCount: tasks.length,
    attachmentCount: attachmentJobs.length,
    attachmentsDownloaded,
    keyChanges,
    keyChangesTxt,
    errors,
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/* ------------------------------ renderers ------------------------------ */

function dedupeChanges(list: KeyChange[]): KeyChange[] {
  const seen = new Set<string>()
  const out: KeyChange[] = []
  for (const c of list) {
    if (!c?.key) continue
    const k = `${c.taskId}|${c.target}|${c.location}|${c.key}|${c.value}|${c.action}`.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(c)
  }
  return out
}

/**
 * Notepad-friendly output: only target, key and value.
 * One line per key; if the same key appears in several tasks the value
 * from the most recently changed task wins.
 *
 *   MongoDB › Setup Parameters and Global Parametrs
 *   InterventionsToBeCompletedBeforeRTO = "WL1,WL2:'…'"
 *   ShowTardyInAbsenceCalendar = false
 *
 *   appsettings.json
 *   SomeKey = value
 */
export function renderKeyChangesTxt(changes: KeyChange[], texts: PackTaskText[]): string {
  if (!changes.length) return "No key changes found.\n"
  const changed = new Map(texts.map((t) => [t.id, t.changedDate]))
  const latest = new Map<string, KeyChange>()
  for (const c of changes) {
    const k = `${c.target}|${c.location}|${c.key}`.toLowerCase()
    const prev = latest.get(k)
    if (!prev || (changed.get(c.taskId) ?? "") > (changed.get(prev.taskId) ?? "")) latest.set(k, c)
  }
  const groups = new Map<string, KeyChange[]>()
  for (const c of latest.values()) {
    const head = [c.target || "Config", c.location].filter(Boolean).join(" › ")
    groups.set(head, [...(groups.get(head) ?? []), c])
  }
  const out: string[] = []
  for (const [head, items] of Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    out.push(head)
    for (const c of items.sort((a, b) => a.key.localeCompare(b.key))) {
      out.push(`${c.key} = ${c.action === "remove" ? "<remove>" : c.value || "<no value>"}`)
    }
    out.push("")
  }
  return out.join("\n")
}
