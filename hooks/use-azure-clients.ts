"use client"

/**
 * useAzureClients — the clients an Export Pack can be made for (agents in
 * the Azure DevOps agent pools) plus the signed-in user's last export for
 * each. Backed by GET /api/azure-tasks/clients.
 *
 * Agents change rarely, so the list is not refetched on focus; call
 * `refresh()` after an export finishes to pick up the new "last export".
 */
import useSWR from "swr"

export interface AzureClientOption {
  name: string
  /** Agent pool the client's agent lives in; null when the agent no longer exists. */
  pool: string | null
  online: boolean
  lastExport: { at: string; taskCount: number } | null
}

interface ClientsResponse {
  clients: AzureClientOption[]
  agentsError?: string
  historyUnavailable?: boolean
}

const fetcher = async (url: string): Promise<ClientsResponse> => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Failed to load clients (${res.status})`)
  }
  return (await res.json()) as ClientsResponse
}

export function useAzureClients(enabled = true) {
  const swr = useSWR<ClientsResponse>(enabled ? "/api/azure-tasks/clients" : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })
  return {
    clients: swr.data?.clients ?? [],
    agentsError: swr.data?.agentsError ?? null,
    historyUnavailable: swr.data?.historyUnavailable ?? false,
    error: swr.error instanceof Error ? swr.error.message : null,
    isLoading: swr.isLoading,
    refresh: () => swr.mutate(),
  }
}
