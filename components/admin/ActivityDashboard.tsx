"use client"

/**
 * ActivityDashboard — banner rendered above the admin tabs.
 *
 * Shows a quick summary of what's been happening on the platform:
 *  - new users in the last 7 days
 *  - new snippets in the last 7 days
 *  - top 5 authors (all-time)
 *  - top 5 categories (all-time)
 *  - the 5 most-recently-created snippets
 *  - the 5 most-recently-signed-up users
 *
 * Pure presentational — fetches its own data via `useAdminActivity`.
 * Stats are all-time for the "top" lists so the tiles aren't blank on a
 * freshly-deployed instance where there's no 7-day activity yet.
 */
import * as React from "react"
import {
  FileText,
  Loader2,
  ListChecks,
  UserPlus,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { AdminActivity } from "@/hooks/use-admin-activity"

interface ActivityDashboardProps {
  activity: AdminActivity | null
  isLoading: boolean
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  const diffMs = Date.now() - t
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const days = Math.floor(hr / 24)
  return `${days}d ago`
}

export function ActivityDashboard({
  activity,
  isLoading,
}: ActivityDashboardProps) {
  // Loading skeleton — four tiles + two panels, all in placeholder state.
  if (isLoading && !activity) {
    return (
      <div
        className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5"
        aria-busy="true"
      >
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading activity…
        </div>
      </div>
    )
  }

  const data = activity ?? {
    windowDays: 7,
    newUsers: 0,
    newSnippets: 0,
    topAuthors: [],
    topCategories: [],
    recentSnippets: [],
    recentUsers: [],
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Activity Dashboard
          </h2>
          <p className="text-xs text-gray-500">
            Last {data.windowDays} days · refreshed automatically
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        <StatTile
          icon={<UserPlus className="w-5 h-5 text-blue-600" />}
          label="New users"
          value={data.newUsers}
          chip={`${data.windowDays}d`}
        />
        <StatTile
          icon={<FileText className="w-5 h-5 text-emerald-600" />}
          label="New snippets"
          value={data.newSnippets}
          chip={`${data.windowDays}d`}
        />
        <StatTile
          icon={<Users className="w-5 h-5 text-purple-600" />}
          label="Top author"
          value={data.topAuthors[0]?.name ?? data.topAuthors[0]?.email ?? "—"}
          chip={
            data.topAuthors[0]
              ? `${data.topAuthors[0].snippetCount} snippet${data.topAuthors[0].snippetCount === 1 ? "" : "s"}`
              : undefined
          }
        />
        <StatTile
          icon={<ListChecks className="w-5 h-5 text-amber-600" />}
          label="Top category"
          value={data.topCategories[0]?.category ?? "—"}
          chip={
            data.topCategories[0]
              ? `${data.topCategories[0].count} snippet${data.topCategories[0].count === 1 ? "" : "s"}`
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        <RecentList
          icon={<FileText className="w-4 h-4 text-emerald-600" />}
          title="Recent snippets"
          empty="No new snippets in the last week."
          items={data.recentSnippets.map((s) => ({
            id: s.uuid,
            primary: s.title,
            secondary: s.authorName ?? "—",
            meta: timeAgo(s.createdAt),
          }))}
        />
        <RecentList
          icon={<Users className="w-4 h-4 text-blue-600" />}
          title="Recent users"
          empty="No new sign-ups in the last week."
          items={data.recentUsers.map((u) => ({
            id: u.id,
            primary: u.name ?? u.email,
            secondary: u.email,
            meta: timeAgo(u.createdAt),
          }))}
        />
      </div>
    </div>
  )
}

function StatTile({
  icon,
  label,
  value,
  chip,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  chip?: string
}) {
  return (
    <div className="p-5 flex items-start gap-3">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
          {label}
        </div>
        <div className="text-xl font-semibold text-gray-900 truncate">
          {value}
        </div>
        {chip ? (
          <div className="text-[11px] text-gray-400 mt-0.5">{chip}</div>
        ) : null}
      </div>
    </div>
  )
}

interface RecentItem {
  id: string
  primary: string
  secondary: string
  meta: string
}

function RecentList({
  icon,
  title,
  empty,
  items,
}: {
  icon: React.ReactNode
  title: string
  empty: string
  items: RecentItem[]
}) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
        {icon}
        {title}
      </div>
      {items.length === 0 ? (
        <div className={cn("text-sm text-gray-500 py-3")}>{empty}</div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="text-gray-900 truncate font-medium">
                  {item.primary}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {item.secondary}
                </div>
              </div>
              <div className="text-[11px] text-gray-400 whitespace-nowrap pt-0.5">
                {item.meta}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
