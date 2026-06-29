/**
 * POST /api/auth/register
 *
 * Body: { email: string, password: string, name?: string }
 * - Validates with zod
 * - Hashes password with bcrypt (12 rounds)
 * - Inserts into public.users
 * - Returns 409 if email already exists
 */
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { getSupabaseAdmin } from "@/lib/supabase"

const Body = z.object({
  email: z.string().email().max(255).transform((s) => s.toLowerCase().trim()),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(80).optional(),
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

  const { email, password, name } = parsed.data
  const supabase = getSupabaseAdmin()

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
  // the very first registered user becomes admin automatically.
  // Additionally, the designated admin email is always promoted to admin
  // on registration — this matches the SQL backfill in supabase/schema.sql.
  const { count: adminCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
  const isDesignatedAdmin = email === "a.basit.freelancer@gmail.com"
  const role: "user" | "admin" =
    isDesignatedAdmin || (adminCount ?? 0) === 0 ? "admin" : "user"

  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabase
    .from("users")
    .insert({ email, password_hash, name: name ?? null, role })
    .select("id, email, name, role")
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create account." },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { id: data.id, email: data.email, name: data.name, role: data.role },
    { status: 201 },
  )
}
