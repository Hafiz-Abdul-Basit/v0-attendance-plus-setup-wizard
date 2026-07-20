/**
 * GET    /api/snippets/[id]   — single snippet (public read)
 * PUT    /api/snippets/[id]   — update (auth required; owner OR admin)
 * DELETE /api/snippets/[id]   — delete (auth required; owner OR admin)
 *
 * The [id] path param is the legacy string id ("frontend-webconfig", etc.)
 * — this preserves all existing references in the codebase. UUID lookups
 * also work (matched by /^[0-9a-f]{8}-.../i).
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { getToken } from "next-auth/jwt"

import { getSupabaseAdmin } from "@/lib/supabase"
import { loadTabVisibilityFlags, type Role } from "@/lib/auth"

const UpdateBody = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  content: z.string().min(1).optional(),
  category: z.string().min(1).max(80).optional(),
  language: z.string().max(40).optional(),
  icon: z.string().max(40).optional(),
  color: z.string().max(40).optional(),
  tags: z.array(z.string()).max(50).optional(),
  is_interactive: z.boolean().optional(),
  table_data: z.any().optional(),
  is_public: z.boolean().optional(),
})

function rowToSnippet(row: any) {
  const author = row.created_by_user ?? null
  return {
    id: row.legacy_id ?? row.id,
    title: row.title,
    description: row.description ?? "",
    content: row.content,
    category: row.category,
    language: row.language ?? "",
    icon: row.icon ?? "FileText",
    color: row.color ?? "bg-gray-600",
    tags: row.tags ?? [],
    lastUsed: row.last_used_at ? new Date(row.last_used_at) : new Date(row.created_at),
    updatedAt: row.updated_at ?? row.created_at,
    createdAt: row.created_at,
    createdBy: row.created_by ?? undefined,
    authorName: author?.name ?? author?.email?.split("@")[0] ?? null,
    authorEmail: author?.email ?? null,
    isInteractive: row.is_interactive ?? false,
    tableData: row.table_data ?? undefined,
  }
}

async function loadByLegacyId(legacyId: string) {
  const supabase = getSupabaseAdmin()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(legacyId)
  const q = isUuid
    ? supabase.from("snippets").select("*, created_by_user:users!snippets_created_by_fkey(id, name, email)").eq("id", legacyId)
    : supabase.from("snippets").select("*, created_by_user:users!snippets_created_by_fkey(id, name, email)").eq("legacy_id", legacyId)
  const { data, error } = await q.maybeSingle()
  return { data, error }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { data, error } = await loadByLegacyId(params.id)
  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(rowToSnippet(data))
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  })
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = UpdateBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data: existing } = await loadByLegacyId(params.id)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const role = (token.role as Role | undefined) ?? "user"
  const isOwner = existing.created_by === token.userId
  // Users with can_edit_all_snippets=true (granted by an admin) can edit
  // any snippet, not just their own. Same gate as on the client.
  const caps = await loadTabVisibilityFlags(token.userId as string)
  if (!isOwner && role !== "admin" && !caps.canEditAllSnippets) {
    return NextResponse.json(
      { error: "Forbidden — only the owner, an admin, or a user with edit-all-snippets permission can update this snippet." },
      { status: 403 },
    )
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("snippets")
    .update(parsed.data)
    .eq("id", existing.id)
    .select("*, created_by_user:users!snippets_created_by_fkey(id, name, email)")
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Update failed" },
      { status: 500 },
    )
  }

  return NextResponse.json({ ...rowToSnippet(data), isOwner: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  })
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: existing } = await loadByLegacyId(params.id)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const role = (token.role as Role | undefined) ?? "user"
  const isOwner = existing.created_by === token.userId
  // Users with can_edit_all_snippets=true can delete any snippet, not
  // just their own. Mirrors the PUT authorization above.
  const caps = await loadTabVisibilityFlags(token.userId as string)
  if (!isOwner && role !== "admin" && !caps.canEditAllSnippets) {
    return NextResponse.json(
      { error: "Forbidden — only the owner, an admin, or a user with edit-all-snippets permission can delete this snippet." },
      { status: 403 },
    )
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from("snippets").delete().eq("id", existing.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}