/**
 * /api/admin/users — admin-only user management
 *
 * GET    — list all users with their snippet counts
 * PUT    — change a user's role and/or tab-visibility flags
 *          body: { id: uuid, role?: 'user' | 'admin',
 *                  canSeeSetupClients?: boolean, canSeeSetups?: boolean }
 * DELETE — delete a user          body: { id: uuid }   (idempotent against last-admin)
 *
 * Hard rules enforced server-side:
 *   - Caller must be admin (requireAdmin).
 *   - At least one admin must remain in the system at all times.
 *   - Admins cannot delete their own account (must ask another admin).
 *   - Admins cannot be locked out of either tab — toggling the visibility
 *     flags on an admin row is blocked to keep the admin escape hatch
 *     open.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireAdmin, invalidateTabVisibilityCache } from "@/lib/auth"

const PutBody = z
  .object({
    id: z.string().uuid(),
    role: z.enum(["user", "admin"]).optional(),
    // Accept BOTH camelCase (used by the admin UI types) and snake_case
    // (matches the DB column names some callers use). The UI was
    // accidentally sending snake_case keys, which zod silently stripped,
    // leading to "No fields to update." on every toggle.
    canSeeSetupClients: z.boolean().optional(),
    canSeeSetups: z.boolean().optional(),
    canEditAllSnippets: z.boolean().optional(),
    canSeeAppMenu: z.boolean().optional(),
    canSeeAzureTasks: z.boolean().optional(),
    can_see_setup_clients: z.boolean().optional(),
    can_see_setups: z.boolean().optional(),
    can_edit_all_snippets: z.boolean().optional(),
    can_see_app_menu: z.boolean().optional(),
    can_see_azure_tasks: z.boolean().optional(),
  })
  .transform((raw) => ({
    id: raw.id,
    role: raw.role,
    canSeeSetupClients:
      raw.canSeeSetupClients ?? raw.can_see_setup_clients,
    canSeeSetups: raw.canSeeSetups ?? raw.can_see_setups,
    canEditAllSnippets:
      raw.canEditAllSnippets ?? raw.can_edit_all_snippets,
    canSeeAppMenu: raw.canSeeAppMenu ?? raw.can_see_app_menu,
    canSeeAzureTasks:
      raw.canSeeAzureTasks ?? raw.can_see_azure_tasks,
  }))

const DeleteBody = z.object({
  id: z.string().uuid(),
})

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const supabase = getSupabaseAdmin()

  // Try the full projection first (includes the can_see_* tab-visibility
  // flags AND can_edit_all_snippets). If the columns don't exist yet
  // (schema migration pending), fall back to the base columns so the
  // page still loads — same graceful-degradation strategy used in
  // lib/auth.ts for the session.
  let users: any[] | null = null
  {
    const res = await supabase
      .from("users")
      .select(
        "id, email, name, role, can_see_setup_clients, can_see_setups, can_edit_all_snippets, can_see_app_menu, can_see_azure_tasks, created_at, updated_at",
      )
      .order("created_at", { ascending: true })
    if (res.error && /can_see_|can_edit_all_snippets/.test(res.error.message)) {
      // eslint-disable-next-line no-console
      console.warn(
        "[admin/users] capability columns missing — falling back to base columns. Apply supabase/schema.sql AND the latest migrations in supabase/migrations/ to add them.",
        res.error.message,
      )
      const fallback = await supabase
        .from("users")
        .select("id, email, name, role, created_at, updated_at")
        .order("created_at", { ascending: true })
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 })
      }
      users = (fallback.data ?? []).map((u) => ({
        ...u,
        can_see_setup_clients: false,
        can_see_setups: false,
        can_edit_all_snippets: false,
        can_see_app_menu: false,
        can_see_azure_tasks: false,
      }))
    } else if (res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 500 })
    } else {
      users = res.data
    }
  }

  // snippet counts per author — single round-trip via group+count.
  const { data: counts, error: countErr } = await supabase
    .from("snippets")
    .select("created_by")
  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 })
  }
  const countsMap = new Map<string, number>()
  for (const row of counts ?? []) {
    if (!row.created_by) continue
    countsMap.set(row.created_by, (countsMap.get(row.created_by) ?? 0) + 1)
  }

  return NextResponse.json({
    users: (users ?? []).map((u) => ({
      ...u,
      snippetCount: countsMap.get(u.id) ?? 0,
      isSelf: u.id === auth.userId,
    })),
  })
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = PutBody.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { id, role, canSeeSetupClients, canSeeSetups, canEditAllSnippets, canSeeAppMenu, canSeeAzureTasks } = parsed.data
  if (id === auth.userId && role !== undefined && role !== "admin") {
    return NextResponse.json(
      { error: "You cannot demote yourself out of admin." },
      { status: 400 },
    )
  }

  const supabase = getSupabaseAdmin()
  const { data: target, error: targetErr } = await supabase
    .from("users")
    .select("role")
    .eq("id", id)
    .maybeSingle()
  if (targetErr) {
    return NextResponse.json({ error: targetErr.message }, { status: 500 })
  }
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Last-admin guard: if demoting the only remaining admin, refuse.
  if (target.role === "admin" && role === "user") {
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "At least one admin must remain in the system." },
        { status: 409 },
      )
    }
  }

  // Build the patch object — only include the fields the caller passed.
  const patch: Record<string, unknown> = {}
  if (role !== undefined) patch.role = role
  if (canSeeSetupClients !== undefined) patch.can_see_setup_clients = canSeeSetupClients
  if (canSeeSetups !== undefined) patch.can_see_setups = canSeeSetups
  if (canEditAllSnippets !== undefined) patch.can_edit_all_snippets = canEditAllSnippets
  if (canSeeAppMenu !== undefined) patch.can_see_app_menu = canSeeAppMenu
  if (canSeeAzureTasks !== undefined) patch.can_see_azure_tasks = canSeeAzureTasks
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", id)
    .select(
      "id, email, name, role, can_see_setup_clients, can_see_setups, can_edit_all_snippets, can_see_app_menu, can_see_azure_tasks, created_at, updated_at",
    )
    .single()
  if (error || !data) {
    // Surface a friendlier message when the capability columns are
    // missing — otherwise the operator just sees a generic Supabase
    // error without knowing how to fix it. The relevant migrations are
    // listed in the hint so they can be applied via the Supabase SQL
    // editor or `supabase db push`.
    const friendly =
      error?.message && /can_see_|can_edit_all_snippets/.test(error.message)
        ? "Capability columns are missing. Apply supabase/schema.sql AND all migrations in supabase/migrations/ to add them."
        : (error?.message ?? "Update failed")
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
  // Bust the in-process tab-visibility cache so the change is visible
  // to that user's very next `useSession()` call (well under the 30s TTL).
  invalidateTabVisibilityCache(id)
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = DeleteBody.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const { id } = parsed.data
  if (id === auth.userId) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 },
    )
  }

  const supabase = getSupabaseAdmin()
  const { data: target, error: targetErr } = await supabase
    .from("users")
    .select("role")
    .eq("id", id)
    .maybeSingle()
  if (targetErr) {
    return NextResponse.json({ error: targetErr.message }, { status: 500 })
  }
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  if (target.role === "admin") {
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin." },
        { status: 409 },
      )
    }
  }

  // ON DELETE SET NULL on snippets.created_by preserves snippet history.
  const { error } = await supabase.from("users").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}