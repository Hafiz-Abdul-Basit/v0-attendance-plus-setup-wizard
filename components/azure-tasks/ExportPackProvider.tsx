"use client"

/**
 * ExportPackProvider — keeps the export run (and its floating island)
 * ALIVE across page changes.
 *
 * Mount it ONCE in a layout that wraps every page (e.g. app/layout.tsx):
 *
 *   <ExportPackProvider>{children}</ExportPackProvider>
 *
 * A client-side navigation (Azure Tasks → wizard → back) then never
 * unmounts it, so the export keeps running, the island stays on screen on
 * every page, and the Export button shows the real state when you come
 * back. If it is NOT mounted in a layout, AzureTasksPanel wraps itself in
 * one automatically (works, but only while that page stays open).
 */

import * as React from "react"

import { AzureTaskExportIsland, requestNotifyPermission } from "./AzureTaskExportIsland"
import { useExportPack, type ExportJob, type ExportPackController } from "./use-export-pack"

export interface ExportPromptMeta {
  hasDateRange: boolean
  /** How many tasks the current filters match (for the prompt text). */
  totalCount: number
}

interface Pending {
  job: ExportJob
  meta: ExportPromptMeta
}

interface ExportPackContextValue {
  pack: ExportPackController
  /** Keep the prompt in sync with the filters currently on screen. */
  syncPending: (p: Pending) => void
  /** Open the "use Gemini?" prompt (idle) or show / hide the island (running / finished). */
  openOrToggle: () => void
  /** Hide an un-started prompt (e.g. when the Azure page is left). */
  closePromptIfIdle: () => void
}

const Ctx = React.createContext<ExportPackContextValue | null>(null)

export function useExportPackContext(): ExportPackContextValue {
  const v = React.useContext(Ctx)
  if (!v) throw new Error("useExportPackContext must be used inside <ExportPackProvider>")
  return v
}

/** True when an ExportPackProvider is already mounted above. */
export function useHasExportPackProvider(): boolean {
  return React.useContext(Ctx) != null
}

export function ExportPackProvider({ children }: { children: React.ReactNode }) {
  const pack = useExportPack()
  const [visible, setVisible] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const pendingRef = React.useRef<Pending | null>(null)
  const [pendingMeta, setPendingMeta] = React.useState<ExportPromptMeta>({ hasDateRange: false, totalCount: 0 })
  const [rangeLabel, setRangeLabel] = React.useState("all-dates")

  const syncPending = React.useCallback((p: Pending) => {
    pendingRef.current = p
    setPendingMeta((prev) =>
      prev.hasDateRange === p.meta.hasDateRange && prev.totalCount === p.meta.totalCount ? prev : p.meta,
    )
    setRangeLabel(p.job.rangeLabel)
  }, [])

  const openOrToggle = React.useCallback(() => {
    if (pack.status === "idle") {
      setVisible(true)
      setExpanded(true) // the "use Gemini?" prompt
      return
    }
    setVisible(true)
    setExpanded((v) => (visible ? !v : true))
  }, [pack.status, visible])

  const closePromptIfIdle = React.useCallback(() => {
    if (pack.status === "idle") {
      setVisible(false)
      setExpanded(false)
    }
  }, [pack.status])

  const dismiss = React.useCallback(() => {
    if (pack.status !== "running") pack.reset()
    setVisible(false)
    setExpanded(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack.status, pack.reset])

  const startWith = React.useCallback(
    (useGemini: boolean) => {
      const p = pendingRef.current
      if (!p) return
      requestNotifyPermission()
      setExpanded(false)
      void pack.start({ ...p.job, useGemini })
    },
    [pack],
  )

  const value = React.useMemo<ExportPackContextValue>(
    () => ({ pack, syncPending, openOrToggle, closePromptIfIdle }),
    [pack, syncPending, openOrToggle, closePromptIfIdle],
  )

  return (
    <Ctx.Provider value={value}>
      {children}
      <AzureTaskExportIsland
        pack={pack}
        visible={visible}
        expanded={expanded}
        onExpandedChange={setExpanded}
        onDismiss={dismiss}
        onStart={startWith}
        hasDateRange={pendingMeta.hasDateRange}
        totalCount={pendingMeta.totalCount}
        rangeLabel={rangeLabel}
      />
    </Ctx.Provider>
  )
}
