/**
 * POST /api/setup-agent/validate
 *
 * Runs the structural validation checks the server can perform
 * (path existence, etc.) and returns a `ValidationReport`. The deeper
 * IIS / Mongo / Windows-service checks live in the PowerShell runner
 * and report back via the orchestrator's UI state.
 */

import { NextResponse, type NextRequest } from "next/server"

import { validateConfig, validateDeployment } from "@/lib/setup-agent"
import type { ServerSetupConfig } from "@/lib/setup-agent"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 })
  }

  const config = body as ServerSetupConfig
  const configCheck = validateConfig(config)
  if (!configCheck.ok) {
    return NextResponse.json(
      {
        ok: false,
        configIssues: configCheck.issues,
        checks: [],
      },
      { status: 200 },
    )
  }
  const report = validateDeployment(config)
  return NextResponse.json({
    ok: report.ok,
    configIssues: [],
    checks: report.checks,
  })
}
