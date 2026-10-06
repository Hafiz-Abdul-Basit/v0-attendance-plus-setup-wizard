/**
 * Per-task cache of Gemini results (browser localStorage).
 *
 * Why: re-running "Export pack" for the same date range used to send every
 * task to Gemini again — slow, and it burns the (small) request quota that
 * caused the 429s. A task's result only changes when the task changes, so
 * we key the entry by task id + `rev` (Azure bumps `rev` on every edit /
 * new comment). Unchanged tasks are reused; only new or edited tasks go
 * to Gemini.
 *
 * Bump AI_PROMPT_VERSION whenever the extraction prompt changes so old
 * results are not reused.
 */

import type { KeyChange, SqlScript } from "./export-pack"

const STORAGE_KEY = "azure-pack-ai-cache"
export const AI_PROMPT_VERSION = 2
const MAX_ENTRIES = 500
const MAX_CHARS = 3_500_000 // stay well under the ~5 MB localStorage quota

export interface AiCacheEntry {
  rev: number
  savedAt: number
  changes: KeyChange[]
  sql: SqlScript[]
}

type AiCache = { v: number; entries: Record<string, AiCacheEntry> }

export function loadAiCache(): AiCache {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AiCache
      if (parsed?.v === AI_PROMPT_VERSION && parsed.entries) return parsed
    }
  } catch {
    /* ignore corrupt / unavailable storage */
  }
  return { v: AI_PROMPT_VERSION, entries: {} }
}

export function saveAiCache(cache: AiCache): void {
  try {
    // Keep the newest MAX_ENTRIES, and shrink further if the payload is too big.
    let ids = Object.keys(cache.entries).sort(
      (a, b) => cache.entries[b].savedAt - cache.entries[a].savedAt,
    )
    ids = ids.slice(0, MAX_ENTRIES)
    let entries: Record<string, AiCacheEntry> = {}
    for (const id of ids) entries[id] = cache.entries[id]
    let json = JSON.stringify({ v: cache.v, entries })
    while (json.length > MAX_CHARS && ids.length > 10) {
      ids = ids.slice(0, Math.floor(ids.length * 0.8))
      entries = {}
      for (const id of ids) entries[id] = cache.entries[id]
      json = JSON.stringify({ v: cache.v, entries })
    }
    window.localStorage.setItem(STORAGE_KEY, json)
  } catch {
    /* quota exceeded / private mode — caching is best-effort */
  }
}

export function clearAiCache(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
