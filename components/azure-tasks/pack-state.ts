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
