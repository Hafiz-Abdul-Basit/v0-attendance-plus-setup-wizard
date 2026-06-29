/**
 * /api/admin/activity — admin-only 7-day activity summary for the admin
 * dashboard tiles.
 *
 * Returns:
 *   - newUsers          — count of users created in the window
 *   - newSnippets       — count of snippets created in the window
 *   - topAuthors        — top 5 authors by ALL-TIME snippet count
 *                         (all-time so the tile isn't blank on a fresh
 *                         deployment)
 *   - topCategories     — top 5 categories by ALL-TIME snippet count
 *   - recentSnippets    — last 5 snippets created in the window
 *   - recentUsers       — last 5 users created in the window
 *
 * No new schema columns. The `created_at` columns on `users` and
 * `snippets` are sufficient. If the tables grow past ~100k rows, add
 * btree indexes on `(created_at)` for both tables — left out now to
 * keep the diff scoped.
 */
import { NextResponse } from "next/server"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

const WINDOW_DAYS = 7
const TOP_LIMIT = 5

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const supabase = getSupabaseAdmin()

  // Postgres interval syntax — Supabase JS doesn't expose a helper for
  // "created in the last N days" so we filter with an ISO cutoff and the
  // `.gte` filter. Pre-computing the cutoff once and reusing it everywhere
  // keeps the window consistent if the queries straddle midnight.
  const cutoffIso = new Date(
    Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  // ---- 1. new users in window ----
  const { count: newUsers, error: usersCountErr } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .gte("created_at", cutoffIso)
  if (usersCountErr) {
    return NextResponse.json({ error: usersCountErr.message }, { status: 500 })
  }

  // ---- 2. new snippets in window ----
  const { count: newSnippets, error: snipCountErr } = await supabase
    .from("snippets")
    .select("id", { count: "exact", head: true })
    .gte("created_at", cutoffIso)
  if (snipCountErr) {
    return NextResponse.json({ error: snipCountErr.message }, { status: 500 })
  }

  // ---- 3. top authors (all-time) ----
  // Group by created_by, count, then join names. Two queries because
  // supabase-js doesn't expose HAVING+GROUP BY in a single select.
  const { data: authorRows, error: authorErr } = await supabase
    .from("snippets")
    .select("created_by")
    .not("created_by", "is", null)
  if (authorErr) {
    return NextResponse.json({ error: authorErr.message }, { status: 500 })
  }
  const countsByAuthor = new Map<string, number>()
  for (const row of authorRows ?? []) {
    if (!row.created_by) continue
    countsByAuthor.set(
      row.created_by,
      (countsByAuthor.get(row.created_by) ?? 0) + 1,
    )
  }
  const topAuthorIds = [...countsByAuthor.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_LIMIT)
    .map(([id]) => id)
  let topAuthors: {
    userId: string
    name: string | null
    email: string | null
    snippetCount: number
  }[] = []
  if (topAuthorIds.length > 0) {
    const { data: users, error: topUsersErr } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", topAuthorIds)
    if (topUsersErr) {
      return NextResponse.json({ error: topUsersErr.message }, { status: 500 })
    }
    const byId = new Map((users ?? []).map((u) => [u.id, u]))
    topAuthors = topAuthorIds.map((id) => {
      const u = byId.get(id)
      return {
        userId: id,
        name: u?.name ?? null,
        email: u?.email ?? null,
        snippetCount: countsByAuthor.get(id) ?? 0,
      }
    })
  }

  // ---- 4. top categories (all-time) ----
  const { data: catRows, error: catErr } = await supabase
    .from("snippets")
    .select("category")
  if (catErr) {
    return NextResponse.json({ error: catErr.message }, { status: 500 })
  }
  const countsByCategory = new Map<string, number>()
  for (const row of catRows ?? []) {
    if (!row.category) continue
    countsByCategory.set(
      row.category,
      (countsByCategory.get(row.category) ?? 0) + 1,
    )
  }
  const topCategories = [...countsByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_LIMIT)
    .map(([category, count]) => ({ category, count }))

  // ---- 5. recent snippets (window) ----
  const { data: recentSnipRows, error: recentSnipErr } = await supabase
    .from("snippets")
    .select(
      "id, legacy_id, title, created_at, created_by_user:users!snippets_created_by_fkey(name, email)",
    )
    .gte("created_at", cutoffIso)
    .order("created_at", { ascending: false })
    .limit(TOP_LIMIT)
  if (recentSnipErr) {
    return NextResponse.json({ error: recentSnipErr.message }, { status: 500 })
  }
  const recentSnippets = (recentSnipRows ?? []).map((row) => {
    const author = (row as { created_by_user?: { name?: string | null; email?: string | null } | null }).created_by_user ?? null
    return {
      id: row.legacy_id ?? row.id,
      uuid: row.id,
      title: row.title,
      authorName: author?.name ?? author?.email?.split("@")[0] ?? null,
      createdAt: row.created_at,
    }
  })

  // ---- 6. recent users (window) ----
  const { data: recentUserRows, error: recentUserErr } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .gte("created_at", cutoffIso)
    .order("created_at", { ascending: false })
    .limit(TOP_LIMIT)
  if (recentUserErr) {
    return NextResponse.json({ error: recentUserErr.message }, { status: 500 })
  }
  const recentUsers = (recentUserRows ?? []).map((u) => ({
    id: u.id,
    name: u.name ?? null,
    email: u.email,
    createdAt: u.created_at,
  }))

  return NextResponse.json({
    windowDays: WINDOW_DAYS,
    newUsers: newUsers ?? 0,
    newSnippets: newSnippets ?? 0,
    topAuthors,
    topCategories,
    recentSnippets,
    recentUsers,
  })
}
