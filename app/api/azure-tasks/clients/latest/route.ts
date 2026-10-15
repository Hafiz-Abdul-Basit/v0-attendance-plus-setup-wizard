/**
 * GET /api/azure-tasks/clients/latest
 *
 * Team-wide, read-only view: for every client, when the most recent Export
 * Pack went out and who exported it (email). Task counts stay private.
 * Shown to everyone with Azure Tasks access:
 *   { clients: [{ name, lastAt, byEmail }] }   newest first
 *
 * Each user's own history stays private in GET /api/azure-tasks/clients.
 */
import { NextResponse } from "next/server"

import { requireAzureTasksAccess } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase"

/** Table not created yet (migration pending): PostgREST reports PGRST205, Postgres 42P01. */
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"])

export async function GET(request: Request) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth

  const { data, error } = await getSupabaseAdmin()
    .from("client_exports")
    .select("client_name, exported_at, user:users(email)")
    .order("exported_at", { ascending: false })
    .limit(5000)
  if (error) {
    if (MISSING_TABLE_CODES.has(error.code)) return NextResponse.json({ clients: [] })
    console.error("[azure-tasks/clients/latest]", error.message)
    return NextResponse.json({ error: "Couldn't load the delivery history." }, { status: 500 })
  }

  // Rows are newest-first, so the first row per client is its latest.
  const latest = new Map<string, { name: string; lastAt: string; byEmail: string | null }>()
  for (const row of data ?? []) {
    const key = String(row.client_name).toLowerCase()
    if (latest.has(key)) continue
    // `user` is the joined users row (null if that account was deleted).
    const user = row.user as { email?: string } | { email?: string }[] | null
    const byEmail = (Array.isArray(user) ? user[0]?.email : user?.email) ?? null
    latest.set(key, { name: row.client_name, lastAt: row.exported_at, byEmail })
  }
  return NextResponse.json({ clients: Array.from(latest.values()) })
}
