/**
 * POST /api/auth/register
 *
 * Body: { email: string, password: string, name?: string }
 * - Validates with zod
 * - Hashes password with bcrypt (12 rounds)
 * - Inserts into public.users
 * - Returns 409 if email already exists
 *
 * Registration policy (env, optional):
 *   - REGISTRATION_DISABLED=true    — no new sign-ups (except the very first
 *                                     user of an empty deployment).
 *   - ALLOWED_EMAIL_DOMAINS=a.com,b.com — only these email domains may sign up.
 * Rate limited per IP to stop mass account creation.
 */
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { getSupabaseAdmin } from "@/lib/supabase"
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"

const REGISTER_MAX_PER_IP = 5
const REGISTER_WINDOW_MS = 60 * 60_000

function allowedDomains(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean)
}

const Body = z.object({
  email: z.string().email().max(255).transform((s) => s.toLowerCase().trim()),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80).optional(),
})

export async function POST(request: Request) {
  const limit = rateLimit(
    `register:${getClientIp(request.headers)}`,
    REGISTER_MAX_PER_IP,
    REGISTER_WINDOW_MS,
  )
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfter, "Too many sign-up attempts. Please try again later.")
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = Body.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { email, password, name } = parsed.data
  const supabase = getSupabaseAdmin()

  const domains = allowedDomains()
  if (domains.length > 0 && !domains.includes(email.split("@")[1] ?? "")) {
    return NextResponse.json(
      { error: "Sign-up is limited to approved email domains. Ask an admin for access." },
      { status: 403 },
    )
  }

  // Check for existing user explicitly so we can return a clean 409
  // (the unique constraint would also catch it, but the error message is opaque).
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    )
  }

  // Bootstrap: if no admins exist yet (fresh deploy / freshly emptied DB),
  // the very first registered user becomes admin automatically. Nobody is
  // promoted by email address — emails aren't verified, so anyone could
  // register a "designated" address that hasn't signed up yet.
  const { count: adminCount, error: countError } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
  if (countError) {
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 })
  }
  const isBootstrap = (adminCount ?? 0) === 0

  if (process.env.REGISTRATION_DISABLED === "true" && !isBootstrap) {
    return NextResponse.json(
      { error: "Sign-up is disabled. Ask an admin to create your account." },
      { status: 403 },
    )
  }
  const role: "user" | "admin" = isBootstrap ? "admin" : "user"

  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabase
    .from("users")
    .insert({ email, password_hash, name: name ?? null, role })
    .select("id, email, name, role")
    .single()

  if (error || !data) {
    // Log the DB error server-side; don't leak schema details to the client.
    // eslint-disable-next-line no-console
    console.error("[register] insert failed:", error?.message)
    return NextResponse.json(
      { error: "Failed to create account." },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { id: data.id, email: data.email, name: data.name, role: data.role },
    { status: 201 },
  )
}
