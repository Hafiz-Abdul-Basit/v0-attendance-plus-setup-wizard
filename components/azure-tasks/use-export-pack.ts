"use client"

/**
 * useExportPack — owns the whole export run (state, progress, abort).
 *
 * It lives in the panel, NOT in a modal, so the export keeps running while
 * the user filters, searches and opens tasks. The UI for it is the
 * floating "island" (AzureTaskExportIsland).
 *
 * Tasks are fetched straight from /api/azure-tasks with a SNAPSHOT of the
 * filters taken at click time, so changing filters mid-export (or the
 * table's lazy loading) can never change what ends up in the zip.
 */

import * as React from "react"

import { buildCacheKey } from "@/hooks/use-azure-tasks"
import type { AzureWorkItemQuery } from "@/lib/azure-devops/client-safe"
import { buildExportPack, downloadBlob, type PackProgress, type PackResult } from "./export-pack"
import { setLastExport } from "./pack-state"
import type { AzureWorkItem } from "./types"

export type PackStatus = "idle" | "running" | "done" | "error"

const OPTIONS_KEY = "azure-pack-options"

export interface ExportJob {
  query: AzureWorkItemQuery
  /** Client-side attachments filter at click time. */
  attachments?: "with" | "without"
  rangeLabel: string
  /** true = ask Gemini; false = read keys/SQL with local pattern matching only (still reuses earlier Gemini results). */
  useGemini?: boolean
}

/** Every page of the filtered list, independent of the table's lazy loading. */
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

export function useExportPack() {
  const [status, setStatus] = React.useState<PackStatus>("idle")
  const [progress, setProgress] = React.useState<PackProgress | null>(null)
  const [result, setResult] = React.useState<PackResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [startedAt, setStartedAt] = React.useState<number | null>(null)
  const [finishedAt, setFinishedAt] = React.useState<number | null>(null)
  const [includeAttachments, setIncludeAttachments] = React.useState(true)
  const [usedGemini, setUsedGemini] = React.useState(true)
  const lastJobRef = React.useRef<ExportJob | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)
  const skipAiRef = React.useRef(false)
  const optionsLoaded = React.useRef(false)

  // Remember the two checkboxes between sessions.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(OPTIONS_KEY)
      if (raw) {
        const o = JSON.parse(raw) as { a?: boolean }
        if (typeof o.a === "boolean") setIncludeAttachments(o.a)
      }
    } catch {
      /* ignore */
    }
    optionsLoaded.current = true
  }, [])
  React.useEffect(() => {
    if (!optionsLoaded.current) return
    try {
      window.localStorage.setItem(OPTIONS_KEY, JSON.stringify({ a: includeAttachments }))
    } catch {
      /* ignore */
    }
  }, [includeAttachments])

  // Leaving the page would kill the run: warn, and clean up on unmount.
  React.useEffect(() => {
    if (status !== "running") return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [status])
  React.useEffect(() => () => abortRef.current?.abort(), [])

  const start = React.useCallback(
    async (job: ExportJob) => {
      if (status === "running") return
      lastJobRef.current = job
      const ctrl = new AbortController()
      abortRef.current = ctrl
      skipAiRef.current = job.useGemini === false
      setUsedGemini(job.useGemini !== false)
      setStatus("running")
      setError(null)
      setResult(null)
      setFinishedAt(null)
      setStartedAt(Date.now())
      setProgress({ phase: "details", done: 0, total: 0, message: "Loading the task list…" })
      try {
        const tasks = await fetchAllTasks(job, ctrl.signal, (n, total) =>
          setProgress({ phase: "details", done: n, total, message: "Loading the task list…" }),
        )
        if (tasks.length === 0) throw new Error("No tasks match the current filters.")
        const r = await buildExportPack(tasks, {
          includeAttachments,
          includeKeyChanges: true,
          rangeLabel: job.rangeLabel,
          signal: ctrl.signal,
          skipAi: skipAiRef,
          onProgress: setProgress,
        })
        downloadBlob(r.blob, r.fileName)
        setLastExport(new Date().toISOString())
        setResult(r)
        setFinishedAt(Date.now())
        setStatus("done")
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          setStatus("idle")
          setProgress(null)
        } else {
          setError((e as Error).message || "Export failed")
          setFinishedAt(Date.now())
          setStatus("error")
        }
      }
    },
    [status, includeAttachments],
  )

  const cancel = React.useCallback(() => abortRef.current?.abort(), [])
  const skipAi = React.useCallback(() => {
    skipAiRef.current = true
  }, [])
  const reset = React.useCallback(() => {
    setStatus("idle")
    setProgress(null)
    setResult(null)
    setError(null)
  }, [])
  /** Run the last job again — with Gemini (used for "Retry Gemini" / "Run Gemini"). */
  const retry = React.useCallback(() => {
    if (lastJobRef.current) void start({ ...lastJobRef.current, useGemini: true })
  }, [start])

  return {
    status,
    progress,
    result,
    error,
    startedAt,
    finishedAt,
    includeAttachments,
    setIncludeAttachments,
    usedGemini,
    start,
    cancel,
    skipAi,
    reset,
    retry,
  }
}

export type ExportPackController = ReturnType<typeof useExportPack>
