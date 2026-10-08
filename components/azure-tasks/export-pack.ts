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
*        deployment-checklist.txt <- ONE page: per task (oldest first) the keys to add,
 *                                    SQL to run and files to apply, as tick-boxes
 *        sql-scripts.sql     <- ALL SQL in one file, oldest task first: scripts attached as .sql files
 *                               + SQL found in descriptions / comments (verbatim)
 *        attachments/<id> - <title>/<files…>
 *        _errors.txt         <- only when something could not be fetched
 *
 * Everything runs in the browser using the SAME endpoints the table
 * already uses, so no extra Azure DevOps plumbing is needed.
 *
 * Needs:  npm i jszip
 */

import JSZip from "jszip"

import { loadAiCache, saveAiCache } from "./ai-cache"
import { localExtract } from "./local-extract"
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
const COMMENTS_URL = (id: number, page: number) =>
  `/api/azure-tasks/${id}/comments?page=${page}&pageSize=200`
/** Single attachment download (same URL the row expansion uses). */
const ATTACHMENT_URL = (taskId: number, attId: string | number) =>
  `/api/azure-tasks/${taskId}/attachments/${attId}`
/** Gemini extraction route (new, see app/api/azure-tasks/key-changes). */
const KEY_CHANGES_URL = "/api/azure-tasks/key-changes"

const CONCURRENCY = 4
/** Max characters of task text sent to Gemini per request (≈5k tokens in, so SQL copied back verbatim fits the output limit). */
const AI_BATCH_CHARS = 30_000
const AI_BATCH_MAX_TASKS = 12

export type KeyChangeAction = "add" | "update" | "remove" | "other"

export interface KeyChange {
  taskId: number
  taskTitle: string
  action: KeyChangeAction
  /** e.g. "MongoDB", "appsettings.json", "SQL". */
  target: string
  /** e.g. "Setup Configuration" collection / section. */
  location: string
  /** Application / service the file belongs to (e.g. "Message Hub"). May be empty. */
  project?: string
  key: string
  value: string
  /** One-line original instruction, trimmed. */
  note: string
  source: "description" | "comment"
}

export type SqlKind =
  | "table" | "stored_procedure" | "function" | "view" | "trigger" | "index" | "script" | "query"

export interface SqlScript {
  taskId: number
  taskTitle: string
  kind: SqlKind
  name: string
  /** Copied verbatim by Gemini. */
  sql: string
  source: "description" | "comment" | "attachment"
  /** Task ids whose older version of this same object was dropped in favour of this one. */
  replaces?: number[]
}

export interface PackTaskText {
  id: number
  /** Azure revision — changes whenever the task is edited or commented on. */
  rev: number
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
  /** Raw reason shown under the progress bar (e.g. the exact Gemini error). */
  detail?: string
}

export interface PackOptions {
  includeAttachments: boolean
  includeKeyChanges: boolean
  rangeLabel: string
  signal: AbortSignal
  /** Set `.current = true` (the "Skip Gemini" button) to stop calling Gemini and read the rest locally. */
  skipAi?: { current: boolean }
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
  /** All SQL (attached .sql files + descriptions / comments), written to sql-scripts.sql. */
  sqlScripts: SqlScript[]
  /** Tasks whose Gemini result was reused from the previous run (no request sent). */
  reusedFromCache: number
  /** Keys that different tasks set to different values (newest wins). */
  conflictCount: number
  /** Older versions of procedures / functions / views dropped (newest kept). */
  supersededSql: number
  /** Tasks that Gemini could not read (busy / quota) and that were read locally instead. */
  localTaskCount: number
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
  // Azure DevOps sometimes answers 502/503/429 for a second; retry before
  // giving up, otherwise that task silently loses its attachments.
  let last = ""
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 1200))
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError")
    const res = await fetch(url, { signal, credentials: "same-origin" })
    if (res.ok) return res.json()
    last = `${res.status} ${res.statusText}`
    if (![429, 500, 502, 503, 504].includes(res.status)) break
  }
  throw new Error(last)
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
  let commentsUnavailableNoted = false
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
        // All comment pages (200 per page), not just the first one.
        for (let page = 1; page <= 25; page++) {
          const j = await getJson(COMMENTS_URL(t.id, page), signal)
          if (j?.commentsUnavailable && !commentsUnavailableNoted) {
            commentsUnavailableNoted = true
            errors.push("Comments are unavailable on this Azure DevOps server (the comments endpoint returned 404).")
          }
          comments.push(...(j?.items ?? j?.comments ?? (Array.isArray(j) ? j : [])))
          if (!j?.hasMore) break
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") throw e
        errors.push(`#${t.id} comments: ${(e as Error).message}`)
      }

      const src = { ...t, ...(detail ?? {}) } as AzureWorkItem
      texts.push({
        id: t.id,
        rev: Number(src.rev ?? t.rev ?? 0),
        title: src.title ?? t.title,
        state: src.state ?? "",
        assignedTo: src.assignedTo?.displayName ?? "",
        changedDate: src.changedDate ?? "",
        createdDate: src.createdDate ?? "",
        description: src.description ?? "",
        comments: comments.map((c: any) => ({
          author: c?.createdBy?.displayName ?? "Unknown",
          date: c?.createdDate ?? "",
          text: c?.text ?? "",
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
  /** Contents of attached *.sql files — merged into sql-scripts.sql so ALL SQL is in one place. */
  const attachmentSql: SqlScript[] = []
  const titleById = new Map(texts.map((t) => [t.id, t.title]))
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
          if (/\.sql$/i.test(job.name)) {
            if (buf.byteLength > 3_000_000) {
              errors.push(`#${job.taskId} "${job.name}" is larger than 3 MB — kept in attachments/ but not merged into sql-scripts.sql.`)
            } else {
              const text = decodeText(buf).trim()
              if (text) {
                attachmentSql.push({
                  taskId: job.taskId,
                  taskTitle: titleById.get(job.taskId) ?? "",
                  kind: "script",
                  name: job.name,
                  sql: text,
                  source: "attachment",
                })
              }
            }
          }
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
  let sqlScripts: SqlScript[] = []
  let quotaDead = false
  let reusedFromCache = 0
  let supersededSql = 0
  const localTaskIds = new Set<number>()
  if (opts.includeKeyChanges) {
    // Reuse results for tasks that have not changed since the last run.
    const cache = loadAiCache()
    const fresh: PackTaskText[] = []
    for (const t of texts) {
      const hit = cache.entries[String(t.id)]
      if (hit && t.rev > 0 && hit.rev === t.rev) {
        keyChanges.push(...hit.changes)
        sqlScripts.push(...hit.sql)
        reusedFromCache += 1
      } else {
        fresh.push(t)
      }
    }
    const batches = buildAiBatches(fresh)
    // A task can be split over several requests; only cache it once ALL parts succeeded.
    const unitsLeft = new Map<number, number>()
    for (const b of batches) for (const u of b) unitsLeft.set(u.id, (unitsLeft.get(u.id) ?? 0) + 1)
    const failedIds = new Set<number>()
    const revById = new Map(texts.map((t) => [t.id, t.rev]))
    const aiMsg = reusedFromCache
      ? `Gemini is reading new/changed tasks (${reusedFromCache} reused from the last run)…`
      : "Gemini is reading descriptions & comments…"
    let usedModel = ""
    let gapSec = 4
    const useLocal = (batch: AiTask[]) => {
      const r = localExtract(batch.map((u) => ({ id: u.id, title: u.title, description: u.description, comments: u.comments })))
      keyChanges.push(...r.changes)
      sqlScripts.push(...r.sql)
      for (const u of batch) localTaskIds.add(u.id)
    }
    onProgress({ phase: "ai", done: 0, total: batches.length, message: aiMsg })
    for (let i = 0; i < batches.length; i++) {
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError")
      if (opts.skipAi?.current) {
        errors.push("Gemini was skipped by you — the remaining tasks were read with local pattern matching.")
        for (let k = i; k < batches.length; k++) {
          for (const u of batches[k]) failedIds.add(u.id)
          useLocal(batches[k])
          onProgress({ phase: "ai", done: k + 1, total: batches.length, message: "Reading tasks locally (Gemini skipped)…" })
        }
        break
      }
      try {
        // Gemini can answer 503 ("high demand") for a while. The server
        // already retries; on top of that we retry the batch here with a
        // longer pause before giving up on it.
        let lastErr = "unknown error"
        let ok = false
        let waitSec = 0
        // The server already walks through every usable Gemini model, so only
        // a short, bounded number of extra tries makes sense here.
        for (let attempt = 0; attempt < 5 && !ok && !quotaDead && !opts.skipAi?.current; attempt++) {
          for (let left = Math.ceil(waitSec); left > 0; left--) {
            onProgress({ phase: "ai", done: i, total: batches.length, message: `Gemini is limiting requests — retrying in ${left}s…`, detail: lastErr })
            if (signal.aborted) throw new DOMException("Cancelled", "AbortError")
            if (opts.skipAi?.current) break
            await new Promise((r) => setTimeout(r, 1000))
          }
          if (signal.aborted) throw new DOMException("Cancelled", "AbortError")
          if (opts.skipAi?.current) break
          const res = await fetch(KEY_CHANGES_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tasks: batches[i] }),
            signal,
          })
          const j = await res.json().catch(() => ({}))
          if (res.ok) {
            keyChanges.push(...((j.changes ?? []) as KeyChange[]))
            sqlScripts.push(...((j.sql ?? []) as SqlScript[]))
            if (j.model) usedModel = String(j.model)
            if (Number(j.gapSec) > 0) gapSec = Number(j.gapSec)
            if (j.truncated) {
              errors.push(`Gemini batch ${i + 1}/${batches.length}: output hit the length limit — some SQL may be incomplete.`)
              for (const u of batches[i]) failedIds.add(u.id)
            }
            ok = true
          } else {
            lastErr = j?.error ?? `${res.status}`
            onProgress({ phase: "ai", done: i, total: batches.length, message: "Gemini answered with an error…", detail: lastErr })
            if (j?.quota === "day" || !j?.retryable) {
              quotaDead = j?.quota === "day"
              break
            }
            const ra = Number(j?.retryAfterSec)
            if (ra > 60) break // Google wants a long wait: don't hold the export hostage
            waitSec = ra > 0 ? ra + 1 : Math.min(45, (attempt + 1) * 10)
          }
        }
        if (!ok) throw new Error(lastErr)
        // Batch succeeded: finish bookkeeping for the tasks it contained.
        for (const u of batches[i]) {
          const left = (unitsLeft.get(u.id) ?? 1) - 1
          unitsLeft.set(u.id, left)
          const rev = revById.get(u.id) ?? 0
          if (left === 0 && !failedIds.has(u.id) && rev > 0) {
            cache.entries[String(u.id)] = {
              rev,
              savedAt: Date.now(),
              changes: keyChanges.filter((c) => c.taskId === u.id),
              sql: sqlScripts.filter((q) => q.taskId === u.id),
            }
          }
        }
        saveAiCache(cache) // keep progress even if the page is reloaded mid-run
      } catch (e) {
        if ((e as Error).name === "AbortError") throw e
        for (const u of batches[i]) failedIds.add(u.id)
        errors.push(`Gemini batch ${i + 1}/${batches.length}: ${(e as Error).message}`)
        useLocal(batches[i])
      }
      onProgress({ phase: "ai", done: i + 1, total: batches.length, message: aiMsg })
      if (quotaDead) {
        errors.push("Gemini quota is used up for every model on this key — the remaining tasks were read with local pattern matching instead.")
        for (let k = i + 1; k < batches.length; k++) {
          for (const u of batches[k]) failedIds.add(u.id)
          useLocal(batches[k])
          onProgress({ phase: "ai", done: k + 1, total: batches.length, message: "Reading remaining tasks locally (no Gemini)…" })
        }
        break
      }
      // Small pause between requests: free-tier keys allow only a few requests per minute.
      // Stay under the free-tier requests-per-minute limit (Flash 5/min, Flash-Lite 15/min).
      if (i < batches.length - 1) {
        for (let left = Math.max(3, gapSec); left > 0; left--) {
          if (opts.skipAi?.current || signal.aborted) break
          onProgress({ phase: "ai", done: i + 1, total: batches.length, message: `Next Gemini request in ${left}s (free-tier limit)…` })
          await new Promise((r) => setTimeout(r, 1000))
        }
      }
    }
    saveAiCache(cache)
    if (localTaskIds.size > 0) {
      errors.push(
        `${localTaskIds.size} task(s) were read by local pattern matching, not Gemini (#${Array.from(localTaskIds).slice(0, 20).join(", #")}${localTaskIds.size > 20 ? ", …" : ""}). Please double-check key-changes.txt and sql-scripts.sql for them.`,
      )
    }
    keyChanges = dedupeChanges(keyChanges)
    sqlScripts = dedupeSql(sqlScripts)
    const sqlBefore = sqlScripts.length
    sqlScripts = keepLatestSqlObjects(sqlScripts, texts)
    supersededSql = sqlBefore - sqlScripts.length
  }

  // One SQL file for everything: attached .sql files + SQL found in text.
  if (attachmentSql.length) sqlScripts = dedupeSql([...attachmentSql, ...sqlScripts])

  /* ---- 4. key-changes.txt + zip ---- */
  onProgress({ phase: "zip", done: 0, total: 1, message: "Building zip…" })
  const keyChangesTxt = renderKeyChangesTxt(keyChanges, texts, opts.rangeLabel)
  if (opts.includeKeyChanges) zip.file("key-changes.txt", keyChangesTxt)
  if (sqlScripts.length) zip.file("sql-scripts.sql", renderSqlFile(sqlScripts, texts))
  const conflicts = findKeyConflicts(keyChanges, texts)
  zip.file(
    "deployment-checklist.txt",
    renderChecklist({
      texts,
      keyChanges,
      sqlScripts,
      attachments: attachmentJobs,
      rangeLabel: opts.rangeLabel,
      includeAttachments: opts.includeAttachments,
      includeAi: opts.includeKeyChanges,
      conflicts,
      localTaskIds: Array.from(localTaskIds),
    }),
  )
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
    sqlScripts,
    reusedFromCache,
    conflictCount: conflicts.length,
    supersededSql,
    localTaskCount: localTaskIds.size,
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

/** Same SQL text (ignoring whitespace/case) mentioned twice → keep one. */
/** Decode a text file the way SSMS / Notepad may have saved it (UTF-8, UTF-8 BOM, UTF-16, ANSI). */
function decodeText(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf)
  if (b[0] === 0xff && b[1] === 0xfe) return new TextDecoder("utf-16le").decode(b.subarray(2))
  if (b[0] === 0xfe && b[1] === 0xff) return new TextDecoder("utf-16be").decode(b.subarray(2))
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return new TextDecoder("utf-8").decode(b.subarray(3))
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(b)
  } catch {
    return new TextDecoder("windows-1252").decode(b)
  }
}

function dedupeSql(list: SqlScript[]): SqlScript[] {
  const seen = new Set<string>()
  const out: SqlScript[] = []
  for (const q of list) {
    const k = q.sql.replace(/\s+/g, " ").trim().toLowerCase()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(q)
  }
  return out
}

/**
 * Oldest task first, so the file can be run top-to-bottom the way the
 * changes were made. Each block is headed by a SQL comment naming the task.
 */
function renderSqlFile(items: SqlScript[], texts: PackTaskText[]): string {
  const changed = new Map(texts.map((t) => [t.id, t.changedDate]))
  const sorted = [...items].sort((a, b) =>
    (changed.get(a.taskId) ?? "").localeCompare(changed.get(b.taskId) ?? "") || a.taskId - b.taskId,
  )
  const out: string[] = []
  for (const q of sorted) {
    out.push(
      "-- ============================================================",
      `-- Task #${q.taskId} — ${q.taskTitle.replace(/\s+/g, " ")}`,
      q.source === "attachment"
        ? `-- attached file: ${q.name}  (task changed ${dateOnly(changed.get(q.taskId))})`
        : `-- ${q.kind}${q.name ? `: ${q.name}` : ""}  (from ${q.source}, task changed ${dateOnly(changed.get(q.taskId))})`,
      ...(q.replaces?.length ? [`-- latest version — replaces older version(s) from task ${q.replaces.map((i) => `#${i}`).join(", ")}`] : []),
      "-- ============================================================",
      q.sql.trim(),
      "GO",
      "",
    )
  }
  return out.join("\n")
}

interface AiTask {
  id: number
  title: string
  description?: string
  comments?: Array<{ author: string; date: string; text: string }>
}

/**
 * Pack task text into Gemini requests of ≤ AI_BATCH_CHARS characters.
 * Nothing is cut: a task that is too big is split into several chunks
 * (description first, then its comments) that all carry the same task id.
 */
function buildAiBatches(texts: PackTaskText[]): AiTask[][] {
  const size = (t: AiTask) =>
    (t.description?.length ?? 0) + (t.comments ?? []).reduce((n, c) => n + c.text.length + 60, 0) + t.title.length + 40
  const units: AiTask[] = []
  for (const t of texts) {
    const hasText = t.description || t.comments.some((c) => c.text)
    if (!hasText) continue
    const whole: AiTask = { id: t.id, title: t.title, description: t.description, comments: t.comments }
    if (size(whole) <= AI_BATCH_CHARS) {
      units.push(whole)
      continue
    }
    let cur: AiTask = { id: t.id, title: t.title, description: t.description, comments: [] }
    for (const c of t.comments) {
      if (size(cur) + c.text.length > AI_BATCH_CHARS && (cur.comments!.length > 0 || cur.description)) {
        units.push(cur)
        cur = { id: t.id, title: t.title, comments: [] }
      }
      cur.comments!.push(c)
    }
    units.push(cur)
  }
  const batches: AiTask[][] = []
  let batch: AiTask[] = []
  let chars = 0
  for (const u of units) {
    const n = size(u)
    if (batch.length > 0 && (chars + n > AI_BATCH_CHARS || batch.length >= AI_BATCH_MAX_TASKS)) {
      batches.push(batch)
      batch = []
      chars = 0
    }
    batch.push(u)
    chars += n
  }
  if (batch.length) batches.push(batch)
  return batches
}

/**
 * deployment-checklist.txt — the "everything in one place" page.
 *
 * Tasks are listed oldest-first (the order the changes were made, so the
 * order to apply them). Only tasks that actually carry something to apply
 * (a key, SQL, or an attachment) get a tick-box; the rest are summarised
 * as a count. Built locally — no extra Gemini request.
 */
function renderChecklist(a: {
  texts: PackTaskText[]
  keyChanges: KeyChange[]
  sqlScripts: SqlScript[]
  attachments: Array<{ taskId: number; folder: string; name: string }>
  rangeLabel: string
  includeAttachments: boolean
  includeAi: boolean
  conflicts: KeyConflict[]
  localTaskIds: number[]
}): string {
  const ordered = [...a.texts].sort(
    (x, y) => x.changedDate.localeCompare(y.changedDate) || x.id - y.id,
  )
  const out: string[] = [
    "DEPLOYMENT CHECKLIST",
    `Range    : ${a.rangeLabel.replace("_to_", " -> ")}`,
    `Generated: ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC`,
    `Totals   : ${a.texts.length} tasks · ${a.attachments.length} attachments · ${a.keyChanges.length} key changes · ${a.sqlScripts.length} SQL scripts`,
    "Order    : oldest task first — apply top to bottom.",
    "",
  ]
  if (a.localTaskIds.length) {
    out.push(
      `NOTE — ${a.localTaskIds.length} task(s) were read by local pattern matching instead of Gemini; their keys/SQL may be incomplete: ${a.localTaskIds.slice(0, 20).map((i) => `#${i}`).join(", ")}${a.localTaskIds.length > 20 ? ", …" : ""}`,
      "",
    )
  }
  if (a.conflicts.length) {
    out.push(
      "ATTENTION — same key set to DIFFERENT values in different tasks (the newest task wins; apply only that value):",
    )
    for (const c of a.conflicts) {
      out.push(`  * ${c.label}`)
      for (const v of c.versions) out.push(`      #${v.taskId} (${dateOnly(v.changedDate)}): ${v.value || "<no value>"}${v.latest ? "   <== USE THIS" : ""}`)
    }
    out.push("")
  }
  const latestTaskByKey = new Map(a.conflicts.map((c) => [c.id, c.latestTaskId]))
  let listed = 0
  for (const t of ordered) {
    const keys = a.keyChanges.filter((c) => c.taskId === t.id)
    const sql = a.sqlScripts.filter((q) => q.taskId === t.id)
    const files = a.attachments.filter((f) => f.taskId === t.id)
    if (!keys.length && !sql.length && !files.length) continue
    listed += 1
    out.push(
      "------------------------------------------------------------",
      `[ ] #${t.id}  ${t.title.replace(/\s+/g, " ")}`,
      `    ${t.state || "—"} · ${t.assignedTo || "unassigned"} · changed ${dateOnly(t.changedDate)}`,
    )
    if (keys.length) {
      out.push("    Keys:")
      for (const c of keys) {
        const where = canon(c).heading
        const newer = latestTaskByKey.get(keyId(c))
        const superseded = newer != null && newer !== t.id ? `   (superseded by #${newer} — skip)` : ""
        out.push(`      [ ] ${c.action.toUpperCase()}  ${where} > ${c.key} = ${c.action === "remove" ? "<remove>" : c.value || "<no value>"}${superseded}`)
      }
    }
    if (sql.length) {
      out.push("    SQL (full text in sql-scripts.sql):")
      for (const q of sql) {
        if (q.source === "attachment") {
          out.push(`      [ ] attached file  ${q.name}`)
          continue
        }
        const rp = q.replaces?.length ? `   (latest — replaces ${q.replaces.map((i) => `#${i}`).join(", ")})` : ""
        out.push(`      [ ] ${q.kind}${q.name ? `  ${q.name}` : ""}${rp}`)
      }
    }
    if (files.length) {
      out.push(`    Files (${a.includeAttachments ? "in " : "folder "}${files[0].folder}/):`)
      for (const f of files) out.push(`      [ ] ${f.name}${/\.sql$/i.test(f.name) ? "   (also merged into sql-scripts.sql)" : ""}`)
    }
    out.push("")
  }
  const rest = a.texts.length - listed
  out.push("------------------------------------------------------------")
  out.push(`${listed} task${listed === 1 ? "" : "s"} with something to apply.`)
  if (rest > 0) out.push(`${rest} other task${rest === 1 ? "" : "s"} had no keys, SQL or attachments.`)
  if (!a.includeAi) out.push("(Gemini extraction was off — keys and SQL are not included.)")
  out.push("")
  return out.join("\n")
}

const keyId = (c: KeyChange) => canon(c).id

interface KeyConflict {
  id: string
  label: string
  latestTaskId: number
  versions: Array<{ taskId: number; value: string; changedDate: string; latest: boolean }>
}

/** Keys that different tasks set to different values; the newest task wins. */
function findKeyConflicts(changes: KeyChange[], texts: PackTaskText[]): KeyConflict[] {
  const changed = new Map(texts.map((t) => [t.id, t.changedDate]))
  const groups = new Map<string, KeyChange[]>()
  for (const c of changes) groups.set(keyId(c), [...(groups.get(keyId(c)) ?? []), c])
  const out: KeyConflict[] = []
  for (const [id, items] of groups) {
    const values = new Set(items.map((c) => (c.action === "remove" ? "<remove>" : c.value.trim())))
    if (values.size < 2) continue
    const sorted = [...items].sort(
      (x, y) => (changed.get(x.taskId) ?? "").localeCompare(changed.get(y.taskId) ?? "") || x.taskId - y.taskId,
    )
    const newest = sorted[sorted.length - 1]
    out.push({
      id,
      label: `${canon(newest).heading} › ${newest.key}`,
      latestTaskId: newest.taskId,
      versions: sorted.map((c) => ({
        taskId: c.taskId,
        value: c.action === "remove" ? "<remove>" : c.value,
        changedDate: changed.get(c.taskId) ?? "",
        latest: c.taskId === newest.taskId,
      })),
    })
  }
  return out
}

/**
 * A later CREATE/ALTER of the same stored procedure / function / view /
 * trigger fully replaces the earlier one, so only the newest version is
 * kept (older task ids are noted on it). Tables and ad-hoc scripts are
 * cumulative and are never dropped.
 */
function keepLatestSqlObjects(list: SqlScript[], texts: PackTaskText[]): SqlScript[] {
  const REPLACEABLE = new Set<SqlKind>(["stored_procedure", "function", "view", "trigger"])
  const changed = new Map(texts.map((t) => [t.id, t.changedDate]))
  const norm = (n: string) => n.toLowerCase().replace(/[\[\]"`]/g, "").replace(/^dbo\./, "").trim()
  const newest = new Map<string, SqlScript>()
  const older = new Map<string, number[]>()
  for (const q of list) {
    if (!REPLACEABLE.has(q.kind) || !q.name.trim()) continue
    const k = `${q.kind}|${norm(q.name)}`
    const cur = newest.get(k)
    const isNewer =
      !cur ||
      (changed.get(q.taskId) ?? "") > (changed.get(cur.taskId) ?? "") ||
      ((changed.get(q.taskId) ?? "") === (changed.get(cur.taskId) ?? "") && q.taskId > cur.taskId)
    if (isNewer) {
      if (cur) older.set(k, [...(older.get(k) ?? []), cur.taskId])
      newest.set(k, q)
    } else {
      older.set(k, [...(older.get(k) ?? []), q.taskId])
    }
  }
  return list
    .filter((q) => {
      if (!REPLACEABLE.has(q.kind) || !q.name.trim()) return true
      return newest.get(`${q.kind}|${norm(q.name)}`) === q
    })
    .map((q) => {
      if (!REPLACEABLE.has(q.kind) || !q.name.trim()) return q
      const ids = Array.from(new Set(older.get(`${q.kind}|${norm(q.name)}`) ?? [])).filter((i) => i !== q.taskId)
      return ids.length ? { ...q, replaces: ids } : q
    })
}

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
/** Break a long JSON value into readable lines (one array item / property per line). */
function formatKeyValue(raw: string): { inline: string | null; block: string[] } {
  const v = raw.trim()
  if (/^[[{]/.test(v)) {
    try {
      const parsed: unknown = JSON.parse(v)
      const compact = JSON.stringify(parsed)
      if (compact.length <= 80) return { inline: compact, block: [] }
      if (Array.isArray(parsed)) {
        return {
          inline: null,
          block: ["[", ...parsed.map((it, i) => `  ${JSON.stringify(it)}${i < parsed.length - 1 ? "," : ""}`), "]"],
        }
      }
      if (parsed && typeof parsed === "object") {
        const entries = Object.entries(parsed as Record<string, unknown>)
        return {
          inline: null,
          block: ["{", ...entries.map(([k, val], i) => `  ${JSON.stringify(k)}: ${JSON.stringify(val)}${i < entries.length - 1 ? "," : ""}`), "}"],
        }
      }
    } catch {
      /* not valid JSON — show as written */
    }
  }
  if (v.includes("\n")) return { inline: null, block: v.split("\n").map((l) => l.trimEnd()) }
  return { inline: v, block: [] }
}

/**
 * key-changes.txt — made to be read top to bottom in Notepad:
 *   • a short header and a "where to apply" index
 *   • one section per place (MongoDB › Setup Configuration, appsettings.json — Message Hub …)
 *   • one entry per key:  [ADD #1367]  Name = value
 *     long JSON values are laid out one item per line
 *   • if the same key was changed in several tasks only the NEWEST value is shown,
 *     with a note naming the older tasks to ignore
 */
export function renderKeyChangesTxt(changes: KeyChange[], texts: PackTaskText[], rangeLabel?: string): string {
  if (!changes.length) return "No key changes found.\n"
  const changed = new Map(texts.map((t) => [t.id, t.changedDate]))
  const latest = new Map<string, KeyChange>()
  for (const c of changes) {
    const k = canon(c).id
    const prev = latest.get(k)
    if (!prev || (changed.get(c.taskId) ?? "") > (changed.get(prev.taskId) ?? "")) latest.set(k, c)
  }
  const olderByKey = new Map<string, number[]>()
  for (const cf of findKeyConflicts(changes, texts)) {
    olderByKey.set(cf.id, cf.versions.filter((v) => !v.latest).map((v) => v.taskId))
  }

  const groups = new Map<string, { head: string; items: Array<{ id: string; c: KeyChange }> }>()
  for (const [id, c] of latest) {
    const head = canon(c).heading
    const g = groups.get(head.toLowerCase()) ?? { head, items: [] }
    g.items.push({ id, c })
    groups.set(head.toLowerCase(), g)
  }
  const ordered = Array.from(groups.values()).sort((a, b) => a.head.localeCompare(b.head))

  const LINE = "=".repeat(72)
  const THIN = "-".repeat(72)
  const out: string[] = [
    LINE,
    ` KEY CHANGES${rangeLabel ? `   ${rangeLabel.replace("_to_", "  ->  ")}` : ""}`,
    ` ${latest.size} key${latest.size === 1 ? "" : "s"} in ${ordered.length} place${ordered.length === 1 ? "" : "s"}`,
    LINE,
    " How to read:   [ADD #1367]  Name = value",
    "                 ADD = new key   UPDATE = change an existing key   REMOVE = delete it",
    "                 #1367 = the task to open for details",
    " Same key changed in several tasks? Only the NEWEST value is listed.",
    "",
    " WHERE TO APPLY",
  ]
  ordered.forEach((g, i) => out.push(`   ${i + 1}. ${g.head}   (${g.items.length} key${g.items.length === 1 ? "" : "s"})`))
  out.push("")

  ordered.forEach((g, i) => {
    out.push(THIN, ` ${i + 1}. ${g.head}`, THIN)
    for (const { id, c } of g.items.sort((a, b) => a.c.key.localeCompare(b.c.key))) {
      const tag = `[${c.action === "add" ? "ADD" : c.action === "update" ? "UPDATE" : c.action === "remove" ? "REMOVE" : "SET"} #${c.taskId}]`
      const pad = " ".repeat(Math.max(2, 16 - tag.length))
      const indent = " ".repeat(tag.length + pad.length)
      if (c.action === "remove") {
        out.push(`${tag}${pad}${c.key}   (remove this key)`)
      } else if (!c.value.trim()) {
        out.push(`${tag}${pad}${c.key} = (value not stated in the task)`)
      } else {
        const f = formatKeyValue(c.value)
        if (f.inline !== null) {
          out.push(`${tag}${pad}${c.key} = ${f.inline}`)
        } else {
          out.push(`${tag}${pad}${c.key} =`)
          for (const l of f.block) out.push(`${indent}${l}`)
        }
      }
      const older = olderByKey.get(id)
      if (older?.length) {
        out.push(`${indent}! Older task${older.length === 1 ? "" : "s"} ${older.map((n) => `#${n}`).join(", ")} had a different value — ignore ${older.length === 1 ? "it" : "them"}, this is the newest.`)
      }
      // Breathing room after multi-line entries; short one-liners stay tightly listed.
      if (older?.length || /=$/.test(out[out.length - 1] ?? "") || out[out.length - 1]?.startsWith(indent)) out.push("")
    }
    if (out[out.length - 1] !== "") out.push("")
  })
  return out.join("\n")
}

/**
 * Canonical identity of a key. Gemini (and people) label the same place
 * many ways — "SetupConfig in Mongo", "SetupConfig MongoDB", "Config ›
 * SetupConfiguration" — so identity is built from what matters:
 *   system (MongoDB / appsettings.json / App.config …)
 *   project (only for file-based settings — which app it belongs to)
 *   section (collection / section name, e.g. RabbitMQ)
 *   key name
 * For MongoDB the same key name is the same key, whatever the label.
 */
const STRIP_WORDS =
  /appsettings\.production|appsetting\.production|appsettings\.json|appsettings|appsetting|app\.config|web\.config|mongodb|mongo|setupconfiguration|setupconfig|\bconfig\b|\bin\b/gi

interface Canon {
  system: string
  project: string
  section: string
  id: string
  heading: string
}

function canon(c: KeyChange): Canon {
  const target = (c.target ?? "").trim()
  const location = (c.location ?? "").trim()
  const txt = `${target} ${location} ${c.project ?? ""}`
  let system: string
  if (/mongo|setup\s*config|setup\s*param|global\s*param/i.test(txt)) system = "MongoDB"
  else if (/appsetting/i.test(txt)) system = "appsettings.json"
  else if (/web\.config/i.test(txt)) system = "Web.config"
  else if (/app\.config/i.test(txt)) system = "App.config"
  else system = target && !/^config$/i.test(target) ? target : "Config"

  let project = (c.project ?? "").trim()
  if (!project && system !== "MongoDB" && !/^(appsettings\.json|web\.config|app\.config|config)$/i.test(system)) {
    project = ""
  } else if (!project && system !== "MongoDB") {
    project = target.replace(STRIP_WORDS, " ").replace(/\s+/g, " ").replace(/[\\/_:.\- ]+$/g, "").trim()
  }
  if (system === "MongoDB") project = ""

  let section = location.replace(/\s+section$/i, "").trim()
  const stripped = section.replace(STRIP_WORDS, " ").replace(/\s+/g, " ").trim()
  if (!stripped || stripped.toLowerCase() === system.toLowerCase()) section = ""
  if (system === "MongoDB" && (!section || /^setup\s*config(uration)?$/i.test(section)) && /setup\s*config/i.test(txt)) {
    section = "Setup Configuration"
  }

  const id =
    system === "MongoDB"
      ? `mongodb||${c.key}`.toLowerCase()
      : `${system}|${project}|${section}|${c.key}`.toLowerCase()
  const heading = `${system}${project ? ` — ${project}` : ""}${section ? ` › ${section}` : ""}`
  return { system, project, section, id, heading }
}
