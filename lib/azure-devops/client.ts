/**
 * Azure DevOps — typed HTTP client.
 *
 * Wraps the four endpoints we use:
 *   - POST /_apis/wit/wiql              (returns work item IDs)
 *   - GET  /_apis/wit/workitems?ids=…  (returns full work items)
 *   - GET  /_apis/wit/workitems/{id}   (returns a single work item)
 *   - GET  <attachment URL>            (streams attachment bytes)
 *
 * Adds:
 *   - Auth header resolution via the injected credential provider
 *   - A 10s request timeout (AbortController) for JSON calls; binary
 *     downloads (`getAttachmentStream`) use a longer 60s timeout
 *   - Typed errors via AzureApiError
 *   - 429 honouring: respects Retry-After once before giving up
 *
 * This module is server-only — the credential provider import would
 * otherwise leak PATs into the browser bundle.
 */

import "server-only"

import type { AzureCredentialProvider } from "./auth"
import type { AzureConfig } from "./config"
import { AzureApiError } from "./types"

const DEFAULT_TIMEOUT_MS = 10_000
const ATTACHMENT_TIMEOUT_MS = 60_000

/** Raw shape returned by `GET /wit/workitems?ids=…`. */
export interface AzureWorkItemBatchResponse {
  count: number
  value: Array<{
    id: number
    rev: number
    fields: Record<string, unknown>
    url: string
  }>
}

/** Raw shape returned by `POST /wit/wiql`. */
export interface AzureWiqlResponse {
  queryType: "flat" | "tree" | "oneHop"
  queryResultType: "workItem" | "workItemLink"
  asOf: string
  columns: Array<{ referenceName: string; name: string; url?: string }>
  workItems?: Array<{ id: number; url: string }>
  workItemRelations?: Array<{
    rel?: string
    source?: { id: number; url: string }
    target: { id: number; url: string }
  }>
}

/** Raw shape returned by `GET /wit/workItems/{id}/comments`. */
export interface AzureCommentsResponse {
  /** Total comment count (across all pages). */
  totalCount: number
  /** Comments for the requested page. */
  comments: Array<{
    id: number
    text: string
    createdBy?: {
      displayName?: string
      uniqueName?: string
      imageUrl?: string
      descriptor?: string
    }
    createdDate?: string
    modifiedDate?: string
    isDeleted?: boolean
  }>
}

export class AzureDevOpsClient {
  private readonly config: AzureConfig
  private readonly provider: AzureCredentialProvider

  constructor(config: AzureConfig, provider: AzureCredentialProvider) {
    this.config = config
    this.provider = provider
  }

  private get projectPath(): string {
    return `/${encodeURIComponent(this.config.project)}`
  }

  private get apiVersionQuery(): string {
    return `api-version=${encodeURIComponent(this.config.apiVersion)}`
  }

  /**
   * Build the api-version query string, with an optional override. Used
   * by the comments endpoint, which is pinned to a long-stable preview
   * version regardless of the configured default.
   */
  private apiVersionQueryFor(version: string): string {
    return `api-version=${encodeURIComponent(version)}`
  }

  /** Internal — performs an authenticated JSON request. */
  private async request<T>(
    path: string,
    init: RequestInit = {},
    apiVersionOverride?: string,
  ): Promise<T> {
    // If the caller already provided an api-version in the path
    // (e.g. when an endpoint is pinned to a long-stable preview), do
    // not append a second one.
    const hasApiVersion = /[?&]api-version=/.test(path)
    const url = hasApiVersion
      ? `${this.config.baseUrl}${path}`
      : `${this.config.baseUrl}${path}${
          path.includes("?") ? "&" : "?"
        }${apiVersionOverride
          ? this.apiVersionQueryFor(apiVersionOverride)
          : this.apiVersionQuery}`

    const headers = new Headers(init.headers)
    headers.set("Accept", "application/json")
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
    const auth = await this.provider.getAuthHeaders()
    for (const [k, v] of Object.entries(auth)) headers.set(k, v)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

    const doFetch = async (): Promise<Response> => {
      try {
        return await fetch(url, { ...init, headers, signal: controller.signal })
      } finally {
        clearTimeout(timeoutId)
      }
    }

    let res: Response
    try {
      res = await doFetch()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Azure DevOps request failed"
      throw new AzureApiError(
        `Network error contacting Azure DevOps: ${message}`,
        0,
        "network",
        null,
      )
    }

    // Honor Retry-After exactly once on 429.
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? "0")
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000
      await new Promise((r) => setTimeout(r, Math.min(waitMs, 5_000)))
      try {
        res = await doFetch()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Azure DevOps retry failed"
        throw new AzureApiError(
          `Network error during Azure DevOps retry: ${message}`,
          0,
          "network",
          null,
        )
      }
    }

    if (!res.ok) {
      let body: unknown = null
      try {
        body = await res.json()
      } catch {
        try {
          body = await res.text()
        } catch {
          body = null
        }
      }
      const message =
        (body && typeof body === "object" && "message" in body
          ? String((body as { message: unknown }).message)
          : null) ?? `Azure DevOps returned ${res.status}`
      throw new AzureApiError(message, res.status, "upstream", body)
    }

    return (await res.json()) as T
  }

  /**
   * Run a WIQL query. Returns the parsed response — callers flatten
   * `workItems` / `workItemRelations` into a flat id list themselves.
   */
  async queryWorkItemsByWiql(wiql: string): Promise<AzureWiqlResponse> {
    return this.request<AzureWiqlResponse>(`${this.projectPath}/_apis/wit/wiql`, {
      method: "POST",
      body: JSON.stringify({ query: wiql }),
    })
  }

  /**
   * Fetch a batch of work items by id. The list endpoint accepts up to
   * ~200 ids per call — callers should chunk larger lists.
   */
  async getWorkItems(
    ids: number[],
    fields?: string[],
  ): Promise<AzureWorkItemBatchResponse> {
    if (ids.length === 0) return { count: 0, value: [] }
    const params = new URLSearchParams()
    params.set("ids", ids.join(","))
    if (fields && fields.length > 0) {
      params.set("fields", fields.join(","))
    }
    return this.request<AzureWorkItemBatchResponse>(
      `${this.projectPath}/_apis/wit/workitems?${params.toString()}`,
    )
  }

  /**
   * Fetch a single work item by id. Pass `expand: "relations"` to
   * include the `relations[]` array (used for attachments) — that's
   * the only way the public API exposes attachment metadata.
   *
   * `expandParam` lets callers toggle between the canonical Azure
   * DevOps Service form (`$expand`) and the legacy Azure DevOps
   * Server form (`expand`). Some older on-prem deployments reject
   * `$expand` outright and only accept the un-prefixed name.
   */
  async getWorkItem(
    id: number,
    fields?: string[],
    options?: {
      expand?: "relations" | "all" | "none"
      /** Default: "$expand". Set to "expand" for older Azure DevOps Server. */
      expandParam?: "$expand" | "expand"
    },
  ): Promise<unknown> {
    const params = new URLSearchParams()
    if (fields && fields.length > 0) {
      params.set("fields", fields.join(","))
    }
    const expand = options?.expand
    const expandKey = options?.expandParam ?? "$expand"
    if (expand && expand !== "none") {
      params.set(expandKey, expand)
    }
    const suffix = params.toString() ? `?${params.toString()}` : ""
    return this.request<unknown>(
      `${this.projectPath}/_apis/wit/workitems/${encodeURIComponent(String(id))}${suffix}`,
    )
  }

  /**
   * Fetch the comments attached to a work item. Uses the dedicated
   * comments REST endpoint (`/wit/workItems/{id}/comments`) because
   * comments are NOT included in the standard work-item payload and
   * there's no `expand` flag that surfaces them.
   *
   * `api-version` is hard-coded to `7.1-preview.2` for this endpoint
   * because the comments API has lived on the preview surface for many
   * major versions and switching to GA has historically broken older
   * Azure DevOps Server instances. Using the preview version that has
   * been stable since Azure DevOps Server 2020 is the safe default.
   *
   * `page` is 1-based, `pageSize` is bounded to ≤ 200 by the upstream.
   * Returns the raw response so the service layer can apply pagination
   * + normalisation.
   */
  async getComments(
    id: number,
    options?: { page?: number; pageSize?: number },
  ): Promise<AzureCommentsResponse> {
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 50
    const params = new URLSearchParams()
    params.set("$top", String(pageSize))
    params.set("$skip", String(Math.max(0, (page - 1) * pageSize)))
    // Pin the api-version to the long-stable preview. The comments API
    // has been on the preview surface for many major versions and
    // switching to GA has historically broken older Azure DevOps Server
    // instances. Use `api-version=7.1-preview.4` because earlier
    // previews return `404 Not Found` from newer Azure DevOps Server
    // deployments (verified 2026-07-27: `7.1-preview.2` returns 404
    // even when the work item exists at GET /workItems/{id}).
    const commentPath = `${this.projectPath}/_apis/wit/workItems/${encodeURIComponent(
      String(id),
    )}/comments?${params.toString()}`
    return this.request<AzureCommentsResponse>(commentPath, {}, "7.1-preview.4")
  }

  /**
   * Stream the bytes of a work-item attachment from Azure DevOps. The
   * URL is the one we previously extracted from the work item's
   * `relations[].url` field — calling it directly requires our auth
   * header, so we proxy the response back to the browser.
   *
   * Returns the upstream `Response` (status, headers, body) so callers
   * can pipe it through their own framework. Throws `AzureApiError` on
   * network or upstream failure, identical to `request()`.
   */
  async getAttachmentStream(url: string): Promise<Response> {
    const headers = new Headers()
    const auth = await this.provider.getAuthHeaders()
    for (const [k, v] of Object.entries(auth)) headers.set(k, v)
    // We don't know (or care) what the attachment's content-type is —
    // let the browser infer from the body. Forwarding `Accept:
    // application/json` would actively *break* binary downloads.
    headers.delete("Accept")
    headers.delete("Content-Type")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ATTACHMENT_TIMEOUT_MS)

    let res: Response
    try {
      res = await fetch(url, { headers, signal: controller.signal })
    } catch (err) {
      clearTimeout(timeoutId)
      const message =
        err instanceof Error ? err.message : "Azure DevOps request failed"
      throw new AzureApiError(
        `Network error fetching attachment: ${message}`,
        0,
        "network",
        null,
      )
    }
    clearTimeout(timeoutId)

    if (!res.ok) {
      // Best-effort body capture for diagnostics. We don't surface this
      // to the client, only to the server log via the thrown error.
      let body: unknown = null
      try {
        body = await res.text()
      } catch {
        body = null
      }
      throw new AzureApiError(
        `Azure DevOps returned ${res.status} for attachment`,
        res.status,
        "upstream",
        body,
      )
    }

    return res
  }
}
