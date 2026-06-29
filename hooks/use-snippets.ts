"use client"

/**
 * useSnippets — single source of truth for snippet data in the browser.
 *
 * Replaces direct imports of `data/snippets.tsx`. Returns the same shape
 * (`{ id, title, description, content, category, language, icon, color, tags[], lastUsed, isInteractive?, tableData? }`)
 * so no consumer code needs to change beyond the data source.
 *
 * SWR shares the cache across components — wizard + snippets content render
 * the same array, no double-fetch.
 */
import useSWR from "swr"

export interface ApiSnippet {
  id: string
  title: string
  description: string
  content: string
  category: string
  language: string
  icon: string
  color: string
  tags: string[]
  lastUsed: string | Date
  // New fields populated by /api/snippets (author + ownership + audit timestamps)
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  authorName?: string | null
  authorEmail?: string | null
  isOwner?: boolean
  // Pre-existing optional fields
  isInteractive?: boolean
  tableData?: unknown
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const json = await res.json()
  return (json.snippets ?? []) as ApiSnippet[]
}

interface UseSnippetsResult {
  snippets: ApiSnippet[]
  isLoading: boolean
  isError: boolean
  error: unknown
  mutate: () => void
}

export function useSnippets(): UseSnippetsResult {
  const { data, error, isLoading, mutate } = useSWR<ApiSnippet[]>(
    "/api/snippets",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    },
  )

  return {
    snippets: data ?? [],
    isLoading,
    isError: Boolean(error),
    error,
    mutate: () => mutate(),
  }
}