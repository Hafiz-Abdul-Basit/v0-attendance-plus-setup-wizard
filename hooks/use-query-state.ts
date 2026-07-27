"use client"

/**
 * useQueryState — minimal URL ↔ state sync for the Azure Tasks panel.
 *
 * Why a hand-rolled hook instead of `nuqs` or `router.replace`?
 *   - The Azure Tasks page has ~10 filter knobs. `nuqs` works but adds
 *     a runtime dep just for this view.
 *   - The Next.js `useSearchParams` returns a ReadonlyURLSearchParams
 *     that re-renders the page on every change. We want a soft push
 *     (`history.replaceState`) so typing in the search box doesn't
 *     trigger a full re-render mid-debounce.
 *
 * Contract:
 *   - `value` is the *current* state, owned by the caller.
 *   - `setValue` updates state AND replaces the URL (without scroll).
 *   - On first mount, the URL is read once and `onLoad` is called with
 *     the parsed initial state — the caller uses it to seed `useState`.
 *   - SSR safety: `useSearchParams` is a client hook; this hook should
 *     only be called inside `"use client"` components, which is fine
 *     because it's used by `AzureTasksPanel`.
 *
 * The serializer/deserializer is provided by the caller so we can keep
 * `AzureWorkItemQuery` decoding logic colocated with the panel.
 */

import * as React from "react"

export interface QueryStateBinding<T> {
  /** Parse the URL on first load. Called once during mount. */
  fromUrl: (params: URLSearchParams) => Partial<T>
  /** Serialise a value into URL params. */
  toUrl: (value: T) => Record<string, string | undefined>
}

export interface UseQueryStateOptions<T> {
  /** Default value used when the URL has no relevant params. */
  defaultValue: T
  binding: QueryStateBinding<T>
  /** When false, URL writes are skipped. Useful for SSR/initial render. */
  syncToUrl?: boolean
}

export function useQueryState<T>({
  defaultValue,
  binding,
  syncToUrl = true,
}: UseQueryStateOptions<T>) {
  const [value, setValueRaw] = React.useState<T>(defaultValue)

  // On first mount, hydrate from the URL.
  const hydratedRef = React.useRef(false)
  React.useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const fromUrl = binding.fromUrl(params)
    if (Object.keys(fromUrl).length > 0) {
      setValueRaw((prev) => ({ ...prev, ...fromUrl }))
    }
    // binding is intentionally not in deps — it should be stable for the
    // lifetime of the page (we don't want to re-parse on every render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Replace the URL on every value change. Use history.replaceState so
  // the browser back button still works (one entry per visit) and we
  // don't add a history entry per keystroke.
  React.useEffect(() => {
    if (!syncToUrl) return
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const next = binding.toUrl(value)
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === "") params.delete(k)
      else params.set(k, v)
    }
    const qs = params.toString()
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}`
    if (newUrl !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", newUrl)
    }
  }, [value, syncToUrl, binding])

  const setValue = React.useCallback((next: T | ((prev: T) => T)) => {
    setValueRaw((prev) => (typeof next === "function" ? (next as (p: T) => T)(prev) : next))
  }, [])

  return [value, setValue] as const
}
