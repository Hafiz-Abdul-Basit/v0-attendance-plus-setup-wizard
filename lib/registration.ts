/**
 * Sign-up helpers shared by /api/auth/register and /api/auth/register/verify.
 *
 * Flow:
 *   1. register: validate + domain check. If email is configured
 *      (lib/email.ts), park the sign-up in `pending_registrations` and email
 *      a 6-digit code; otherwise create the user straight away.
 *   2. verify:   check the code, then create the user.
 *
 * Only a hash of the code is stored (keyed with NEXTAUTH_SECRET), it expires
 * after OTP_TTL_MS and allows OTP_MAX_ATTEMPTS wrong guesses.
 */
import "server-only"

import crypto from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

/** Sign-up is limited to these email domains unless ALLOWED_EMAIL_DOMAINS overrides it. */
const DEFAULT_ALLOWED_DOMAINS = ["raaweek12.com"]

export const OTP_TTL_MS = 10 * 60_000
export const OTP_MAX_ATTEMPTS = 5

/**
 * Domains allowed to sign up. ALLOWED_EMAIL_DOMAINS (comma-separated)
 * overrides the default; set it to "*" to allow any domain.
 */
export function allowedDomains(): string[] | null {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS?.trim()
  if (raw === "*") return null
  const list = (raw ? raw.split(",") : DEFAULT_ALLOWED_DOMAINS)
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean)
  return list.length > 0 ? list : null
}

/** Error message when `email` isn't allowed to sign up, else null. */
export function domainError(email: string): string | null {
  const domains = allowedDomains()
  if (!domains) return null
  if (domains.includes(email.split("@")[1] ?? "")) return null
  return `Sign-up is limited to ${domains.map((d) => `@${d}`).join(", ")} email addresses.`
}

export function generateOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0")
}

export function hashOtp(email: string, otp: string): string {
  return crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "")
    .update(`${email}:${otp}`)
    .digest("hex")
}

export function otpMatches(email: string, otp: string, storedHash: string): boolean {
  const a = Buffer.from(hashOtp(email, otp), "hex")
  const b = Buffer.from(storedHash, "hex")
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Insert the user. The very first user of an empty deployment becomes admin
 * (bootstrap); everyone else is a plain user with every tab hidden until an
 * admin grants it.
 */
export async function createUser(
  supabase: SupabaseClient,
  user: { email: string; name: string | null; password_hash: string },
): Promise<
  | { ok: true; user: { id: string; email: string; name: string | null; role: string } }
  | { ok: false; status: number; error: string }
> {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", user.email)
    .maybeSingle()
  if (existing) {
    return { ok: false, status: 409, error: "An account with this email already exists." }
  }

  // Nobody is promoted by email address: only the first user of an empty
  // deployment becomes admin; promote others from the Admin Panel.
  const { count: adminCount, error: countError } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
  if (countError) return { ok: false, status: 500, error: "Failed to create account." }
  const isBootstrap = (adminCount ?? 0) === 0

  if (process.env.REGISTRATION_DISABLED === "true" && !isBootstrap) {
    return { ok: false, status: 403, error: "Sign-up is disabled. Ask an admin to create your account." }
  }

  const { data, error } = await supabase
    .from("users")
    .insert({ ...user, role: isBootstrap ? "admin" : "user" })
    .select("id, email, name, role")
    .single()
  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error("[register] insert failed:", error?.message)
    return { ok: false, status: 500, error: "Failed to create account." }
  }
  return { ok: true, user: data }
}
