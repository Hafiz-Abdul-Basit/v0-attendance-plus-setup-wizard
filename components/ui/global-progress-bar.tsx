"use client"

/**
 * GlobalProgressBar — fixed-top animated progress indicator.
 *
 * Reads `isLoading` from GlobalLoadingProvider context and renders a
 * 3px gradient bar that:
 *   - slides from 0 → 70% while loading (gentle indeterminate feel)
 *   - snaps to 100% on finish
 *   - fades out 250ms later
 *
 * No JS animation loop; pure CSS keyframes driven by a className swap
 * tied to the provider state.
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { useGlobalLoading } from "@/components/providers/GlobalLoadingProvider"

export function GlobalProgressBar() {
  const { isLoading } = useGlobalLoading()
  const [phase, setPhase] = React.useState<"idle" | "loading" | "done">(
    "idle",
  )

  React.useEffect(() => {
    if (isLoading) {
      setPhase("loading")
    } else if (phase === "loading") {
      // Snap to done, then back to idle after the fade-out.
      setPhase("done")
      const t = setTimeout(() => setPhase("idle"), 350)
      return () => clearTimeout(t)
    }
  }, [isLoading, phase])

  if (phase === "idle") return null

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
    >
      <div
        className={cn(
          "h-[3px] origin-left",
          "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500",
          "shadow-[0_0_10px_rgba(99,102,241,0.6)]",
          phase === "loading" && "animate-global-progress-load",
          phase === "done" && "animate-global-progress-done",
        )}
      />
    </div>
  )
}