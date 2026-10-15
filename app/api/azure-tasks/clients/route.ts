/**
 * /api/azure-tasks/clients
 *
 * GET  — the clients the Export Pack can be made for (agents in the Azure
 *        DevOps organization's self-hosted agent pools), each with the
 *        signed-in user's most recent export for that client:
 *          { clients: [{ name, pool, online, lastExport: { at, taskCount, byEmail } | null }],
 *            agentsError?: string, historyUnavailable?: boolean }
 *        Clients the user exported before but that no longer exist as
 *        agents are still listed (pool = null) so their history isn't lost.
 *
 * POST — record a finished export for the signed-in user:
 *          { client, from?, to?, taskCount }  →  201 { at }
 *
 * History is per user: nobody sees another user's exports. Backed by
 * public.client_exports (migration 20261012000000_client_exports.sql).
 *
 * Auth: same as the rest of Azure Tasks (admin or can_see_azure_tasks).
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAzureTasksAccess } from "@/lib/auth"
import { AzureApiError, getClientAgents, type AzureClientAgent } from "@/lib/azure-devops"
import { getSupabaseAdmin } from "@/lib/supabase"

/** Table not created yet (migration pending): PostgREST reports PGRST205, Postgres 42P01. */
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"])

interface ClientRow {
  name: string
  pool: string | null
  online: boolean
  lastExport: { at: string; taskCount: number; byEmail: string } | null
}

function agentsErrorMessage(err: unknown): string {
  if (err instanceof AzureApiError) {
    if (err.status === 501 || err.code === "config") return "Azure DevOps is not configured."
    if (err.status === 401 || err.status === 403) {
      return "The Azure DevOps PAT can't read agent pools. Add the “Agent Pools (Read)” scope to AZURE_DEVOPS_PAT."
    }
    return `Couldn't load agents from Azure DevOps (${err.status}).`
  }
  return "Couldn't load agents from Azure DevOps."
}

export async function GET(request: Request) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth

  let agents: AzureClientAgent[] = []
  let agentsError: string | undefined
  try {
    agents = await getClientAgents()
  } catch (err) {
    console.error("[azure-tasks/clients] agents:", err)
    agentsError = agentsErrorMessage(err)
  }

  // Latest export per client for THIS user. Rows are newest-first, so the
  // first row seen for a client is its latest.
  const latest = new Map<string, { name: string; at: string; taskCount: number }>()
  let historyUnavailable = false
  const { data, error } = await getSupabaseAdmin()
    .from("client_exports")
    .select("client_name, exported_at, task_count")
    .eq("user_id", auth.userId)
    .order("exported_at", { ascending: false })
    .limit(1000)
  if (error) {
    historyUnavailable = true
    if (!MISSING_TABLE_CODES.has(error.code)) console.error("[azure-tasks/clients] history:", error.message)
  } else {
    for (const row of data ?? []) {
      const key = String(row.client_name).toLowerCase()
      if (!latest.has(key)) {
        latest.set(key, { name: row.client_name, at: row.exported_at, taskCount: row.task_count })
      }
    }
  }

  const clients: ClientRow[] = agents.map((a) => {
    const hit = latest.get(a.name.toLowerCase())
    return {
      name: a.name,
      pool: a.pool,
      online: a.online,
      lastExport: hit ? { at: hit.at, taskCount: hit.taskCount, byEmail: auth.email } : null,
    }
  })
  const known = new Set(agents.map((a) => a.name.toLowerCase()))
  for (const [key, hit] of latest) {
    if (!known.has(key)) {
      clients.push({
        name: hit.name,
        pool: null,
        online: false,
        lastExport: { at: hit.at, taskCount: hit.taskCount, byEmail: auth.email },
      })
    }
  }

  return NextResponse.json({
    clients,
    ...(agentsError ? { agentsError } : {}),
    ...(historyUnavailable ? { historyUnavailable } : {}),
  })
}

const RecordBody = z.object({
  client: z.string().trim().min(1).max(200),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  taskCount: z.number().int().min(0).max(1_000_000),
})

export async function POST(request: Request) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = RecordBody.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 })
  }
  const { client, from, to, taskCount } = parsed.data

  // Only real agents can be recorded (when the agent list is available),
  // so a typo'd or forged name can't pollute the history.
  try {
    const agents = await getClientAgents()
    if (!agents.some((a) => a.name.toLowerCase() === client.toLowerCase())) {
      return NextResponse.json({ error: `Unknown client “${client}”.` }, { status: 400 })
    }
  } catch {
    /* Azure unreachable — still record; the name came from an earlier list. */
  }

  const { data, error } = await getSupabaseAdmin()
    .from("client_exports")
    .insert({
      user_id: auth.userId,
      client_name: client,
      range_from: from ?? null,
      range_to: to ?? null,
      task_count: taskCount,
    })
    .select("exported_at")
    .single()
  if (error || !data) {
    if (MISSING_TABLE_CODES.has(error?.code ?? "")) {
      return NextResponse.json(
        { error: "Export history isn't set up yet — apply migration 20261012000000_client_exports.sql." },
        { status: 503 },
      )
    }
    console.error("[azure-tasks/clients] insert:", error?.message)
    return NextResponse.json({ error: "Couldn't save the export record." }, { status: 500 })
  }
  return NextResponse.json({ at: data.exported_at }, { status: 201 })
}
