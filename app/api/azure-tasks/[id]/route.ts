/**
 * GET /api/azure-tasks/[id]
 *
 * Returns a single work item by Azure DevOps id. Same auth model as the
 * list endpoint.
 *
 * Response shape (200): the normalised AzureWorkItem object directly.
 * 404 if the work item does not exist (or the project does not see it).
 *
 * Diagnostic mode: pass `?probe=1` to also receive the raw upstream
 * payload (with the `relations` array redacted if present, but the
 * `raw` shape truncated to the top-level keys) so an admin can see
 * whether the upstream is returning the `relations[]` array at all.
 * If the upstream returns 200 OK but `relations` is missing, that's a
 * near-certain PAT-scope gap (missing `vso.work_full`) — the
 * `relationsUnavailable` flag on the normalised item will also be true.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAzureTasksAccess } from "@/lib/auth"
import { AzureApiError, getAzureConfig } from "@/lib/azure-devops"
import { AzureDevOpsClient } from "@/lib/azure-devops/client"
import { getDefaultCredentialProvider } from "@/lib/azure-devops/auth"
import { getWorkItemById } from "@/lib/azure-devops/service"

const IdSchema = z
  .string()
  .regex(/^\d+$/, "Work item id must be a positive integer")
  .transform((v) => Number(v))

interface RouteContext {
  params: { id: string }
}

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth

  const parsed = IdSchema.safeParse(params.id)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid work item id" }, { status: 400 })
  }
  const id = parsed.data

  const url = new URL(request.url)
  const probe = url.searchParams.get("probe") === "1"

  try {
    const item = await getWorkItemById(id)
    if (!item) {
      return NextResponse.json({ error: "Work item not found" }, { status: 404 })
    }
    if (!probe) {
      return NextResponse.json(item)
    }
    // Probe mode: also re-run a *raw* expand call so the caller can see
    // exactly what the upstream returned. Use the same client/auth that
    // the service uses.
    const config = getAzureConfig()
    const provider = getDefaultCredentialProvider()
    const client = new AzureDevOpsClient(config, provider)
    let rawShape: Record<string, unknown> | null = null
    let rawError: string | null = null
    try {
      const raw = (await client.getWorkItem(id, undefined, {
        expand: "relations",
        expandParam: "$expand",
      })) as Record<string, unknown> | null
      if (raw && typeof raw === "object") {
        // Surface only the top-level keys (don't ship the whole work
        // item body back — could be large).
        const keys = Object.keys(raw)
        rawShape = {
          keys,
          hasRelationsField: "relations" in raw,
          relationsIsArray: Array.isArray((raw as { relations?: unknown }).relations),
          relationsLength: Array.isArray((raw as { relations?: unknown }).relations)
            ? ((raw as { relations: unknown[] }).relations.length)
            : null,
        }
      }
    } catch (err) {
      rawError = err instanceof Error ? err.message : String(err)
    }
    return NextResponse.json({
      item,
      probe: {
        relationsUnavailable: Boolean(item.relationsUnavailable),
        rawShape,
        rawError,
        hint: item.relationsUnavailable
          ? "The upstream returned 200 OK but omitted the `relations` field. This is almost always a missing `vso.work_full` PAT scope. Regenerate your PAT at https://dev.azure.com/_usersSettings/tokens with Full Access selected."
          : "Relations were returned normally — attachments should be visible in the row expansion.",
      },
    })
  } catch (err) {
    if (err instanceof AzureApiError) {
      if (err.status === 501 || err.code === "config") {
        return NextResponse.json({ error: err.message }, { status: 501 })
      }
      return NextResponse.json(
        { error: "Failed to fetch work item from Azure DevOps" },
        { status: 502 },
      )
    }
    return NextResponse.json(
      { error: "Internal error fetching Azure DevOps work item" },
      { status: 500 },
    )
  }
}
