"use client"

/**
 * useExportPack — React view of the export store (export-store.ts).
 * The run itself is NOT owned by React, so components can mount / unmount
 * freely (page changes) without touching it.
 */

import * as React from "react"

import * as store from "./export-store"
import type { PackProgress, PackResult } from "./export-pack"

export type { ExportJob, PackStatus } from "./export-store"

export interface ExportPackController {
  status: store.PackStatus
  progress: PackProgress | null
  result: PackResult | null
  error: string | null
  startedAt: number | null
  finishedAt: number | null
  includeAttachments: boolean
  setIncludeAttachments: (v: boolean) => void
  usedGemini: boolean
  start: (job: store.ExportJob) => Promise<void>
  cancel: () => void
  skipAi: () => void
  reset: () => void
  retry: () => void
}

export function useExportStoreState(): store.StoreState {
  return React.useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
}

export function useExportPack(): ExportPackController {
  const s = useExportStoreState()
  return React.useMemo<ExportPackController>(
    () => ({
      status: s.status,
      progress: s.progress,
      result: s.result,
      error: s.error,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
      includeAttachments: s.includeAttachments,
      setIncludeAttachments: store.setIncludeAttachments,
      usedGemini: s.usedGemini,
      start: store.start,
      cancel: store.cancel,
      skipAi: store.skipAi,
      reset: store.reset,
      retry: store.retry,
    }),
    [s],
  )
}
