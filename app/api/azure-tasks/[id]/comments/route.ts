/**
 * GET /api/azure-tasks/[id]/comments
 *
 * Returns the comments for a single work item. Comments live on a
 * dedicated Azure DevOps REST endpoint (`/wit/workItems/{id}/comments`)
 * that is NOT exposed via the standard work-item payload. We proxy it
 * here so clients only ever see this Next.js route.
 *
 * Query params (all optional):
 *   - page       1-based page number (default 1)
 *   - pageSize   items per page, max 200 (default 50)
 *
 * Response shape (200):
 *   { items, total, page, pageSize, hasMore, commentsUnavailable? }
 *
 * 404 if the work item does not exist.
 *
 * Auth: any signed-in user (admins always, non-admins only if the
 * `can_see_azure_tasks` capability flag is on — same gate as the rest
 * of the Azure Tasks API).
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAzureTasksAccess } from "@/lib/auth"
import { AzureApiError, getWorkItemComments } from "@/lib/azure-devops"

const IdSchema = z
  .string()
  .regex(/^\d+$/, "Work item id must be a positive integer")
  .transform((v) => Number(v))

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
})

interface RouteContext {
  params: { id: string }
}

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth

  const parsedId = IdSchema.safeParse(params.id)
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid work item id" }, { status: 400 })
  }
  const id = parsedId.data

  const { searchParams } = new URL(request.url)
  const parsedQuery = QuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  })
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsedQuery.error.flatten() },
      { status: 400 },
    )
  }

  try {
    // The service always returns a page — it converts a 404 from the
    // upstream comments endpoint into `commentsUnavailable: true` so
    // the UI can show "Comments are unavailable" instead of an error
    // toast. That preserves the row-expansion details that already
    // loaded successfully via the single-item endpoint.
    const result = await getWorkItemComments(id, parsedQuery.data)
    return NextResponse.json(result)
  } catch (err) {
    console.error("[azure-tasks] upstream comments error:", err)

    if (err instanceof AzureApiError) {
      if (err.status === 501 || err.code === "config") {
        return NextResponse.json({ error: err.message }, { status: 501 })
      }
      return NextResponse.json(
        {
          error: "Failed to fetch comments from Azure DevOps",
          detail: err.message,
          upstreamStatus: err.status,
        },
        { status: 502 },
      )
    }
    return NextResponse.json(
      { error: "Internal error fetching work item comments" },
      { status: 500 },
    )
  }
}
