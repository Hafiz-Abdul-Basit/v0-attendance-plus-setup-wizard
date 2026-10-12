/**
 * POST /api/auth/register/verify
 *
 * Body: { email: string, otp: string }
 *
 * Second step of sign-up when email verification is on: checks the
 * 6-digit code sent by /api/auth/register and, if it matches, creates the
 * account from the pending sign-up (201). Wrong codes count against the
 * pending row (OTP_MAX_ATTEMPTS) and the caller's IP; an expired or
 * exhausted code must be re-requested by registering again.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { OTP_MAX_ATTEMPTS, createUser, otpMatches } from "@/lib/registration"
import { getSupabaseAdmin } from "@/lib/supabase"

const Body = z.object({
  email: z.string().email().max(255).transform((s) => s.toLowerCase().trim()),
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
})

const EXPIRED = "This code has expired or was used up. Request a new code."

export async function POST(request: Request) {
  const limit = rateLimit(`register-verify:${getClientIp(request.headers)}`, 20, 15 * 60_000)
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = Body.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the 6-digit code from the email." }, { status: 400 })
  }
  const { email, otp } = parsed.data

  const supabase = getSupabaseAdmin()
  const { data: pending, error } = await supabase
    .from("pending_registrations")
    .select("email, name, password_hash, otp_hash, expires_at, attempts")
    .eq("email", email)
    .maybeSingle()
  if (error) {
    console.error("[register/verify] lookup failed:", error.message)
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 })
  }
  if (!pending || new Date(pending.expires_at).getTime() <= Date.now() || pending.attempts >= OTP_MAX_ATTEMPTS) {
    return NextResponse.json({ error: EXPIRED }, { status: 410 })
  }

  if (!otpMatches(email, otp, pending.otp_hash)) {
    const attempts = pending.attempts + 1
    await supabase.from("pending_registrations").update({ attempts }).eq("email", email)
    const left = OTP_MAX_ATTEMPTS - attempts
    return NextResponse.json(
      { error: left > 0 ? `Wrong code. ${left} attempt${left === 1 ? "" : "s"} left.` : EXPIRED },
      { status: left > 0 ? 400 : 410 },
    )
  }

  const result = await createUser(supabase, {
    email,
    name: pending.name,
    password_hash: pending.password_hash,
  })
  // Account created (or already existed) — the code is spent either way.
  if (result.ok || result.status === 409) {
    await supabase.from("pending_registrations").delete().eq("email", email)
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result.user, { status: 201 })
}
