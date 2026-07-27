/**
 * Azure DevOps — WIQL builder + raw-response mapper.
 *
 * WIQL syntax is documented here:
 *   https://learn.microsoft.com/en-us/azure/devops/boards/queries/wiql-syntax
 *
 * The builder here only covers the subset of WIQL we need: equality
 * matches and date-range filters on the System.* / Microsoft.VSTS.*
 * fields. Anything more complex (hierarchy queries, group-by, etc.) can
 * be added later — the public signature stays the same.
 *
 * `mapWorkItem` is the one place where the upstream field names (which
 * the rest of the app should not depend on) are translated to our
 * normalised shape.
 */

import type {
  AzureIdentity,
  AzureWorkItem,
  AzureWorkItemAttachment,
  AzureWorkItemFieldRef,
  AzureWorkItemQuery,
} from "./types";
import { AZURE_WORK_ITEM_FIELDS } from "./types";

/**
 * WIQL date literals against fields like `[System.ChangedDate]` are
 * written as a bare `YYYY-MM-DD` token (no `@`, no quotes, no time
 * component). Empirically:
 *   - `'2026-04-23T19:00:00.000Z'` (quoted ISO) → "cannot supply a
 *     time with the date when running a query using date precision".
 *   - `@2026-04-23` (`@`-wrapped) → "Expecting end of string", parser
 *     reads `@` as a token and chokes on the trailing `-23`.
 *   - `2026-04-23` (bare) → accepted.
 *
 * Day-resolution is plenty for our use case (e.g. "last 7 days",
 * "this month").
 */
const isoForWiql = (iso: string): string => {
  // Tolerate full ISO 8601, ISO with offset, or bare "YYYY-MM-DD".
  // `Date#toISOString` always produces `…T00:00:00.000Z` for a parsed
  // date-only string, so slicing is safe.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Escape single quotes inside a WIQL string literal (double the quote).
 * WIQL uses doubled single-quotes as the escape mechanism.
 */
const escapeStringLiteral = (s: string): string => s.replace(/'/g, "''");

/**
 * Build a WIQL string for the given query. The query is always scoped
 * to the configured project and to work items whose ChangedDate is in
 * the requested window (or all-time if neither `from` nor `to` is set).
 */
export function buildWorkItemQuery(
  project: string,
  query: AzureWorkItemQuery,
): string {
  const clauses: string[] = [
    `[System.TeamProject] = '${escapeStringLiteral(project)}'`,
  ];

  if (query.type) {
    clauses.push(
      `[System.WorkItemType] = '${escapeStringLiteral(query.type)}'`,
    );
  }

  if (query.state) {
    clauses.push(`[System.State] = '${escapeStringLiteral(query.state)}'`);
  }

  if (query.assignee) {
    clauses.push(
      `[System.AssignedTo] = '${escapeStringLiteral(query.assignee)}'`,
    );
  }

  if (query.from) {
    clauses.push(`[System.ChangedDate] >= '${isoForWiql(query.from)}'`);
  }

  if (query.to) {
    clauses.push(`[System.ChangedDate] <= '${isoForWiql(query.to)}'`);
  }

  const wiql = `
SELECT
    [System.Id],
    [System.Title],
    [System.State],
    [System.WorkItemType],
    [System.ChangedDate]
FROM WorkItems
WHERE
    ${clauses.join("\n    AND ")}
ORDER BY
    [System.ChangedDate] DESC
`.trim();

  return wiql;
}

const asString = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;

const asNumber = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const asIdentity = (v: unknown): AzureIdentity | null => {
  // Sometimes the server returns an identity as a string (the display
  // name alone, e.g. "Johnnie McLeod <foo@bar.com>"). Surface the
  // string as the display name so the UI can still show it.
  if (typeof v === "string") {
    if (v.length === 0) return null;
    return { displayName: v, uniqueName: "" };
  }
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const displayName = asString(o.displayName);
  const uniqueName = asString(o.uniqueName);
  if (!displayName && !uniqueName) return null;
  return {
    displayName: displayName ?? uniqueName ?? "",
    uniqueName: uniqueName ?? "",
    imageUrl: asString(o.imageUrl) ?? undefined,
    descriptor: asString(o.descriptor) ?? undefined,
  };
};

const asTags = (v: unknown): string[] => {
  const s = asString(v);
  if (!s) return [];
  return s
    .split(";")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
};

/**
 * Strip the most common HTML tags from an Azure DevOps description so it
 * renders safely as plain text. We do NOT render HTML — the description
 * is always shown in a `<pre>` / monospace block.
 */
const stripHtml = (s: string): string =>
  s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Extract the GUID out of an Azure DevOps attachment URL. URLs look
 * like:
 *   https://dev.azure.com/{org}/{project}/_apis/wit/attachments/{guid}?fileName=…
 *
 * Returns null if no GUID is present (e.g. a relation URL that points
 * somewhere else, like a link to another work item).
 */
const extractAttachmentId = (url: string): string | null => {
  const m = url.match(/\/attachments\/([0-9a-fA-F-]{36})(?:[?#]|$)/);
  return m ? m[1] : null;
};

/**
 * Pull the `AttachedFile` relations off a raw work item and project them
 * into our typed shape. The list-fetch path does NOT call this (the
 * batch endpoint doesn't support `$expand=relations`); only the
 * single-item path goes through here.
 */
export function parseAttachments(raw: unknown): AzureWorkItemAttachment[] {
  const r = (raw ?? {}) as {
    relations?: Array<{
      rel?: string;
      url?: string;
      attributes?: { name?: string; comment?: string };
    }>;
  };
  if (!Array.isArray(r.relations)) return [];
  const out: AzureWorkItemAttachment[] = [];
  for (const rel of r.relations) {
    if (rel?.rel !== "AttachedFile") continue;
    const url = asString(rel.url);
    if (!url) continue;
    const id = extractAttachmentId(url);
    if (!id) continue;
    out.push({
      id,
      name:
        asString(rel.attributes?.name) ??
        // The filename is sometimes tucked in the `?fileName=…` query
        // string. Fall back to it so we never render "Untitled".
        (() => {
          try {
            const u = new URL(url);
            const fn = u.searchParams.get("fileName");
            return fn ?? `attachment-${id}`;
          } catch {
            return `attachment-${id}`;
          }
        })(),
      url,
      comment: asString(rel.attributes?.comment),
    });
  }
  return out;
}

/**
 * Convert a single raw Azure work item into our normalised shape.
 * `webUrl` is the user-facing URL Azure DevOps uses to open the work
 * item in a browser (`/_workitems/edit/{id}`).
 */
export function mapWorkItem(
  raw: unknown,
  organization: string,
  project: string,
): AzureWorkItem {
  const r = (raw ?? {}) as {
    id: number;
    rev: number;
    fields: Record<string, unknown>;
    url: string;
    relations?: unknown;
  };
  const f = r.fields ?? {};
  const description = asString(f["System.Description"]);
  const attachments = parseAttachments(raw);
  const attachmentCount =
    asNumber(f["System.AttachedFileCount"]) ?? attachments.length;
  return {
    id: r.id,
    rev: r.rev,
    type: asString(f["System.WorkItemType"]) ?? "Task",
    title: asString(f["System.Title"]) ?? "(untitled)",
    state: asString(f["System.State"]) ?? "Unknown",
    reason: asString(f["System.Reason"]),
    assignedTo: asIdentity(f["System.AssignedTo"]),
    createdBy: asIdentity(f["System.CreatedBy"]),
    createdDate: asString(f["System.CreatedDate"]),
    changedBy: asIdentity(f["System.ChangedBy"]),
    changedDate: asString(f["System.ChangedDate"]),
    tags: asTags(f["System.Tags"]),
    iterationPath: asString(f["System.IterationPath"]),
    areaPath: asString(f["System.AreaPath"]),
    priority:
      asNumber(f["System.Priority"]) ??
      asNumber(f["Microsoft.VSTS.Common.Priority"]),
    description: description ? stripHtml(description) : null,
    startDate: asString(f["Microsoft.VSTS.Scheduling.StartDate"]),
    targetDate: asString(f["Microsoft.VSTS.Scheduling.TargetDate"]),
    attachmentCount,
    // Only surface the full attachment list when the upstream payload
    // actually contained a relations array (i.e. the single-item path
    // with $expand=relations). The list path leaves this undefined.
    attachments: Array.isArray(r.relations) ? attachments : undefined,
    url: r.url,
    webUrl: `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(
      project,
    )}/_workitems/edit/${r.id}`,
    raw,
  };
}

/** The field list we ask the upstream API for. */
export function getRequestedFields(): AzureWorkItemFieldRef[] {
  return [...AZURE_WORK_ITEM_FIELDS];
}
