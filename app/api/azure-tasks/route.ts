/**
 * GET /api/azure-tasks
 *
 * Proxy for the Azure DevOps work-items API. All upstream auth (PAT) is
 * handled server-side; clients only ever see this endpoint.
 *
 * Query params (all optional):
 *   - from            ISO datetime, ChangedDate >=
 *   - to              ISO datetime, ChangedDate <=
 *   - q               free-text search across title/description/tags
 *   - assignee        exact display name match
 *   - onlyMine        "1"/"true" to filter by signed-in user's display name
 *   - currentUserName display name to use for onlyMine (defaults to user.name)
 *   - stale           "1"/"true" to filter for items not changed in 30+ days
 *   - state           exact state match (e.g. "Active", "Done")
 *   - type            exact work item type (e.g. "Task")
 *   - page            1-based page number (default 1)
 *   - pageSize        items per page, max 200 (default 50)
 *
 * Response shape (200):
 *   { tasks, total, page, pageSize, hasMore, summary }
 *
 * Auth: any signed-in user (the page is admin-visible by default but
 * the endpoint itself is open to authenticated users — the auth gate
 * happens in middleware).
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAzureTasksAccess } from "@/lib/auth"
import { getWorkItems, AzureApiError } from "@/lib/azure-devops"

const QuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  q: z.string().trim().min(1).max(200).optional(),
  assignee: z.string().trim().min(1).max(200).optional(),
  onlyMine: z
    .union([z.literal("1"), z.literal("true"), z.literal("false"), z.literal("0")])
    .optional()
    .transform((v) => v === "1" || v === "true"),
  currentUserName: z.string().trim().min(1).max(200).optional(),
  stale: z
    .union([z.literal("1"), z.literal("true"), z.literal("false"), z.literal("0")])
    .optional()
    .transform((v) => v === "1" || v === "true"),
  state: z.string().trim().min(1).max(80).optional(),
  type: z.string().trim().min(1).max(80).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

export async function GET(request: Request) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const rawQuery = {
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    assignee: searchParams.get("assignee") ?? undefined,
    onlyMine: searchParams.get("onlyMine") ?? undefined,
    currentUserName: searchParams.get("currentUserName") ?? undefined,
    stale: searchParams.get("stale") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  }

  const parsed = QuerySchema.safeParse(rawQuery)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const result = await getWorkItems(parsed.data, {
      currentUserName: parsed.data.currentUserName ?? null,
    })
    return NextResponse.json({
      tasks: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
      summary: result.summary,
    })
  } catch (err) {
    // Surface the upstream failure in the server log so it's diagnosable
    // without a browser. Keep the response shape stable for the client.
    console.error("[azure-tasks] upstream error:", err)

    if (err instanceof AzureApiError) {
      // Config errors are 501 (not the client's fault, but actionable).
      // Upstream 4xx/5xx are 502 to the client.
      if (err.status === 501 || err.code === "config") {
        return NextResponse.json({ error: err.message }, { status: 501 })
      }
      return NextResponse.json(
        {
          error: "Failed to fetch work items from Azure DevOps",
          detail: err.message,
          upstreamStatus: err.status,
        },
        { status: 502 },
      )
    }
    return NextResponse.json(
      { error: "Internal error fetching Azure DevOps work items" },
      { status: 500 },
    )
  }
}
