"use client"

/**
 * GlobalLoadingProvider — tracks in-flight requests + router transitions
 * and exposes a single `isLoading: boolean` via context.
 *
 * How it counts:
 *   1. Patches `window.fetch` on mount (saved as the original, restored
 *      on unmount). Each fetch increments on start, decrements on settle.
 *   2. Subscribes to `usePathname()` from `next/navigation`; every time
 *      the path changes we briefly flip `isLoading` true then false so
 *      `<Link>` clicks and back/forward navigation also trigger the bar.
 *
 * SSR-safe: the fetch patch only runs in the browser. During SSR, no
 * fetch calls happen so the counter stays at 0.
 *
 * The hook into SWR isn't needed — `useSnippets` calls `fetch` under
 * the hood, so the fetch interceptor covers it automatically.
 */
import * as React from "react"
import { usePathname } from "next/navigation"

interface GlobalLoadingContextValue {
  isLoading: boolean
  /** Exposed for tests / debugging — current in-flight fetch count. */
  count: number
}

const GlobalLoadingContext = React.createContext<GlobalLoadingContextValue>({
  isLoading: false,
  count: 0,
})

export function useGlobalLoading() {
  return React.useContext(GlobalLoadingContext)
}

export function GlobalLoadingProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [count, setCount] = React.useState(0)
  const pathname = usePathname()
  const [routerPending, setRouterPending] = React.useState(false)
  const routerTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- fetch interceptor ----
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (...args) => {
      setCount((c) => c + 1)
      try {
        return await originalFetch(...args)
      } finally {
        setCount((c) => Math.max(0, c - 1))
      }
    }
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // ---- router transitions ----
  React.useEffect(() => {
    // Pathname changes after navigation completes; show the bar briefly
    // on every change so users see feedback for client-side route changes.
    setRouterPending(true)
    if (routerTimer.current) clearTimeout(routerTimer.current)
    routerTimer.current = setTimeout(() => setRouterPending(false), 350)
    return () => {
      if (routerTimer.current) clearTimeout(routerTimer.current)
    }
  }, [pathname])

  const isLoading = count > 0 || routerPending

  return (
    <GlobalLoadingContext.Provider value={{ isLoading, count }}>
      {children}
    </GlobalLoadingContext.Provider>
  )
}