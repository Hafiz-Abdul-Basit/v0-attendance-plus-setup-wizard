/**
 * Azure Tasks — domain types.
 *
 * Everything Azure DevOps–related is normalised here so the rest of the
 * application can depend on a stable shape regardless of the upstream
 * field names. Raw API responses are kept on `raw` for debugging.
 *
 * This module is pure (no side effects, no env reads, no fetch) and is
 * safe to import from any layer.
 */

/** A flattened identity reference (e.g. an assignee). */
export interface AzureIdentity {
  displayName: string;
  uniqueName: string;
  imageUrl?: string;
  descriptor?: string;
}

/**
 * Work items not changed in this many days are considered "stale" by
 * the panel filter. Surfaced as a constant so the UI can render the
 * same number in its toggle label.
 */
export const STALE_DAYS = 30;

/**
 * The list of System.* / Microsoft.VSTS.* field reference names we ask
 * Azure DevOps to return. Keeping this in one place ensures the WIQL
 * builder, the batch GET, and the summary stats all stay in sync.
 */
export const AZURE_WORK_ITEM_FIELDS = [
  "System.Id",
  "System.Title",
  "System.Description",
  "System.State",
  "System.Reason",
  "System.WorkItemType",
  "System.AssignedTo",
  "System.CreatedBy",
  "System.CreatedDate",
  "System.ChangedBy",
  "System.ChangedDate",
  "System.Tags",
  "System.IterationPath",
  "System.AreaPath",
  "System.AttachedFileCount",
  "Microsoft.VSTS.Scheduling.StartDate",
  "Microsoft.VSTS.Scheduling.TargetDate",
  "Microsoft.VSTS.Common.Priority",
] as const;

export type AzureWorkItemFieldRef = (typeof AZURE_WORK_ITEM_FIELDS)[number];

/**
 * A single file attached to a work item. Populated only on the
 * single-item fetch (which uses `$expand=relations`). The list endpoint
 * returns just `attachmentCount`.
 *
 * `id` is the GUID embedded in the upstream URL's path — the same id we
 * pass to `/api/azure-tasks/[id]/attachments/[attachmentId]` to stream
 * the file through our auth proxy.
 */
export interface AzureWorkItemAttachment {
  id: string;
  name: string;
  /** The upstream Azure DevOps URL — server-only, never expose to the client. */
  url: string;
  comment: string | null;
}

/**
 * A single comment on a work item. Populated by the dedicated comments
 * endpoint (`GET /wit/workItems/{id}/comments`) — not included in the
 * standard work-item payload. We normalise the upstream shape into this
 * so the row-expansion UI can render a stable, client-safe structure.
 *
 * `id` is the upstream comment id (an integer, NOT a GUID). The HTML
 * body returned by the upstream is stripped to plain text by the
 * service layer — clients never see raw HTML.
 */
export interface AzureWorkItemComment {
  /** Upstream comment id (integer). */
  id: number;
  /** Plain-text body (HTML stripped). */
  text: string;
  /** When the comment was created. */
  createdDate: string | null;
  /** When the comment was last edited. */
  modifiedDate: string | null;
  /** True if the comment is currently visible (not deleted / hidden). */
  isDeleted: boolean;
  /** The author of the comment, if known. */
  createdBy: AzureIdentity | null;
}

/** A page of work-item comments plus paging metadata. */
export interface AzureWorkItemCommentsPage {
  items: AzureWorkItemComment[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  /**
   * True if the upstream did not return a `comments` array at all (e.g.
   * the deployment is configured to hide comments, or the comments
   * service is disabled). Lets the UI render a "comments disabled"
   * message rather than a misleading empty state.
   */
  commentsUnavailable?: boolean;
}

/** The normalised work item shape consumed by the UI. */
export interface AzureWorkItem {
  id: number;
  rev: number;
  type: string;
  title: string;
  state: string;
  reason: string | null;
  assignedTo: AzureIdentity | null;
  createdBy: AzureIdentity | null;
  createdDate: string | null;
  changedBy: AzureIdentity | null;
  changedDate: string | null;
  tags: string[];
  iterationPath: string | null;
  areaPath: string | null;
  priority: number | null;
  description: string | null;
  startDate: string | null;
  targetDate: string | null;
  /**
   * Number of files attached to the work item (from
   * `System.AttachedFileCount`). Always present on list-fetched items.
   * For single-fetched items this matches `attachments.length`.
   */
  attachmentCount: number;
  /**
   * Per-attachment metadata. Only populated when the work item was
   * fetched with `$expand=relations` (the single-item path). Undefined
   * on list-fetched items, and explicitly set to an empty array when
   * the upstream has no relations for this work item.
   */
  attachments?: AzureWorkItemAttachment[];
  /**
   * True when the single-item fetch tried every available relations
   * expansion path and the upstream rejected all of them (typically a
   * missing `vso.work_full` PAT scope). When this is true, the UI
   * should render a specific remediation message rather than the
   * generic "not loaded yet" placeholder.
   */
  relationsUnavailable?: boolean;
  url: string;
  webUrl: string;
  /** Raw Azure response — useful for power users / debugging. */
  raw: unknown;
}

/** A query against the work-item store. All fields are optional. */
export interface AzureWorkItemQuery {
  /** ISO datetime string — filter by ChangedDate >= from. */
  from?: string;
  /** ISO datetime string — filter by ChangedDate <= to. */
  to?: string;
  /** Free-text search across title + description + tags. */
  q?: string;
  /** Filter by assignee display name (exact match). */
  assignee?: string;
  /**
   * When true, restrict to work items whose assignee matches the
   * signed-in user's display name. Resolved server-side from the
   * session — clients don't pass an identity here.
   */
  onlyMine?: boolean;
  /**
   * Display name to use when `onlyMine` is true. Populated by the
   * client from the session (or by an admin tool) — never deserialized
   * from a saved URL.
   */
  currentUserName?: string;
  /**
   * When true, restrict to work items whose ChangedDate is older than
   * STALE_DAYS ago. Useful for clearing the backlog of untouched work.
   */
  stale?: boolean;
  /** Filter by state (e.g. "Active", "Closed", "Done"). */
  state?: string;
  /** Filter by work item type (e.g. "Task", "Bug", "User Story"). */
  type?: string;
  /** 1-based page number. */
  page?: number;
  /** Page size (max 200). */
  pageSize?: number;
}

/** Summary stats computed across the *filtered* result set. */
export interface AzureWorkItemSummary {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  byState: Record<string, number>;
  byAssignee: Record<string, number>;
}

/** A single page of work items plus paging + summary metadata. */
export interface AzureWorkItemPage {
  items: AzureWorkItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  summary: AzureWorkItemSummary;
}

/** Typed error returned by the Azure service. */
export class AzureApiError extends Error {
  status: number;
  code: string | null;
  body: unknown;

  constructor(
    message: string,
    status: number,
    code: string | null,
    body: unknown,
  ) {
    super(message);
    this.name = "AzureApiError";
    this.status = status;
    this.code = code;
    this.body = body;
  }
}
