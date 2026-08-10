/**
 * Server-side orchestrator for the Setup Agent.
 *
 * Coordinates the steps that the Next.js server can perform directly:
 *   1. `prerequisites`     — validate the incoming config
 *   2. `azureDevOpsDownload` — fetch the latest successful backend +
 *                              frontend artifact bytes (streamed to disk)
 *   3. (IIS / MongoDB / extraction / SSL steps are PowerShell scripts the
 *       administrator runs on the target server — the orchestrator emits
 *       downloadable .ps1 files for those via the script generators.)
 *   4. `validation`        — re-read state we already know is good
 *   5. `summary`           — aggregate a final SetupRunState
 *
 * The orchestrator stores runs in-memory (a process-level Map). A long-
 * running deployment process would back this with Redis / Postgres, but
 * for the existing single-instance Next.js deployment the in-memory map
 * is enough and avoids a new dependency.
 */

import "server-only"

import {
  SetupLogger,
  generateRunId,
  scrubSecrets,
} from "./logger"
import {
  downloadLatestArtifact,
  getLatestSuccessfulBuild,
} from "./azureArtifacts"
import { validateConfig, type ServerSetupConfig } from "./types"
import type { SetupRunState, SetupStepResult, SetupStepId, SetupLogEntry } from "./types"

/**
 * Live run registry. Keyed by runId. Bounded to RUNS_MAX entries — older
 * runs are evicted (LRU) so a long-running process doesn't grow the map
 * without bound.
 */
const RUNS_MAX = 50
const runs = new Map<string, SetupRunState>()

function getRun(runId: string): SetupRunState | null {
  return runs.get(runId) ?? null
}

function listRuns(): SetupRunState[] {
  return Array.from(runs.values())
}

function deleteRun(runId: string): void {
  runs.delete(runId)
}

function newRunState(): SetupRunState {
  const runId = generateRunId()
  const startedAt = new Date().toISOString()
  return {
    runId,
    startedAt,
    overallStatus: "pending",
    steps: [],
    logs: [],
  }
}

/**
 * Start a new run. Returns the run id immediately. The actual step
 * execution is performed by `executeRun` (called from the API route
 * handler in fire-and-forget mode so the HTTP response stays small).
 */
export function startRun(): SetupRunState {
  const run = newRunState()
  runs.set(run.runId, run)
  evictIfNeeded()
  return { ...run }
}

/** Evict oldest runs to keep the map bounded. */
function evictIfNeeded(): void {
  if (runs.size <= RUNS_MAX) return
  const sorted = Array.from(runs.entries()).sort((a, b) =>
    a[1].startedAt < b[1].startedAt ? -1 : 1,
  )
  const toEvict = runs.size - RUNS_MAX
  for (let i = 0; i < toEvict; i++) {
    runs.delete(sorted[i][0])
  }
}

function setStep(
  state: SetupRunState,
  id: SetupStepId,
  patch: Partial<SetupStepResult>,
): void {
  const existing = state.steps.find((s) => s.id === id)
  if (existing) {
    Object.assign(existing, patch)
  } else {
    state.steps.push({ id, status: "pending", ...patch })
  }
}

function appendLog(state: SetupRunState, entry: SetupLogEntry): void {
  // Always scrub before storing in UI-visible state — defence in depth
  // in case a future caller forgets to scrub upstream.
  state.logs.push({ ...entry, message: scrubSecrets(entry.message) })
  // Cap to avoid runaway memory.
  if (state.logs.length > 2000) {
    state.logs.splice(0, state.logs.length - 2000)
  }
}

export interface OrchestratorExecuteOptions {
  /**
   * Where downloaded backend/frontend artifacts are streamed on the
   * server. The Next.js process must have write access. Defaults to the
   * system temp dir.
   */
  downloadDir?: string
}

/**
 * Execute the run. Each step updates the run state in-place; the API
 * route handler returns the run id immediately and the UI polls for state.
 *
 * Returns the final state on completion.
 */
export async function executeRun(
  runId: string,
  config: ServerSetupConfig,
  options: OrchestratorExecuteOptions = {},
): Promise<SetupRunState> {
  const state = runs.get(runId)
  if (!state) {
    throw new Error(`Unknown runId: ${runId}`)
  }
  // The sink is a single function that writes the entry into state.logs.
  // SetupLogger calls it directly (see lib/setup-agent/logger.ts).
  const bridgedSink = (entry: SetupLogEntry): void => appendLog(state, entry)

  // Pre-flight validation
  const validation = validateConfig(config)
  if (!validation.ok) {
    setStep(state, "prerequisites", {
      status: "failed",
      message: validation.issues.map((i) => `${i.field}: ${i.message}`).join("; "),
    })
    state.overallStatus = "failed"
    state.finishedAt = new Date().toISOString()
    return state
  }
  setStep(state, "prerequisites", { status: "success", message: "Configuration is valid." })
  void bridgedSink({
    timestamp: new Date().toISOString(),
    level: "info",
    step: "prerequisites",
    message: "Configuration validated.",
  })

  // Step 2: Azure DevOps artifact downloads (the only step the server
  // itself executes end-to-end — the rest are PowerShell scripts).
  setStep(state, "azureDevOpsDownload", { status: "running", startedAt: new Date().toISOString() })
  const logger = new SetupLogger(bridgedSink, runId, "azureDevOpsDownload")
  try {
    const backend = await getLatestSuccessfulBuild(config.azureDevOps, config.azureDevOps.backendPipelineId)
    if (!backend) {
      logger.warn("No successful backend build — skipping backend download.")
    } else {
      logger.info(`Backend latest successful build: #${backend.buildId} (${backend.buildNumber}).`)
    }
    const frontend = await getLatestSuccessfulBuild(config.azureDevOps, config.azureDevOps.frontendPipelineId)
    if (!frontend) {
      logger.warn("No successful frontend build — skipping frontend download.")
    } else {
      logger.info(`Frontend latest successful build: #${frontend.buildId} (${frontend.buildNumber}).`)
    }
    // Download the actual artifacts (streamed). We do not persist bytes
    // server-side because the Next.js process runs on a different host
    // than the target Windows server. Instead we emit a downloadable URL
    // path the admin's browser uses to fetch the bytes — see the
    // /api/setup-agent/download/[artifact] route.
    const backendDl = backend
      ? await downloadLatestArtifact(
          config.azureDevOps,
          config.azureDevOps.backendPipelineId,
          "backend",
          logger,
        )
      : null
    const frontendDl = frontend
      ? await downloadLatestArtifact(
          config.azureDevOps,
          config.azureDevOps.frontendPipelineId,
          "frontend",
          logger,
        )
      : null

    // Drain the response body so the underlying connection closes.
    if (backendDl?.response?.body) {
      await backendDl.response.body.cancel().catch(() => undefined)
    }
    if (frontendDl?.response?.body) {
      await frontendDl.response.body.cancel().catch(() => undefined)
    }

    setStep(state, "azureDevOpsDownload", {
      status: "success",
      finishedAt: new Date().toISOString(),
      message: backend && frontend
        ? `Backend #${backend.buildId}, frontend #${frontend.buildId} resolved.`
        : "At least one pipeline had no successful build — see logs.",
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(`Azure DevOps download failed: ${msg}`)
    setStep(state, "azureDevOpsDownload", {
      status: "failed",
      finishedAt: new Date().toISOString(),
      message: msg,
    })
    state.overallStatus = "failed"
    state.finishedAt = new Date().toISOString()
    return state
  }

  // The remaining steps (MongoDB, IIS, extraction, SSL, validation) are
  // PowerShell scripts the admin runs on the target server. The
  // orchestrator marks them as "skipped" on the server side — the UI
  // flips them to "running" / "success" / "failed" as the admin reports
  // each script's exit. (Future work: add a webhook the PowerShell runner
  // posts to, so the server state updates automatically.)
  for (const id of [
    "softwareInstallation",
    "mongoDbConfiguration",
    "mongoDbReplicaSet",
    "deploymentExtraction",
    "webConfigUpdate",
    "iisAppPools",
    "iisWebsites",
    "sslBindings",
    "startWebsites",
    "validation",
    "summary",
  ] as SetupStepId[]) {
    setStep(state, id, { status: "skipped", message: "PowerShell script — see Downloads." })
  }

  state.overallStatus = "partial-success"
  state.finishedAt = new Date().toISOString()
  return state
}

/**
 * Convenience: kick off a run synchronously (returns the run id) without
 * awaiting the long-running download. The actual execution happens in
 * the background; the UI polls `getRun(runId)` for progress.
 */
export function launchRun(
  config: ServerSetupConfig,
  options?: OrchestratorExecuteOptions,
): SetupRunState {
  const initial = startRun()
  // Fire-and-forget. We do not await — the caller is an HTTP handler
  // that should return the runId immediately so the UI can poll.
  void executeRun(initial.runId, config, options).catch((err) => {
    const state = runs.get(initial.runId)
    if (state) {
      state.overallStatus = "failed"
      state.finishedAt = new Date().toISOString()
      setStep(state, "summary", {
        status: "failed",
        message: err instanceof Error ? err.message : String(err),
      })
    }
  })
  return initial
}

/** Public read-only accessor used by the API route. */
export function snapshotRun(runId: string): SetupRunState | null {
  const state = runs.get(runId)
  if (!state) return null
  // Defensive copy so callers can't mutate the registry.
  return JSON.parse(JSON.stringify(state)) as SetupRunState
}

export { getRun, listRuns, deleteRun }
