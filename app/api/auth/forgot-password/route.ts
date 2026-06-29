/**
 * POST /api/auth/forgot-password
 *
 * Body: { email: string }
 *
 * Always returns `{ ok: true }` to avoid email-enumeration leaks. If the
 * account exists, generate a one-time token (1-hour expiry), store it on
 * the user row, and hand the URL to `sendPasswordResetEmail(...)`. In dev
 * (NODE_ENV !== 'production'), the API also echoes the link back in the
 * response so the developer can click through without an SMTP setup.
 *
 * Requires schema columns: users.password_reset_token, users.password_reset_expires
 * (added in supabase/schema.sql).
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import crypto from "node:crypto"

import { getSupabaseAdmin } from "@/lib/supabase"
import { sendPasswordResetEmail } from "@/lib/passwordResetEmail"

const Body = z.object({
  email: z.string().email().max(255).transform((s) => s.toLowerCase().trim()),
})

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: true }) // still 200 to avoid leak
  }

  const parsed = Body.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ ok: true }) // invalid body — same response
  }
  const { email } = parsed.data

  const supabase = getSupabaseAdmin()
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (!user) {
    // No account, but we don't tell the caller that.
    return NextResponse.json({ ok: true })
  }

  const token = crypto.randomUUID()
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from("users")
    .update({
      password_reset_token: token,
      password_reset_expires: expires,
    })
    .eq("id", user.id)

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[forgot-password] failed to store token", error)
    return NextResponse.json({ ok: true })
  }

  const base =
    process.env.NEXTAUTH_URL ?? new URL(request.url).origin
  const resetUrl = `${base.replace(/\/$/, "")}/reset-password?token=${token}`

  // Best-effort email send — never throws to the caller (see plan).
  try {
    await sendPasswordResetEmail(email, resetUrl)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[forgot-password] email send failed", e)
  }

  // eslint-disable-next-line no-console
  console.log("[forgot-password] dev reset link:", resetUrl)

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json({ ok: true, devResetLink: resetUrl })
  }
  return NextResponse.json({ ok: true })
}