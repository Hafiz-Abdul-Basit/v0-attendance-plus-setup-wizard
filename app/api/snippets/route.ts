/**
 * GET  /api/snippets           — list public snippets (supports ?q=, ?category=, ?tag=)
 * POST /api/snippets           — create a snippet (auth required)
 *
 * GET now joins `users!snippets_created_by_fkey` so the UI can show the
 * author's name/email + an "updated 2 days ago" line on each card.
 *
 * Note: middleware redirects unauthenticated browser requests to /login, but
 * programmatic callers (curl, fetch from other origin) get a 401 JSON response.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { getToken } from "next-auth/jwt"

import { getSupabaseAdmin } from "@/lib/supabase"

const ListQuery = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
})

const CreateBody = z.object({
  legacy_id: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  content: z.string().min(1),
  category: z.string().min(1).max(80),
  language: z.string().max(40).optional(),
  icon: z.string().max(40).optional(),
  color: z.string().max(40).optional(),
  tags: z.array(z.string()).max(50).default([]),
  is_interactive: z.boolean().default(false),
  table_data: z.any().optional(),
  is_public: z.boolean().default(true),
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const parsed = ListQuery.safeParse({
    q: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 })
  }

  // Read the JWT silently — if absent, we still serve public rows but leave
  // isOwner=false on every result. Middleware already redirects browser
  // visitors to /login, so this path is mostly for non-browser clients.
  const token = await getToken({
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  })
  const viewerId = (token?.userId as string | undefined) ?? null

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from("snippets")
    .select(
      "*, created_by_user:users!snippets_created_by_fkey(id, name, email)",
    )
    .eq("is_public", true)
    .order("category", { ascending: true })
    .order("title", { ascending: true })

  if (parsed.data.category) {
    query = query.eq("category", parsed.data.category)
  }
  if (parsed.data.tag) {
    query = query.contains("tags", [parsed.data.tag])
  }
  if (parsed.data.q && parsed.data.q.trim()) {
    const q = parsed.data.q.trim()
    query = query.textSearch(
      "fts",
      `${q}`,
      { type: "websearch", config: "english" },
    )
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const snippets = (data ?? []).map((row) => {
    const mapped = rowToSnippet(row)
    return { ...mapped, isOwner: Boolean(viewerId && mapped.createdBy === viewerId) }
  })
  return NextResponse.json({ snippets })
}

export async function POST(request: Request) {
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

  const parsed = CreateBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("snippets")
    .insert({
      ...parsed.data,
      created_by: token.userId,
    })
    .select("*, created_by_user:users!snippets_created_by_fkey(id, name, email)")
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 },
    )
  }

  const mapped = rowToSnippet(data)
  return NextResponse.json({ ...mapped, isOwner: true }, { status: 201 })
}