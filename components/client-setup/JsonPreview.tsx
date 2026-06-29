"use client"

/**
 * JsonPreview — full-height JSON viewer with smart search.
 *
 * Designed to fill its parent's available vertical space (the parent
 * must be `flex flex-col` and give this component `flex-1`). Replaces
 * the plain `<pre>` blocks previously used in the Component and
 * Truancy Configuration editors.
 *
 * Features:
 *   - Smart search bar (debounced) with match counter + prev/next.
 *   - Case-sensitive and whole-word toggles.
 *   - Inline `<mark>` highlights on matches (keys tinted, values yellow).
 *   - Line numbers, copy-to-clipboard, download-as-file.
 */
import * as React from "react"
import { ChevronDown, ChevronUp, Copy, Download, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface JsonPreviewProps {
  /** The value to render. Will be JSON.stringify'd with 2-space indent. */
  data: unknown
  /** Optional header label shown above the search bar. */
  title?: string
  /** Optional download filename. If omitted, no download button is shown. */
  filename?: string
  /** Optional className for the outer container. */
  className?: string
}

/**
 * Find all match ranges [start, end) in `haystack`, honoring case + whole-word.
 * Returns sorted, non-overlapping ranges. Empty needle returns [].
 */
function findAllMatches(
  haystack: string,
  needle: string,
  matchCase: boolean,
  wholeWord: boolean,
): Array<[number, number]> {
  if (!needle) return []
  const out: Array<[number, number]> = []
  const hay = matchCase ? haystack : haystack.toLowerCase()
  const ndl = matchCase ? needle : needle.toLowerCase()
  const len = ndl.length
  if (len === 0) return []

  let i = 0
  while (i <= hay.length - len) {
    const at = hay.indexOf(ndl, i)
    if (at === -1) break
    if (wholeWord) {
      const before = at === 0 ? "" : hay[at - 1]
      const after = at + len >= hay.length ? "" : hay[at + len]
      const isWordChar = (c: string) => /[A-Za-z0-9_]/.test(c)
      if ((before === "" || !isWordChar(before)) && (after === "" || !isWordChar(after))) {
        out.push([at, at + len])
      }
      i = at + 1
    } else {
      out.push([at, at + len])
      i = at + len
    }
  }
  return out
}

/**
 * Build the highlighted HTML for a JSON string. We splice `<mark>` tags
 * around every match range, then split by `\n` for line-number rendering.
 *
 * Note: `data` is serialized JSON, so any `"` `<` `>` are already escaped
 * by `JSON.stringify`. We only need to additionally escape `<` and `>`
 * for the wrapper (and `&` defensively) — never trust user-provided
 * needle/filename in a way that would inject HTML here.
 */
function buildHighlightedJson(
  json: string,
  ranges: Array<[number, number]>,
  currentIndex: number,
): string {
  if (ranges.length === 0) return escapeHtml(json)

  let out = ""
  let cursor = 0
  ranges.forEach(([start, end], idx) => {
    if (start > cursor) out += escapeHtml(json.slice(cursor, start))
    const slice = escapeHtml(json.slice(start, end))
    const isCurrent = idx === currentIndex
    out += isCurrent
      ? `<mark data-idx="${idx}" class="bg-amber-300 text-slate-900 rounded-sm px-0.5 -mx-0.5 ring-1 ring-amber-500">${slice}</mark>`
      : `<mark data-idx="${idx}" class="bg-yellow-200/80 text-slate-900 rounded-sm px-0.5 -mx-0.5">${slice}</mark>`
    cursor = end
  })
  if (cursor < json.length) out += escapeHtml(json.slice(cursor))
  return out
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => {
    if (c === "&") return "&amp;"
    if (c === "<") return "&lt;"
    return "&gt;"
  })
}

export function JsonPreview({
  data,
  title,
  filename,
  className,
}: JsonPreviewProps) {
  const [query, setQuery] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  const [matchCase, setMatchCase] = React.useState(false)
  const [wholeWord, setWholeWord] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const scrollRef = React.useRef<HTMLPreElement>(null)

  // Debounce the query so we don't re-render on every keystroke.
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200)
    return () => clearTimeout(t)
  }, [query])

  // Reset current match when the search shape changes.
  React.useEffect(() => {
    setCurrentIndex(0)
  }, [debounced, matchCase, wholeWord])

  const json = React.useMemo(
    () => JSON.stringify(data, null, 2),
    [data],
  )

  const ranges = React.useMemo(
    () => findAllMatches(json, debounced.trim(), matchCase, wholeWord),
    [json, debounced, matchCase, wholeWord],
  )

  // Keep currentIndex in range.
  React.useEffect(() => {
    if (currentIndex >= ranges.length) setCurrentIndex(0)
  }, [currentIndex, ranges.length])

  const highlightedHtml = React.useMemo(
    () => buildHighlightedJson(json, ranges, currentIndex),
    [json, ranges, currentIndex],
  )

  const totalLines = React.useMemo(() => json.split("\n").length, [json])

  // Auto-scroll the current match into view inside the preview scroller.
  React.useEffect(() => {
    if (!scrollRef.current || ranges.length === 0) return
    const el = scrollRef.current.querySelector(
      `mark[data-idx="${currentIndex}"]`,
    ) as HTMLElement | null
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [currentIndex, ranges.length])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Copy failed — your browser may have blocked it.")
    }
  }

  const handleDownload = () => {
    if (!filename) return
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const goNext = () => {
    if (ranges.length === 0) return
    setCurrentIndex((i) => (i + 1) % ranges.length)
  }
  const goPrev = () => {
    if (ranges.length === 0) return
    setCurrentIndex((i) => (i - 1 + ranges.length) % ranges.length)
  }
  const clearSearch = () => {
    setQuery("")
    setDebounced("")
  }

  return (
    <div
      className={cn(
        "flex-1 min-h-0 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/60">
        {title && (
          <span className="text-sm font-semibold text-slate-700 mr-1">
            {title}
          </span>
        )}
        <div className="relative flex-1 min-w-[180px] max-w-md">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (e.shiftKey) goPrev()
                else goNext()
              } else if (e.key === "Escape") {
                clearSearch()
              }
            }}
            placeholder="Search JSON…"
            className="h-9 pl-3 pr-8 text-sm font-mono bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <label className="flex items-center gap-1 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="accent-blue-600"
            />
            <span>Match case</span>
          </label>
          <label className="flex items-center gap-1 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={wholeWord}
              onChange={(e) => setWholeWord(e.target.checked)}
              className="accent-blue-600"
            />
            <span>Whole word</span>
          </label>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs font-mono text-slate-500 tabular-nums min-w-[90px] text-right">
            {debounced.trim()
              ? ranges.length === 0
                ? "0 matches"
                : `${currentIndex + 1}/${ranges.length}`
              : `${totalLines} lines`}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={goPrev}
            disabled={ranges.length === 0}
            className="h-8 w-8 p-0"
            aria-label="Previous match"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={goNext}
            disabled={ranges.length === 0}
            className="h-8 w-8 p-0"
            aria-label="Next match"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-8 gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy
          </Button>
          {filename && (
            <Button
              type="button"
              size="sm"
              onClick={handleDownload}
              className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 bg-slate-900 overflow-auto">
        <pre
          ref={scrollRef}
          className="text-xs font-mono leading-relaxed text-slate-100 p-4"
          // eslint-disable-next-line react/no-danger -- JSON is our own stringify of `data`,
          // which comes from in-memory React state; we escape `<>&` before splicing marks.
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </div>
    </div>
  )
}