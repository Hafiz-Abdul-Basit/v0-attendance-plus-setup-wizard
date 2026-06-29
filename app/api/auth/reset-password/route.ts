/**
 * POST /api/auth/reset-password
 *
 * Body: { token: string, password: string }
 *
 * Consumes a one-time password-reset token:
 *   1. Look up the user by `password_reset_token`.
 *   2. Reject if no row matches OR `password_reset_expires <= now()`.
 *   3. Hash the new password (bcrypt, 12 rounds), update `password_hash`,
 *      and NULL out both reset columns so the token can't be reused.
 *
 * Requires schema columns: users.password_reset_token, users.password_reset_expires
 * (added in supabase/schema.sql).
 */
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { getSupabaseAdmin } from "@/lib/supabase"

const Body = z.object({
  token: z.string().min(10).max(128),
  password: z.string().min(8).max(128),
})

export async function POST(request: Request) {
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

  const { token, password } = parsed.data
  const supabase = getSupabaseAdmin()

  const { data: user, error: lookupErr } = await supabase
    .from("users")
    .select("id, password_reset_expires")
    .eq("password_reset_token", token)
    .maybeSingle()

  if (lookupErr) {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 })
  }
  if (!user || !user.password_reset_expires) {
    return NextResponse.json(
      { error: "Invalid or expired reset link." },
      { status: 400 },
    )
  }

  if (new Date(user.password_reset_expires).getTime() <= Date.now()) {
    // Clear the expired token so the same row can't be retried.
    await supabase
      .from("users")
      .update({ password_reset_token: null, password_reset_expires: null })
      .eq("id", user.id)
    return NextResponse.json(
      { error: "This reset link has expired. Please request a new one." },
      { status: 400 },
    )
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { error: updateErr } = await supabase
    .from("users")
    .update({
      password_hash,
      password_reset_token: null,
      password_reset_expires: null,
    })
    .eq("id", user.id)

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message ?? "Failed to update password" },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}