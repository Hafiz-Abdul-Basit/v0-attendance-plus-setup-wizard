"use client"

/**
 * useAdminChatbotSettings — SWR wrapper for `/api/admin/chatbot-settings`.
 *
 * Mirrors the project's hook conventions (see `use-admin-users`,
 * `use-admin-snippets`):
 *   - "use client" directive
 *   - Module-scoped fetcher that throws on non-OK
 *   - `revalidateOnFocus: false` + `dedupingInterval: 30_000` so the
 *     panel doesn't refetch on every focus
 *   - Returns a typed result with `mutate()` for manual refresh
 *
 * Only fetches once the caller is admin (the page already gates this
 * by checking `useSession().user.role === "admin"`); the API would
 * return 403 to a non-admin caller anyway.
 */
import useSWR from "swr"

export type ChatbotAccess = "inherit" | "enabled" | "disabled"

export interface ChatbotUserOverride {
  userId: string
  email: string
  name: string | null
  access: ChatbotAccess
}

export interface ChatbotSettings {
  chatbotEnabled: boolean
  perUserOverrides: ChatbotUserOverride[]
}

const fetcher = async (url: string): Promise<ChatbotSettings> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  const data = (await res.json()) as Partial<ChatbotSettings>
  return {
    chatbotEnabled: Boolean(data.chatbotEnabled),
    perUserOverrides: data.perUserOverrides ?? [],
  }
}

interface UseAdminChatbotSettingsResult {
  settings: ChatbotSettings | null
  isLoading: boolean
  isError: boolean
  error: unknown
  mutate: () => Promise<ChatbotSettings | undefined>
}

export function useAdminChatbotSettings(): UseAdminChatbotSettingsResult {
  const { data, error, isLoading, mutate } = useSWR<ChatbotSettings>(
    "/api/admin/chatbot-settings",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30_000,
    },
  )

  return {
    settings: data ?? null,
    isLoading,
    isError: Boolean(error),
    error,
    mutate: () => mutate(),
  }
}
