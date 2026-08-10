/**
 * Deployment validator — given a configuration, runs the read-only checks
 * the task spec calls out in section 14 (validation):
 *
 *   - For IIS:    website exists, app pool exists, app pool running,
 *                 HTTPS binding present, certificate bound, site started.
 *   - For Mongo:  Windows service running, replica-set name matches,
 *                 `rs.status()` reports a primary.
 *   - For deployment:  expected directories exist, extracted folders
 *                      exist, web.config files exist.
 *
 * As with the rest of the orchestrator, the *server-side* validator runs
 * only the cheap structural checks (path existence, JSON parsing). The
 * full check set lives in the PowerShell runner script — `Invoke-
 * SetupAgent.ps1` — and the result is reported back via the UI when the
 * admin runs it.
 */

import "server-only"

import { existsSync, statSync } from "node:fs"
import { join, isAbsolute } from "node:path"

import type { ServerSetupConfig } from "./types"

export interface ValidationCheck {
  /** Identifier — stable for UI test-id lookup. */
  id: string
  /** Category for grouping ("paths", "iis", "mongo", "deployment"). */
  category: "paths" | "iis" | "mongo" | "deployment"
  label: string
  status: "ok" | "warn" | "fail" | "skipped"
  message: string
}

export interface ValidationReport {
  ok: boolean
  checks: ValidationCheck[]
}

/**
 * Run the structural validation checks the server can perform in
 * isolation. The deeper IIS / Mongo / Windows-service checks must run
 * on the target server itself — see `Invoke-SetupAgent.ps1`.
 */
export function validateDeployment(config: ServerSetupConfig): ValidationReport {
  const checks: ValidationCheck[] = []

  // Path checks
  checks.push(checkPath("deploymentBasePath", config.deploymentBasePath, "Deployment base path"))
  checks.push(checkPath("iisBasePath", config.iisBasePath, "IIS base path"))

  // Per-site physical path
  for (const site of config.iisSites) {
    const path = site.physicalPath
      ? site.physicalPath
      : site.physicalSubPath
      ? join(config.iisBasePath, site.physicalSubPath)
      : ""
    checks.push(
      checkPath(
        `iisSite.${site.name}.physicalPath`,
        path,
        `IIS site "${site.name}" physical path`,
      ),
    )
  }

  // Port / host sanity
  for (const site of config.iisSites) {
    checks.push({
      id: `iisSite.${site.name}.port`,
      category: "iis",
      label: `Port for "${site.name}"`,
      status:
        Number.isFinite(site.port) && site.port > 0 && site.port <= 65535
          ? "ok"
          : "fail",
      message:
        Number.isFinite(site.port) && site.port > 0 && site.port <= 65535
          ? `Port ${site.port}`
          : "Invalid port",
    })
  }

  // MongoDB config file path
  checks.push(
    checkPath(
      "mongoDb.configFilePath",
      config.mongoDb.configFilePath,
      "MongoDB config file",
    ),
  )

  return {
    ok: checks.every((c) => c.status === "ok" || c.status === "warn"),
    checks,
  }
}

function checkPath(
  id: string,
  path: string,
  label: string,
): ValidationCheck {
  if (!path || path.trim().length === 0) {
    return {
      id,
      category: "paths",
      label,
      status: "fail",
      message: "Path is empty.",
    }
  }
  if (!isAbsolute(path)) {
    return {
      id,
      category: "paths",
      label,
      status: "warn",
      message: `Path is not absolute (${path}).`,
    }
  }
  try {
    if (existsSync(path)) {
      const stat = statSync(path)
      return {
        id,
        category: "paths",
        label,
        status: "ok",
        message: stat.isDirectory()
          ? `Directory exists: ${path}`
          : `File exists: ${path}`,
      }
    }
    return {
      id,
      category: "paths",
      label,
      status: "warn",
      message: `Path does not exist yet: ${path}`,
    }
  } catch (err) {
    return {
      id,
      category: "paths",
      label,
      status: "fail",
      message:
        err instanceof Error ? `Cannot access path: ${err.message}` : "Cannot access path.",
    }
  }
}
