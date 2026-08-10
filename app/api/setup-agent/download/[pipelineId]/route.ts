/**
 * GET /api/setup-agent/download/[pipelineId]
 *
 * Streams the latest successful build artifact for the given pipeline
 * back to the admin's browser. Used by the Setup Agent UI's "Download
 * artifact" button. The PAT lives in the request body — never in the URL.
 *
 * The full Azure DevOps config (org, project, PAT) is sent as JSON in
 * the request body. Pipeline id is in the URL path so the route can be
 * memoised / linked to.
 */

import { NextResponse, type NextRequest } from "next/server"

import { downloadLatestArtifact, getLatestSuccessfulBuild } from "@/lib/setup-agent"
import type { AzureDevOpsConfig } from "@/lib/setup-agent"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { pipelineId: string } },
) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const pipelineId = Number(params.pipelineId)
  if (!Number.isFinite(pipelineId) || pipelineId <= 0) {
    return NextResponse.json({ error: "Invalid pipeline id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 })
  }
  const azure = body as AzureDevOpsConfig
  if (!azure.personalAccessToken || !azure.organization || !azure.project) {
    return NextResponse.json(
      { error: "Missing Azure DevOps config (organization, project, PAT)." },
      { status: 400 },
    )
  }

  // Quick pre-flight so the UI can show a useful error before streaming.
  const latest = await getLatestSuccessfulBuild(azure, pipelineId)
  if (!latest) {
    return NextResponse.json(
      { error: `No successful build found for pipeline ${pipelineId}.` },
      { status: 404 },
    )
  }

  const logger = {
    info: (m: string) => console.log(`[Setup][download:${pipelineId}] ${m}`),
    warn: (m: string) => console.warn(`[Setup][download:${pipelineId}] ${m}`),
  }
  const downloaded = await downloadLatestArtifact(azure, pipelineId, "", logger)
  if (!downloaded) {
    return NextResponse.json(
      { error: "Failed to download artifact" },
      { status: 502 },
    )
  }

  return new NextResponse(downloaded.response.body, {
    status: 200,
    headers: {
      "Content-Type":
        downloaded.response.headers.get("content-type") ?? "application/zip",
      "Content-Disposition": `attachment; filename="${downloaded.filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
