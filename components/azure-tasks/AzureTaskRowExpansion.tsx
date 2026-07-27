"use client";

/**
 * AzureTaskRowExpansion — inline detail panel shown beneath a table row.
 *
 * Replaces the modal dialog with a content-stretching expansion that
 * keeps the table context visible while letting the user see the full
 * work item (fields, description, tags, attachments).
 *
 * Data shape:
 *   - If the parent already supplied an `expandedTask` with `attachments`
 *     populated (single-item fetch), we render that. Otherwise the row
 *     is responsible for fetching the expanded data (this component
 *     accepts a pre-fetched task — it does NOT fetch by itself, keeping
 *     the table the source of truth for which rows are expanded).
 */

import * as React from "react";
import {
  Calendar,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Paperclip,
  Tag,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AzureWorkItem } from "./types";
import { AzureTaskCommentsSection } from "./AzureTaskCommentsSection";

interface AzureTaskRowExpansionProps {
  task: AzureWorkItem;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function stateChipClass(state: string): string {
  const s = state.toLowerCase();
  if (s === "done" || s === "closed" || s === "resolved" || s === "completed") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  if (s === "active" || s === "in progress") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (s === "new" || s === "to do") {
    return "bg-gray-100 text-gray-700 border-gray-200";
  }
  if (s === "blocked" || s === "impediment") {
    return "bg-red-100 text-red-800 border-red-200";
  }
  return "bg-indigo-100 text-indigo-800 border-indigo-200";
}

function priorityChipClass(priority: number | null): string {
  if (priority == null) return "bg-gray-100 text-gray-500 border-gray-200";
  if (priority <= 1) return "bg-red-100 text-red-800 border-red-200";
  if (priority === 2) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function fileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "🖼️";
  if (["pdf"].includes(ext)) return "📄";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["zip", "7z", "rar", "tar", "gz"].includes(ext)) return "🗜️";
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "🎬";
  if (["mp3", "wav", "ogg"].includes(ext)) return "🎵";
  if (["txt", "log", "md"].includes(ext)) return "📃";
  if (["json", "xml", "yml", "yaml"].includes(ext)) return "🔧";
  return "📎";
}

function humanFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AzureTaskRowExpansion({ task }: AzureTaskRowExpansionProps) {
  const attachments = task.attachments ?? [];
  // Distinguish three states for the attachments section:
  //   1. We have a list (even if empty) → render it (or "no attachments")
  //   2. We don't have a list because the relations fetch was skipped
  //      (fallback path) → "attachments unavailable" with a hint
  //   3. No data → impossible here, the parent passes a task.
  const hasFetchedAttachments = Array.isArray(task.attachments);
  const hasAttachments = attachments.length > 0 || task.attachmentCount > 0;

  return (
    <div className="bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 border-y border-blue-100 px-6 py-5">
      {/* Inner scroll shell — when a work item has a long description, a
          big comment thread, or lots of attachments, the expansion panel
          would otherwise push the rest of the table down and force the
          outer `az-task-scroller` to scroll huge amounts. That breaks
          the user’s row context (the row they expanded scrolls out of
          view) and forces the lazy-load IntersectionObserver to keep
          loading pages even when the user is just reading one task.

          Wrap the content with a viewport-capped container that scrolls
          internally instead. `min(70vh, 40rem)` keeps tall panels usable
          on both mobile (caps at 70% of the screen) and huge desktop
          viewports (caps at 40rem so the right-rail sidebar stays
          visible above the fold). The `az-task-scroller` class mirrors
          the outer table scrollbar — same hover-fade styling so it
          visually doesn't look like a second distinct scroll surface.

          Important: this is an INDEPENDENT scroll region from the outer
          table. We deliberately do NOT propagate scroll events from
          here back to the parent — the row stays a single row in the
          table regardless of how tall the inner content gets. */}
      <div className="az-task-scroller az-task-inner-scroller max-h-[min(70vh,40rem)] overflow-y-auto pr-2 -mr-2">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-6">
        {/* Left: main content */}
        <div className="min-w-0 space-y-4">
          {/* Title + meta */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-mono text-gray-500">
                #{task.id}
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                  stateChipClass(task.state),
                )}
              >
                {task.state}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                {task.type}
              </span>
              {task.priority != null ? (
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    priorityChipClass(task.priority),
                  )}
                >
                  P{task.priority}
                </span>
              ) : null}
              {hasAttachments ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  <Paperclip className="w-3 h-3" />
                  {attachments.length || task.attachmentCount}
                </span>
              ) : null}
            </div>
            <h3 className="text-base font-semibold text-gray-900 leading-snug">
              {task.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Last updated {formatDateTime(task.changedDate)}
              {task.changedBy?.displayName
                ? ` by ${task.changedBy.displayName}`
                : ""}
            </p>
          </div>

          {/* Description */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">
              Description
            </div>
            <div className="text-sm text-gray-800 bg-white border border-gray-200 rounded-md p-3 whitespace-pre-wrap font-mono leading-relaxed">
              {task.description || (
                <span className="text-gray-400">No description provided.</span>
              )}
            </div>
          </div>

          {/* Comments — fetched lazily via SWR when this row is expanded.
              The component renders its own loading/error/empty states. */}
          <AzureTaskCommentsSection workItemId={task.id} />

          {/* Tags */}
          {task.tags.length > 0 ? (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Attachments */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              Attachments
              <span className="text-gray-400 normal-case font-normal">
                ({attachments.length || task.attachmentCount})
              </span>
            </div>

            {attachments.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {attachments.map((a) => {
                  const previewUrl = `/api/azure-tasks/${task.id}/attachments/${a.id}`;
                  const downloadUrl = `${previewUrl}?download=1`;

                  return (
                    <li
                      key={a.id}
                      className="flex items-stretch gap-1.5 px-2.5 py-2 rounded-md border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 transition-colors group"
                    >
                      <span
                        className="text-base shrink-0 self-center"
                        aria-hidden
                      >
                        {fileIcon(a.name)}
                      </span>

                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={
                          a.comment
                            ? `Open ${a.name} — ${a.comment}`
                            : `Open ${a.name}`
                        }
                        className="min-w-0 flex-1 self-center"
                      >
                        <span className="block text-sm font-medium text-gray-800 truncate group-hover:text-blue-700">
                          {a.name}
                        </span>
                        {a.comment ? (
                          <span className="block text-[11px] text-gray-500 truncate">
                            {a.comment}
                          </span>
                        ) : null}
                      </a>

                      <a
                        href={downloadUrl}
                        download={a.name}
                        title={`Download ${a.name}`}
                        aria-label={`Download ${a.name}`}
                        className="inline-flex items-center justify-center self-center shrink-0 w-8 h-8 rounded-md border border-gray-200 bg-white text-gray-500 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : hasFetchedAttachments ? (
              <div className="text-xs text-gray-500 italic flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                No attachments on this work item.
              </div>
            ) : task.relationsUnavailable && (task.attachmentCount ?? 0) > 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Attachments unavailable — PAT scope gap
                </div>

                <p>
                  The Azure DevOps PAT used by this app is missing the{" "}
                  <code className="px-1 py-0.5 rounded bg-amber-100 border border-amber-200 font-mono text-[11px]">
                    vso.work_full
                  </code>{" "}
                  scope, which is required to read work-item relations
                  (including attachments). The rest of this work item loaded
                  fine — only attachments are affected.
                </p>

                <p className="text-amber-800">
                  Ask an Azure DevOps admin to update the PAT at{" "}
                  <a
                    href="https://dev.azure.com/_usersSettings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-amber-900"
                  >
                    dev.azure.com/_usersSettings/tokens
                  </a>{" "}
                  with <strong>Full Access</strong> selected, then refresh this
                  page.
                </p>

                <p className="text-amber-800">
                  To confirm the diagnosis without reading server logs, open{" "}
                  <a
                    href={`/api/azure-tasks/${task.id}?probe=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-amber-900"
                  >
                    the probe response
                  </a>{" "}
                  and check that the upstream{" "}
                  <code className="font-mono text-[11px]">relations</code> field
                  is empty.
                </p>
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                No attachments on this work item.
              </div>
            )}
          </div>
        </div>

        {/* Right: meta sidebar */}
        <div className="min-w-0 space-y-3 text-sm">
          <div className="bg-white border border-gray-200 rounded-md p-3 space-y-2.5">
            <SidebarRow
              icon={<User className="w-3.5 h-3.5" />}
              label="Assigned to"
              value={task.assignedTo?.displayName ?? "Unassigned"}
            />
            <SidebarRow
              icon={<User className="w-3.5 h-3.5" />}
              label="Created by"
              value={task.createdBy?.displayName ?? "—"}
            />
            <SidebarRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Created"
              value={formatDateOnly(task.createdDate)}
            />
            <SidebarRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Start date"
              value={formatDateOnly(task.startDate)}
            />
            <SidebarRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Target date"
              value={formatDateOnly(task.targetDate)}
            />
            <SidebarRow
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Changed"
              value={formatDateTime(task.changedDate)}
            />
            <div className="border-t border-gray-100 pt-2.5">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                Iteration
              </div>
              <div
                className="text-xs text-gray-800 mt-0.5 break-words"
                title={task.iterationPath ?? ""}
              >
                {task.iterationPath ?? "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                Area
              </div>
              <div
                className="text-xs text-gray-800 mt-0.5 break-words"
                title={task.areaPath ?? ""}
              >
                {task.areaPath ?? "—"}
              </div>
            </div>
          </div>

          <a
            href={task.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 w-full px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Azure DevOps
          </a>
        </div>
      </div>
      </div>
    </div>
  );
}

interface SidebarRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function SidebarRow({ icon, label, value }: SidebarRowProps) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500 font-medium">
        {icon}
        {label}
      </div>
      <div className="text-xs text-gray-800 mt-0.5 break-words">{value}</div>
    </div>
  );
}

/**
 * AzureTaskRowExpansionPlaceholder — shown inline when the row is open
 * but the expanded (relation-expanded) copy hasn't finished loading.
 * Lets the user keep their place in the table while the network call
 * for attachments runs.
 */
export function AzureTaskRowExpansionPlaceholder({
  taskId,
  isLoading,
  isError,
  onRetry,
}: {
  taskId: number;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 border-y border-blue-100 px-6 py-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading work item #{taskId}…
          </>
        ) : isError ? (
          <>
            <span className="text-red-700">
              Could not load work item #{taskId}.
            </span>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Retry
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

// Re-export the helper so other components can reuse it without copying.
export { humanFileSize };
