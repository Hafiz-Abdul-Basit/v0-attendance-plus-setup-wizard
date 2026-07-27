/**
 * GET /api/azure-tasks/[id]/attachments/[attachmentId]
 *
 * Streams a single work-item attachment from Azure DevOps back to the
 * browser with our auth header attached. The browser cannot call Azure
 * DevOps directly because the PAT lives server-side.
 *
 * `id` is the work-item id; `attachmentId` is the GUID embedded in the
 * attachment's upstream URL (see `lib/azure-devops/queries.ts`).
 *
 * Auth: any signed-in user with `can_see_azure_tasks` access (admins
 * included).
 *
 * Query params:
 *   - download=1     — force Content-Disposition: attachment so the
 *                      browser saves the file instead of previewing it.
 *                      Without this flag we send "inline" so the UI can
 *                      preview images / PDFs in a new tab while still
 *                      letting the user right-click → Save As.
 *   - preview=1      — same as default (inline). Provided for callers
 *                      that want to be explicit.
 */
import { NextResponse } from "next/server"

import { requireAzureTasksAccess } from "@/lib/auth"
import { streamAttachment, AzureApiError } from "@/lib/azure-devops"

interface RouteContext {
  params: { id: string; attachmentId: string }
}

export async function GET(request: Request, { params }: RouteContext) {
  const auth = await requireAzureTasksAccess(request)
  if (auth instanceof NextResponse) return auth

  const workItemId = Number(params.id)
  if (!Number.isFinite(workItemId) || workItemId <= 0) {
    return NextResponse.json({ error: "Invalid work item id" }, { status: 400 })
  }

  const attachmentId = params.attachmentId
  if (!attachmentId || !/^[0-9a-fA-F-]{36}$/.test(attachmentId)) {
    return NextResponse.json(
      { error: "Invalid attachment id" },
      { status: 400 },
    )
  }

  const url = new URL(request.url)
  const download = url.searchParams.get("download") === "1"

  try {
    const stream = await streamAttachment(workItemId, attachmentId)
    if (!stream) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 },
      )
    }

    // Pass the upstream bytes back through. We override the
    // content-disposition so the browser downloads (or renders) the file
    // using the filename Azure DevOps has on record, not the route path.
    // `inline` lets the UI preview PDFs / images; `?download=1` forces
    // the browser's Save As dialog.
    const headers = new Headers()
    const upstreamType = stream.contentType
    if (upstreamType) headers.set("Content-Type", upstreamType)

    const disposition = download ? "attachment" : "inline"
    const encodedName = encodeURIComponent(stream.filename)
    headers.set(
      "Content-Disposition",
      `${disposition}; filename="${stream.filename.replace(/["\\]/g, "_")}"; filename*=UTF-8''${encodedName}`,
    )

    // Surface the upstream content-length so the browser can show a
    // progress bar / file size in the download UI. Falls back to no
    // header if upstream didn't include it.
    const upstreamLen = stream.response.headers.get("content-length")
    if (upstreamLen) headers.set("Content-Length", upstreamLen)

    headers.set("Cache-Control", "private, max-age=300")

    return new Response(stream.response.body, {
      status: 200,
      headers,
    })
  } catch (err) {
    if (err instanceof AzureApiError) {
      if (err.status === 501 || err.code === "config") {
        return NextResponse.json({ error: err.message }, { status: 501 })
      }
      return NextResponse.json(
        { error: "Failed to fetch attachment from Azure DevOps" },
        { status: 502 },
      )
    }
    return NextResponse.json(
      { error: "Internal error fetching attachment" },
      { status: 500 },
    )
  }
}
