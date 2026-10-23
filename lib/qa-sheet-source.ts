/**
 * Read the QA workbook straight from a Google Sheets link.
 *
 * The sheet must be shared as "Anyone with the link → Viewer". We download
 * the whole workbook as .xlsx (Google's export endpoint) and hand it to
 * parseQaSheet(), which picks the "Att Plus" tab by name — so it doesn't
 * matter which tab the link was copied from.
 *
 * Security: the server only ever fetches docs.google.com and Google's
 * download host (*.googleusercontent.com), following redirects manually
 * and re-checking each hop, so a pasted link can't make the server call
 * arbitrary or internal URLs.
 */
import "server-only"

import { parseQaSheet, QaSheetError, type ParsedQaSheet } from "@/lib/qa-sheet"

const MAX_BYTES = 10 * 1024 * 1024
const TIMEOUT_MS = 20_000
const MAX_REDIRECTS = 5

/** Spreadsheet id from any docs.google.com/spreadsheets/d/<id>/... link, or null. */
export function googleSheetId(url: string): string | null {
  let u: URL
  try {
    u = new URL(url.trim())
  } catch {
    return null
  }
  if (u.protocol !== "https:" || u.hostname !== "docs.google.com") return null
  const m = u.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/)
  return m ? m[1] : null
}

/** Canonical link we store and show (no tab / query noise). */
export function canonicalSheetUrl(id: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}/edit`
}

function allowedHost(host: string): boolean {
  return host === "docs.google.com" || host.endsWith(".googleusercontent.com")
}

export async function fetchGoogleQaSheet(url: string): Promise<ParsedQaSheet> {
  const id = googleSheetId(url)
  if (!id) {
    throw new QaSheetError("Paste a Google Sheets link (https://docs.google.com/spreadsheets/d/…).")
  }

  let next = `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`
  let res: Response | null = null
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const target = new URL(next)
    if (target.protocol !== "https:" || !allowedHost(target.hostname)) {
      throw new QaSheetError("Google redirected somewhere unexpected. Check the sheet's sharing settings.")
    }
    try {
      res = await fetch(target, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS) })
    } catch {
      throw new QaSheetError("Couldn't reach Google Sheets. Try again in a moment.")
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location")
      if (!loc) break
      next = new URL(loc, target).toString()
      res = null
      continue
    }
    break
  }
  if (!res) throw new QaSheetError("Too many redirects from Google Sheets.")
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    throw new QaSheetError('Google won\'t share this sheet. Set Share → General access → "Anyone with the link" → Viewer.')
  }
  if (!res.ok) throw new QaSheetError(`Google Sheets returned an error (${res.status}).`)

  const type = res.headers.get("content-type") ?? ""
  if (type.includes("text/html")) {
    // Private sheets bounce to a Google sign-in page instead of a 403.
    throw new QaSheetError('This sheet isn\'t public. Set Share → General access → "Anyone with the link" → Viewer.')
  }
  const len = Number(res.headers.get("content-length") ?? 0)
  if (len > MAX_BYTES) throw new QaSheetError("The Google Sheet is larger than 10 MB.")
  const buf = await res.arrayBuffer()
  if (buf.byteLength > MAX_BYTES) throw new QaSheetError("The Google Sheet is larger than 10 MB.")
  return parseQaSheet(buf)
}
