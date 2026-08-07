/**
 * Chatbot settings — server-only helpers.
 *
 * Centralises all reads of the master `chatbot_enabled` toggle and the
 * per-user `chatbot_access` override. The chat widget, the
 * /api/chatbot-status endpoint, the /api/chat endpoint, and the admin
 * chatbot-settings API all funnel through these helpers so the rules
 * stay in one place.
 *
 * Resolution rules (per spec):
 *   - Global OFF always wins, regardless of the per-user override.
 *   - If global is ON:
 *       access='inherit'  → enabled (follows global)
 *       access='enabled'  → enabled
 *       access='disabled' → disabled
 *   - If the `chatbot_access` column is missing (migration pending),
 *     every user falls back to 'inherit' / follows global.
 *
 * Caching: module-level Maps with a 30 s TTL, mirroring the
 * `loadTabVisibilityFlags` pattern in `lib/auth.ts`. Admins can call
 * `invalidateChatbotCache()` after a toggle to skip the wait.
 *
 * IMPORTANT: this module calls `getSupabaseAdmin()` which uses the
 * service-role key. Never import this from a "use client" file.
 */
import { getSupabaseAdmin } from "@/lib/supabase"

const ENABLE_KEY = "chatbot_enabled"
const CACHE_TTL_MS = 30_000

export type ChatbotAccess = "inherit" | "enabled" | "disabled"

// ── Global toggle cache ──────────────────────────────────────────────
let globalCache: { enabled: boolean; cachedAt: number } | null = null

export async function getChatbotEnabled(): Promise<boolean> {
  if (globalCache && Date.now() - globalCache.cachedAt < CACHE_TTL_MS) {
    return globalCache.enabled
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", ENABLE_KEY)
      .maybeSingle()
    if (error) {
      // Most likely the table doesn't exist yet (migration pending).
      // Default to true so the widget still works.
      // eslint-disable-next-line no-console
      console.warn(
        "[chatbot] app_settings read failed (defaulting to enabled):",
        error.message,
      )
      globalCache = { enabled: true, cachedAt: Date.now() }
      return true
    }
    const raw = data?.value
    // JSONB values come back as their parsed native type. Accept both
    // JSONB `true` (preferred) and a stringified "true" (defensive, in
    // case a row was inserted via raw SQL without `::jsonb`).
    const enabled: boolean = raw === true || raw === "true"
    globalCache = { enabled, cachedAt: Date.now() }
    return enabled
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[chatbot] failed to read global toggle:", e)
    return true
  }
}

// ── Per-user override cache ──────────────────────────────────────────
const accessCache = new Map<
  string,
  { access: ChatbotAccess; cachedAt: number }
>()

async function loadChatbotAccess(userId: string): Promise<ChatbotAccess> {
  const cached = accessCache.get(userId)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.access
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("users")
      .select("chatbot_access")
      .eq("id", userId)
      .maybeSingle()
    if (error) {
      if (/chatbot_access/.test(error.message)) {
        // Column missing — fall back to inherit.
        // eslint-disable-next-line no-console
        console.warn(
          "[chatbot] chatbot_access column missing (run latest migration):",
          error.message,
        )
      }
      accessCache.set(userId, { access: "inherit", cachedAt: Date.now() })
      return "inherit"
    }
    const raw = data?.chatbot_access
    const access: ChatbotAccess =
      raw === "enabled" || raw === "disabled" ? raw : "inherit"
    accessCache.set(userId, { access, cachedAt: Date.now() })
    return access
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[chatbot] failed to read per-user override:", e)
    return "inherit"
  }
}

/**
 * Resolve whether a given user should currently have access to the
 * chatbot. Returns `false` for unauthenticated callers, and follows
 * Global-OFF-always-wins semantics for everyone else.
 *
 * Pass `null` if the request is unauthenticated; the function will
 * return `false` without touching the DB.
 */
export async function resolveChatbotAccess(
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false

  const globalEnabled = await getChatbotEnabled()
  if (!globalEnabled) return false

  const access = await loadChatbotAccess(userId)
  if (access === "disabled") return false
  return true
}

/**
 * Bust the in-process caches. Called by the admin POST handler after a
 * toggle so the change is visible immediately (well under the 30 s TTL).
 *
 * - No userId → clear everything (global toggle changed).
 * - userId set → only that user's per-user override was changed; clear
 *   the global cache too so a stale `false` global can't shadow an
 *   override change.
 */
export function invalidateChatbotCache(userId?: string) {
  globalCache = null
  if (userId) accessCache.delete(userId)
  else accessCache.clear()
}
