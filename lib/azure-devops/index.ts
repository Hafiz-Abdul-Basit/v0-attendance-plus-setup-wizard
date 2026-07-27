/**
 * Azure DevOps — barrel export.
 *
 * Public surface of the lib/azure-devops module. Routes and other
 * server-only consumers should import from here, not from individual
 * files, so the internal layout can change without ripple effects.
 */
export type {
  AzureIdentity,
  AzureWorkItem,
  AzureWorkItemComment,
  AzureWorkItemCommentsPage,
  AzureWorkItemFieldRef,
  AzureWorkItemPage,
  AzureWorkItemQuery,
  AzureWorkItemSummary,
} from "./types"
export { AzureApiError, AZURE_WORK_ITEM_FIELDS, STALE_DAYS } from "./types"
export { getAzureConfig, AzureConfigError } from "./config"
export {
  getDefaultCredentialProvider,
  PatCredentialProvider,
  OAuthCredentialProvider,
} from "./auth"
export type { AzureCredentialProvider } from "./auth"
export {
  getWorkItems,
  getWorkItemById,
  getWorkItemComments,
  getSummaryStats,
  isAzureConfigured,
  streamAttachment,
} from "./service"
