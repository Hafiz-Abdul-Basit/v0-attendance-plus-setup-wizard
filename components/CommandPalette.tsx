"use client"

/**
 * CommandPalette — global Cmd/Ctrl+K palette.
 *
 * Mounts in `app/RootShell.tsx` so it's available on every page (except
 * the auth pages, gated on `usePathname`).
 *
 * Searches across:
 *   - Wizard installation steps (imported `searchData` from installation-wizard.tsx)
 *   - Snippets (via `useSnippets()` SWR hook — shares cache with the wizard + browser)
 *
 * Keyboard:
 *   - Cmd/Ctrl + K       → toggle open
 *   - ↑ / ↓              → navigate results
 *   - Enter              → activate (closes palette + dispatches `app:palette-select`)
 *   - Esc                → close
 *
 * The palette itself doesn't open snippets or switch wizard sections
 * directly — it dispatches a CustomEvent on `window` that the
 * `InstallationWizard` listens for (see `installation-wizard.tsx`).
 * This keeps the palette decoupled from the wizard's internal state.
 */
import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Code2, FileText, Loader2, Search as SearchIcon } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSnippets } from "@/hooks/use-snippets"
import {
  searchData,
  sections,
  type SearchEntry,
} from "@/components/installation-wizard"
import { cn } from "@/lib/utils"

type Result =
  | {
      kind: "step"
      id: string
      title: string
      subtitle: string
      keywords: string
      step: SearchEntry
    }
  | {
      kind: "snippet"
      id: string
      title: string
      subtitle: string
      keywords: string
      snippetId: string
    }

function paletteIsMac(): boolean {
  if (typeof navigator === "undefined") return false
  return /Mac|iPhone|iPad/.test(navigator.platform)
}

export function CommandPalette() {
  const pathname = usePathname() ?? ""
  const router = useRouter()
  // Don't show the palette on auth pages.
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const { snippets } = useSnippets()

  // ---- keyboard: Cmd/Ctrl+K toggles open ----
  React.useEffect(() => {
    if (isAuthRoute) return
    const isMac = paletteIsMac()
    const onKey = (e: KeyboardEvent) => {
      const isMod = isMac ? e.metaKey : e.ctrlKey
      if (isMod && (e.key === "k" || e.key === "K")) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isAuthRoute])

  // ---- reset query state when opening ----
  React.useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIndex(0)
      // Defer focus until the dialog has rendered
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const sectionById = React.useMemo(() => {
    const m = new Map<string, { title: string; number: number }>()
    for (const s of sections) m.set(s.id, { title: s.title, number: s.number })
    return m
  }, [])

  // ---- build the search index only when needed ----
  const results = React.useMemo<Result[]>(() => {
    if (!open) return []
    const q = query.trim().toLowerCase()
    const steps: Result[] = searchData
      .map((entry): Result | null => {
        if (entry.type !== "step") return null
        if (!q) {
          return {
            kind: "step",
            id: `step:${entry.step}`,
            title: entry.title,
            subtitle: sectionById.get(entry.section)?.title ?? entry.section,
            keywords: entry.content,
            step: entry,
          }
        }
        const inTitle = entry.title.toLowerCase().includes(q)
        const inContent = entry.content.toLowerCase().includes(q)
        if (!inTitle && !inContent) return null
        return {
          kind: "step",
          id: `step:${entry.step}`,
          title: entry.title,
          subtitle: sectionById.get(entry.section)?.title ?? entry.section,
          keywords: entry.content,
          step: entry,
        }
      })
      .filter((r): r is Result => r !== null)
    const snippetResults: Result[] = snippets
      .map((s): Result | null => {
        const haystack = `${s.title} ${s.description} ${s.tags.join(" ")}`.toLowerCase()
        if (q && !haystack.includes(q)) return null
        return {
          kind: "snippet",
          id: `snippet:${s.id}`,
          title: s.title,
          subtitle: s.category,
          keywords: s.description,
          snippetId: s.id,
        }
      })
      .filter((r): r is Result => r !== null)
    return [...steps, ...snippetResults].slice(0, 40)
  }, [open, query, snippets, sectionById])

  // Keep the active index in range as results change.
  React.useEffect(() => {
    if (activeIndex >= results.length) {
      setActiveIndex(Math.max(0, results.length - 1))
    }
  }, [results.length, activeIndex])

  // ---- handle key navigation inside the dialog ----
  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (results.length === 0 ? 0 : (i + 1) % results.length))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) =>
        results.length === 0 ? 0 : (i - 1 + results.length) % results.length,
      )
    } else if (e.key === "Enter") {
      e.preventDefault()
      const target = results[activeIndex]
      if (target) activate(target)
    } else if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    }
  }

  const activate = (r: Result) => {
    setOpen(false)
    if (r.kind === "step") {
      // Make sure we're on the home page where the wizard lives.
      if (pathname !== "/") router.push("/")
      // Dispatch after the navigation so the listener (attached during
      // mount of the wizard) is guaranteed to be live. If we're already
      // on / the listener is already attached.
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("app:palette-select", {
            detail: { kind: "section", target: r.step.section },
          }),
        )
      }, 60)
    } else {
      if (pathname !== "/") router.push("/")
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("app:palette-select", {
            detail: { kind: "snippet", target: r.snippetId },
          }),
        )
      }, 60)
    }
  }

  if (isAuthRoute) return null

  const shortcutHint = paletteIsMac() ? "⌘K" : "Ctrl+K"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={cn(
          "max-w-2xl w-[95vw] gap-0 p-0 overflow-hidden",
          // Tighter top spacing — DialogContent already adds padding
          "sm:rounded-xl",
        )}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>

        {/* Search header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
          <SearchIcon className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onInputKey}
            placeholder="Search snippets, installation steps…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 text-[11px] font-medium text-gray-500">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-gray-500">
              <SearchIcon className="h-8 w-8 text-gray-300" />
              <p className="font-medium">
                {query ? "No results." : "Type to search."}
              </p>
              <p className="text-xs text-gray-400">
                Try “MongoDB”, “IIS”, or “Web.config”.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {results.map((r, i) => {
                const active = i === activeIndex
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => activate(r)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                        active ? "bg-blue-50" : "hover:bg-gray-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white",
                          r.kind === "snippet"
                            ? "bg-purple-500"
                            : "bg-blue-500",
                        )}
                      >
                        {r.kind === "snippet" ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <Code2 className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate font-medium",
                            active ? "text-blue-700" : "text-gray-900",
                          )}
                        >
                          {r.title}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          <span className="font-medium text-gray-600">
                            {r.kind === "snippet" ? "Snippet" : "Step"}
                          </span>
                          <span className="mx-1.5 text-gray-300">·</span>
                          {r.subtitle}
                        </span>
                      </span>
                      {active ? (
                        <span className="text-xs text-blue-600 font-medium">
                          ↵
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2 text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5">
                ↑↓
              </kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5">
                ↵
              </kbd>
              select
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5">
                esc
              </kbd>
              close
            </span>
          </div>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-gray-200 bg-white px-1.5 py-0.5">
              {shortcutHint}
            </kbd>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const _paletteShortcutHint = paletteIsMac
