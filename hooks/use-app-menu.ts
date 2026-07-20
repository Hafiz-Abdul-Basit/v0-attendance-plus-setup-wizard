"use client"

/**
 * useAppMenu — single source of truth for the active main-app menu.
 *
 * Mirrors `hooks/use-snippets.ts`:
 *   - SWR shares the cache across components (wizard + menu page).
 *   - `dedupingInterval: 30_000` so tab switches don't refetch.
 *   - `revalidateOnFocus: false` (the menu is admin-controlled).
 *
 * Returns the active menu (or null if none has been uploaded yet),
 * plus a `saveJson()` helper that PATCHes the menu row with a new
 * `json` payload and updates the SWR cache optimistically. This is
 * what the inline tree editor calls after a rename / add / delete.
 */
import useSWR from "swr"

export interface MenuItem {
  ID?: string | null
  Name: string
  DisplayName?: string | null
  Sequence?: number
  Claims?: string[]
  Children?: MenuItem[]
  routerLink?: string | null
  Count?: string | number | null
  actionType?: string | null
  target?: string | null
}

export interface MenuDoc {
  _id?: string | null
  MenuItems: MenuItem[]
}

export interface ActiveMenu {
  id: string
  name: string
  json: MenuDoc
  is_active: boolean
  created_at: string
  updated_at: string
}

interface UseAppMenuResult {
  menu: ActiveMenu | null
  isLoading: boolean
  isError: boolean
  error: unknown
  /** Re-fetch the menu from the server (used after upload). */
  refresh: () => Promise<ActiveMenu | null | undefined>
  /**
   * Persist a new `json` to the active menu and update the local
   * SWR cache optimistically. Resolves with the server-confirmed
   * menu row, or throws on failure (the cache is rolled back).
   */
  saveJson: (json: MenuDoc) => Promise<ActiveMenu>
}

const fetcher = async (url: string): Promise<ActiveMenu | null> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const json = (await res.json()) as { menu: ActiveMenu | null }
  return json.menu ?? null
}

export function useAppMenu(): UseAppMenuResult {
  const swr = useSWR<ActiveMenu | null>("/api/app-menus", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  })
  const { data, error, isLoading, mutate } = swr

  /**
   * PATCH /api/app-menus/[id] with the new json. We:
   *   1. Snapshot the current cache so we can roll back on error.
   *   2. Optimistically write the new json + a bumped updated_at so
   *      the navbar reflects the change immediately.
   *   3. Re-fetch on success to pull the server's actual updated_at.
   *   4. Roll back to the snapshot on failure.
   */
  const saveJson = async (json: MenuDoc): Promise<ActiveMenu> => {
    const current = data ?? null
    if (!current) {
      throw new Error("No active menu to update — upload one first.")
    }
    const optimistic: ActiveMenu = {
      ...current,
      json,
      updated_at: new Date().toISOString(),
    }
    // Fire-and-forget: the optimistic value is written synchronously,
    // and any subscriber (navbar, tree) re-renders right away.
    void mutate(optimistic, { revalidate: false })

    try {
      const res = await fetch(`/api/app-menus/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        menu?: ActiveMenu
        error?: string
      }
      if (!res.ok || !body.menu) {
        throw new Error(body.error || `Save failed (${res.status})`)
      }
      // Pull the server's authoritative row (real updated_at, etc.).
      void mutate(body.menu, { revalidate: false })
      return body.menu
    } catch (err) {
      // Roll back so the UI matches reality.
      void mutate(current, { revalidate: false })
      throw err
    }
  }

  return {
    menu: data ?? null,
    isLoading,
    isError: Boolean(error),
    error,
    refresh: () => mutate(),
    saveJson,
  }
}
