"use client"

/**
 * ShortcutsOverlay — global keyboard-shortcut cheat sheet.
 *
 * Press `?` (Shift+/) anywhere outside the auth pages to see the list.
 * Uses Radix Dialog for the modal shell — matches the rest of the UI.
 *
 * Documents both global shortcuts (this overlay's responsibility) and the
 * per-component wizard shortcuts (which already live behind F6 / Ctrl+H
 * inside `installation-wizard.tsx`). The wizard's own cheat sheet still
 * works — this overlay simply gives global coverage.
 */
import * as React from "react"
import { usePathname } from "next/navigation"
import { Keyboard } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface ShortcutEntry {
  keys: string[]
  description: string
  scope: "global" | "wizard"
}

const SHORTCUTS: ShortcutEntry[] = [
  {
    keys: ["⌘", "K"],
    description: "Open command palette (jump anywhere)",
    scope: "global",
  },
  {
    keys: ["?"],
    description: "Show this shortcut cheat sheet",
    scope: "global",
  },
  {
    keys: ["Esc"],
    description: "Close any open modal or dialog",
    scope: "global",
  },
  {
    keys: ["F6"],
    description: "Open the wizard's in-page search",
    scope: "wizard",
  },
  {
    keys: ["F7"],
    description: "Open the E-Sign setup guide",
    scope: "wizard",
  },
  {
    keys: ["Ctrl", "H"],
    description: "Show the wizard's keyboard shortcuts",
    scope: "wizard",
  },
  {
    keys: ["Ctrl", "1-9"],
    description: "Quick-filter to a popular snippet",
    scope: "wizard",
  },
]

function paletteIsMac(): boolean {
  if (typeof navigator === "undefined") return false
  return /Mac|iPhone|iPad/.test(navigator.platform)
}

export function ShortcutsOverlay() {
  const pathname = usePathname() ?? ""
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")

  const [open, setOpen] = React.useState(false)

  // `?` toggles open. We catch it as Shift+/ (which is the `?` key on US
  // keyboards) and also accept the bare `?` character in case the layout
  // produces a different key value.
  React.useEffect(() => {
    if (isAuthRoute) return
    const onKey = (e: KeyboardEvent) => {
      // Don't open if the user is typing in an input/textarea/contenteditable.
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return
        }
      }
      const isQuestion =
        e.key === "?" || (e.shiftKey && e.key === "/")
      if (isQuestion) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isAuthRoute])

  if (isAuthRoute) return null

  const isMac = paletteIsMac()
  const global = SHORTCUTS.filter((s) => s.scope === "global")
  const wizard = SHORTCUTS.filter((s) => s.scope === "wizard")

  // Replace ⌘ with Ctrl on non-Mac for the Cmd+K row.
  const displayKeys = (keys: string[]) =>
    keys.map((k) =>
      isMac ? k : k === "⌘" ? "Ctrl" : k,
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-600" />
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick reference for the most useful shortcuts across the app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Group label="Global" entries={global} displayKeys={displayKeys} />
          <Group label="Inside the installation wizard" entries={wizard} displayKeys={displayKeys} />
        </div>

        <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
          Press <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5">?</kbd>{" "}
          anytime to come back here.
        </p>
      </DialogContent>
    </Dialog>
  )
}

function Group({
  label,
  entries,
  displayKeys,
}: {
  label: string
  entries: ShortcutEntry[]
  displayKeys: (k: string[]) => string[]
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </div>
      <ul className="space-y-1.5">
        {entries.map((entry, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="text-gray-700">{entry.description}</span>
            <span className="inline-flex shrink-0 items-center gap-1">
              {displayKeys(entry.keys).map((k, j) => (
                <kbd
                  key={j}
                  className="min-w-[1.5rem] rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-center text-[11px] font-medium text-gray-700"
                >
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
