"use client"

/**
 * useAzureTasks — SWR wrapper for `/api/azure-tasks`.
 *
 * Mirrors the project's hook conventions (see `use-snippets`,
 * `use-app-menu`, `use-admin-users`):
 *   - "use client" directive
 *   - Module-scoped fetcher that throws on non-OK and unwraps the
 *     envelope on success
 *   - `revalidateOnFocus: false` + `dedupingInterval: 30_000` so the
 *     panel doesn't refetch on every focus
 *   - Returns a typed result with `mutate` for manual refreshes
 *
 * The hook also exports a `useAzureTask(id)` companion that hits the
 * single-item endpoint when the details dialog opens.
 *
 * For the lazy-loading panel we expose `useAzureTasksPage(query)` which
 * returns the page-by-page accumulator that infinite scroll needs.
 */

import * as React from "react"
import useSWR from "swr"

import type {
  AzureWorkItem,
  AzureWorkItemComment,
  AzureWorkItemCommentsPage,
  AzureWorkItemQuery,
  AzureWorkItemSummary,
  AzureIdentity,
} from "@/lib/azure-devops/client-safe"

// Re-export the domain types so consumers can import everything from
// this hook, mirroring the `use-app-menu` pattern.
export type {
  AzureWorkItem,
  AzureWorkItemComment,
  AzureWorkItemCommentsPage,
  AzureWorkItemQuery,
  AzureWorkItemSummary,
  AzureIdentity,
}

export interface AzureWorkItemPageResult {
  tasks: AzureWorkItem[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  summary: AzureWorkItemSummary
}

interface UseAzureTasksResult {
  data: AzureWorkItemPageResult | null
  tasks: AzureWorkItem[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  summary: AzureWorkItemSummary | null
  isLoading: boolean
  isError: boolean
  error: unknown
  mutate: () => Promise<AzureWorkItemPageResult | undefined>
}

interface UseAzureTasksPageOptions {
  /**
   * Bypass the SWR cache when fetching additional pages. The first
   * page still benefits from the 30s dedupe window, but loadMore()
   * fetches are tagged so the cache doesn't serve a stale "page 2"
   * when the user has scrolled forward again.
   */
  pageSize?: number
  /** Page size to fetch on loadMore calls. Defaults to `pageSize`. */
  loadMorePageSize?: number
}

interface UseAzureTasksPageResult extends UseAzureTasksResult {
  /** Trigger a fetch of the next page. No-op when `hasMore` is false. */
  loadMore: () => Promise<void>
  /** True while a `loadMore` fetch is in flight (excludes first page). */
  isLoadingMore: boolean
}

/** Build a stable cache key from a query object. */
export function buildCacheKey(query: AzureWorkItemQuery): string {
  const ordered: Record<string, unknown> = {}
  const keys: Array<keyof AzureWorkItemQuery> = [
    "from",
    "to",
    "q",
    "assignee",
    "state",
    "type",
    "onlyMine",
    "currentUserName",
    "stale",
    "page",
    "pageSize",
  ]
  for (const k of keys) {
    const v = query[k]
    if (v != null && v !== "") ordered[k as string] = v
  }
  return `/api/azure-tasks?${new URLSearchParams(
    ordered as Record<string, string>,
  ).toString()}`
}

const listFetcher = async (url: string): Promise<AzureWorkItemPageResult> => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) {
    let message = `Failed to fetch ${url}: ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return (await res.json()) as AzureWorkItemPageResult
}

const emptySummary: AzureWorkItemSummary = {
  total: 0,
  active: 0,
  completed: 0,
  overdue: 0,
  byState: {},
  byAssignee: {},
}

/**
 * useAzureTasks — fetch a page of work items.
 * Pass an empty `{}` for "all work items, default page".
 */
export function useAzureTasks(query: AzureWorkItemQuery): UseAzureTasksResult {
  const key = buildCacheKey(query)
  const { data, error, isLoading, mutate } = useSWR<AzureWorkItemPageResult>(
    key,
    listFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
      keepPreviousData: true,
    },
  )

  return {
    data: data ?? null,
    tasks: data?.tasks ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? query.page ?? 1,
    pageSize: data?.pageSize ?? query.pageSize ?? 50,
    hasMore: data?.hasMore ?? false,
    summary: data?.summary ?? null,
    isLoading,
    isError: Boolean(error),
    error,
    mutate: () => mutate(),
  }
}

/**
 * useAzureTasksPage — page-by-page fetcher for infinite scroll.
 *
 * Internally maintains an accumulator keyed by the *non-paginated*
 * portion of the query (filters + page size), so changing `page`
 * doesn't evict the accumulated list. The accumulator is deduped by
 * `id`, so a partial overlap between page 1 and page 2 (e.g. an item
 * was edited between requests) doesn't double-render.
 *
 * The hook re-fetches page 1 whenever the *filter* portion of the
 * query changes (handled via `buildCacheKey` ignoring `page`), and
 * triggers `loadMore()` when the IntersectionObserver sentinel
 * scrolls into view.
 *
 * `loadMore` is stabilised via a ref so callers can include it in an
 * effect dependency list without rebuilding the observer on every
 * SWR revalidation. The hook also keeps a monotonic `nextPage` cursor
 * so we never request a page lower than what we already have, even
 * across overlapping fetches.
 */
export function useAzureTasksPage(
  query: AzureWorkItemQuery,
  options: UseAzureTasksPageOptions = {},
): UseAzureTasksPageResult {
  const loadMorePageSize = options.loadMorePageSize ?? options.pageSize ?? query.pageSize ?? 100
  const firstPageSize = options.pageSize ?? loadMorePageSize

  // The cache key is the filter shape + first-page size only. This is
  // what tells SWR "new filters → drop the accumulator and start fresh".
  const filterKey = buildCacheKey({ ...query, page: 1, pageSize: firstPageSize })

  const { data, error, isLoading, mutate } = useSWR<AzureWorkItemPageResult>(
    filterKey,
    listFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
      keepPreviousData: false,
    },
  )

  const [extraPages, setExtraPages] = React.useState<AzureWorkItem[][]>([])
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  // Monotonic cursor: the next page we *want* to ask for. Bumped after
  // each successful page response (or the initial first-page response).
  // Survives filter resets via the effect below.
  const nextPageRef = React.useRef<number>(2)
  // Stash the latest `data` and `query` so the loadMore callback stays
  // referentially stable. Without this, every SWR revalidation would
  // build a new `loadMore`, which in turn tears down and rebuilds any
  // IntersectionObserver that depends on it.
  const dataRef = React.useRef<AzureWorkItemPageResult | null>(null)
  dataRef.current = data ?? null
  const queryRef = React.useRef<AzureWorkItemQuery>(query)
  queryRef.current = query

  // Reset accumulator whenever filters change (filterKey changes).
  React.useEffect(() => {
    setExtraPages([])
    setIsLoadingMore(false)
    // First page will be page 1, so the next page we want is 2.
    nextPageRef.current = 2
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  // Keep the cursor in sync with the highest page we've actually
  // received. This handles the case where page 1 returns and reports
  // `hasMore: false` — `nextPageRef` should not advance to 2 in that
  // case because there's no page 2 to fetch.
  React.useEffect(() => {
    if (!data) return
    const receivedPage = data.page ?? 1
    if (receivedPage + 1 > nextPageRef.current) {
      nextPageRef.current = receivedPage + 1
    }
  }, [data])

  const hasMore = data?.hasMore ?? false

  const loadMore = React.useCallback(async () => {
    const current = dataRef.current
    if (!current) return
    if (!current.hasMore) return
    if (isLoadingMore) return
    const nextPage = nextPageRef.current
    setIsLoadingMore(true)
    try {
      const url = buildCacheKey({
        ...queryRef.current,
        page: nextPage,
        pageSize: loadMorePageSize,
      })
      const page = await listFetcher(url)
      // Bump the cursor past whatever we just received, but never
      // backwards (in case of overlapping fetches).
      if (page.page + 1 > nextPageRef.current) {
        nextPageRef.current = page.page + 1
      }
      setExtraPages((prev) => [...prev, page.tasks])
    } catch (err) {
      console.warn("[useAzureTasksPage] loadMore failed:", err)
      throw err
    } finally {
      setIsLoadingMore(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingMore, filterKey])

  // Flatten accumulator into a single deduped list.
  const tasks = React.useMemo(() => {
    const out: AzureWorkItem[] = data ? [...data.tasks] : []
    for (const batch of extraPages) {
      for (const t of batch) out.push(t)
    }
    if (out.length <= 1) return out
    const seen = new Set<number>()
    const dedup: AzureWorkItem[] = []
    for (const t of out) {
      if (seen.has(t.id)) continue
      seen.add(t.id)
      dedup.push(t)
    }
    return dedup
  }, [data, extraPages])

  return {
    data: data ?? null,
    tasks,
    total: data?.total ?? 0,
    page: data?.page ?? query.page ?? 1,
    pageSize: data?.pageSize ?? query.pageSize ?? 50,
    hasMore,
    summary: data?.summary ?? null,
    isLoading,
    isError: Boolean(error),
    error,
    mutate: () => mutate(),
    loadMore,
    isLoadingMore,
  }
}

interface UseAzureTaskResult {
  task: AzureWorkItem | null
  isLoading: boolean
  isError: boolean
  error: unknown
  mutate: () => Promise<AzureWorkItem | null | undefined>
}

const singleFetcher = async (url: string): Promise<AzureWorkItem | null> => {
  const res = await fetch(url, { credentials: "include" })
  if (res.status === 404) return null
  if (!res.ok) {
    let message = `Failed to fetch ${url}: ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return (await res.json()) as AzureWorkItem
}

/** Fetch a single work item by id. */
export function useAzureTask(id: number | null): UseAzureTaskResult {
  const key = id == null ? null : `/api/azure-tasks/${id}`
  const { data, error, isLoading, mutate } = useSWR<AzureWorkItem | null>(
    key,
    singleFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )
  return {
    task: data ?? null,
    isLoading,
    isError: Boolean(error),
    error,
    mutate: () => mutate(),
  }
}

// Re-export the empty summary so consumers can default-state the panel.
export { emptySummary }

interface UseAzureTaskCommentsOptions {
  /** 1-based page number. Default 1. */
  page?: number
  /** Page size (max 200). Default 50. */
  pageSize?: number
}

interface UseAzureTaskCommentsResult {
  comments: AzureWorkItemComment[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  /** True if the upstream told us the comments service is unavailable. */
  commentsUnavailable: boolean
  isLoading: boolean
  isError: boolean
  error: unknown
  mutate: () => Promise<AzureWorkItemCommentsPage | null | undefined>
}

const commentsFetcher = async (
  url: string,
): Promise<AzureWorkItemCommentsPage> => {
  const res = await fetch(url, { credentials: "include" })
  // The comments route always returns 200 with a normalised envelope
  // — even when the upstream comments service is unavailable, the
  // route sets `commentsUnavailable: true` rather than failing. So we
  // only treat network/HTTP errors as failures here.
  if (!res.ok) {
    let message = `Failed to fetch ${url}: ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return (await res.json()) as AzureWorkItemCommentsPage
}

/**
 * useAzureTaskComments — fetch a page of comments for a work item.
 *
 * Pass `null` as the id to disable fetching (e.g. before the row is
 * expanded). SWR will keep the previous data around via
 * `keepPreviousData`, so a user collapsing + re-expanding a row won't
 * trigger a fresh network round-trip unless the cache has aged out.
 *
 * Unlike the work-items list, we don't bother with an accumulator —
 * a work item's comment count is rarely in the hundreds, so a single
 * page is plenty for the row expansion. If we ever need paging, we can
 * add a `loadMore` here the same way `useAzureTasksPage` does.
 */
export function useAzureTaskComments(
  workItemId: number | null,
  options: UseAzureTaskCommentsOptions = {},
): UseAzureTaskCommentsResult {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? 50
  const key =
    workItemId == null
      ? null
      : `/api/azure-tasks/${workItemId}/comments?page=${page}&pageSize=${pageSize}`

  const { data, error, isLoading, mutate } = useSWR<AzureWorkItemCommentsPage>(
    key,
    commentsFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
      keepPreviousData: true,
    },
  )

  return {
    comments: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    hasMore: data?.hasMore ?? false,
    commentsUnavailable: Boolean(data?.commentsUnavailable),
    isLoading,
    isError: Boolean(error),
    error,
    mutate: () => mutate(),
  }
}
