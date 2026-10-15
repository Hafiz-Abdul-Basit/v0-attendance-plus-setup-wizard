/**
 * GET /api/azure-tasks/clients/history
 *
 * Team-wide Export Pack log for the "Export history" tab: every recorded
 * export, newest first, with who made it.
 *   { exports: [{ id, client, exportedAt, byEmail, byName, isMine,
 *                 taskCount, rangeFrom, rangeTo }] }
 *
 * Read-only. The per-user "since your last export" logic (client picker,
 * export prompt) still comes from GET /api/azure-tasks/clients.
 * Auth: same as the rest of Azure Tasks (admin or can_see_azure_tasks).
 */
import { NextResponse } from "next/server"

import { requireAzureTasksAccess } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase"

/** Table not created yet (migration pending): PostgREST reports PGRST205, Postgres 42P01. */
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"])
const MAX_ROWS = 1000

export async function GET(request: Request) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth

  const { data, error } = await getSupabaseAdmin()
    .from("client_exports")
    .select("id, user_id, client_name, exported_at, range_from, range_to, task_count, user:users(email, name)")
    .order("exported_at", { ascending: false })
    .limit(MAX_ROWS)
  if (error) {
    if (MISSING_TABLE_CODES.has(error.code)) return NextResponse.json({ exports: [] })
    console.error("[azure-tasks/clients/history]", error.message)
    return NextResponse.json({ error: "Couldn't load the export history." }, { status: 500 })
  }

  const exports = (data ?? []).map((row) => {
    // `user` is the joined users row (null if that account was deleted).
    const raw = row.user as { email?: string; name?: string | null } | Array<{ email?: string; name?: string | null }> | null
    const user = Array.isArray(raw) ? raw[0] : raw
    return {
      id: row.id,
      client: row.client_name,
      exportedAt: row.exported_at,
      byEmail: user?.email ?? null,
      byName: user?.name ?? null,
      isMine: row.user_id === auth.userId,
      taskCount: row.task_count,
      rangeFrom: row.range_from,
      rangeTo: row.range_to,
    }
  })
  return NextResponse.json({ exports })
}
