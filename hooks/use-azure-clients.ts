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
  /** This user's latest export for the client (`byEmail` is always the signed-in user). */
  lastExport: { at: string; taskCount: number; byEmail: string } | null
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

export interface ClientDelivery {
  name: string
  /** When the latest Export Pack for this client went out (by anyone). */
  lastAt: string
  /** Who exported it; null if that account was deleted. */
  byEmail: string | null
}

/**
 * Team-wide "last delivery per client" list (read-only: name, date, exporter email)
 * from GET /api/azure-tasks/clients/latest. Fetched only when `enabled`
 * (i.e. when the dialog is open).
 */
export function useClientDeliveries(enabled: boolean) {
  const swr = useSWR<{ clients: ClientDelivery[] }>(
    enabled ? "/api/azure-tasks/clients/latest" : null,
    async (url: string) => {
      const res = await fetch(url, { credentials: "include" })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Failed to load history (${res.status})`)
      }
      return (await res.json()) as { clients: ClientDelivery[] }
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )
  return {
    deliveries: swr.data?.clients ?? [],
    error: swr.error instanceof Error ? swr.error.message : null,
    isLoading: swr.isLoading,
  }
}

/** One recorded Export Pack, from anyone on the team. */
export interface TeamExport {
  id: string
  client: string
  exportedAt: string
  /** Null if that account was deleted. */
  byEmail: string | null
  byName: string | null
  /** Exported by the signed-in user. */
  isMine: boolean
  taskCount: number
  rangeFrom: string | null
  rangeTo: string | null
}

export const TEAM_EXPORTS_KEY = "/api/azure-tasks/clients/history"

/**
 * Team-wide Export Pack log (newest first) for the Export history tab.
 * Revalidate after an export with `mutate(TEAM_EXPORTS_KEY)` from swr.
 */
export function useTeamExports(enabled: boolean) {
  const swr = useSWR<{ exports: TeamExport[] }>(
    enabled ? TEAM_EXPORTS_KEY : null,
    async (url: string) => {
      const res = await fetch(url, { credentials: "include" })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? `Failed to load export history (${res.status})`)
      }
      return (await res.json()) as { exports: TeamExport[] }
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )
  return {
    exports: swr.data?.exports ?? [],
    error: swr.error instanceof Error ? swr.error.message : null,
    isLoading: swr.isLoading,
  }
}
