/**
 * Azure Tasks — barrel export.
 *
 * Lets pages import everything from `@/components/azure-tasks`:
 *   import { AzureTasksPanel } from "@/components/azure-tasks"
 */
export { AzureTasksPanel } from "./AzureTasksPanel"
export { AzureTaskSummaryCards } from "./AzureTaskSummaryCards"
export { AzureTaskKpiStrip } from "./AzureTaskKpiStrip"
export { AzureTaskFilters, deriveFilterOptions } from "./AzureTaskFilters"
export { AzureTaskTable } from "./AzureTaskTable"
export type {
  AzureTaskSort,
  AzureTaskSortKey,
  SortDir,
} from "./AzureTaskTable"
export {
  AzureTaskRowExpansion,
  AzureTaskRowExpansionPlaceholder,
} from "./AzureTaskRowExpansion"
export {
  AzureTaskQuickRanges,
  detectQuickRange,
} from "./AzureTaskQuickRanges"
export type { QuickRange, QuickRangeId } from "./AzureTaskQuickRanges"
export { AzureTaskResultSummary } from "./AzureTaskResultSummary"
export { AzureTaskToggles } from "./AzureTaskToggles"
export type {
  AzureWorkItem,
  AzureWorkItemQuery,
  AzureWorkItemSummary,
  AzureIdentity,
} from "./types"
export { FilterPopoverSelect } from "./FilterPopoverSelect"
export type { FilterPopoverSelectOption } from "./FilterPopoverSelect"
