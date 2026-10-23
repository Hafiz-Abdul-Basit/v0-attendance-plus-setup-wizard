/**
 * /api/azure-tasks/qa-sheet — the QA-passed task list Export Packs are
 * filtered against.
 *
 * GET  — the active (newest) QA sheet:
 *          { sheet: { fileName, uploadedAt, fetchedAt, byEmail, taskIds,
 *                     rowCount, sourceUrl } | null, setupRequired?: true }
 *        With ?fresh=1 and a Google Sheets source, the sheet is re-read
 *        first (the export does this), so QA's latest edits always apply.
 *        A failed re-read is an error — the export must not use stale IDs.
 * POST — set the QA sheet, either
 *          multipart `file`  (.xlsx workbook or .csv of the "Att Plus" sheet), or
 *          JSON { url }      (Google Sheets link, "Anyone with the link → Viewer").
 *        Only the "Att Plus" sheet's "Azure Task No" column is read
 *        (lib/qa-sheet.ts). The newest row wins, so uploading a file after
 *        saving a link switches back to the file.
 *
 * Auth: Azure Tasks access (admin or can_see_azure_tasks). Files are not
 * stored — only the parsed IDs, the source link and who set it.
 */
import { NextResponse } from "next/server"

import { requireAzureTasksAccess } from "@/lib/auth"
import { parseQaFile, QaSheetError, type ParsedQaSheet } from "@/lib/qa-sheet"
import { canonicalSheetUrl, fetchGoogleQaSheet, googleSheetId } from "@/lib/qa-sheet-source"
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"
import { getSupabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

/** Table not created yet (migration pending): PostgREST reports PGRST205, Postgres 42P01. */
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"])
/** Column missing (the source_url migration isn't applied yet). */
const MISSING_COLUMN_CODES = new Set(["42703", "PGRST204"])
const MAX_BYTES = 10 * 1024 * 1024
const SETUP_MESSAGE = "QA sheet storage isn't set up yet — apply migration 20261023000000_qa_sheets.sql."
const LINK_SETUP_MESSAGE =
  "Google Sheets links need migration 20261024000000_qa_sheets_source_url.sql — apply it in Supabase, or upload the file instead."

const FULL_COLUMNS = "id, file_name, uploaded_at, fetched_at, source_url, task_ids, row_count, uploaded_by, user:users(email)"
const BASIC_COLUMNS = "id, file_name, uploaded_at, task_ids, row_count, uploaded_by, user:users(email)"

type SheetRow = {
  id: string
  file_name: string
  uploaded_at: string
  fetched_at?: string | null
  source_url?: string | null
  task_ids: number[]
  row_count: number
  uploaded_by: string | null
  user: { email?: string } | Array<{ email?: string }> | null
}

function toSheet(row: SheetRow) {
  const user = Array.isArray(row.user) ? row.user[0] : row.user
  return {
    fileName: row.file_name,
    uploadedAt: row.uploaded_at,
    fetchedAt: row.fetched_at ?? row.uploaded_at,
    byEmail: user?.email ?? null,
    taskIds: row.task_ids ?? [],
    rowCount: row.row_count,
    sourceUrl: row.source_url ?? null,
  }
}

/** Newest row; falls back to the pre-link columns if that migration is pending. */
async function latestRow(): Promise<{ row: SheetRow | null; linkColumns: boolean; error?: { code?: string; message: string } }> {
  const db = getSupabaseAdmin()
  const full = await db.from("qa_sheets").select(FULL_COLUMNS).order("uploaded_at", { ascending: false }).limit(1).maybeSingle()
  if (!full.error) return { row: full.data as SheetRow | null, linkColumns: true }
  if (!MISSING_COLUMN_CODES.has(full.error.code)) return { row: null, linkColumns: true, error: full.error }
  const basic = await db.from("qa_sheets").select(BASIC_COLUMNS).order("uploaded_at", { ascending: false }).limit(1).maybeSingle()
  if (basic.error) return { row: null, linkColumns: false, error: basic.error }
  return { row: basic.data as SheetRow | null, linkColumns: false }
}

const sameIds = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i])

export async function GET(request: Request) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth

  const { row, error } = await latestRow()
  if (error) {
    if (MISSING_TABLE_CODES.has(error.code ?? "")) return NextResponse.json({ sheet: null, setupRequired: true })
    console.error("[azure-tasks/qa-sheet] read:", error.message)
    return NextResponse.json({ error: "Couldn't load the QA sheet." }, { status: 500 })
  }
  if (!row) return NextResponse.json({ sheet: null })

  const fresh = new URL(request.url).searchParams.get("fresh") === "1"
  if (!fresh || !row.source_url) return NextResponse.json({ sheet: toSheet(row) })

  // Re-read the linked Google Sheet so the export uses QA's latest edits.
  let parsed: ParsedQaSheet
  try {
    parsed = await fetchGoogleQaSheet(row.source_url)
  } catch (err) {
    const msg = err instanceof QaSheetError ? err.message : "Couldn't read the Google Sheet."
    if (!(err instanceof QaSheetError)) console.error("[azure-tasks/qa-sheet] refresh:", err)
    return NextResponse.json({ error: `QA sheet: ${msg} Export stopped.` }, { status: 502 })
  }

  const db = getSupabaseAdmin()
  const now = new Date().toISOString()
  if (sameIds(parsed.taskIds, row.task_ids ?? [])) {
    await db.from("qa_sheets").update({ fetched_at: now, row_count: parsed.rowCount }).eq("id", row.id)
    return NextResponse.json({ sheet: toSheet({ ...row, fetched_at: now, row_count: parsed.rowCount }) })
  }
  // The list changed — keep a new row so the history shows when.
  const { data, error: insertError } = await db
    .from("qa_sheets")
    .insert({
      uploaded_by: row.uploaded_by,
      file_name: row.file_name,
      source_url: row.source_url,
      task_ids: parsed.taskIds,
      row_count: parsed.rowCount,
      fetched_at: now,
    })
    .select(FULL_COLUMNS)
    .single()
  if (insertError || !data) {
    console.error("[azure-tasks/qa-sheet] refresh insert:", insertError?.message)
    // The fresh IDs are still right; serve them even if saving failed.
    return NextResponse.json({ sheet: toSheet({ ...row, task_ids: parsed.taskIds, row_count: parsed.rowCount, fetched_at: now }) })
  }
  return NextResponse.json({ sheet: toSheet(data as SheetRow) })
}

export async function POST(request: Request) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth
  const limit = rateLimit(`qa-sheet:${auth.userId}:${getClientIp(request.headers)}`, 20, 60 * 60_000)
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  const isJson = (request.headers.get("content-type") ?? "").includes("application/json")
  let parsed: ParsedQaSheet
  let fileName: string
  let sourceUrl: string | null = null

  try {
    if (isJson) {
      const body = (await request.json().catch(() => ({}))) as { url?: unknown }
      const url = typeof body.url === "string" ? body.url.trim() : ""
      const id = googleSheetId(url)
      if (!id) {
        return NextResponse.json(
          { error: "Paste a Google Sheets link (https://docs.google.com/spreadsheets/d/…). OneDrive links can't be read by the server." },
          { status: 400 },
        )
      }
      parsed = await fetchGoogleQaSheet(url)
      sourceUrl = canonicalSheetUrl(id)
      fileName = "Google Sheet"
    } else {
      let file: File | null = null
      try {
        const f = (await request.formData()).get("file")
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
      parsed = await parseQaFile(file.name, await file.arrayBuffer())
      fileName = file.name.slice(0, 200)
    }
  } catch (err) {
    if (err instanceof QaSheetError) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error("[azure-tasks/qa-sheet] parse:", err)
    return NextResponse.json({ error: "Couldn't read that QA sheet." }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const base = { uploaded_by: auth.userId, file_name: fileName, task_ids: parsed.taskIds, row_count: parsed.rowCount }
  let result = await db
    .from("qa_sheets")
    .insert({ ...base, source_url: sourceUrl, fetched_at: new Date().toISOString() })
    .select(FULL_COLUMNS)
    .single()
  if (result.error && MISSING_COLUMN_CODES.has(result.error.code)) {
    // source_url migration pending: files still work, links can't be saved.
    if (sourceUrl) return NextResponse.json({ error: LINK_SETUP_MESSAGE }, { status: 503 })
    result = await db.from("qa_sheets").insert(base).select(BASIC_COLUMNS).single()
  }
  if (result.error || !result.data) {
    if (result.error && MISSING_TABLE_CODES.has(result.error.code)) {
      return NextResponse.json({ error: SETUP_MESSAGE }, { status: 503 })
    }
    console.error("[azure-tasks/qa-sheet] insert:", result.error?.message)
    return NextResponse.json({ error: "Couldn't save the QA sheet." }, { status: 500 })
  }
  return NextResponse.json({ sheet: toSheet(result.data as SheetRow) }, { status: 201 })
}
