/**
 * Public surface of `lib/setup-agent`.
 *
 * Server-side consumers (API routes, server components) should import
 * from here rather than the individual files so the internal layout can
 * evolve without ripple effects.
 */

export type {
  ServerSetupConfig,
  RedactedServerSetupConfig,
  IisSiteConfig,
  MongoDbConfig,
  SslConfig,
  AzureDevOpsConfig,
  RedactedAzureDevOpsConfig,
  SoftwareVersions,
  SetupLogEntry,
  SetupStepId,
  SetupStepResult,
  SetupRunState,
  StepStatus,
  LogLevel,
  ValidationIssue,
  ConfigValidationResult,
} from "./types"

export {
  SETUP_STEP_LABELS,
  DEFAULT_PINNED_VERSIONS,
  DEFAULT_SERVER_SETUP_CONFIG,
  redactConfig,
  validateConfig,
} from "./types"

export {
  scrubSecrets,
  SetupLogger,
  generateRunId,
} from "./logger"

export {
  downloadLatestArtifact,
  getLatestSuccessfulBuild,
  listBuildArtifacts,
  pickArtifact,
} from "./azureArtifacts"

export { buildMongoSetupScript } from "./mongoSetup"
export { buildIisSetupScript, renderIisSiteBlock } from "./iisSetup"
export { buildExtractionScript } from "./deploymentExtractor"
export { validateDeployment, type ValidationCheck, type ValidationReport } from "./deploymentValidator"
export { checkPrivilege, type PrivilegeStatus } from "./privilegeChecker"

export {
  launchRun,
  snapshotRun,
  startRun,
  executeRun,
  getRun,
  listRuns,
  deleteRun,
  type OrchestratorExecuteOptions,
} from "./orchestrator"
