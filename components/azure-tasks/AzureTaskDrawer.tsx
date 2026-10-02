"use client"

/**
 * AzureTaskDrawer — right-hand, full-height detail panel.
 *
 * Opens when a table row is clicked (replaces the old inline expansion).
 * It is docked, NOT an overlay: there is no backdrop, and the panel
 * adds right padding to the page so the table stays visible and
 * clickable. Click another row to swap the content; Esc or ✕ closes.
 *
 * Sits under the sticky page header (top-[65px]) and runs to the bottom
 * of the viewport. The body scrolls on its own.
 */

import * as React from "react"
import { ExternalLink, X } from "lucide-react"

import {
  AzureTaskRowExpansion,
  AzureTaskRowExpansionPlaceholder,
} from "./AzureTaskRowExpansion"
import type { AzureWorkItem } from "./types"

/** Keep in sync with the `lg:pr-[…]` the panel adds when the drawer is open. */
export const DRAWER_WIDTH_PX = 560

interface Props {
  taskId: number | null
  task: AzureWorkItem | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onClose: () => void
}

export function AzureTaskDrawer({ taskId, task, isLoading, isError, onRetry, onClose }: Props) {
  const bodyRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (taskId == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [taskId, onClose])

  // New task selected → start reading from the top.
  React.useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [taskId])

  if (taskId == null) return null

  const showLoading = isLoading || (!task && !isError)
  const showError = isError && !task

  return (
    <aside
      aria-label={`Work item #${taskId}`}
      style={{ width: DRAWER_WIDTH_PX }}
      className="fixed right-0 top-[65px] bottom-0 z-20 max-w-full bg-white border-l border-gray-200 shadow-[-8px_0_24px_-12px_rgba(0,0,0,0.15)] flex flex-col"
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-3 shrink-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Work item <span className="font-mono text-gray-800">#{taskId}</span>
        </div>
        <div className="flex items-center gap-1">
        {task?.webUrl ? (
          <a
            href={task.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Azure DevOps"
            aria-label="Open in Azure DevOps"
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-blue-700 hover:bg-blue-50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Azure DevOps
          </a>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          title="Close (Esc)"
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
        </div>
      </div>

      <div ref={bodyRef} className="az-task-scroller flex-1 min-h-0 overflow-y-auto">
        {showLoading || showError || !task ? (
          <AzureTaskRowExpansionPlaceholder
            taskId={taskId}
            isLoading={showLoading}
            isError={showError}
            onRetry={onRetry}
          />
        ) : (
          <AzureTaskRowExpansion task={task} variant="drawer" />
        )}
      </div>
    </aside>
  )
}
