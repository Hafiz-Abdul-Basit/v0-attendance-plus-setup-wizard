/**
 * POST /api/setup-agent/run
 *
 * Launch a new Setup Agent run. The request body is a `ServerSetupConfig`
 * (PAT included) — kept server-side, never logged or returned to the
 * client. The response is the new `runId`; the client polls
 * `/api/setup-agent/runs/[runId]` for progress.
 *
 * GET /api/setup-agent/run
 *
 * Returns the redacted default config the UI uses to bootstrap its form,
 * plus the current privilege status. No secrets are exposed.
 */

import { NextResponse, type NextRequest } from "next/server"

import {
  DEFAULT_SERVER_SETUP_CONFIG,
  checkPrivilege,
  launchRun,
  redactConfig,
  validateConfig,
} from "@/lib/setup-agent"
import type { ServerSetupConfig } from "@/lib/setup-agent"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  // Bootstrap data for the UI form. The PAT is always redacted here.
  const privilege = checkPrivilege()
  const redactedDefault = redactConfig(DEFAULT_SERVER_SETUP_CONFIG)
  return NextResponse.json({
    config: redactedDefault,
    privilege,
    pinnedVersions: {
      rabbitMq: "4.3.1",
      erlang: "27.3.4.13",
    },
  })
}

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

  // We accept the *unredacted* config because the PAT must reach the
  // server-side downloader. The PAT is never echoed back to the client.
  const validation = validateConfig(body as ServerSetupConfig)
  if (!validation.ok) {
    return NextResponse.json(
      { error: "Invalid config", issues: validation.issues },
      { status: 400 },
    )
  }

  const config = body as ServerSetupConfig
  const run = launchRun(config)
  return NextResponse.json({ runId: run.runId, startedAt: run.startedAt })
}
