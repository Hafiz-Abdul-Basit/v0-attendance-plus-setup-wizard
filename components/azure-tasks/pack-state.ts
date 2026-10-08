/** Tiny localStorage helpers for the Export pack automation. */

const LAST_EXPORT_KEY = "azure-pack-last-export"

export function getLastExport(): string | null {
  try {
    const v = window.localStorage.getItem(LAST_EXPORT_KEY)
    return v && !Number.isNaN(new Date(v).getTime()) ? v : null
  } catch {
    return null
  }
}

export function setLastExport(iso: string): void {
  try {
    window.localStorage.setItem(LAST_EXPORT_KEY, iso)
  } catch {
    /* best effort */
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
