/**
 * Azure DevOps — client-safe public surface.
 *
 * Only re-exports types and pure constants that are safe to import from
 * `"use client"` components. Anything that touches the network, env
 * vars, or filesystem lives in `./index` and must only be imported from
 * server code (route handlers, server components, server actions).
 *
 * This split exists so client components can import our types without
 * dragging the `server-only` markers from `./auth` / `./config` into
 * the browser bundle.
 */
export type {
  AzureIdentity,
  AzureWorkItem,
  AzureWorkItemAttachment,
  AzureWorkItemFieldRef,
  AzureWorkItemPage,
  AzureWorkItemQuery,
  AzureWorkItemSummary,
} from "./types"
export { AZURE_WORK_ITEM_FIELDS, STALE_DAYS } from "./types"

// Pure search helpers — safe to import from client components so the
// search box can render an "id search" hint without a server round-trip.
// Lives in `./search` (a pure module with no `server-only` marker) so
// re-exporting it doesn't drag the server-only marker from `./service`
// into the browser bundle.
export { parseSearchQuery, isIdOnlySearch } from "./search"
export type { ParsedSearch } from "./search"
