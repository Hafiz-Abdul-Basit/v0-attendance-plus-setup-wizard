/**
 * Azure DevOps artifacts — server-side download service.
 *
 * Calls the Azure DevOps Builds REST API directly on behalf of the Setup
 * Agent, authenticating with the PAT the user supplied for the run
 * (`OverridePatProvider`). The server's own AZURE_DEVOPS_PAT is never used
 * here: the request body picks the organization / project, so falling back
 * to the server credential would let any caller borrow it.
 *
 * Three responsibilities:
 *   1. List the latest *successful* build for a pipeline
 *   2. List the artifacts attached to a build
 *   3. Download a single artifact as a Node ReadableStream
 *
 * Streaming matters: backend artifacts can be tens of megabytes. We never
 * buffer a full artifact in memory — the route handler pipes the
 * `ReadableStream` straight to the filesystem (via `Response`).
 */

import "server-only"

import { AzureApiError } from "@/lib/azure-devops/types"

import type { AzureDevOpsConfig } from "./types"

/** Raw shape returned by the Builds REST endpoint. We only read what we use. */
interface AzureBuild {
  id: number
  buildNumber: string
  status: string
  result: string
  finishTime?: string
  sourceBranch?: string
  _links?: {
    artifacts?: { href: string }
  }
}

interface AzureBuildListResponse {
  count: number
  value: AzureBuild[]
}

interface AzureArtifact {
  id: string
  name: string
  resource: {
    type: string
    data: string
    downloadUrl: string
    properties?: Record<string, unknown>
  }
}

/** Build summary returned to the orchestrator / UI. */
export interface LatestBuildSummary {
  buildId: number
  buildNumber: string
  finishTime: string | null
  result: string
  sourceBranch: string | null
}

/** Information about an artifact attached to a build. */
export interface ArtifactInfo {
  id: string
  name: string
  downloadUrl: string
}

/** Download result — either a streamed response or a buffer. */
export interface ArtifactDownload {
  artifactName: string
  buildId: number
  /** Underlying upstream Response. The caller is responsible for reading & closing. */
  response: Response
  filename: string
}

/** Inject the user-supplied PAT into a fresh credential provider. */
class OverridePatProvider {
  readonly name = "pat-override"
  constructor(private readonly pat: string) {}
  async getAuthHeaders(): Promise<Record<string, string>> {
    const basic = Buffer.from(`:${this.pat}`, "utf8").toString("base64")
    return { Authorization: `Basic ${basic}` }
  }
}

/** Internal — list the latest successful build for a pipeline. */
async function listBuilds(
  azure: AzureDevOpsConfig,
  pipelineId: number,
): Promise<AzureBuild[]> {
  if (!azure.organization || !azure.project || !pipelineId) {
    throw new Error("Azure DevOps org / project / pipelineId are required.")
  }
  const params = new URLSearchParams()
  params.set("definitions", String(pipelineId))
  params.set("statusFilter", "completed")
  params.set("resultFilter", "succeeded")
  params.set("$top", "10")
  params.set("api-version", "7.1")
  const url = `/${encodeURIComponent(azure.project)}/_apis/build/builds?${params.toString()}`

  const headers: Record<string, string> = { Accept: "application/json" }
  const auth = await new OverridePatProvider(azure.personalAccessToken).getAuthHeaders()
  Object.assign(headers, auth)

  const baseUrl = `https://dev.azure.com/${encodeURIComponent(azure.organization)}`
  const res = await fetch(`${baseUrl}${url}`, { headers })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new AzureApiError(
      `Failed to list builds for pipeline ${pipelineId} (status ${res.status})`,
      res.status,
      "upstream",
      body,
    )
  }
  const json = (await res.json()) as AzureBuildListResponse
  return json.value ?? []
}

/**
 * Find the latest *successful* build for the given pipeline. Returns null
 * if no successful build exists.
 */
export async function getLatestSuccessfulBuild(
  azure: AzureDevOpsConfig,
  pipelineId: number,
): Promise<LatestBuildSummary | null> {
  const builds = await listBuilds(azure, pipelineId)
  if (builds.length === 0) return null
  const latest = builds[0]
  return {
    buildId: latest.id,
    buildNumber: latest.buildNumber,
    finishTime: latest.finishTime ?? null,
    result: latest.result,
    sourceBranch: latest.sourceBranch ?? null,
  }
}

/** List artifacts attached to a specific build. */
export async function listBuildArtifacts(
  azure: AzureDevOpsConfig,
  buildId: number,
): Promise<ArtifactInfo[]> {
  if (!azure.organization || !azure.project || !buildId) {
    throw new Error("Azure DevOps org / project / buildId are required.")
  }
  const params = new URLSearchParams()
  params.set("api-version", "7.1")
  const url = `/${encodeURIComponent(azure.project)}/_apis/build/builds/${buildId}/artifacts?${params.toString()}`

  const headers: Record<string, string> = { Accept: "application/json" }
  const auth = await new OverridePatProvider(azure.personalAccessToken).getAuthHeaders()
  Object.assign(headers, auth)

  const baseUrl = `https://dev.azure.com/${encodeURIComponent(azure.organization)}`
  const res = await fetch(`${baseUrl}${url}`, { headers })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new AzureApiError(
      `Failed to list artifacts for build ${buildId} (status ${res.status})`,
      res.status,
      "upstream",
      body,
    )
  }
  const json = (await res.json()) as { value?: AzureArtifact[] }
  const list = json.value ?? []
  return list.map((a) => ({
    id: a.id,
    name: a.name,
    downloadUrl: a.resource?.downloadUrl ?? "",
  }))
}

/** Pick the artifact whose name best matches `preferredName` (case-insensitive). */
export function pickArtifact(
  artifacts: ArtifactInfo[],
  preferredName: string,
): ArtifactInfo | null {
  if (artifacts.length === 0) return null
  const lower = preferredName.toLowerCase()
  const exact = artifacts.find((a) => a.name.toLowerCase() === lower)
  if (exact) return exact
  const contains = artifacts.find((a) => a.name.toLowerCase().includes(lower))
  if (contains) return contains
  // Fall back to the first artifact so a misconfigured preferredName
  // doesn't silently drop the download — the orchestrator can warn.
  return artifacts[0]
}

/**
 * Stream a build artifact's bytes. The caller is responsible for piping the
 * returned `Response.body` to disk (or throwing on `!response.ok`).
 */
export async function downloadBuildArtifact(
  azure: AzureDevOpsConfig,
  downloadUrl: string,
): Promise<Response> {
  if (!azure.personalAccessToken) {
    throw new Error("Azure DevOps PAT is required to download artifacts.")
  }
  const auth = await new OverridePatProvider(azure.personalAccessToken).getAuthHeaders()
  const res = await fetch(downloadUrl, { headers: auth })
  if (!res.ok) {
    throw new AzureApiError(
      `Artifact download failed (status ${res.status})`,
      res.status,
      "upstream",
      null,
    )
  }
  return res
}

/**
 * High-level helper: resolve the latest successful build for `pipelineId`,
 * pick the artifact whose name matches `artifactNameHint` (or the first
 * one), and stream its bytes back. Returns null if the pipeline has no
 * successful builds yet.
 */
export async function downloadLatestArtifact(
  azure: AzureDevOpsConfig,
  pipelineId: number,
  artifactNameHint: string,
  logger: { info: (m: string) => void; warn: (m: string) => void },
): Promise<{ buildId: number; buildNumber: string; filename: string; response: Response } | null> {
  const latest = await getLatestSuccessfulBuild(azure, pipelineId)
  if (!latest) {
    logger.warn(`No successful build found for pipeline ${pipelineId}.`)
    return null
  }
  logger.info(
    `Latest successful build for pipeline ${pipelineId}: #${latest.buildId} (${latest.buildNumber}).`,
  )
  const artifacts = await listBuildArtifacts(azure, latest.buildId)
  if (artifacts.length === 0) {
    logger.warn(`Build #${latest.buildId} has no artifacts.`)
    return null
  }
  const chosen = pickArtifact(artifacts, artifactNameHint)
  if (!chosen) {
    logger.warn(`No artifact matched hint "${artifactNameHint}".`)
    return null
  }
  if (chosen.name.toLowerCase() !== artifactNameHint.toLowerCase()) {
    logger.warn(
      `Artifact "${chosen.name}" did not exactly match hint "${artifactNameHint}" — using it as the closest match.`,
    )
  }
  logger.info(`Downloading artifact "${chosen.name}" from build #${latest.buildId}.`)
  const response = await downloadBuildArtifact(azure, chosen.downloadUrl)
  const filename = `${chosen.name}-${latest.buildNumber}.zip`
  return {
    buildId: latest.buildId,
    buildNumber: latest.buildNumber,
    filename,
    response,
  }
}
