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

  /** Internal — performs an authenticated JSON request. */
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${path}${
      path.includes("?") ? "&" : "?"
    }${this.apiVersionQuery}`

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
