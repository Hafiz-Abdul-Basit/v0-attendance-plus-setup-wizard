/**
 * /api/app-menus — main app menu storage
 *
 * GET  — returns the currently active menu (signed-in users)
 * POST — admin only: archives the current active menu and inserts a
 *        new one from the supplied JSON payload.
 *
 * The body shape is `{ name, json }` where `json` is the full
 * `{ _id?, MenuItems: [...] }` document the client uploaded.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireAuth, requireAdmin } from "@/lib/auth"

// Loose validation: MenuItems must be an array. Individual item shape
// (Name/Children/Claims/...) is validated client-side at upload time;
// the server just stores the JSON verbatim. We do require it to be an
// object — never a primitive — to avoid malformed rows.
//
// `_id` is intentionally `z.any()` because the source documents come
// from MongoDB which can render an ObjectId as either a string
// (`"65134f64..."`) or a sub-document (`{ "$oid": "65134f64..." }`).
// Rejecting either form would block legitimate NextPremium exports.
const PostBody = z.object({
  name: z.string().min(1).max(200),
  json: z.object({
    _id: z.any().optional(),
    MenuItems: z.array(z.any()).default([]),
  }).passthrough(),
})

export async function GET(_request: Request) {
  // Any signed-in user can read the active menu. The middleware has
  // already redirected unauthenticated callers to /login, so this
  // `requireAuth` is defensive — if we somehow get here without a
  // token (e.g. curl) we return 401 JSON.
  const auth = await requireAuth(_request)
  if (auth instanceof NextResponse) return auth

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("app_menus")
    .select("id, name, json, is_active, created_at, updated_at")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ menu: data ?? null })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = PostBody.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const supabase = getSupabaseAdmin()

  // Archive the currently active row in a single UPDATE so the new
  // row can claim `is_active=true` without violating any uniqueness.
  // (We don't have a partial unique index on `is_active=true` so this
  // step is technically not required for correctness, but it keeps
  // the table tidy if the operator later adds version history.)
  const { error: archiveErr } = await supabase
    .from("app_menus")
    .update({ is_active: false })
    .eq("is_active", true)
  if (archiveErr) {
    return NextResponse.json({ error: archiveErr.message }, { status: 500 })
  }

  const { data, error } = await supabase
    .from("app_menus")
    .insert({
      name: parsed.data.name,
      json: parsed.data.json,
      is_active: true,
      created_by: auth.userId,
    })
    .select("id, name, json, is_active, created_at, updated_at")
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({ menu: data }, { status: 201 })
}
