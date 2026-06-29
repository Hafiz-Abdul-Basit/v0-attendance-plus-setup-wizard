"use client"

/**
 * useAdminActivity — SWR wrapper for `/api/admin/activity`.
 *
 * Returns a `T | null` envelope instead of an array because the payload
 * is a single activity summary object (newUsers count, top authors list,
 * recent snippets list, etc.).
 */
import useSWR from "swr"

export interface ActivityAuthor {
  userId: string
  name: string | null
  email: string | null
  snippetCount: number
}

export interface ActivityCategory {
  category: string
  count: number
}

export interface ActivityRecentSnippet {
  id: string
  uuid: string
  title: string
  authorName: string | null
  createdAt: string
}

export interface ActivityRecentUser {
  id: string
  name: string | null
  email: string
  createdAt: string
}

export interface AdminActivity {
  windowDays: number
  newUsers: number
  newSnippets: number
  topAuthors: ActivityAuthor[]
  topCategories: ActivityCategory[]
  recentSnippets: ActivityRecentSnippet[]
  recentUsers: ActivityRecentUser[]
}

interface UseAdminActivityResult {
  activity: AdminActivity | null
  isLoading: boolean
  isError: boolean
  error: unknown
  mutate: () => Promise<AdminActivity | undefined>
}

const fetcher = async (url: string): Promise<AdminActivity> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return (await res.json()) as AdminActivity
}

export function useAdminActivity(): UseAdminActivityResult {
  const { data, error, isLoading, mutate } = useSWR<AdminActivity>(
    "/api/admin/activity",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    },
  )

  return {
    activity: data ?? null,
    isLoading,
    isError: Boolean(error),
    error,
    mutate: () => mutate(),
  }
}
