"use client"

/**
 * AdminPanel — tabbed admin console.
 *
 * Layout: a sidebar (desktop) / pill bar (mobile) switches between four
 * tabs — Overview, Users, Snippets, Chatbot — so only one section is on
 * screen at a time. Each tab fills the viewport: its toolbar stays put and
 * only the table scrolls, with a sticky header. The active tab is kept in
 * the URL (?tab=users) so refresh / back keeps your place.
 *
 * Data comes from SWR hooks (`useAdminUsers`, `useAdminSnippets`,
 * `useAdminActivity`); mutations call `mutate()`. Destructive actions go
 * through `<ConfirmDialog>`.
 */
import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  FileText,
  ListChecks,
  Loader2,
  MessageCircle,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wrench,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Switch } from "@/components/ui/switch"
import { SnippetEditorModal } from "@/components/snippet-editor-modal"
import { cn } from "@/lib/utils"

import { useAdminUsers, type AdminUser } from "@/hooks/use-admin-users"
import { useAdminSnippets, type AdminSnippet } from "@/hooks/use-admin-snippets"
import { useAdminActivity } from "@/hooks/use-admin-activity"
import { ActivityDashboard } from "@/components/admin/ActivityDashboard"
import { ChatbotSettings } from "@/components/admin/ChatbotSettings"

type Tab = "overview" | "users" | "snippets" | "chatbot"
const TABS: Tab[] = ["overview", "users", "snippets", "chatbot"]

type CapabilityKey =
  | "can_see_setup_clients"
  | "can_see_setups"
  | "can_edit_all_snippets"
  | "can_see_azure_tasks"

/** Per-user capability columns in the Users table. */
const CAPABILITIES: Array<{
  key: CapabilityKey
  label: string
  short: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}> = [
  {
    key: "can_see_setup_clients",
    label: "Setup Clients",
    short: "Setup Agent",
    icon: Wrench,
    description: "Show the Setup Agent tab.",
  },
  {
    key: "can_see_setups",
    label: "Setups",
    short: "Setups",
    icon: ListChecks,
    description: "Show the Setups tab (config editors).",
  },
  {
    key: "can_edit_all_snippets",
    label: "Edit All Snippets",
    short: "Edit all",
    icon: Pencil,
    description: "Edit and delete any snippet, not just their own.",
  },
  {
    key: "can_see_azure_tasks",
    label: "Azure Tasks",
    short: "Azure",
    icon: Sparkles,
    description: "Browse Azure DevOps work items and make Export Packs.",
  },
]

type RoleFilter = "all" | "admin" | "user"

function readTabFromUrl(): Tab {
  if (typeof window === "undefined") return "overview"
  const t = new URLSearchParams(window.location.search).get("tab")
  return TABS.includes(t as Tab) ? (t as Tab) : "overview"
}

export function AdminPanel() {
  const { data: session, status } = useSession()
  const [tab, setTabState] = React.useState<Tab>("overview")

  // Restore the tab from ?tab= after mount (avoids a hydration mismatch).
  React.useEffect(() => {
    setTabState(readTabFromUrl())
  }, [])
  const setTab = React.useCallback((next: Tab) => {
    setTabState(next)
    const url = new URL(window.location.href)
    if (next === "overview") url.searchParams.delete("tab")
    else url.searchParams.set("tab", next)
    window.history.replaceState(null, "", url.toString())
  }, [])

  const isAdmin = status === "authenticated" && session?.user?.role === "admin"

  // -------- SWR-backed state --------
  const { users, isLoading: usersLoading, mutate: mutateUsers } = useAdminUsers()
  const { snippets, isLoading: snippetsLoading, mutate: mutateSnippets } = useAdminSnippets()
  const { activity, isLoading: activityLoading, mutate: mutateActivity } = useAdminActivity()

  // -------- local UI state --------
  const [userQuery, setUserQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>("all")
  const [snippetQuery, setSnippetQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("")
  const [busyUserId, setBusyUserId] = React.useState<string | null>(null)
  const [busySnippetId, setBusySnippetId] = React.useState<string | null>(null)

  // -------- delete confirmation state --------
  const [pendingUserDelete, setPendingUserDelete] = React.useState<AdminUser | null>(null)
  const [pendingSnippetDelete, setPendingSnippetDelete] = React.useState<AdminSnippet | null>(null)

  // -------- edit modal state (admin can edit any snippet) --------
  const [editingSnippet, setEditingSnippet] = React.useState<AdminSnippet | null>(null)

  // Declared above the auth-gate early returns so the hook count stays
  // constant across renders (a "Rendered more hooks" error otherwise).
  const handleSnippetEdited = React.useCallback(async () => {
    await mutateSnippets()
    await mutateActivity()
  }, [mutateSnippets, mutateActivity])

  // Categories for the editor's dropdown and the Snippets filter.
  const categories = React.useMemo(() => {
    const set = new Set<string>()
    for (const s of snippets) set.add(s.category)
    if (editingSnippet) set.add(editingSnippet.category)
    return [...set].sort()
  }, [snippets, editingSnippet])
  const adminFolders = React.useMemo(
    () => Object.fromEntries(categories.map((name) => [name, { name }])),
    [categories],
  )

  // ---- all hooks above; the auth-gate rendering happens after ----

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!session?.user || !isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not authorized</h1>
          <p className="text-gray-600 mb-6">You need an admin account to view this page.</p>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to wizard
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // ---- handlers ----
  const refreshAll = () => {
    mutateUsers()
    mutateSnippets()
    mutateActivity()
  }

  const changeUserRole = async (u: AdminUser, newRole: "user" | "admin") => {
    if (newRole === u.role) return
    if (u.isSelf && newRole !== "admin") {
      toast.error("You cannot demote yourself out of admin.")
      return
    }
    setBusyUserId(u.id)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, role: newRole }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Update failed (${res.status})`)
      toast.success(`${u.email} is now ${newRole}`)
      await mutateUsers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setBusyUserId(null)
    }
  }

  // Toggle a per-user capability flag. The key matches the API field name.
  const toggleCapability = async (u: AdminUser, key: CapabilityKey, value: boolean) => {
    setBusyUserId(u.id)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, [key]: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Update failed (${res.status})`)
      const label = CAPABILITIES.find((c) => c.key === key)?.label ?? key
      toast.success(`${u.email}: ${label} ${value ? "enabled" : "disabled"}`)
      await mutateUsers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setBusyUserId(null)
    }
  }

  // The actual delete is invoked from the ConfirmDialog's onConfirm.
  const performUserDelete = async (u: AdminUser) => {
    setBusyUserId(u.id)
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Delete failed (${res.status})`)
      toast.success("User deleted")
      await mutateUsers()
      await mutateSnippets()
      await mutateActivity()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setBusyUserId(null)
      setPendingUserDelete(null)
    }
  }

  const performSnippetDelete = async (s: AdminSnippet) => {
    const id = s.uuid ?? s.id
    setBusySnippetId(id)
    try {
      const res = await fetch("/api/admin/snippets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Delete failed (${res.status})`)
      toast.success("Snippet deleted")
      await mutateSnippets()
      await mutateActivity()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setBusySnippetId(null)
      setPendingSnippetDelete(null)
    }
  }

  const adminCount = users.filter((u) => u.role === "admin").length

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false
    if (!userQuery.trim()) return true
    const q = userQuery.toLowerCase()
    return u.email.toLowerCase().includes(q) || (u.name?.toLowerCase().includes(q) ?? false)
  })

  const filteredSnippets = snippets.filter((s) => {
    if (categoryFilter && s.category !== categoryFilter) return false
    if (!snippetQuery.trim()) return true
    const q = snippetQuery.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (s.authorName?.toLowerCase().includes(q) ?? false) ||
      (s.authorEmail?.toLowerCase().includes(q) ?? false)
    )
  })

  const nav: Array<{
    id: Tab
    label: string
    icon: React.ComponentType<{ className?: string }>
    count?: number
  }> = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users, count: users.length },
    { id: "snippets", label: "Snippets", icon: FileText, count: snippets.length },
    { id: "chatbot", label: "Chatbot", icon: MessageCircle },
  ]

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
      {/* ── Sidebar (desktop) ───────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white/80 backdrop-blur">
        <div className="px-5 pt-5 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-gray-900 leading-tight">Admin Panel</div>
            <div className="text-xs text-gray-500">Users, snippets &amp; Snip</div>
          </div>
        </div>
        <nav className="px-3 space-y-1" aria-label="Admin sections">
          {nav.map((item) => (
            <SidebarItem
              key={item.id}
              active={tab === item.id}
              onClick={() => setTab(item.id)}
              icon={item.icon}
              label={item.label}
              count={item.count}
            />
          ))}
        </nav>
        <div className="mt-auto p-4 space-y-3 border-t border-gray-100">
          <Button variant="outline" size="sm" onClick={refreshAll} className="w-full gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh data
          </Button>
          <p className="text-[11px] text-gray-500 truncate" title={session.user.email ?? ""}>
            Signed in as <span className="font-semibold text-gray-700">{session.user.email}</span>
          </p>
        </div>
      </aside>

      {/* ── Pill tabs (mobile / tablet) ─────────────────────────────── */}
      <div className="lg:hidden shrink-0 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5">
          {nav.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {item.count != null && (
                  <span className={cn("text-xs", active ? "text-white/80" : "text-gray-500")}>{item.count}</span>
                )}
              </button>
            )
          })}
          <button
            type="button"
            onClick={refreshAll}
            aria-label="Refresh data"
            className="ml-auto inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-full text-gray-600 hover:bg-gray-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-0 min-w-0 flex flex-col">
        {tab === "overview" && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4 lg:p-6 space-y-5">
              <SectionTitle title="Overview" subtitle="Who's using the app and what changed recently." />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                  icon={Users}
                  tone="blue"
                  label="Users"
                  value={usersLoading ? "…" : users.length}
                  onClick={() => setTab("users")}
                />
                <KpiCard
                  icon={ShieldCheck}
                  tone="purple"
                  label="Admins"
                  value={usersLoading ? "…" : adminCount}
                  onClick={() => {
                    setRoleFilter("admin")
                    setTab("users")
                  }}
                />
                <KpiCard
                  icon={FileText}
                  tone="emerald"
                  label="Snippets"
                  value={snippetsLoading ? "…" : snippets.length}
                  onClick={() => setTab("snippets")}
                />
                <KpiCard
                  icon={ListChecks}
                  tone="amber"
                  label="Categories"
                  value={snippetsLoading ? "…" : categories.length}
                  onClick={() => setTab("snippets")}
                />
              </div>
              <ActivityDashboard activity={activity} isLoading={activityLoading} />
            </div>
          </div>
        )}

        {tab === "users" && (
          <TabFrame
            title="Users"
            subtitle="Roles and what each user can see. Admins always see every tab."
            toolbar={
              <>
                <SearchBox value={userQuery} onChange={setUserQuery} placeholder="Search by name or email…" />
                <Segmented<RoleFilter>
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={[
                    { value: "all", label: `All ${users.length}` },
                    { value: "admin", label: `Admins ${adminCount}` },
                    { value: "user", label: `Users ${users.length - adminCount}` },
                  ]}
                />
              </>
            }
          >
            {usersLoading ? (
              <LoadingState label="Loading users…" />
            ) : filteredUsers.length === 0 ? (
              <EmptyState label="No users match." />
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur text-gray-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">User</th>
                    <th className="px-3 py-3 text-left font-semibold">Role</th>
                    {CAPABILITIES.map((c) => (
                      <th key={c.key} className="px-3 py-3 text-center font-semibold whitespace-nowrap" title={c.description}>
                        <span className="inline-flex items-center gap-1">
                          <c.icon className="w-3.5 h-3.5" />
                          {c.short}
                        </span>
                      </th>
                    ))}
                    <th className="px-3 py-3 text-right font-semibold">Snippets</th>
                    <th className="px-3 py-3 text-left font-semibold">Joined</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const busy = busyUserId === u.id
                    const willBeLastAdmin = u.role === "admin" && adminCount <= 1
                    const isAdminRow = u.role === "admin"
                    return (
                      <tr key={u.id} className={cn("hover:bg-purple-50/40 transition-colors", busy && "opacity-60")}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={u.name} email={u.email} admin={isAdminRow} />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate flex items-center gap-1.5">
                                {u.name || u.email.split("@")[0]}
                                {u.isSelf && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-[240px]" title={u.email}>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Segmented<"user" | "admin">
                            size="sm"
                            value={u.role as "user" | "admin"}
                            disabled={busy || (u.isSelf && willBeLastAdmin)}
                            onChange={(r) => changeUserRole(u, r)}
                            options={[
                              { value: "user", label: "User" },
                              { value: "admin", label: "Admin" },
                            ]}
                          />
                        </td>
                        {CAPABILITIES.map((c) => (
                          <td key={c.key} className="px-3 py-2.5 text-center">
                            {isAdminRow ? (
                              <span className="text-[11px] text-gray-400" title="Admins always see every tab">
                                Always
                              </span>
                            ) : (
                              <Switch
                                size="sm"
                                checked={u[c.key]}
                                disabled={busy}
                                label={`${c.label} for ${u.email}: ${u[c.key] ? "on" : "off"} — ${c.description}`}
                                onChange={(v) => toggleCapability(u, c.key, v)}
                              />
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{u.snippetCount}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <IconButton
                            label={u.isSelf ? "You can't delete yourself" : willBeLastAdmin ? "Can't delete the last admin" : `Delete ${u.email}`}
                            tone="danger"
                            disabled={busy || u.isSelf || willBeLastAdmin}
                            onClick={() => setPendingUserDelete(u)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </TabFrame>
        )}

        {tab === "snippets" && (
          <TabFrame
            title="Snippets"
            subtitle="Every snippet in the library. Admins can edit or delete any of them."
            toolbar={
              <>
                <SearchBox value={snippetQuery} onChange={setSnippetQuery} placeholder="Search title, category or author…" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filter by category"
                  className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500 ml-auto">
                  {filteredSnippets.length} of {snippets.length}
                </span>
              </>
            }
          >
            {snippetsLoading ? (
              <LoadingState label="Loading snippets…" />
            ) : filteredSnippets.length === 0 ? (
              <EmptyState label="No snippets match." />
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur text-gray-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Title</th>
                    <th className="px-3 py-3 text-left font-semibold">Category</th>
                    <th className="px-3 py-3 text-left font-semibold">Author</th>
                    <th className="px-3 py-3 text-left font-semibold">Updated</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSnippets.map((s) => {
                    const id = s.uuid ?? s.id
                    const busy = busySnippetId === id
                    return (
                      <tr key={id} className={cn("group hover:bg-purple-50/40 transition-colors", busy && "opacity-60")}>
                        <td className="px-4 py-2.5 max-w-0 w-[45%]">
                          <div className="font-medium text-gray-900 truncate">{s.title}</div>
                          {s.description && <div className="text-xs text-gray-500 truncate">{s.description}</div>}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 whitespace-nowrap">
                            {s.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          <div className="text-gray-800">{s.authorName ?? "—"}</div>
                          {s.authorEmail && <div className="text-gray-400 text-[11px] truncate max-w-[200px]">{s.authorEmail}</div>}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap" title={new Date(s.updatedAt).toLocaleString()}>
                          {new Date(s.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <IconButton label={`Edit “${s.title}”`} disabled={busy} onClick={() => setEditingSnippet(s)}>
                            <Pencil className="w-4 h-4" />
                          </IconButton>
                          <IconButton
                            label={`Delete “${s.title}”`}
                            tone="danger"
                            disabled={busy}
                            onClick={() => setPendingSnippetDelete(s)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </TabFrame>
        )}

        {tab === "chatbot" && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4 lg:p-6 space-y-5">
              <SectionTitle title="Chatbot" subtitle="Turn the Snip AI assistant on or off, globally or per user." />
              <ChatbotSettings />
            </div>
          </div>
        )}
      </main>

      {/* Confirm dialogs. Only one shows at a time because they share the
          same state slot per resource type. */}
      <ConfirmDialog
        open={pendingUserDelete !== null}
        onOpenChange={(o) => {
          if (!o) setPendingUserDelete(null)
        }}
        title="Delete user"
        description={
          pendingUserDelete ? (
            <span>
              Delete <span className="font-semibold">{pendingUserDelete.email}</span>? Their snippets will remain
              (with no author).
            </span>
          ) : null
        }
        confirmLabel="Delete user"
        cancelLabel="Cancel"
        destructive
        busy={busyUserId === pendingUserDelete?.id}
        onConfirm={() => {
          if (pendingUserDelete) performUserDelete(pendingUserDelete)
        }}
      />

      <ConfirmDialog
        open={pendingSnippetDelete !== null}
        onOpenChange={(o) => {
          if (!o) setPendingSnippetDelete(null)
        }}
        title="Delete snippet"
        description={
          pendingSnippetDelete ? (
            <span>
              Delete <span className="font-semibold">“{pendingSnippetDelete.title}”</span>? This cannot be undone.
            </span>
          ) : null
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        busy={busySnippetId === (pendingSnippetDelete?.uuid ?? pendingSnippetDelete?.id)}
        onConfirm={() => {
          if (pendingSnippetDelete) performSnippetDelete(pendingSnippetDelete)
        }}
      />

      {/* Edit modal — opens when an admin clicks Edit on a snippet row. */}
      <SnippetEditorModal
        open={editingSnippet !== null}
        onOpenChange={(o) => {
          if (!o) setEditingSnippet(null)
        }}
        mode="edit"
        folders={adminFolders}
        initial={editingSnippet}
        onSaved={handleSnippetEdited}
      />
    </div>
  )
}

/* ───────────────────────────── building blocks ───────────────────────────── */

function SidebarItem({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
          : "text-gray-700 hover:bg-gray-100",
      )}
    >
      <Icon className={cn("w-4 h-4", active ? "text-white" : "text-gray-500")} />
      <span className="flex-1 text-left">{label}</span>
      {count != null && (
        <span
          className={cn(
            "text-xs tabular-nums rounded-full px-2 py-0.5",
            active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600",
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}

/** Full-height tab: fixed title + toolbar, then a card whose table scrolls on its own. */
function TabFrame({
  title,
  subtitle,
  toolbar,
  children,
}: {
  title: string
  subtitle: string
  toolbar: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col p-4 lg:p-6 gap-4">
      <div className="shrink-0 space-y-3">
        <SectionTitle title={title} subtitle={subtitle} />
        <div className="flex items-center gap-2 flex-wrap">{toolbar}</div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        {children}
      </div>
    </div>
  )
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  disabled,
  size = "md",
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (v: T) => void
  disabled?: boolean
  size?: "sm" | "md"
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex items-center rounded-lg bg-gray-100 p-0.5",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => !active && onChange(o.value)}
            className={cn(
              "rounded-md font-medium transition-colors whitespace-nowrap",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
              active ? "bg-white text-purple-700 shadow-sm" : "text-gray-600 hover:text-gray-900",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  tone = "default",
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: "default" | "danger"
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
        "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent",
        tone === "danger"
          ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
          : "text-gray-400 hover:text-purple-700 hover:bg-purple-50",
      )}
    >
      {children}
    </button>
  )
}

const AVATAR_TONES = [
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-sky-500",
]

function Avatar({ name, email, admin }: { name: string | null; email: string; admin: boolean }) {
  const source = (name || email).trim()
  const initials =
    source
      .split(/[\s._@-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?"
  const tone = admin
    ? "from-purple-600 to-indigo-600"
    : AVATAR_TONES[[...email].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length]
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0 w-9 h-9 rounded-full bg-gradient-to-br text-white text-xs font-bold flex items-center justify-center",
        tone,
      )}
    >
      {initials}
    </div>
  )
}

const KPI_TONES = {
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
} as const

function KpiCard({
  icon: Icon,
  tone,
  label,
  value,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  tone: keyof typeof KPI_TONES
  label: string
  value: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-purple-200"
    >
      <div className="flex items-center justify-between">
        <span className={cn("inline-flex w-9 h-9 items-center justify-center rounded-xl", KPI_TONES[tone])}>
          <Icon className="w-5 h-5" />
        </span>
        <ArrowRight className="w-4 h-4 text-gray-300 transition-colors group-hover:text-purple-500" />
      </div>
      <div className="mt-3 text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
      <div className="text-xs font-medium text-gray-500">{label}</div>
    </button>
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> {label}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="py-16 text-center text-gray-500 text-sm">{label}</div>
}
