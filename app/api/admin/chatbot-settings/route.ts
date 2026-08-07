/**
 * /api/admin/chatbot-settings — admin-only chatbot configuration.
 *
 * GET  — returns the global toggle plus every user's per-user override.
 *        Shape: { chatbotEnabled: boolean,
 *                 perUserOverrides: { userId, email, name, access }[] }
 *
 * POST — admin-only mutations. Body is validated by zod. Either field
 *        may be updated independently:
 *          { chatbotEnabled: boolean }                          → flips the master toggle
 *          { userId: uuid, access: 'inherit'|'enabled'|'disabled' } → updates one user's override
 *
 * Hard rules:
 *   - Caller must be admin (`requireAdmin`).
 *   - The chatbot_access column may not exist yet on a fresh deploy;
 *     GET gracefully falls back to "inherit" for every user (mirrors
 *     the /api/admin/users graceful-degradation pattern).
 *   - Mutations bust the in-process cache via `invalidateChatbotCache`
 *     so the next request sees the change immediately.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { getSupabaseAdmin } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import {
  getChatbotEnabled,
  invalidateChatbotCache,
  type ChatbotAccess,
} from "@/lib/chatbot"

const PostBody = z
  .object({
    chatbotEnabled: z.boolean().optional(),
    userId: z.string().uuid().optional(),
    access: z.enum(["inherit", "enabled", "disabled"]).optional(),
  })
  .refine(
    (v) =>
      v.chatbotEnabled !== undefined ||
      (v.userId !== undefined && v.access !== undefined),
    {
      message:
        "Provide either { chatbotEnabled } or { userId, access }.",
    },
  )

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const supabase = getSupabaseAdmin()
  const chatbotEnabled = await getChatbotEnabled()

  // Try the full projection first. If the chatbot_access column is
  // missing (migration pending), fall back to the base columns and
  // treat every user as 'inherit'. Same pattern as /api/admin/users.
  let users: Array<{
    id: string
    email: string
    name: string | null
    chatbot_access: ChatbotAccess
  }> = []

  {
    const res = await supabase
      .from("users")
      .select("id, email, name, chatbot_access")
      .order("created_at", { ascending: true })
    if (res.error && /chatbot_access/.test(res.error.message)) {
      // eslint-disable-next-line no-console
      console.warn(
        "[admin/chatbot-settings] chatbot_access column missing — falling back. Apply supabase/schema.sql AND the latest migration.",
        res.error.message,
      )
      const fallback = await supabase
        .from("users")
        .select("id, email, name")
        .order("created_at", { ascending: true })
      if (fallback.error) {
        return NextResponse.json(
          { error: fallback.error.message },
          { status: 500 },
        )
      }
      users = (fallback.data ?? []).map((u) => ({
        ...u,
        chatbot_access: "inherit" as ChatbotAccess,
      }))
    } else if (res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 500 })
    } else {
      users = (res.data ?? []).map((u) => ({
        ...u,
        chatbot_access:
          u.chatbot_access === "enabled" || u.chatbot_access === "disabled"
            ? u.chatbot_access
            : ("inherit" as ChatbotAccess),
      }))
    }
  }

  return NextResponse.json({
    chatbotEnabled,
    perUserOverrides: users.map((u) => ({
      userId: u.id,
      email: u.email,
      name: u.name,
      access: u.chatbot_access,
    })),
  })
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

  // Branch 1: global toggle.
  if (parsed.data.chatbotEnabled !== undefined) {
    const { error } = await supabase
      .from("app_settings")
      .upsert(
        { key: "chatbot_enabled", value: parsed.data.chatbotEnabled },
        { onConflict: "key" },
      )
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    invalidateChatbotCache()
    return NextResponse.json({ ok: true, chatbotEnabled: parsed.data.chatbotEnabled })
  }

  // Branch 2: per-user override.
  const { userId, access } = parsed.data as {
    userId: string
    access: ChatbotAccess
  }
  const { data, error } = await supabase
    .from("users")
    .update({ chatbot_access: access })
    .eq("id", userId)
    .select("id, chatbot_access")
    .single()
  if (error || !data) {
    const friendly =
      error?.message && /chatbot_access/.test(error.message)
        ? "chatbot_access column is missing. Apply the latest migration in supabase/migrations/ to add it."
        : (error?.message ?? "Update failed")
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
  invalidateChatbotCache(userId)
  return NextResponse.json({ ok: true, userId: data.id, access: data.chatbot_access })
}
