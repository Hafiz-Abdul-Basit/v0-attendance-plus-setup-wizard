"use client"

/**
 * RootShell — client wrapper that mounts the global Toaster, the
 * GlobalLoadingProvider (for the top progress bar), and the
 * GlobalProgressBar itself. Kept as a separate component because
 * `app/layout.tsx` is a server component and cannot render
 * `next-auth`'s SessionProvider or sonner's Toaster directly.
 *
 * Also mounts the global Cmd+K command palette (`CommandPalette`) and
 * the `?` keyboard-shortcut overlay (`ShortcutsOverlay`). Both skip
 * themselves on the auth pages via `usePathname()`.
 */
import * as React from "react"
import { Toaster } from "sonner"

import { GlobalLoadingProvider } from "@/components/providers/GlobalLoadingProvider"
import { GlobalProgressBar } from "@/components/ui/global-progress-bar"
import { CommandPalette } from "@/components/CommandPalette"
import { ShortcutsOverlay } from "@/components/ShortcutsOverlay"

export function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <GlobalLoadingProvider>
      <GlobalProgressBar />
      {children}
      <CommandPalette />
      <ShortcutsOverlay />
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3500}
      />
    </GlobalLoadingProvider>
  )
}
