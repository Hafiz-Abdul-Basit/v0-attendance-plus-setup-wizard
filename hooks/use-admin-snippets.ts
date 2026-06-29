"use client"

/**
 * useAdminSnippets — SWR wrapper for `/api/admin/snippets`.
 *
 * Mirror of `useAdminUsers` but for snippets. Same deduping + focus
 * behavior, same `.snippets` envelope unwrap as `hooks/use-snippets.ts`.
 */
import useSWR from "swr"

export interface AdminSnippet {
  id: string
  uuid?: string
  title: string
  description: string
  category: string
  authorName: string | null
  authorEmail: string | null
  createdAt: string
  updatedAt: string
}

interface UseAdminSnippetsResult {
  snippets: AdminSnippet[]
  isLoading: boolean
  isError: boolean
  error: unknown
  mutate: () => Promise<AdminSnippet[] | undefined>
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const json = await res.json()
  return (json.snippets ?? []) as AdminSnippet[]
}

export function useAdminSnippets(): UseAdminSnippetsResult {
  const { data, error, isLoading, mutate } = useSWR<AdminSnippet[]>(
    "/api/admin/snippets",
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
