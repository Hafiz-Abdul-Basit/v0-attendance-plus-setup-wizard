/**
 * Azure DevOps — high-level service used by the API route handler.
 *
 * Responsibilities:
 *   - Build a WIQL query and run it via the HTTP client
 *   - Batch-fetch the resulting work items (≤200 ids per call)
 *   - Map raw responses into our normalised shape
 *   - Apply in-memory filters that the WIQL builder can't express
 *     (free-text search across title/description/tags) — we keep the
 *     filter logic here so the WIQL builder stays declarative
 *   - Provide a tiny TTL cache (60s) so page refreshes don't hammer
 *     the upstream API
 *   - Compute summary statistics for the KPI tiles
 *
 * The service is stateless apart from the cache; the route handler
 * owns the request shape.
 */

import "server-only"

import { getDefaultCredentialProvider } from "./auth"
import { AzureConfigError, getAzureConfig } from "./config"
import { AzureDevOpsClient } from "./client"
import {
  buildWorkItemQuery,
  getRequestedFields,
  mapComment,
  mapWorkItem,
} from "./queries"
import type {
  AzureWorkItem,
  AzureWorkItemCommentsPage,
  AzureWorkItemPage,
  AzureWorkItemQuery,
  AzureWorkItemSummary,
} from "./types"
import { AzureApiError, STALE_DAYS } from "./types"

const CACHE_TTL_MS = 60_000
const MAX_BATCH_SIZE = 200

// Note: `STALE_DAYS` lives in `./types` (pure) so it can be re-exported
// from the client-safe `./client` surface without dragging `server-only`
// markers into the browser bundle.

// --- Tiny in-memory TTL cache --------------------------------------------

interface CacheEntry<T> {
  value: T
  expires: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (entry.expires < Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function cacheSet<T>(key: string, value: T, ttlMs: number = CACHE_TTL_MS): void {
  cache.set(key, { value, expires: Date.now() + ttlMs })
  // Cap the cache so a long-running process doesn't grow it without bound.
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
}

function cacheDelete(key: string): void {
  cache.delete(key)
}

// --- Service --------------------------------------------------------------

let cachedClient: AzureDevOpsClient | null = null

function getClient(): AzureDevOpsClient {
  if (cachedClient) return cachedClient
  const config = getAzureConfig()
  const provider = getDefaultCredentialProvider()
  cachedClient = new AzureDevOpsClient(config, provider)
  return cachedClient
}

/** Test-only — drops the client and cache. */
export function _resetAzureServiceForTests(): void {
  cachedClient = null
  cache.clear()
}

/** Returns true if Azure DevOps is configured. UI can use this to render a CTA. */
export function isAzureConfigured(): boolean {
  try {
    getAzureConfig()
    return true
  } catch {
    return false
  }
}

/** Stable, deterministic key for the cache, regardless of object key order. */
function queryKey(prefix: string, q: AzureWorkItemQuery): string {
  const ordered: Record<string, unknown> = {}
  const keys: Array<keyof AzureWorkItemQuery> = [
    "from",
    "to",
    "q",
    "assignee",
    "state",
    "type",
  ]
  for (const k of keys) {
    const v = q[k]
    if (v != null && v !== "") ordered[k as string] = v
  }
  return `${prefix}:${JSON.stringify(ordered)}`
}

/** Cutoff used by the `stale` filter. */
function staleCutoffMs(nowMs: number = Date.now()): number {
  return nowMs - STALE_DAYS * 86_400_000
}

// `parseSearchQuery` / `isIdOnlySearch` live in `./search` so client
// components can import them too (without dragging this file's
// `server-only` marker into the browser bundle). We import them here
// for our own use, and re-export them so server-side callers can
// import them from `./service` if they prefer.
import { parseSearchQuery } from "./search"
export { parseSearchQuery, isIdOnlySearch } from "./search"
export type { ParsedSearch } from "./search"

/**
 * Apply the post-fetch filters that can't be expressed in WIQL:
 *   - `onlyMine` (depends on the signed-in user's display name)
 *   - `stale`    (ChangedDate < now - STALE_DAYS)
 *
 * WIQL is intentionally kept declarative — only fields the upstream
 * API can express in WHERE go through `buildWorkItemQuery`.
 */
function applyPostFilters(
  items: AzureWorkItem[],
  query: AzureWorkItemQuery,
  options: { currentUserName?: string | null },
): AzureWorkItem[] {
  let out = items
  if (query.onlyMine) {
    const me = options.currentUserName?.trim()
    if (me && me.length > 0) {
      out = out.filter(
        (it) => it.assignedTo?.displayName?.trim() === me,
      )
    } else {
      // No identity available — return empty so the UI shows "0"
      // rather than silently including everyone's work.
      out = []
    }
  }
  if (query.stale) {
    const cutoff = staleCutoffMs()
    out = out.filter((it) => {
      if (!it.changedDate) return false
      return new Date(it.changedDate).getTime() < cutoff
    })
  }
  return out
}

/** Compute summary statistics from a final list of work items. */
export function getSummaryStats(items: AzureWorkItem[]): AzureWorkItemSummary {
  const byState: Record<string, number> = {}
  const byAssignee: Record<string, number> = {}
  let active = 0
  let completed = 0
  let overdue = 0
  const now = Date.now()
  const doneStates = new Set([
    "Done",
    "Closed",
    "Resolved",
    "Completed",
    "Removed",
  ])

  for (const item of items) {
    byState[item.state] = (byState[item.state] ?? 0) + 1
    const assigneeName = item.assignedTo?.displayName ?? "Unassigned"
    byAssignee[assigneeName] = (byAssignee[assigneeName] ?? 0) + 1

    if (doneStates.has(item.state)) {
      completed += 1
    } else {
      active += 1
    }

    if (
      item.targetDate &&
      !doneStates.has(item.state) &&
      new Date(item.targetDate).getTime() < now
    ) {
      overdue += 1
    }
  }

  return {
    total: items.length,
    active,
    completed,
    overdue,
    byState,
    byAssignee,
  }
}

/**
 * Pull a page of work items for the given query. WIQL is used to scope
 * the project + date + assignee + state + type; free-text search is
 * applied in-memory after the items are fetched (so the WIQL builder
 * stays declarative). `onlyMine` / `stale` are also applied in-memory
 * because they need either session context or a constant cutoff that
 * would otherwise explode the WIQL cache key space.
 */
export async function getWorkItems(
  query: AzureWorkItemQuery,
  options: { currentUserName?: string | null } = {},
): Promise<AzureWorkItemPage> {
  let config
  try {
    config = getAzureConfig()
  } catch (err) {
    if (err instanceof AzureConfigError) {
      throw new AzureApiError(err.message, 501, "config", null)
    }
    throw err
  }

  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.max(1, Math.min(MAX_BATCH_SIZE, query.pageSize ?? 50))
  const normalized: AzureWorkItemQuery = { ...query, page, pageSize }

  // Cache key is the *WIQL* (not the page) so multiple pages share the
  // same upstream call. Pagination is applied in-memory.
  const upstreamKey = queryKey("wiql", normalized)
  const upstream = cacheGet<{
    items: AzureWorkItem[]
    fetchedAt: number
  }>(upstreamKey)

  let items: AzureWorkItem[]
  if (upstream) {
    items = upstream.items
  } else {
    const client = getClient()
    const wiql = buildWorkItemQuery(config.project, normalized)
    let wiqlRes
    try {
      wiqlRes = await client.queryWorkItemsByWiql(wiql)
    } catch (err) {
      if (err instanceof AzureApiError) {
        cacheDelete(upstreamKey)
        throw err
      }
      throw err
    }

    const ids: number[] = []
    if (wiqlRes.workItems && wiqlRes.workItems.length > 0) {
      for (const w of wiqlRes.workItems) ids.push(w.id)
    } else if (wiqlRes.workItemRelations && wiqlRes.workItemRelations.length > 0) {
      for (const w of wiqlRes.workItemRelations) ids.push(w.target.id)
    }

    const fields = getRequestedFields()
    const fetched: AzureWorkItem[] = []
    for (let i = 0; i < ids.length; i += MAX_BATCH_SIZE) {
      const batch = ids.slice(i, i + MAX_BATCH_SIZE)
      let res
      try {
        res = await client.getWorkItems(batch, fields)
      } catch (err) {
        if (err instanceof AzureApiError) {
          cacheDelete(upstreamKey)
          throw err
        }
        throw err
      }
      for (const raw of res.value) {
        fetched.push(mapWorkItem(raw, config.organization, config.project))
      }
    }

    items = fetched
    cacheSet(upstreamKey, { items, fetchedAt: Date.now() })
  }

  // In-memory free-text search (title / description / tags / assignee
  // / id). `parseSearchQuery` decides whether the user typed a work-item
  // id (`#123` or bare `123`) or free text. Both can match in the same
  // pass — we keep the row if any branch hits.
  const search = parseSearchQuery(normalized.q ?? "")
  const idNeedle = search.idTerm !== undefined ? String(search.idTerm) : null
  const textNeedle = search.textTerm ?? null
  let filtered = items
  if (idNeedle !== null || textNeedle !== null) {
    filtered = items.filter((it) => {
      if (idNeedle !== null && String(it.id).includes(idNeedle)) return true
      if (textNeedle !== null) {
        if (it.title.toLowerCase().includes(textNeedle)) return true
        if (it.description && it.description.toLowerCase().includes(textNeedle)) {
          return true
        }
        if (it.tags.some((t) => t.toLowerCase().includes(textNeedle))) {
          return true
        }
        if (
          it.assignedTo?.displayName &&
          it.assignedTo.displayName.toLowerCase().includes(textNeedle)
        ) {
          return true
        }
      }
      return false
    })
  }

  // In-memory post-filters (onlyMine / stale).
  filtered = applyPostFilters(filtered, normalized, options)

  const total = filtered.length
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)
  const hasMore = start + paged.length < total

  // The summary is over the filtered set (NOT just the current page) so
  // the KPI tiles show accurate counts. For very large result sets this
  // is still O(total), but the cache means the upstream call only runs
  // once per query window.
  const summary = getSummaryStats(filtered)

  return {
    items: paged,
    total,
    page,
    pageSize,
    hasMore,
    summary,
  }
}

/** Fetch a single work item by id (with cache). Returns null if missing.
 *
 * Tries several expand variants in order before giving up on relations:
 *   1. `$expand=relations` with the full field list (canonical Service)
 *   2. `expand=relations` (legacy Azure DevOps Server, no `$` prefix)
 *   3. Minimal-field expand (just `System.Id`) to grab the relations
 *      alone — if successful, we then graft those relations onto a
 *      plain field fetch of the rest of the body
 *
 * If every expand attempt fails (typically a missing `vso.work_full`
 * PAT scope, or a server-side configuration that rejects the relations
 * endpoint), we fall back to a plain field fetch. The row-expansion UI
 * then renders an honest "Attachments unavailable" message that names
 * the exact PAT scope required to fix it.
 */
export async function getWorkItemById(id: number): Promise<AzureWorkItem | null> {
  let config
  try {
    config = getAzureConfig()
  } catch (err) {
    if (err instanceof AzureConfigError) {
      throw new AzureApiError(err.message, 501, "config", null)
    }
    throw err
  }

  // NOTE: the previous implementation memoised single-item fetches for
  // 30–60s. That cache backfired: when the upstream `$expand=relations`
  // path started failing (e.g. a PAT scope gap), the cached "plain"
  // payload (with no relations) was served for a full minute, locking
  // the UI into the misleading "Attachments unavailable — Re-open"
  // message. Single-item fetches are not hot enough to need memo —
  // collapse them, and let the upstream state be authoritative.

  const client = getClient()
  // We deliberately do NOT call `getRequestedFields()` here. Passing a
  // `fields=…` query parameter to Azure DevOps Server on this instance
  // strips the `relations[]` array from the response (server treats it
  // as a "subset select" that excludes relations). The upstream's
  // default response already contains every System.* / Microsoft.VSTS.*
  // field we need; see Attempt 1 below for the full explanation.
  // We collect every failure (status + code) so the user-facing error
  // message can name the specific PAT scope required to fix it.
  const attempts: Array<{
    label: string
    status: number
    code: string | null
    message: string
  }> = []

  /**
   * Wrap a successful upstream response. Some Azure DevOps Server
   * deployments silently ignore the `$expand=relations` parameter and
   * return a 200 with no relations in the body. When that happens we
   * can't trust the success — the user expects attachments, not a
   * misleading "unavailable" message — so we stamp the item with
   * `relationsUnavailable: true` so the UI shows the PAT-scope gap
   * hint instead of the generic "Re-open to retry" placeholder.
   */
  const mapWithRelationsGuard = (raw: unknown): AzureWorkItem => {
    const item = mapWorkItem(raw, config.organization, config.project)
    const rawObj = raw as { relations?: unknown } | null
    if (!Array.isArray(rawObj?.relations)) {
      item.relationsUnavailable = true
      console.warn(
        `[azure-tasks] getWorkItemById(${id}): upstream returned 200 OK but no 'relations' array. ` +
          `This is almost always a PAT-scope gap — the configured PAT does not have 'vso.work_full', ` +
          `so Azure DevOps silently omits the relations field instead of returning a 401/403. ` +
          `Verify at https://dev.azure.com/_usersSettings/tokens that the token in AZURE_DEVOPS_PAT ` +
          `has "Full Access" selected.`,
      )
    }
    return item
  }

  // Attempt 1: canonical `$expand=relations`.
  //
  // We intentionally pass `undefined` for the `fields` argument here
  // (and on every other attempt below) instead of the full
  // `AZURE_WORK_ITEM_FIELDS` list. Empirically, on this Azure DevOps
  // Server instance, passing `fields=System.Id,System.Title,…` together
  // with `$expand=relations` causes the upstream to silently omit the
  // `relations[]` array from the response. The two are server-side
  // orthogonal on documented Azure DevOps Service, but this Server
  // build treats them as a "subset select" that excludes relations.
  //
  // Without `fields`, the upstream returns the full default body
  // (which already includes every System.* / Microsoft.VSTS.* field
  // we need) AND the relations array when the PAT has `vso.work_full`.
  // Probe endpoint confirms: 156 relations, all System.* fields
  // present.
  try {
    const raw = await client.getWorkItem(id, undefined, {
      expand: "relations",
      expandParam: "$expand",
    })
    if (!raw || typeof raw !== "object") return null
    return mapWithRelationsGuard(raw)
  } catch (err) {
    if (err instanceof AzureApiError && err.status === 404) return null
    if (err instanceof AzureApiError && (err.status === 0 || err.code === "network")) {
      throw err
    }
    attempts.push({
      label: "$expand=relations",
      status: err instanceof AzureApiError ? err.status : 0,
      code: err instanceof AzureApiError ? err.code : "?",
      message: err instanceof Error ? err.message : String(err),
    })
  }

  // Attempt 2: legacy `expand=relations` (no `$`) for older Azure DevOps
  // Server installations. The REST API on TFS / older server releases
  // accepts the un-prefixed parameter name. Same `undefined` fields
  // trick — we want the upstream to give us the relations, not a
  // field-subset response that strips them.
  try {
    const raw = await client.getWorkItem(id, undefined, {
      expand: "relations",
      expandParam: "expand",
    })
    if (!raw || typeof raw !== "object") return null
    return mapWithRelationsGuard(raw)
  } catch (err) {
    if (err instanceof AzureApiError && err.status === 404) return null
    if (err instanceof AzureApiError && (err.status === 0 || err.code === "network")) {
      throw err
    }
    attempts.push({
      label: "expand=relations",
      status: err instanceof AzureApiError ? err.status : 0,
      code: err instanceof AzureApiError ? err.code : "?",
      message: err instanceof Error ? err.message : String(err),
    })
  }

  // Attempt 3: minimal-field expand to grab the relations alone, then
  // merge onto a plain field fetch of the body. The minimal call uses
  // `fields=System.Id` ONLY as a sanity probe — if it still returns no
  // relations, this whole chain is doomed (real PAT scope gap or
  // server-side configuration that rejects expand entirely).
  try {
    const minimalRaw = (await client.getWorkItem(
      id,
      ["System.Id"],
      { expand: "relations", expandParam: "$expand" },
    )) as { relations?: unknown } | null
    if (minimalRaw && typeof minimalRaw === "object") {
      // If the minimal fetch came back without relations, this whole
      // chain is doomed — fall through to the next attempt rather than
      // returning a relations-less item.
      if (Array.isArray((minimalRaw as { relations?: unknown }).relations)) {
        const richRaw = await client.getWorkItem(id, undefined)
        if (richRaw && typeof richRaw === "object") {
          ;(richRaw as { relations?: unknown }).relations =
            (minimalRaw as { relations?: unknown }).relations
          return mapWithRelationsGuard(richRaw)
        }
        return mapWithRelationsGuard(minimalRaw)
      }
    }
  } catch (err) {
    if (err instanceof AzureApiError && err.status === 404) return null
    if (err instanceof AzureApiError && (err.status === 0 || err.code === "network")) {
      throw err
    }
    attempts.push({
      label: "minimal-field $expand=relations",
      status: err instanceof AzureApiError ? err.status : 0,
      code: err instanceof AzureApiError ? err.code : "?",
      message: err instanceof Error ? err.message : String(err),
    })
  }

  // All expand attempts failed. Log the chain so the admin can see
  // exactly what the upstream rejected.
  for (const a of attempts) {
    console.warn(
      `[azure-tasks] getWorkItemById(${id}): ${a.label} failed (status=${a.status}, code=${a.code}): ${a.message}`,
    )
  }

  // Last resort: plain field fetch (no relations). The row-expansion
  // UI will render an honest "Attachments unavailable" message.
  // Use `undefined` fields here too — see the long comment on
  // Attempt 1 above for why `fields=…` strips relations on this
  // upstream. (The fallback doesn't *want* relations, but consistency
  // makes the upstream easier to reason about.)
  try {
    const raw = await client.getWorkItem(id, undefined)
    if (!raw || typeof raw !== "object") return null
    const item = mapWorkItem(raw, config.organization, config.project)
    // Mark this copy as relations-unavailable so the UI can render the
    // specific remediation hint instead of "list not loaded yet".
    item.relationsUnavailable = true
    return item
  } catch (fallbackErr) {
    // The fallback also failed — surface the *original* expand error
    // so the user-facing message names the specific failure mode.
    const first = attempts[0]
    if (first) {
      const code =
        first.code === "?" || first.code == null ? "upstream" : first.code
      throw new AzureApiError(first.message, first.status, code, null)
    }
    throw fallbackErr
  }
}

/**
 * Stream a single attachment off a work item. The route handler uses
 * this to proxy the upstream bytes back to the browser with our auth
 * header attached.
 *
 * Returns `null` when the work item has no `AttachedFile` relation with
 * the given id (e.g. the id is wrong, the attachment was removed, or
 * the relation is for a different kind of link). Callers should
 * surface that as a 404.
 */
export async function streamAttachment(
  workItemId: number,
  attachmentId: string,
): Promise<{ filename: string; contentType: string; response: Response } | null> {
  // Reuse the cached single-item fetch (which already expanded relations).
  const item = await getWorkItemById(workItemId)
  if (!item) return null
  const attachment = item.attachments?.find((a) => a.id === attachmentId)
  if (!attachment) return null

  const client = getClient()
  const response = await client.getAttachmentStream(attachment.url)
  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream"
  return { filename: attachment.name, contentType, response }
}

/**
 * Fetch the comments for a work item. Goes through the dedicated
 * comments REST endpoint because comments are NOT part of the standard
 * work-item payload (no `expand` flag surfaces them).
 *
 * Unlike `getWorkItemById` we do NOT cache the result: comments are
 * edited frequently and the user typically wants the latest copy when
 * they open the row. The endpoint itself supports paging — we pass
 * through the requested page and return the same shape the UI uses for
 * the work-items list (`items / total / page / pageSize / hasMore`).
 *
 * If the upstream returns no `comments` field at all (e.g. an Azure
 * DevOps Server instance with the comments service disabled), we set
 * `commentsUnavailable: true` so the UI can show an honest "comments
 * not available" message rather than a misleading empty list.
 *
 * If the upstream returns 404 from the comments endpoint specifically,
 * we DO NOT propagate that as "work item not found" — the caller may
 * have already loaded the work item successfully via
 * `getWorkItemById`. A 404 from the comments endpoint almost always
 * means one of:
 *   - The Azure DevOps Server build doesn't support comments at this
 *     preview api-version (we pin to a stable preview — see the client)
 *   - The deployment has the comments service disabled
 *   - The PAT is missing a scope that gates the comments endpoint
 * In all three cases we surface `commentsUnavailable: true` so the UI
 * can render an honest empty state instead of an error toast.
 */
export async function getWorkItemComments(
  workItemId: number,
  options: { page?: number; pageSize?: number; includeDeleted?: boolean } = {},
): Promise<AzureWorkItemCommentsPage> {
  // The comments endpoint doesn't need anything from the config beyond
  // "is Azure DevOps configured at all" — the cached client already
  // holds the org/project/pat. A misconfiguration here surfaces from
  // `getClient()` below as a normal AzureApiError(501, "config").
  try {
    getAzureConfig()
  } catch (err) {
    if (err instanceof AzureConfigError) {
      throw new AzureApiError(err.message, 501, "config", null)
    }
    throw err
  }

  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.max(1, Math.min(200, options.pageSize ?? 50))
  const includeDeleted = Boolean(options.includeDeleted)

  const client = getClient()
  let res: { totalCount?: number; comments?: unknown[] } | null = null
  try {
    res = await client.getComments(workItemId, { page, pageSize })
  } catch (err) {
    // 404 from the comments endpoint means the deployment doesn't
    // expose comments at this preview version (or at all). Treat it
    // as "comments unavailable" rather than failing the whole call —
    // the row expansion already rendered the work-item details
    // successfully, so the user just doesn't get to see the thread.
    if (err instanceof AzureApiError && err.status === 404) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        hasMore: false,
        commentsUnavailable: true,
      }
    }
    throw err
  }

  // The upstream always returns `totalCount` and a (possibly empty)
  // `comments` array. If the `comments` key is missing entirely, that's
  // a deployment-level "comments disabled" signal — surface it so the
  // UI doesn't render a misleading "no comments yet" empty state.
  const rawComments = Array.isArray(res.comments) ? res.comments : null
  if (rawComments === null) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
      commentsUnavailable: true,
    }
  }

  const items = rawComments
    .map((c) => mapComment(c, includeDeleted))
    .filter(
      (c): c is NonNullable<ReturnType<typeof mapComment>> => c !== null,
    )

  // The upstream orders comments oldest-first on this endpoint, which
  // is what we want for the chronological feed. Don't re-sort.
  const total = typeof res.totalCount === "number" ? res.totalCount : items.length
  const hasMore = page * pageSize < total

  return {
    items,
    total,
    page,
    pageSize,
    hasMore,
  }
}
