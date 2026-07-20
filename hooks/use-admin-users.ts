"use client"

/**
 * useAdminUsers — SWR wrapper for `/api/admin/users`.
 *
 * Mirrors `hooks/use-snippets.ts`:
 *   - `dedupingInterval: 30_000` so tab switches don't refetch
 *   - `revalidateOnFocus: false` (admin data doesn't change behind the admin's back)
 *   - unwraps `.users` from the JSON envelope
 *
 * Pass `null` to the key to skip fetching entirely (e.g. before the session
 * is known to be admin). SWR handles `null` natively — the hook returns
 * `{ users: [], isLoading: false }` until a real key is supplied.
 */
import useSWR from "swr"

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: "user" | "admin"
  can_see_setup_clients: boolean
  can_see_setups: boolean
  can_edit_all_snippets: boolean
  can_see_app_menu: boolean
  created_at: string
  updated_at: string
  snippetCount: number
  isSelf?: boolean
}

interface UseAdminUsersResult {
  users: AdminUser[]
  isLoading: boolean
  isError: boolean
  error: unknown
  mutate: () => Promise<AdminUser[] | undefined>
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const json = await res.json()
  return (json.users ?? []) as AdminUser[]
}

export function useAdminUsers(): UseAdminUsersResult {
  const { data, error, isLoading, mutate } = useSWR<AdminUser[]>(
    "/api/admin/users",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    },
  )

  return {
    users: data ?? [],
    isLoading,
    isError: Boolean(error),
    error,
    mutate: () => mutate(),
  }
}
