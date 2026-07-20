/**
 * /api/app-menus/[id] — single-row operations on the active menu
 *
 * PATCH  — admin only: update the `json` column in place. Used by the
 *          inline tree editor so admins can rename / add / delete items
 *          without uploading a whole new menu. Bumps `updated_at`.
 *          Returns the updated row.
 *
 * DELETE — admin only: delete a menu row. The "active" menu is
 *          protected from deletion if it's the only one — there must
 *          always be at least one record for the page to render.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

// Permissive shape: items are validated structurally on the client at
// edit time (we only render valid ones). Top-level MenuItems must be
// an array, and `_id` is accepted in either MongoDB-style
// `{ $oid: "..." }` or a plain string — same rationale as
// app/api/app-menus/route.ts.
const PatchBody = z.object({
  json: z
    .object({
      _id: z.any().optional(),
      MenuItems: z.array(z.any()).default([]),
    })
    .passthrough(),
})

interface RouteContext {
  params: { id: string }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  // The id from the URL must be a uuid — same shape we store in `id`.
  // zod's uuid() rejects anything that isn't a v1-5 uuid, which matches
  // gen_random_uuid()'s output and prevents path-injection via the param.
  const idParse = z.string().uuid().safeParse(params.id)
  if (!idParse.success) {
    return NextResponse.json({ error: "Invalid menu id" }, { status: 400 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = PatchBody.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("app_menus")
    .update({ json: parsed.data.json })
    .eq("id", params.id)
    .select("id, name, json, is_active, created_at, updated_at")
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Update failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({ menu: data })
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const idParse = z.string().uuid().safeParse(params.id)
  if (!idParse.success) {
    return NextResponse.json({ error: "Invalid menu id" }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Refuse to delete the only active menu. The GET endpoint looks up
  // `is_active = true`; deleting it would 404 the menu page until the
  // admin uploads a replacement, which is a worse UX than a 409.
  const { data: target, error: targetErr } = await supabase
    .from("app_menus")
    .select("is_active")
    .eq("id", params.id)
    .maybeSingle()
  if (targetErr) {
    return NextResponse.json({ error: targetErr.message }, { status: 500 })
  }
  if (!target) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 })
  }
  if (target.is_active) {
    const { count } = await supabase
      .from("app_menus")
      .select("id", { count: "exact", head: true })
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the only menu. Upload a new one first." },
        { status: 409 },
      )
    }
  }

  const { error } = await supabase
    .from("app_menus")
    .delete()
    .eq("id", params.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
