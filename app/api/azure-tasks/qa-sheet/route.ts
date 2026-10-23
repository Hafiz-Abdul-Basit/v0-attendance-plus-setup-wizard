/**
 * /api/azure-tasks/qa-sheet — the QA-passed task list Export Packs are
 * filtered against.
 *
 * GET  — the active (latest) upload:
 *          { sheet: { fileName, uploadedAt, byEmail, taskIds, rowCount } | null,
 *            setupRequired?: true }   (setupRequired = migration not applied)
 * POST — multipart form with `file` (.xlsx workbook, or .csv export of the
 *        "Att Plus" sheet). Reads only the "Att Plus" sheet's "Azure Task
 *        No" column (lib/qa-sheet.ts), stores the IDs
 *        and returns the new sheet. 400 with a plain message when the file
 *        doesn't have that sheet / column.
 *
 * Auth: Azure Tasks access (admin or can_see_azure_tasks). The workbook
 * itself is not stored — only the parsed IDs and who uploaded it.
 */
import { NextResponse } from "next/server"

import { requireAzureTasksAccess } from "@/lib/auth"
import { parseQaFile, QaSheetError } from "@/lib/qa-sheet"
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { getSupabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

/** Table not created yet (migration pending): PostgREST reports PGRST205, Postgres 42P01. */
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"])
const MAX_BYTES = 10 * 1024 * 1024
const SETUP_MESSAGE = "QA sheet storage isn't set up yet — apply migration 20261023000000_qa_sheets.sql."

type SheetRow = {
  file_name: string
  uploaded_at: string
  task_ids: number[]
  row_count: number
  user: { email?: string } | Array<{ email?: string }> | null
}

function toSheet(row: SheetRow) {
  const user = Array.isArray(row.user) ? row.user[0] : row.user
  return {
    fileName: row.file_name,
    uploadedAt: row.uploaded_at,
    byEmail: user?.email ?? null,
    taskIds: row.task_ids ?? [],
    rowCount: row.row_count,
  }
}

export async function GET(request: Request) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth

  const { data, error } = await getSupabaseAdmin()
    .from("qa_sheets")
    .select("file_name, uploaded_at, task_ids, row_count, user:users(email)")
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    if (MISSING_TABLE_CODES.has(error.code)) return NextResponse.json({ sheet: null, setupRequired: true })
    console.error("[azure-tasks/qa-sheet] read:", error.message)
    return NextResponse.json({ error: "Couldn't load the QA sheet." }, { status: 500 })
  }
  return NextResponse.json({ sheet: data ? toSheet(data as SheetRow) : null })
}

export async function POST(request: Request) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth
  const limit = rateLimit(`qa-sheet:${auth.userId}:${getClientIp(request.headers)}`, 20, 60 * 60_000)
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  let file: File | null = null
  try {
    const form = await request.formData()
    const f = form.get("file")
    file = f instanceof File ? f : null
  } catch {
    /* handled below */
  }
  if (!file) return NextResponse.json({ error: "Choose the QA sheet (.xlsx or .csv) to upload." }, { status: 400 })
  if (!/\.(xlsx|csv)$/i.test(file.name)) {
    return NextResponse.json(
      { error: "Upload the QA sheet as .xlsx or .csv (in OneDrive: File → Download a copy, or Export → CSV)." },
      { status: 400 },
    )
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "The file is larger than 10 MB." }, { status: 400 })

  let parsed
  try {
    parsed = await parseQaFile(file.name, await file.arrayBuffer())
  } catch (err) {
    if (err instanceof QaSheetError) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error("[azure-tasks/qa-sheet] parse:", err)
    return NextResponse.json({ error: "Couldn't read that workbook." }, { status: 400 })
  }

  const { data, error } = await getSupabaseAdmin()
    .from("qa_sheets")
    .insert({
      uploaded_by: auth.userId,
      file_name: file.name.slice(0, 200),
      task_ids: parsed.taskIds,
      row_count: parsed.rowCount,
    })
    .select("file_name, uploaded_at, task_ids, row_count, user:users(email)")
    .single()
  if (error || !data) {
    if (error && MISSING_TABLE_CODES.has(error.code)) return NextResponse.json({ error: SETUP_MESSAGE }, { status: 503 })
    console.error("[azure-tasks/qa-sheet] insert:", error?.message)
    return NextResponse.json({ error: "Couldn't save the QA sheet." }, { status: 500 })
  }
  return NextResponse.json({ sheet: toSheet(data as SheetRow) }, { status: 201 })
}
