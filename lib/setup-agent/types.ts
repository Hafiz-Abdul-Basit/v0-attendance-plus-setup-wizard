/**
 * Server Setup Agent — shared types.
 *
 * Used by the server-side orchestrator (`lib/setup-agent/orchestrator.ts`),
 * the API routes (`app/api/setup-agent/...`), the PowerShell runner script
 * (`scripts/setup-agent/Invoke-SetupAgent.ps1`), and the UI
 * (`components/client-setup/ServerSetup.tsx`).
 *
 * Everything that varies between environments (paths, Azure DevOps project
 * names, IIS site list, software versions, etc.) is expressed as data here
 * rather than being hardcoded in scripts or service files. The orchestrator
 * validates the config against `ServerSetupConfigSchema` before any step
 * runs.
 */

/** A single IIS site the agent must create and bind. */
export interface IisSiteConfig {
  /** Display name of the IIS site AND the matching application pool. */
  name: string
  /** TCP port the site binds (HTTPS, so usually 443 or a non-default port). */
  port: number
  /**
   * Physical path on disk where the application is deployed. Resolved at
   * runtime as `iisBasePath + "/" + physicalSubPath` if `physicalSubPath` is
   * set, otherwise used verbatim.
   */
  physicalPath?: string
  /**
   * Sub-path under `iisBasePath`. Use this for the multi-tenant case where
   * each site lives under a common solution folder.
   */
  physicalSubPath?: string
  /** Host header used in the HTTPS binding (e.g. `apigateway.raaweek12.com`). */
  host: string
}

/** MongoDB replica-set configuration. */
export interface MongoDbConfig {
  /** Replica set name — defaults to `rs0` per project convention. */
  replicaSetName: string
  /**
   * Bind IP for the mongod instance. `127.0.0.1` keeps it loopback-only;
   * change for a clustered deployment.
   */
  bindIp: string
  /** mongod TCP port. */
  port: number
  /** Path to the mongod configuration file on disk. */
  configFilePath: string
  /** Path mongod writes its database files to. */
  dbPath: string
  /** Path mongod writes its log file to. */
  logPath: string
  /** Windows service name (default `MongoDB`). */
  serviceName: string
}

/** SSL certificate configuration. */
export interface SslConfig {
  /** Friendly name of the cert in `Cert:\LocalMachine\My`. */
  certificateFriendlyName: string
  /**
   * Certificate store location. Always `LocalMachine\My` on Windows for
   * shared-cert IIS use; exposed for completeness and testing.
   */
  storeLocation: string
}

/** Azure DevOps pipeline configuration. */
export interface AzureDevOpsConfig {
  /** Organization (e.g. `Raaweek12Organization`). */
  organization: string
  /** Project (e.g. `Rk12.AttPlus.Integration`). */
  project: string
  /** Numeric pipeline id for the backend pipeline. */
  backendPipelineId: number
  /** Numeric pipeline id for the frontend pipeline. */
  frontendPipelineId: number
  /**
   * Personal Access Token. NEVER serialise this to the client; it is read
   * here only so the server-side AzureDevOpsArtifactService can include
   * the auth header on upstream calls. The UI receives a redacted shape
   * (see `RedactedAzureDevOpsConfig`).
   */
  personalAccessToken: string
}

/**
 * Redacted shape used in API responses and UI state. Mirrors
 * `AzureDevOpsConfig` but with the PAT replaced by a boolean `hasPat`.
 */
export interface RedactedAzureDevOpsConfig {
  organization: string
  project: string
  backendPipelineId: number
  frontendPipelineId: number
  hasPat: boolean
}

/**
 * Pinned software versions. Two packages are intentionally pinned because
 * RabbitMQ/Erlang have an ABI compatibility matrix — upgrading one without
 * the other breaks the broker. Everything else installs the latest stable
 * available at runtime.
 */
export interface SoftwareVersions {
  /** Pinned because it must match the Erlang version below. */
  rabbitMq: string
  /** Pinned — must match RabbitMQ's expected Erlang/OTP release. */
  erlang: string
  /** Empty string = "use latest stable at install time". */
  mongoDb: string
  /** Empty string = "use latest stable at install time". */
  dotNet: string
}

/** Full deployment config consumed by the orchestrator. */
export interface ServerSetupConfig {
  /** Path on disk where deployment artifacts (zips) are downloaded. */
  deploymentBasePath: string
  /**
   * Path on disk where the actual IIS sites live. Typically the parent of
   * each site's physical folder.
   */
  iisBasePath: string
  /** Azure DevOps project + pipeline identifiers + PAT. */
  azureDevOps: AzureDevOpsConfig
  /** MongoDB configuration. */
  mongoDb: MongoDbConfig
  /** SSL / certificate configuration. */
  ssl: SslConfig
  /** IIS sites the agent will create and bind. */
  iisSites: IisSiteConfig[]
  /** Pinned software versions. */
  softwareVersions: SoftwareVersions
}

/** Redacted config sent to the UI (no PAT). */
export type RedactedServerSetupConfig = Omit<ServerSetupConfig, "azureDevOps"> & {
  azureDevOps: RedactedAzureDevOpsConfig
}

/** Status of a single step. */
export type StepStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "skipped"
  /** Aggregate overall status when some steps succeeded and others skipped. */
  | "partial-success"

/** Severity of a single log entry. */
export type LogLevel = "info" | "warn" | "error" | "debug"

/**
 * A single log entry emitted by the orchestrator. The PAT and any other
 * secrets are NEVER placed in `message` — the orchestrator redacts before
 * emitting.
 */
export interface SetupLogEntry {
  timestamp: string
  level: LogLevel
  step: SetupStepId
  message: string
}

/** Identifier for each step the orchestrator knows about. */
export type SetupStepId =
  | "prerequisites"
  | "softwareInstallation"
  | "mongoDbConfiguration"
  | "mongoDbReplicaSet"
  | "azureDevOpsDownload"
  | "deploymentExtraction"
  | "webConfigUpdate"
  | "iisAppPools"
  | "iisWebsites"
  | "sslBindings"
  | "startWebsites"
  | "validation"
  | "summary"

/** Human-readable label for each step. */
export const SETUP_STEP_LABELS: Record<SetupStepId, string> = {
  prerequisites: "Validate server prerequisites",
  softwareInstallation: "Install required software",
  mongoDbConfiguration: "Configure MongoDB",
  mongoDbReplicaSet: "Configure MongoDB replica set",
  azureDevOpsDownload: "Download backend & frontend artifacts",
  deploymentExtraction: "Extract backend packages",
  webConfigUpdate: "Update backend web.config",
  iisAppPools: "Configure IIS application pools",
  iisWebsites: "Configure IIS websites",
  sslBindings: "Configure HTTPS / SSL bindings",
  startWebsites: "Start IIS websites",
  validation: "Validate deployment",
  summary: "Final deployment summary",
}

/** Status of an individual step within a run. */
export interface SetupStepResult {
  id: SetupStepId
  status: StepStatus
  message?: string
  startedAt?: string
  finishedAt?: string
  /** Per-site / per-item detail (e.g. one row per IIS site). */
  details?: Array<{ name: string; status: StepStatus; message?: string }>
}

/** Aggregate state of a setup run. */
export interface SetupRunState {
  runId: string
  startedAt: string
  finishedAt?: string
  overallStatus: StepStatus
  steps: SetupStepResult[]
  logs: SetupLogEntry[]
}

/** Validation result for a single field or whole-config check. */
export interface ValidationIssue {
  field: string
  message: string
}

/** Result of validating a config before running. */
export interface ConfigValidationResult {
  ok: boolean
  issues: ValidationIssue[]
}

/** Default pinned versions per project convention. */
export const DEFAULT_PINNED_VERSIONS: SoftwareVersions = {
  rabbitMq: "4.3.1",
  erlang: "27.3.4.13",
  mongoDb: "",
  dotNet: "",
}

/** Default config — safe starting values; user overrides via the UI. */
export const DEFAULT_SERVER_SETUP_CONFIG: ServerSetupConfig = {
  deploymentBasePath: "D:\\myNGApp\\Deployments\\Rk12.AttPlus.Integration",
  iisBasePath: "D:\\myNgApp\\Rk12.AttPlus.Solution.US",
  azureDevOps: {
    organization: "",
    project: "",
    backendPipelineId: 0,
    frontendPipelineId: 0,
    personalAccessToken: "",
  },
  mongoDb: {
    replicaSetName: "rs0",
    bindIp: "127.0.0.1",
    port: 27017,
    configFilePath: "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.cfg",
    dbPath: "C:\\data\\db",
    logPath: "C:\\data\\log\\mongod.log",
    serviceName: "MongoDB",
  },
  ssl: {
    certificateFriendlyName: "",
    storeLocation: "Cert:\\LocalMachine\\My",
  },
  iisSites: [],
  softwareVersions: { ...DEFAULT_PINNED_VERSIONS },
}

/** Redact secrets from a config — PAT is replaced by a boolean. */
export function redactConfig(config: ServerSetupConfig): RedactedServerSetupConfig {
  const hasPat =
    typeof config.azureDevOps.personalAccessToken === "string" &&
    config.azureDevOps.personalAccessToken.trim().length > 0
  return {
    ...config,
    azureDevOps: {
      organization: config.azureDevOps.organization,
      project: config.azureDevOps.project,
      backendPipelineId: config.azureDevOps.backendPipelineId,
      frontendPipelineId: config.azureDevOps.frontendPipelineId,
      hasPat,
    },
  }
}

/**
 * Lightweight zod-less validator. The Next.js app already uses zod, but
 * this module needs to be importable from both client and server bundles
 * and the shape is small enough to keep self-contained.
 */
export function validateConfig(config: ServerSetupConfig): ConfigValidationResult {
  const issues: ValidationIssue[] = []

  if (!config.deploymentBasePath || config.deploymentBasePath.trim().length === 0) {
    issues.push({ field: "deploymentBasePath", message: "Deployment base path is required." })
  }
  if (!config.iisBasePath || config.iisBasePath.trim().length === 0) {
    issues.push({ field: "iisBasePath", message: "IIS base path is required." })
  }
  if (!config.azureDevOps.organization) {
    issues.push({ field: "azureDevOps.organization", message: "Azure DevOps organization is required." })
  }
  if (!config.azureDevOps.project) {
    issues.push({ field: "azureDevOps.project", message: "Azure DevOps project is required." })
  }
  if (!config.azureDevOps.personalAccessToken) {
    issues.push({ field: "azureDevOps.personalAccessToken", message: "Azure DevOps PAT is required." })
  }
  if (!Number.isFinite(config.azureDevOps.backendPipelineId) || config.azureDevOps.backendPipelineId <= 0) {
    issues.push({
      field: "azureDevOps.backendPipelineId",
      message: "Backend pipeline id must be a positive integer.",
    })
  }
  if (!Number.isFinite(config.azureDevOps.frontendPipelineId) || config.azureDevOps.frontendPipelineId <= 0) {
    issues.push({
      field: "azureDevOps.frontendPipelineId",
      message: "Frontend pipeline id must be a positive integer.",
    })
  }
  if (!config.mongoDb.replicaSetName) {
    issues.push({ field: "mongoDb.replicaSetName", message: "MongoDB replica set name is required." })
  }
  if (!config.ssl.certificateFriendlyName) {
    issues.push({
      field: "ssl.certificateFriendlyName",
      message: "SSL certificate friendly name is required.",
    })
  }
  if (!Array.isArray(config.iisSites) || config.iisSites.length === 0) {
    issues.push({ field: "iisSites", message: "At least one IIS site must be configured." })
  } else {
    const seenNames = new Set<string>()
    for (const site of config.iisSites) {
      if (!site.name) {
        issues.push({ field: "iisSites[].name", message: "Each IIS site needs a name." })
      } else if (seenNames.has(site.name)) {
        issues.push({
          field: "iisSites[].name",
          message: `Duplicate IIS site name: ${site.name}`,
        })
      } else {
        seenNames.add(site.name)
      }
      if (!Number.isFinite(site.port) || site.port <= 0 || site.port > 65535) {
        issues.push({
          field: `iisSites[${site.name}].port`,
          message: `Invalid port for site ${site.name}.`,
        })
      }
      if (!site.host) {
        issues.push({ field: `iisSites[${site.name}].host`, message: `Site ${site.name} is missing host header.` })
      }
    }
  }

  return { ok: issues.length === 0, issues }
}
