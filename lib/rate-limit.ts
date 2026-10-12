/**
 * Tiny in-memory fixed-window rate limiter.
 *
 * Used to slow down password guessing, reset-email spam, mass sign-ups
 * and Gemini quota burn. State lives in the server process, so on Vercel
 * each instance counts separately — it is a speed bump, not a hard
 * guarantee. Swap the Map for Redis / Upstash if a strict global limit is
 * ever needed; the call sites don't need to change.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

export interface RateLimitResult {
  ok: boolean
  /** Seconds until the window resets (for Retry-After). */
  retryAfter: number
}

/**
 * Count one hit against `key` and report whether it is still within
 * `limit` hits per `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
    if (buckets.size > MAX_BUCKETS) sweep(now)
  }
  bucket.count += 1
  return {
    ok: bucket.count <= limit,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  }
}

/** Forget a key — e.g. clear failed-login counts after a successful login. */
export function resetRateLimit(key: string): void {
  buckets.delete(key)
}

function sweep(now: number) {
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
  // Still too big (a flood of unique keys) — drop the oldest entries.
  for (const k of buckets.keys()) {
    if (buckets.size <= MAX_BUCKETS) break
    buckets.delete(k)
  }
}

/**
 * Best-effort client IP from proxy headers (Vercel sets x-forwarded-for).
 * Accepts a Headers object or NextAuth's plain header record.
 */
export function getClientIp(
  headers: Headers | Record<string, string | string[] | undefined> | undefined,
): string {
  if (!headers) return "unknown"
  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined
    const v = headers[name]
    return Array.isArray(v) ? v[0] : v
  }
  const forwarded = get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return get("x-real-ip")?.trim() || "unknown"
}

/** Standard 429 JSON body + Retry-After header. */
export function tooManyRequests(retryAfter: number, message?: string) {
  return new Response(
    JSON.stringify({
      error: message ?? `Too many requests. Try again in ${retryAfter} seconds.`,
    }),
    {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
    },
  )
}
