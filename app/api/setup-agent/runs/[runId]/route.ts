/**
 * GET /api/setup-agent/runs/[runId]
 *
 * Return the latest snapshot of a setup run. The PAT is never included
 * in this response — only build summaries (id, number, branch).
 */

import { NextResponse } from "next/server"

import { snapshotRun } from "@/lib/setup-agent"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  req: Request,
  { params }: { params: { runId: string } },
) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth
  const run = snapshotRun(params.runId)
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 })
  }
  return NextResponse.json(run)
}
