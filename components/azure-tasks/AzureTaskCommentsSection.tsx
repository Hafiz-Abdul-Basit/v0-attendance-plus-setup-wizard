"use client"

/**
 * AzureTaskCommentsSection — conversation thread for a single work item.
 *
 * Mirrors the styling in `AzureTaskRowExpansion`: white card with
 * light borders, uppercase tiny labels. We render a chronological list
 * of comments (oldest first — that's the order the upstream returns),
 * each with author, timestamp, and a plain-text body.
 *
 * Empty / loading / error / unavailable states are all rendered inline
 * so the parent (the row expansion) doesn't need to know which one to
 * pick — we already have the SWR state from `useAzureTaskComments`.
 *
 * The comments are NOT lazy — they fetch as soon as the parent passes
 * a non-null workItemId. That's intentional: when a user expands a
 * row, they want to see the conversation, and the upstream call is
 * cheap (~50 items max, paginated server-side).
 */

import * as React from "react"
import { Loader2, MessageSquare, RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAzureTaskComments } from "@/hooks/use-azure-tasks"
import type { AzureWorkItemComment } from "./types"

interface AzureTaskCommentsSectionProps {
  /** Pass null to disable the fetch (e.g. when the row is collapsed). */
  workItemId: number | null
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** First two initials from a display name, used as the avatar fallback. */
function initials(name: string | null | undefined): string {
  if (!name) return "?"
  const trimmed = name.trim()
  if (trimmed.length === 0) return "?"
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function avatarColor(name: string): string {
  // Deterministic color picked from a small palette so the same author
  // always gets the same chip color within a session. The hash is
  // intentionally trivial — visual variety matters, collision resistance
  // does not.
  const palette = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-violet-100 text-violet-700",
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

export function AzureTaskCommentsSection({
  workItemId,
}: AzureTaskCommentsSectionProps) {
  const {
    comments,
    total,
    isLoading,
    isError,
    error,
    commentsUnavailable,
    mutate,
  } = useAzureTaskComments(workItemId)

  // Fetching is disabled when workItemId is null. Render a static
  // "loading" state until the parent flips to a real id — keeps the
  // layout stable as the row expands.
  if (workItemId == null) {
    return (
      <div>
        <SectionHeader count={null} />
        <div className="text-xs text-gray-400 italic px-1 py-2">
          Loading conversation…
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader count={isLoading ? null : total} />

      {isError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800 flex items-start gap-2">
          <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold mb-0.5">
              Could not load comments
            </div>
            <div className="text-red-700 break-words">
              {error instanceof Error ? error.message : "Unknown error"}
            </div>
            <button
              type="button"
              onClick={() => void mutate()}
              className="mt-1.5 inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </div>
      ) : commentsUnavailable ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700 flex items-start gap-2">
          <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
          <div>
            Comments are unavailable for this work item. The Azure DevOps
            deployment may have the comments service disabled.
          </div>
        </div>
      ) : isLoading && comments.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-gray-500 italic px-1 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading conversation…
        </div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-gray-500 italic flex items-center gap-1.5 px-1 py-2">
          <MessageSquare className="w-3.5 h-3.5" />
          No comments on this work item yet.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
        </ul>
      )}
    </div>
  )
}

function SectionHeader({ count }: { count: number | null }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 flex items-center gap-1">
      <MessageSquare className="w-3 h-3" />
      Comments
      {count != null ? (
        <span className="text-gray-400 normal-case font-normal">({count})</span>
      ) : null}
    </div>
  )
}

interface CommentItemProps {
  comment: AzureWorkItemComment
}

function CommentItem({ comment }: CommentItemProps) {
  const author = comment.createdBy?.displayName ?? "Unknown"
  return (
    <li className="bg-white border border-gray-200 rounded-md px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold uppercase",
            avatarColor(author),
          )}
          aria-hidden
        >
          {initials(author)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-900 truncate">
              {author}
            </span>
            <span className="text-[11px] text-gray-500">
              {formatTimestamp(comment.createdDate)}
            </span>
            {comment.modifiedDate &&
            comment.modifiedDate !== comment.createdDate ? (
              <span className="text-[10px] text-gray-400 italic">
                (edited {formatTimestamp(comment.modifiedDate)})
              </span>
            ) : null}
          </div>
          {comment.text.trim().length > 0 ? (
            <div className="text-sm text-gray-800 mt-1 whitespace-pre-wrap break-words leading-relaxed">
              {comment.text}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic mt-1">
              (no message body)
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
