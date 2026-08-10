/**
 * GET /api/setup-agent/scripts?type=iis|mongo|extract|all
 *
 * Returns PowerShell scripts the operator runs on the target Windows
 * server. The PAT is NEVER embedded in these scripts (the IIS / Mongo
 * scripts don't need it; the Azure DevOps downloads are streamed
 * separately by the orchestrator).
 *
 * Query params:
 *   - type: "iis" | "mongo" | "extract" | "all"
 *   - config: JSON-encoded ServerSetupConfig (in the request body for
 *     POST, query string for GET — we accept POST because configs can
 *     be large and don't belong in URLs).
 */

import { NextResponse, type NextRequest } from "next/server"

import {
  buildExtractionScript,
  buildIisSetupScript,
  buildMongoSetupScript,
  validateConfig,
} from "@/lib/setup-agent"
import type { ServerSetupConfig } from "@/lib/setup-agent"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  const url = new URL(req.url)
  const type = url.searchParams.get("type") ?? "all"

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 })
  }
  const validation = validateConfig(body as ServerSetupConfig)
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Invalid config", issues: validation.issues },
      { status: 400 },
    )
  }
  const config = body as ServerSetupConfig

  switch (type) {
    case "iis":
      return scriptResponse("iis", buildIisSetupScript(config.iisSites, config.iisBasePath, config.ssl))
    case "mongo":
      return scriptResponse("mongo", buildMongoSetupScript(config.mongoDb))
    case "extract":
      return scriptResponse(
        "extract",
        buildExtractionScript(config.deploymentBasePath),
      )
    case "all": {
      // Concatenate the three scripts with section headers so the admin
      // can run them in order from a single .ps1 file.
      const combined = [
        "# ===== MongoDB setup =====",
        buildMongoSetupScript(config.mongoDb),
        "# ===== Backend extraction =====",
        buildExtractionScript(config.deploymentBasePath),
        "# ===== IIS setup =====",
        buildIisSetupScript(config.iisSites, config.iisBasePath, config.ssl),
      ].join("\n\n")
      return scriptResponse("setup-agent", combined)
    }
    default:
      return NextResponse.json(
        { error: `Unknown script type: ${type}` },
        { status: 400 },
      )
  }
}

function scriptResponse(name: string, body: string): NextResponse {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.ps1"`,
      "Cache-Control": "no-store",
    },
  })
}
