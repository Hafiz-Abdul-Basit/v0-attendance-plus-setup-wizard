/**
 * Azure DevOps — credential provider abstraction.
 *
 * Today we only support Personal Access Tokens (PAT) via HTTP Basic auth.
 * The `AzureCredentialProvider` interface is the seam where future OAuth
 * support (or a managed-identity flow) can plug in without touching the
 * HTTP client or the service layer.
 *
 * IMPORTANT: this module is server-only. It must never be imported from
 * a "use client" file. The PAT and OAuth token are only read here and
 * are never returned to callers — only the `Authorization` header.
 */

import "server-only"

import { getAzureOAuthToken, getAzurePat } from "./config"

/** An abstract credential provider. */
export interface AzureCredentialProvider {
  /** A short, human-readable name used in logs / error messages. */
  readonly name: string
  /** Returns the request headers this provider requires. */
  getAuthHeaders(): Promise<Record<string, string>>
}

/**
 * Personal Access Token — uses HTTP Basic auth with a blank username and
 * the PAT as the password. This is the simplest, recommended way to talk
 * to Azure DevOps from a service.
 * See: https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate
 */
export class PatCredentialProvider implements AzureCredentialProvider {
  readonly name = "pat"

  async getAuthHeaders(): Promise<Record<string, string>> {
    const pat = getAzurePat()
    if (!pat) {
      throw new Error("AZURE_DEVOPS_PAT is not set.")
    }
    // Basic auth: base64(":" + pat)
    const basic = Buffer.from(`:${pat}`, "utf8").toString("base64")
    return { Authorization: `Basic ${basic}` }
  }
}

/**
 * OAuth access token — bearer auth. This is a forward-compatible stub:
 * the actual token acquisition / refresh flow can be added later without
 * changing the rest of the service. For now it reads the env var once
 * per request; the eventual refresh-token implementation can wrap that.
 */
export class OAuthCredentialProvider implements AzureCredentialProvider {
  readonly name = "oauth"

  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = getAzureOAuthToken()
    if (!token) {
      throw new Error("AZURE_DEVOPS_OAUTH_TOKEN is not set.")
    }
    return { Authorization: `Bearer ${token}` }
  }
}

let cached: AzureCredentialProvider | null = null

/**
 * Returns the configured credential provider, picking PAT or OAuth based
 * on which env var is present. PAT wins if both are set (it is the more
 * common, simpler path for service-to-service auth).
 */
export function getDefaultCredentialProvider(): AzureCredentialProvider {
  if (cached) return cached
  if (getAzurePat()) {
    cached = new PatCredentialProvider()
  } else if (getAzureOAuthToken()) {
    cached = new OAuthCredentialProvider()
  } else {
    throw new Error(
      "No Azure DevOps credential is configured. Set AZURE_DEVOPS_PAT (or AZURE_DEVOPS_OAUTH_TOKEN).",
    )
  }
  return cached
}

/** Test-only — drops the cached provider so the next call re-reads env. */
export function _resetCredentialProviderForTests(): void {
  cached = null
}
