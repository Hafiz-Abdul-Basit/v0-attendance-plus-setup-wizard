"use client"

/**
 * useQaSheet — the active QA sheet (QA-passed task IDs from the "Att Plus"
 * sheet) that Export Packs are filtered against, plus `upload(file)` and
 * `linkSheet(url)` (Google Sheets, re-read before every export) to replace
 * it. Backed by /api/azure-tasks/qa-sheet.
 */
import * as React from "react"
import useSWR from "swr"

export interface QaSheet {
  fileName: string
  uploadedAt: string
  /** When the IDs were last read (re-read before each export for a linked sheet). */
  fetchedAt: string
  byEmail: string | null
  /** Google Sheets link the IDs come from; null for an uploaded file. */
  sourceUrl: string | null
  taskIds: number[]
  rowCount: number
}

const KEY = "/api/azure-tasks/qa-sheet"

export function useQaSheet(enabled: boolean) {
  const swr = useSWR<{ sheet: QaSheet | null; setupRequired?: boolean }>(
    enabled ? KEY : null,
    async (url: string) => {
      const res = await fetch(url, { credentials: "include" })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Couldn't load the QA sheet (${res.status})`)
      }
      return res.json()
    },
    { revalidateOnFocus: false, dedupingInterval: 15_000 },
  )
  const [uploading, setUploading] = React.useState(false)

  /** POST a new source (file or link). Resolves with an error message, or null on success. */
  const save = React.useCallback(
    async (init: RequestInit): Promise<string | null> => {
      setUploading(true)
      try {
        const res = await fetch(KEY, { method: "POST", credentials: "include", ...init })
        const body = (await res.json().catch(() => ({}))) as { sheet?: QaSheet; error?: string }
        if (!res.ok || !body.sheet) return body.error ?? `Upload failed (${res.status})`
        await swr.mutate({ sheet: body.sheet }, { revalidate: false })
        return null
      } catch {
        return "Upload failed (network error)."
      } finally {
        setUploading(false)
      }
    },
    [swr],
  )

  const upload = React.useCallback(
    (file: File) => {
      const form = new FormData()
      form.append("file", file)
      return save({ body: form })
    },
    [save],
  )

  const linkSheet = React.useCallback(
    (url: string) =>
      save({ body: JSON.stringify({ url }), headers: { "Content-Type": "application/json" } }),
    [save],
  )

  return {
    sheet: swr.data?.sheet ?? null,
    setupRequired: swr.data?.setupRequired ?? false,
    error: swr.error instanceof Error ? swr.error.message : null,
    isLoading: swr.isLoading,
    uploading,
    upload,
    linkSheet,
  }
}
