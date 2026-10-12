/** Tiny localStorage helpers for the Export pack automation. Per-user keys go through `userKey()`. */

const LAST_EXPORT_KEY = "azure-pack-last-export"

/**
 * Per-user namespace for keys that belong to one person (last export).
 * Set from the signed-in session; until it is known nothing is read or
 * written, so two people sharing a browser never see each other's data.
 */
let userScope: string | null = null

export function setStorageUser(userId: string | null): void {
  userScope = userId
}

/** `key:userId`, or null while no user is known. */
export function userKey(key: string): string | null {
  return userScope ? `${key}:${userScope}` : null
}

export function getLastExport(): string | null {
  const key = userKey(LAST_EXPORT_KEY)
  if (!key) return null
  try {
    const v = window.localStorage.getItem(key)
    return v && !Number.isNaN(new Date(v).getTime()) ? v : null
  } catch {
    return null
  }
}

export function setLastExport(iso: string): void {
  const key = userKey(LAST_EXPORT_KEY)
  if (!key) return
  try {
    window.localStorage.setItem(key, iso)
  } catch {
    /* best effort */
  }
}

/** Drop pre-namespacing keys that were shared by every user of the browser. */
export function removeLegacySharedKeys(): void {
  try {
    window.localStorage.removeItem(LAST_EXPORT_KEY)
    window.localStorage.removeItem("azure-pack-client")
  } catch {
    /* ignore */
  }
}

/** Ask once (from a click) so a "pack ready" notification can reach you in another tab. */
export function requestNotifyPermission(): void {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission()
    }
  } catch {
    /* unsupported */
  }
}

const ACTIVE_KEY = "azure-pack-active"

/** A run that was in progress — lets the next page load say "interrupted" instead of silently losing it. */
export function saveActiveRun(v: unknown): void {
  try {
    window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(v))
  } catch {
    /* best effort */
  }
}
export function clearActiveRun(): void {
  try {
    window.localStorage.removeItem(ACTIVE_KEY)
  } catch {
    /* best effort */
  }
}
export function readActiveRun<T>(): T | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
