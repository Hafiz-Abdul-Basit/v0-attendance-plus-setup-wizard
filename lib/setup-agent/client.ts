/**
 * Client-importable surface of `lib/setup-agent`.
 *
 * This barrel exists separately from `./index.ts` so client components
 * can import the types and the PowerShell script generators without
 * pulling in modules that use `import "server-only"` (i.e. the
 * orchestrator, Azure DevOps downloader, logger, validator).
 *
 * Rule: if a module touches `fs`, `process.env` secrets, network calls,
 * or `server-only`, it lives in `./index.ts` and must NOT be exported
 * from here.
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

export { buildMongoSetupScript } from "./mongoSetup"
export { buildIisSetupScript, renderIisSiteBlock } from "./iisSetup"
export { buildExtractionScript } from "./deploymentExtractor"
