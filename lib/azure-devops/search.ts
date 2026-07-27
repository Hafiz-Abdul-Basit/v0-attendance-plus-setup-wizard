/**
 * Pure search helpers for the Azure Tasks panel.
 *
 * Kept in their own module (no `"server-only"`, no `server-only`
 * transitive deps) so client components can import the parser to
 * render hints like "Searching by id" without dragging the
 * `server-only` marker from `./service` into the browser bundle.
 *
 * Used by:
 *   - `lib/azure-devops/service.ts` (server-side filter)
 *   - `lib/azure-devops/client-safe.ts` (re-exported for the panel)
 */

export interface ParsedSearch {
  idTerm?: number
  textTerm?: string
}

/**
 * Parse the free-text search box into the parts we can match.
 *
 *   "#123"   → { idTerm: 123 }    — explicit id search (any length)
 *   "123"    → { idTerm: 123 }    — bare digits ≥ 2 chars
 *   "auth"   → { textTerm: "auth" } — free-text against title/desc/tags
 *   "12"     → { idTerm: 12 }     — substring match on ids (e.g. typing
 *                                     "12" matches 12, 120, 1245…)
 *
 * Why ≥2 chars for bare digits: a 1-char search like "1" would otherwise
 * also match the literal "1" anywhere in a title/description and feel
 * surprising. Two chars is a comfortable threshold — most real ids in a
 * project are 3-5 digits, so partial typing still works.
 */
export function parseSearchQuery(raw: string): ParsedSearch {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return {}
  const hashMatch = trimmed.match(/^#(\d+)$/)
  if (hashMatch) return { idTerm: Number(hashMatch[1]) }
  if (/^\d{2,}$/.test(trimmed)) return { idTerm: Number(trimmed) }
  return { textTerm: trimmed.toLowerCase() }
}

/** True if the search box currently parses as an id-only search. */
export function isIdOnlySearch(raw: string): boolean {
  return parseSearchQuery(raw).textTerm === undefined
    && parseSearchQuery(raw).idTerm !== undefined
}
