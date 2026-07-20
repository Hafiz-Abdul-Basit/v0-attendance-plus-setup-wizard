/**
 * /api/admin/snippets — admin-only snippet moderation
 *
 * GET    — list ALL snippets (including private) with their authors
 * DELETE — delete any snippet body: { id: uuid }
 *
 * PUT goes through /api/snippets/[id] which already enforces owner-or-admin.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

const DeleteBody = z.object({
  id: z.string().uuid(),
})

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("snippets")
    .select(
      "*, created_by_user:users!snippets_created_by_fkey(id, name, email)",
    )
    .order("updated_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const snippets = (data ?? []).map((row: any) => {
    const author = row.created_by_user ?? null
    return {
      id: row.legacy_id ?? row.id,
      uuid: row.id,
      title: row.title,
      description: row.description ?? "",
      content: row.content,
      category: row.category,
      language: row.language ?? "",
      icon: row.icon ?? "FileText",
      color: row.color ?? "bg-gray-600",
      tags: row.tags ?? [],
      isPublic: row.is_public,
      isInteractive: row.is_interactive ?? false,
      tableData: row.table_data ?? null,
      createdBy: row.created_by ?? undefined,
      authorName: author?.name ?? author?.email?.split("@")[0] ?? null,
      authorEmail: author?.email ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })

  return NextResponse.json({ snippets })
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

  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from("snippets")
    .delete()
    .eq("id", parsed.data.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}