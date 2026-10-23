"use client"

/**
 * useQaSheet — the active QA sheet (QA-passed task IDs from the "Att Plus"
 * sheet) that Export Packs are filtered against, plus `upload(file)` to
 * replace it. Backed by /api/azure-tasks/qa-sheet.
 */
import * as React from "react"
import useSWR from "swr"

export interface QaSheet {
  fileName: string
  uploadedAt: string
  byEmail: string | null
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

  /** Upload a new workbook. Resolves with an error message, or null on success. */
  const upload = React.useCallback(
    async (file: File): Promise<string | null> => {
      setUploading(true)
      try {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch(KEY, { method: "POST", body: form, credentials: "include" })
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

  return {
    sheet: swr.data?.sheet ?? null,
    setupRequired: swr.data?.setupRequired ?? false,
    error: swr.error instanceof Error ? swr.error.message : null,
    isLoading: swr.isLoading,
    uploading,
    upload,
  }
}
