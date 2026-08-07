/**
 * /api/chatbot-status — public-but-authenticated status endpoint.
 *
 * Returns `{ enabled: boolean }` for the currently signed-in user,
 * resolving the global toggle + per-user override via the
 * `resolveChatbotAccess` helper.
 *
 * The ChatWidget calls this on mount to decide whether to render the
 * launcher. If the response is `enabled: false` (or the call fails),
 * the widget does not render — fail closed.
 *
 * Unauthenticated callers receive `enabled: false`. The middleware
 * normally redirects anonymous browser traffic to /login, so this is
 * purely defensive (e.g. curl calls).
 */
import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth"
import { resolveChatbotAccess } from "@/lib/chatbot"

export async function GET(request: Request) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) {
    // Unauthenticated: fail closed (do not expose the widget).
    return NextResponse.json({ enabled: false })
  }
  const enabled = await resolveChatbotAccess(auth.userId)
  return NextResponse.json({ enabled })
}
