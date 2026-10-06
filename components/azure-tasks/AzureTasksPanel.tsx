"use client"

/**
 * AzureTasksPanel — main client component for the /azure-tasks page.
 *
 * Layout (full-viewport, two-column):
 *
 *   ┌────────────────────┬──────────────────────────────────────────┐
 *   │  LEFT (filters)    │  RIGHT (table + inline expansion)        │
 *   │  • KPI summary     │  • header (title + result summary +     │
 *   │  • quick ranges    │    refresh)                             │
 *   │  • toggles         │  • sticky table                         │
 *   │  • filter form     │  • rows expand inline to show full      │
 *   │  • reset           │    work-item detail + attachments       │
 *   └────────────────────┴──────────────────────────────────────────┘
 *
 * State lives locally (no global store). The `useAzureTasksPage` hook
 * owns the accumulator that backs infinite scroll; `useAzureTask`
 * fetches a single work item with relations (attachments) whenever the
 * user expands a row.
 *
 * Lazy loading: instead of a Prev/Next pager, the table renders a
 * sentinel `<div>` after the rows. An `IntersectionObserver` fires
 * `loadMore()` when the sentinel scrolls into view, which fetches the
 * next server-side page (100 items) and appends it to the accumulator.
 * When the server reports `hasMore === false`, the sentinel is
 * replaced by an "all caught up" footer.
 *
 * Filter and sort are mirrored to the URL via `useQueryState` so users
 * can bookmark, share, or refresh without losing their view.
 *
 * All hooks are declared ABOVE the auth-gate early return so React
 * never sees a different hook order between renders.
 */

import * as React from "react"
import { useSession } from "next-auth/react"
import { Check, Loader2, PackageOpen, RefreshCw, Sparkles } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useAzureTask, useAzureTasksPage } from "@/hooks/use-azure-tasks"
import { useQueryState } from "@/hooks/use-query-state"
import { STALE_DAYS } from "@/lib/azure-devops/client-safe"
import { cn } from "@/lib/utils"

import { AzureTaskDrawer } from "./AzureTaskDrawer"
import { AzureTaskExportDialog } from "./AzureTaskExportDialog"
import { AzureTaskKpiStrip } from "./AzureTaskKpiStrip"
import {
  AzureTaskFilters,
  deriveFilterOptions,
  type AzureTaskExtraFilters,
} from "./AzureTaskFilters"
import { AzureTaskQuickRanges } from "./AzureTaskQuickRanges"
import { AzureTaskSearchBar } from "./AzureTaskSearchBar"
import { getLastExport } from "./pack-state"
import {
  AzureTaskTable,
  type AzureTaskSort,
  type SortDir,
  type AzureTaskSortKey,
} from "./AzureTaskTable"
import type { AzureWorkItem, AzureWorkItemQuery } from "./types"

/**
 * How many items to ask the server for per page. 100 keeps the first
 * paint fast while still being large enough that the user rarely
 * triggers a second fetch — most teams don't have hundreds of changed
 * items in a 3-month window.
 */
const PAGE_SIZE = 100

/**
 * Default query state when the user opens /azure-tasks directly (no
 * URL params, no chat-bridge intent). We intentionally don't seed a
 * "from" date here — the panel should show *everything* by default,
 * and the user can narrow the window via the filter bar or via a
 * chatbot suggestion.
 */
const EMPTY_QUERY: AzureWorkItemQuery = {}
const EMPTY_EXTRA: AzureTaskExtraFilters = {}

const DEFAULT_SORT: AzureTaskSort = { key: "changedDate", dir: "desc" }

const VALID_SORT_KEYS: AzureTaskSortKey[] = [
  "id",
  "title",
  "type",
  "state",
  "assignedTo",
  "changedDate",
  "createdDate",
  "priority",
  "targetDate",
  "iteration",
]

// --- URL <-> state codecs ---------------------------------------------------

const queryBinding = {
  fromUrl(params: URLSearchParams): Partial<AzureWorkItemQuery> {
    const out: Partial<AzureWorkItemQuery> = {}
    const from = params.get("from")
    if (from) out.from = from

    // Snip chatbot bridge: the widget navigates with
    // `?daysBack=<n>` for relative phrases ("last 3 days").
    // We resolve it to an absolute ISO `from` here so downstream
    // code only has to deal with one shape.
    const daysBack = params.get("daysBack")
    if (daysBack && /^\d{1,4}$/.test(daysBack)) {
      const n = parseInt(daysBack, 10)
      if (n >= 1 && n <= 365) {
        const d = new Date()
        d.setDate(d.getDate() - n)
        d.setHours(0, 0, 0, 0)
        out.from = d.toISOString()
      }
    }

    const to = params.get("to")
    if (to) out.to = to
    // Accept `q` (panel convention) AND `search` (chat widget URL) —
    // both populate the free-text filter.
    const q = params.get("q") ?? params.get("search")
    if (q) out.q = q
    const assignee = params.get("assignee")
    if (assignee) out.assignee = assignee
    const state = params.get("state")
    if (state) out.state = state
    const type = params.get("type")
    if (type) out.type = type
    if (params.get("onlyMine") === "1") out.onlyMine = true
    if (params.get("stale") === "1") out.stale = true
    // `page` and `pageSize` are intentionally NOT persisted — the panel
    // now loads more on scroll, so bookmarking a view should land the
    // user on the same filter set with a fresh load.
    return out
  },
  toUrl(value: AzureWorkItemQuery): Record<string, string | undefined> {
    return {
      from: value.from,
      to: value.to,
      q: value.q,
      assignee: value.assignee,
      state: value.state,
      type: value.type,
      onlyMine: value.onlyMine ? "1" : undefined,
      stale: value.stale ? "1" : undefined,
      // currentUserName is intentionally NOT serialized — it's resolved
      // from the session on every page load. Bookmarking a view with
      // onlyMine=1 should still apply "only mine" for whoever opens it.
    }
  },
}

const sortBinding = {
  fromUrl(params: URLSearchParams): Partial<AzureTaskSort> {
    const sortKey = params.get("sort") as AzureTaskSortKey | null
    const sortDir = params.get("dir") as SortDir | null
    if (sortKey && VALID_SORT_KEYS.includes(sortKey)) {
      return {
        key: sortKey,
        dir: sortDir === "asc" || sortDir === "desc" ? sortDir : "desc",
      }
    }
    return {}
  },
  toUrl(value: AzureTaskSort): Record<string, string | undefined> {
    return {
      sort: value.key === DEFAULT_SORT.key ? undefined : value.key,
      dir:
        value.key === DEFAULT_SORT.key
          ? undefined
          : value.dir === DEFAULT_SORT.dir
            ? undefined
            : value.dir,
    }
  },
}


// Client-side filter (attachments) mirrored to the URL.
const extraBinding = {
  fromUrl(params: URLSearchParams): Partial<AzureTaskExtraFilters> {
    const out: Partial<AzureTaskExtraFilters> = {}
    const att = params.get("att")
    if (att === "with" || att === "without") out.attachments = att
    return out
  },
  toUrl(value: AzureTaskExtraFilters): Record<string, string | undefined> {
    return { att: value.attachments }
  },
}

export function AzureTasksPanel() {
  const { data: session, status } = useSession()

  // ---- Hooks (all declared above the auth-gate) ----
  const [query, setQuery] = useQueryState<AzureWorkItemQuery>({
    defaultValue: EMPTY_QUERY,
    binding: queryBinding,
  })
  const [sort, setSort] = useQueryState<AzureTaskSort>({
    defaultValue: DEFAULT_SORT,
    binding: sortBinding,
  })
  const [extra, setExtra] = useQueryState<AzureTaskExtraFilters>({
    defaultValue: EMPTY_EXTRA,
    binding: extraBinding,
  })
  const [debouncedQuery, setDebouncedQuery] =
    React.useState<AzureWorkItemQuery>(EMPTY_QUERY)
  // Which row is expanded (inline, replaces the old modal dialog).
  const [expandedTaskId, setExpandedTaskId] = React.useState<number | null>(null)
  // Cache of relation-expanded work items, keyed by id. Persisted across
  // re-renders so opening the same row twice doesn't refetch.
  const [expandedTasks, setExpandedTasks] = React.useState<Record<number, AzureWorkItem>>({})

  // Snip chatbot bridge: the chat widget navigates here using URL
  // params (?search, ?daysBack, ?from, ?to). The `useQueryState`
  // hook above already reads those params from `window.location.search`
  // on first mount (see `queryBinding.fromUrl`), so we don't need a
  // separate bridge effect here. An earlier version used a
  // localStorage handoff, but parent effects run AFTER child effects
  // in React, so the panel read the keys too early and missed them.

  // Build the query that actually goes to the server — include the
  // resolved user name when `onlyMine` is on so the SWR cache key is
  // unique per signed-in user.
  // "Only mine" / "Stale" no longer have toggle buttons, but the Snip chatbot
  // (and old bookmarks) can still set them through the URL — keep honouring
  // that. They show up as removable pills in the Filters card.
  const currentUserName = React.useMemo(() => {
    const name = session?.user?.name?.trim()
    if (name) return name
    return session?.user?.email?.trim() || null
  }, [session?.user?.name, session?.user?.email])
  const serverQuery = React.useMemo<AzureWorkItemQuery>(() => {
    if (!query.onlyMine) return query
    if (!currentUserName) return { ...query, onlyMine: false }
    return { ...query, currentUserName }
  }, [query, currentUserName])

  // Debounce search input (and any other field) so we don't hammer
  // the API on every keystroke. ~400ms feels responsive without
  // being noisy.
  React.useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(serverQuery)
    }, 400)
    return () => clearTimeout(handle)
  }, [serverQuery])

  const swr = useAzureTasksPage(debouncedQuery, {
    pageSize: PAGE_SIZE,
    loadMorePageSize: PAGE_SIZE,
  })

  // The Azure Tasks screen is a "fixed viewport, internal scroll"
  // layout — the header + filters stay anchored at the top, the table
  // owns all vertical scrolling. Without this, the page itself scrolls
  // under the sticky header and the lazy-load sentinel never gets
  // reached by the IntersectionObserver (the browser is scrolling the
  // <html>, not our container).
  React.useEffect(() => {
    const cls = "az-tasks-no-page-scroll"
    document.body.classList.add(cls)
    return () => {
      document.body.classList.remove(cls)
    }
  }, [])

  // Single-item fetch (relations-expanded) for the currently-expanded row.
  // We always use `useAzureTask` with a stable id; SWR no-ops when the id
  // is null. Loading/error/data shape is mirrored into our local cache.
  const expansion = useAzureTask(expandedTaskId)

  React.useEffect(() => {
    if (expandedTaskId == null) return
    if (expansion.task) {
      setExpandedTasks((prev) => ({ ...prev, [expandedTaskId]: expansion.task! }))
    }
  }, [expandedTaskId, expansion.task])

  // Derive dropdown options from the items we've already loaded so the
  // user can pick from real values rather than typing them.
  const knownStatesRef = React.useRef<Set<string>>(new Set())
  const filterOptions = React.useMemo(() => {
    const base = deriveFilterOptions(swr.tasks)
    for (const st of base.states) knownStatesRef.current.add(st)
    for (const st of Object.keys(swr.summary?.byState ?? {})) knownStatesRef.current.add(st)
    return {
      ...base,
      states: Array.from(knownStatesRef.current).sort((a, b) => a.localeCompare(b)),
    }
  }, [swr.tasks, swr.summary])

  // ---- Lazy-load wiring (must run before the auth gate) ----
  // The panel owns the *only* scrollable element on this screen (see
  // the `az-task-scroller` div below). The sentinel sits at the bottom
  // of that container, and `scrollRootRef` lets the IntersectionObserver
  // watch the container rather than the viewport — otherwise the
  // observer would never fire on internal scroll events.
  const scrollRootRef = React.useRef<HTMLDivElement | null>(null)
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)
  // Pin the SWR hooks' loadMore behind refs so the IntersectionObserver
  // effect below doesn't tear down and rebuild on every render. Without
  // this, any SWR revalidation produces a new `loadMore` reference,
  // which kicks the observer's deps and churns the lifecycle.
  const swrLoadMoreRef = React.useRef(swr.loadMore)
  swrLoadMoreRef.current = swr.loadMore
  const swrHasMoreRef = React.useRef(swr.hasMore)
  swrHasMoreRef.current = swr.hasMore
  const swrIsLoadingMoreRef = React.useRef(swr.isLoadingMore)
  swrIsLoadingMoreRef.current = swr.isLoadingMore
  const swrIsLoadingRef = React.useRef(swr.isLoading)
  swrIsLoadingRef.current = swr.isLoading
  // In-flight guard so the observer can't fire two parallel loadMore
  // calls (the `isLoadingMore` check inside loadMore covers the *next*
  // click, but doesn't help when two observer callbacks fire from the
  // same scroll frame).
  const inFlightRef = React.useRef(false)
  // IntersectionObserver fires once on initial observation even when
  // the sentinel is already in view. Earlier versions tried to skip
  // that boot event so the panel wouldn't auto-load page 2 before
  // the user scrolled — but the skip-the-first-event logic combined
  // with "sentinel already in view at boot" caused a deadlock where
  // the observer never fired again and the user got stuck staring
  // at "Scroll for more".
  //
  // We now trust the observer unconditionally. The other guards
  // (`swrHasMoreRef`, `swrIsLoadingMoreRef`, `swrIsLoadingRef`,
  // `inFlightRef`) already prevent wasted fetches, so there's no
  // scenario where an immediate load is incorrect: if the panel
  // just rendered page 1 and `hasMore` is true, an immediate
  // intersection means the user can already see the sentinel and
  // they want more rows.
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    const root = scrollRootRef.current
    const node = sentinelRef.current
    if (!root || !node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (!swrHasMoreRef.current) continue
          if (swrIsLoadingMoreRef.current || swrIsLoadingRef.current) continue
          if (inFlightRef.current) continue
          inFlightRef.current = true
          swrLoadMoreRef
            .current()
            .catch(() => {
              /* surfaced via swr.error */
            })
            .finally(() => {
              inFlightRef.current = false
            })
        }
      },
      { root, rootMargin: "300px 0px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
    // `swr.tasks.length` re-creates the observer after each page, so if
    // the sentinel is STILL on screen (tall monitor, few rows) it fires
    // again. If it is off-screen nothing loads — real lazy loading.
  }, [debouncedQuery, swr.tasks.length])


  // ---- Client-side filter: attachments ----
  const visibleTasks = React.useMemo(() => {
    if (!extra.attachments) return swr.tasks
    return swr.tasks.filter((t) => {
      if (extra.attachments === "with" && !(t.attachmentCount > 0)) return false
      if (extra.attachments === "without" && t.attachmentCount > 0) return false
      return true
    })
  }, [swr.tasks, extra.attachments])
  const clientFilterActive = Boolean(extra.attachments)

  // ---- Export pack ----
  const [exportOpen, setExportOpen] = React.useState(false)
  const [lastExportAt, setLastExportAt] = React.useState<string | null>(null)
  // Chatbot / link bridge: /azure-tasks?daysBack=90&export=1 opens Export pack
  // as soon as the list has loaded (the range from the URL is applied by then).
  const exportFromUrlRef = React.useRef<boolean>(false)
  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get("export") === "1") {
      exportFromUrlRef.current = true
      p.delete("export")
      const qs = p.toString()
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`)
    }
  }, [])
  React.useEffect(() => {
    if (exportFromUrlRef.current && !swr.isLoading && swr.total > 0) {
      exportFromUrlRef.current = false
      setExportOpen(true)
    }
  }, [swr.isLoading, swr.total])
  React.useEffect(() => {
    setLastExportAt(getLastExport())
  }, [])
  const tasksRef = React.useRef<AzureWorkItem[]>([])
  tasksRef.current = visibleTasks

  /**
   * Only called when the user presses "Create pack": pulls every
   * remaining page for the CURRENT filters, then returns the list
   * (attachments filter applied). Normal browsing stays lazy.
   */
  const loadAllTasks = React.useCallback(async (): Promise<AzureWorkItem[]> => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    for (let i = 0; i < 100; i++) {
      await wait(60) // let React publish the latest swr state into the refs
      if (!swrHasMoreRef.current) break
      if (swrIsLoadingMoreRef.current || swrIsLoadingRef.current) continue
      try {
        await swrLoadMoreRef.current()
      } catch {
        break
      }
    }
    await wait(120)
    return tasksRef.current
  }, [])
  const rangeLabel =
    query.from || query.to
      ? `${(query.from ?? "").slice(0, 10) || "start"}_to_${(query.to ?? "").slice(0, 10) || "today"}`
      : "all-dates"
  const isAuthed = status === "authenticated"
  const isAuthLoading = status === "loading"

  // ---- Auth gate ----
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    )
  }
  if (!isAuthed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center max-w-md">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Not signed in</h2>
          <p className="text-sm text-gray-500 mb-4">
            You need to sign in to view Azure DevOps work items.
          </p>
          <Button asChild>
            <Link href="/login">Go to sign in</Link>
          </Button>
        </div>
      </div>
    )
  }

  // ---- Handlers ----
  const handleReset = () => {
    setQuery(EMPTY_QUERY)
    setExtra(EMPTY_EXTRA)
    setSort(DEFAULT_SORT)
  }

  const handleRangeChange = (range: { from?: string; to?: string }) => {
    setQuery((q) => ({ ...q, ...range }))
  }

  // Toggle the inline expansion. The previous implementation opened a
  // modal — we now flip the row open in place so the user keeps their
  // bearings in the table while reading full details.
  //
  // When re-opening a row that previously came back with relations
  // unavailable (typically a PAT scope gap that was since fixed), we
  // drop the cached copy so the next fetch re-tries all the relations
  // paths against the freshly-fixed PAT.
  const handleRowToggle = (task: AzureWorkItem) => {
    setExpandedTaskId((prev) => {
      if (prev === task.id) return null
      const cached = expandedTasks[task.id]
      if (cached?.relationsUnavailable) {
        setExpandedTasks((map) => {
          const next = { ...map }
          delete next[task.id]
          return next
        })
      }
      return task.id
    })
  }

  const handleExpansionRetry = () => {
    if (expandedTaskId != null) {
      expansion.mutate().catch(() => {
        /* surfaced via the placeholder */
      })
    }
  }

  const handleRefresh = async () => {
    try {
      await swr.mutate()
      if (expandedTaskId != null) {
        await expansion.mutate()
      }
      toast.success("Refreshed")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh work items",
      )
    }
  }

  const errorMessage =
    swr.error instanceof Error ? swr.error.message : "Failed to load work items"


  // Pre-build the expansion state bag to keep the table's prop shape tidy.
  const expansionState = {
    expandedTaskId,
    expandedTasks,
    isExpansionLoading: expansion.isLoading,
    isExpansionError: expansion.isError,
    expansionError: expansion.error,
    onExpansionRetry: handleExpansionRetry,
  }

  // "All caught up" footer state: server reports hasMore=false and we
  // already have a non-empty list rendered. (If the list is empty, the
  // table itself renders the "no items match" placeholder — no need
  // for a second empty-state footer.)
  const showCaughtUp = !swr.hasMore && swr.tasks.length > 0 && !swr.isLoading
  const shownCount = clientFilterActive ? visibleTasks.length : swr.total

  return (
    // Full-viewport layout. The page-level <header> is sticky
    // (z-30); the panel content scrolls beneath it. The control bar
    // sits at the top (KPI summary + filters as one horizontal
    // strip); the table fills the remaining height via `flex-1`.
    <div
      className={cn(
        "flex flex-col h-[calc(100vh-65px)] transition-[padding] duration-200",
        expandedTaskId != null && "lg:pr-[560px]",
      )}
    >
      {/* Slim top header: title on the left, KPI strip + Refresh on
          the right. The four KPI tiles (Total / Active / Completed /
          Overdue) used to live as their own "Work item overview"
          block; they've been promoted into a compact strip that
          runs alongside the title. The standalone Work item overview
          card has been removed to free up vertical space for the
          filters below. */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">Azure Tasks</h1>
            <p className="text-xs text-gray-500 truncate">
              Work items from your Azure DevOps project. Click any row to see attachments and details inline.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AzureTaskKpiStrip
            summary={swr.summary}
            isLoading={swr.isLoading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
            disabled={swr.isLoading || swr.total === 0}
            className="gap-1 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white disabled:bg-blue-300 disabled:border-blue-300 disabled:text-white"
            title="One click: attachments + key changes + SQL + checklist for the current filters, as one zip"
          >
            <PackageOpen className="w-4 h-4" />
            Export pack
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={swr.isLoading}
            className="gap-1"
          >
            <RefreshCw className={cn("w-4 h-4", swr.isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Horizontal control bar.
          The filters used to live in a left rail; they now run
          horizontally across the full screen so the table can use
          every pixel. The KPI tiles have moved up to the header
          (AzureTaskKpiStrip) — there is no longer a standalone
          "Work item overview" card here. The bar is NOT sticky —
          it scrolls away with the page so the table itself owns
          the viewport while the user is reading rows. */}
      <div className="border-b border-gray-200 bg-white/70 backdrop-blur-sm">
        <div className="px-4 lg:px-6 py-3 space-y-3">
          {/* Search (left) + quick date ranges (right) on one row. */}
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-3 items-stretch">
            <AzureTaskSearchBar
              value={query.q}
              onChange={(q) => setQuery((prev) => ({ ...prev, q }))}
            />
            <AzureTaskQuickRanges
              from={query.from}
              to={query.to}
              onChange={handleRangeChange}
              lastExportAt={lastExportAt}
              className="!rounded-xl"
            />
          </div>

          {/* Filter form (date range + assignee + state + type) */}
          <AzureTaskFilters
            value={query}
            onChange={setQuery}
            extra={extra}
            onExtraChange={setExtra}
            onReset={handleReset}
            options={filterOptions}
            items={swr.tasks}
            stateCounts={swr.summary?.byState}
            className="!rounded-xl"
          />
        </div>
      </div>

      {/* List section — covers the rest of the screen vertically. The
          search bar + result-summary chips live on a single row at the
          top of the list section (search left, chips right). The table
          owns the *only* vertical scroll surface on this screen — the
          <html> scroll is suppressed (see `az-tasks-no-page-scroll` in
          globals.css) so the controls stay anchored and the
          IntersectionObserver driving lazy-loading can see the sentinel
          without any page-level scroll interfering. */}
      <div className="flex-1 min-h-0 flex flex-col p-4 lg:p-5 pt-3 lg:pt-3 gap-4">
        {/* Table container — the *only* scrollable element on this
            screen. The slim `az-task-scroller` style in globals.css
            gives a modern WebKit/Firefox scrollbar that fades in on
            hover instead of always-on chrome. min-h-0 is required so
            the inner overflow-y container can claim the flex parent's
            height. `scrollRootRef` is the IntersectionObserver root
            so the observer watches this container's internal scroll,
            not the page viewport. */}
        <div
          ref={scrollRootRef}
          className="az-task-scroller flex-1 min-h-0 rounded-2xl"
        >
          <AzureTaskTable
            tasks={visibleTasks}
            isLoading={swr.isLoading}
            isError={swr.isError}
            errorMessage={errorMessage}
            sort={sort}
            onSortChange={setSort}
            expansion={expansionState}
            onRowToggle={handleRowToggle}
            onRetry={handleRefresh}
            // The sentinel sits *inside* the scroll container so the
            // IntersectionObserver's `root` (scrollRootRef) sees it
            // when the user scrolls near the bottom.
            scrollSentinel={
              <div ref={sentinelRef} aria-hidden>
                {swr.hasMore ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-4 text-xs text-gray-500">
                    {swr.isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading more work items…
                      </>
                    ) : (
                      "Scroll for more"
                    )}
                  </div>
                ) : null}
              </div>
            }
            caughtUp={
              showCaughtUp ? (
                <div className="flex items-center justify-center gap-2 px-4 py-4 text-xs text-gray-500 bg-white border-t border-gray-100">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  You're all caught up · {shownCount.toLocaleString()} work item
                  {shownCount === 1 ? "" : "s"}
                  {clientFilterActive ? " match your filters" : " loaded"}
                </div>
              ) : null
            }
          />
        </div>
      </div>
      <AzureTaskDrawer
        taskId={expandedTaskId}
        task={expandedTaskId != null ? expandedTasks[expandedTaskId] : undefined}
        isLoading={expansion.isLoading}
        isError={expansion.isError}
        onRetry={handleExpansionRetry}
        onClose={() => setExpandedTaskId(null)}
      />
      <AzureTaskExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        rangeLabel={rangeLabel}
        hasDateRange={Boolean(query.from || query.to)}
        autoStart={Boolean(query.from || query.to)}
        onExported={setLastExportAt}
        totalCount={clientFilterActive ? visibleTasks.length : swr.total}
        loadAllTasks={loadAllTasks}
      />
    </div>
  )
}

// Keep the unused type exports so future filter hooks can import them
// without the bundler complaining.
export type { AzureTaskSortKey, SortDir }