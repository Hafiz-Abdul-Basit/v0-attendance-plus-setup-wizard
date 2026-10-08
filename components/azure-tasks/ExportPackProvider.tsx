"use client"

/**
 * Export pack host.
 *
 * The floating island is rendered from its OWN React root attached to
 * <body>, and the run lives in export-store.ts (module state). Neither is
 * part of any page's React tree, so changing pages cannot remove them.
 *
 * <ExportPackProvider> is now optional: wrapping your root layout with it
 * just loads this module on every page, which makes an "Export interrupted"
 * notice (after a hard reload) appear on any page, not only Azure Tasks.
 */

import * as React from "react"
import { createRoot, type Root } from "react-dom/client"

import { AzureTaskExportIsland } from "./AzureTaskExportIsland"
import * as store from "./export-store"
import { useExportPack, useExportStoreState } from "./use-export-pack"

function IslandHost() {
  const pack = useExportPack()
  const s = useExportStoreState()
  return (
    <AzureTaskExportIsland
      pack={pack}
      visible={s.visible}
      expanded={s.expanded}
      onExpandedChange={store.setExpanded}
      onDismiss={store.dismiss}
      onStart={store.startPending}
      hasDateRange={s.pending?.meta.hasDateRange ?? false}
      totalCount={s.pending?.meta.totalCount ?? 0}
      rangeLabel={s.pending?.job.rangeLabel ?? "all-dates"}
    />
  )
}

const ROOT_ID = "az-export-island-root"

/** Create (once) the independent React root that holds the island. Safe to call repeatedly. */
export function ensureIslandMounted(): void {
  if (typeof document === "undefined") return
  const w = window as unknown as { __azIslandRoot?: Root }
  let el = document.getElementById(ROOT_ID)
  if (!el) {
    el = document.createElement("div")
    el.id = ROOT_ID
    document.body.appendChild(el)
  }
  if (!w.__azIslandRoot) w.__azIslandRoot = createRoot(el)
  w.__azIslandRoot.render(<IslandHost />)
}

// A run restored as "interrupted" after a hard reload must be visible straight away.
if (typeof window !== "undefined" && store.getSnapshot().visible) {
  setTimeout(ensureIslandMounted, 0)
}

const openOrToggle = () => {
  ensureIslandMounted()
  store.openOrToggle()
}

export interface ExportPackContextValue {
  pack: ReturnType<typeof useExportPack>
  syncPending: typeof store.syncPending
  openOrToggle: () => void
  closePromptIfIdle: () => void
}

/** Same shape the panel always used; now backed by the store. Function identities are stable. */
export function useExportPackContext(): ExportPackContextValue {
  const pack = useExportPack()
  return React.useMemo(
    () => ({ pack, syncPending: store.syncPending, openOrToggle, closePromptIfIdle: store.closePromptIfIdle }),
    [pack],
  )
}

/** Kept for compatibility — the host no longer needs a provider. */
export function useHasExportPackProvider(): boolean {
  return true
}

/** Optional: mount in the root layout so the "interrupted" notice can show on every page. */
export function ExportPackProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (store.getSnapshot().visible) ensureIslandMounted()
  }, [])
  return <>{children}</>
}
