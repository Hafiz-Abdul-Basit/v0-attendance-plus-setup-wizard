/**
 * Azure DevOps — server-side configuration.
 *
 * Reads org / project / PAT / API version from process.env at first use.
 * The PAT is NEVER exposed via any return value; only downstream code in
 * this directory reads it through `getAzureConfig()` and only passes the
 * derived `CredentialProvider` around.
 *
 * If the required env vars are missing, the loader throws a descriptive
 * error. The API route handler catches that and returns 501 so the UI
 * can show a friendly "Configure AZURE_DEVOPS_PAT" message.
 */

import "server-only"

export interface AzureConfig {
  organization: string
  project: string
  /** True when a PAT is configured. The PAT value itself is not exposed. */
  hasPat: boolean
  /** True when an OAuth token is configured. The token itself is not exposed. */
  hasOAuth: boolean
  apiVersion: string
  /** Base URL of the Azure DevOps REST API. */
  baseUrl: string
}

const DEFAULT_API_VERSION = "7.1"

let cached: AzureConfig | null = null

function readEnv(name: string): string | null {
  const v = process.env[name]
  if (v == null) return null
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Resolve (and cache) the Azure DevOps config from environment variables.
 * Throws a single, descriptive error if the required vars are missing —
 * the route handler maps this to a 501 response.
 */
export function getAzureConfig(): AzureConfig {
  if (cached) return cached

  const organization = readEnv("AZURE_DEVOPS_ORG")
  const project = readEnv("AZURE_DEVOPS_PROJECT")
  const pat = readEnv("AZURE_DEVOPS_PAT")
  const oauth = readEnv("AZURE_DEVOPS_OAUTH_TOKEN")
  const apiVersion = readEnv("AZURE_DEVOPS_API_VERSION") ?? DEFAULT_API_VERSION

  if (!organization || !project) {
    throw new AzureConfigError(
      "Azure DevOps is not configured. Set AZURE_DEVOPS_ORG and AZURE_DEVOPS_PROJECT in .env.local.",
    )
  }
  if (!pat && !oauth) {
    throw new AzureConfigError(
      "Azure DevOps credentials are missing. Set AZURE_DEVOPS_PAT (Personal Access Token) in .env.local.",
    )
  }

  cached = Object.freeze({
    organization,
    project,
    hasPat: Boolean(pat),
    hasOAuth: Boolean(oauth),
    apiVersion,
    baseUrl: `https://dev.azure.com/${encodeURIComponent(organization)}`,
  })
  return cached
}

/** Test-only — clears the cached config so the next call re-reads env. */
export function _resetAzureConfigForTests(): void {
  cached = null
}

/** Thrown when the Azure DevOps env vars are missing or malformed. */
export class AzureConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AzureConfigError"
  }
}

/**
 * Returns the raw PAT — only callable from server-side code in this
 * directory. Do not export this to hooks or components.
 */
export function getAzurePat(): string | null {
  return readEnv("AZURE_DEVOPS_PAT")
}

/**
 * Returns the raw OAuth access token — only callable from server-side
 * code. Do not export this to hooks or components.
 */
export function getAzureOAuthToken(): string | null {
  return readEnv("AZURE_DEVOPS_OAUTH_TOKEN")
}
