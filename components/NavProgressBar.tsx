"use client"

/**
 * NavProgressBar — thin gradient bar pinned to the top of the viewport
 * that animates while Next.js is between route segments. It uses the
 * `usePathname` change to detect navigation; on every pathname change
 * (other than the initial mount) it restarts a CSS animation so the
 * bar smoothly runs left-to-right, then fades out when the new page
 * has rendered.
 *
 * The pattern is intentionally lightweight (no global state, no
 * context, no NProgress dep) so it works for every route without
 * coupling. The user always sees motion within one frame of clicking
 * a `<Link>`, which kills the "stuck for a second" feel during
 * heavier page transitions (e.g. wizard → Azure Tasks, which does a
 * server-side `getServerSession` before the panel mounts).
 */

import * as React from "react"
import { usePathname } from "next/navigation"

export function NavProgressBar() {
  const pathname = usePathname()
  // We track the rendered pathname so the animation can finish before
  // we hide the bar.
  const [shown, setShown] = React.useState(false)
  const lastPathRef = React.useRef(pathname)
  const finishTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    // Initial mount: don't show the bar (no navigation happened).
    if (lastPathRef.current === pathname) return
    lastPathRef.current = pathname

    // Clear any prior timers so a fast double-navigation doesn't leave
    // a half-finished bar hanging on screen.
    if (finishTimer.current) clearTimeout(finishTimer.current)
    if (hideTimer.current) clearTimeout(hideTimer.current)

    // Show the bar, restart the keyframe-driven animation by remounting.
    setShown(true)
    // Most route segments in this app resolve within ~400-900ms
    // (server-side session lookup + SWR first paint). Cap at 1.4s so
    // the bar never lingers if something genuinely fails.
    finishTimer.current = setTimeout(() => {
      setShown(false)
    }, 1400)

    return () => {
      if (finishTimer.current) clearTimeout(finishTimer.current)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [pathname])

  if (!shown) return null

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] h-0.5 pointer-events-none overflow-hidden"
    >
      <div
        key={pathname}
        className="h-full w-1/3 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600 shadow-[0_0_8px_rgba(59,130,246,0.7)] animate-global-progress-load"
      />
    </div>
  )
}