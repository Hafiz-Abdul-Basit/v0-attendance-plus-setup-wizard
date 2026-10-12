/**
 * Type re-exports for the Azure Tasks module.
 *
 * Lets components import the
 * domain types from the component layer rather than reaching into
 * `hooks/use-azure-tasks`.
 */
export type {
  AzureWorkItem,
  AzureWorkItemComment,
  AzureWorkItemCommentsPage,
  AzureWorkItemQuery,
  AzureWorkItemSummary,
  AzureIdentity,
} from "@/hooks/use-azure-tasks"
