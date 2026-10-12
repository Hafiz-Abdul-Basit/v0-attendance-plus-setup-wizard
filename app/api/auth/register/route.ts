/**
 * POST /api/auth/register
 *
 * Body: { email: string, password: string, name?: string }
 * - Validates with zod; only allowed email domains may sign up
 *   (default @raaweek12.com, override with ALLOWED_EMAIL_DOMAINS)
 * - When email is configured (RESEND_API_KEY + EMAIL_FROM): stores the
 *   sign-up in pending_registrations, emails a 6-digit code and returns
 *   202 { otpRequired: true } — finish with POST /api/auth/register/verify.
 *   Calling this again re-sends a fresh code.
 * - Otherwise (or before the pending_registrations migration is applied):
 *   creates the user immediately and returns 201.
 * - Returns 409 if the email already has an account.
 * Rate limited per IP. See lib/registration.ts for the shared rules.
 */
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { isEmailConfigured, sendEmail } from "@/lib/email"
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"
import {
  OTP_TTL_MS,
  createUser,
  domainError,
  generateOtp,
  hashOtp,
} from "@/lib/registration"
import { getSupabaseAdmin } from "@/lib/supabase"

/** Each code (re)send counts, so this also caps OTP email spam. */
const REGISTER_MAX_PER_IP = 10
const REGISTER_WINDOW_MS = 60 * 60_000
/** Table not created yet (migration pending): PostgREST reports PGRST205, Postgres 42P01. */
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"])

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
  const notAllowed = domainError(email)
  if (notAllowed) {
    return NextResponse.json({ error: notAllowed }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()
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

  const password_hash = await bcrypt.hash(password, 12)

  // ── Email verification (OTP) when email can be sent ──────────────────
  if (isEmailConfigured()) {
    const otp = generateOtp()
    const { error: pendingError } = await supabase.from("pending_registrations").upsert({
      email,
      name: name ?? null,
      password_hash,
      otp_hash: hashOtp(email, otp),
      expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      attempts: 0,
      created_at: new Date().toISOString(),
    })

    if (!pendingError) {
      const minutes = Math.round(OTP_TTL_MS / 60_000)
      const sent = await sendEmail({
        to: email,
        subject: `${otp} is your AttendancePlus sign-up code`,
        text: `Your sign-up code is ${otp}. It expires in ${minutes} minutes.\n\nIf you didn't try to create an account, ignore this email.`,
        html: `<p>Your sign-up code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${otp}</p><p>It expires in ${minutes} minutes.</p><p>If you didn't try to create an account, ignore this email.</p>`,
      })
      if (!sent) {
        return NextResponse.json(
          { error: "Couldn't send the verification code. Please try again in a moment." },
          { status: 502 },
        )
      }
      return NextResponse.json({ otpRequired: true, email }, { status: 202 })
    }

    if (!MISSING_TABLE_CODES.has(pendingError.code)) {
      console.error("[register] pending insert failed:", pendingError.message)
      return NextResponse.json({ error: "Failed to create account." }, { status: 500 })
    }
    // Migration not applied yet — fall through to direct sign-up.
    console.warn("[register] pending_registrations table missing; skipping email verification.")
  }

  // ── No email verification: create the account now ────────────────────
  const result = await createUser(supabase, { email, name: name ?? null, password_hash })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.user, { status: 201 })
}
