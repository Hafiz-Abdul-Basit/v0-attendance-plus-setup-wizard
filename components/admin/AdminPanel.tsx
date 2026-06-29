"use client"

/**
 * AdminPanel — single-page admin console with two tabs: Users and Snippets,
 * plus an Activity Dashboard banner on top.
 *
 * Changes from the previous version:
 *   - Data fetching moved to three SWR hooks (`useAdminUsers`,
 *     `useAdminSnippets`, `useAdminActivity`). Tab switches no longer
 *     refetch thanks to SWR's deduping + cache. Mutations call `mutate()`
 *     instead of `loadUsers()`/`loadSnippets()`.
 *   - `window.confirm()` for deletes replaced with `<ConfirmDialog>` so
 *     the destructive actions match the rest of the UI.
 *   - New `<ActivityDashboard />` banner shows last-7-days activity.
 */
import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  FileText,
  ShieldAlert,
  RefreshCw,
  Eye,
  EyeOff,
  Wrench,
  ListChecks,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"

import { useAdminUsers, type AdminUser } from "@/hooks/use-admin-users"
import {
  useAdminSnippets,
  type AdminSnippet,
} from "@/hooks/use-admin-snippets"
import {
  useAdminActivity,
  type AdminActivity,
} from "@/hooks/use-admin-activity"
import { ActivityDashboard } from "@/components/admin/ActivityDashboard"

type Tab = "users" | "snippets"

export function AdminPanel() {
  const { data: session, status } = useSession()
  const [tab, setTab] = React.useState<Tab>("users")

  // Only fetch once the session is known to be admin — otherwise we'd
  // hit 401s on every load. Passing the session-scoped key lets the hooks
  // decide themselves; here we just gate the mutations + rendering.
  const isAdmin = status === "authenticated" && session?.user?.role === "admin"

  // -------- SWR-backed state --------
  const { users, isLoading: usersLoading, mutate: mutateUsers } = useAdminUsers()
  const { snippets, isLoading: snippetsLoading, mutate: mutateSnippets } =
    useAdminSnippets()
  const { activity, isLoading: activityLoading, mutate: mutateActivity } =
    useAdminActivity()

  // -------- local UI state --------
  const [userQuery, setUserQuery] = React.useState("")
  const [snippetQuery, setSnippetQuery] = React.useState("")
  const [busyUserId, setBusyUserId] = React.useState<string | null>(null)
  const [busySnippetId, setBusySnippetId] = React.useState<string | null>(null)

  // -------- delete confirmation state --------
  const [pendingUserDelete, setPendingUserDelete] = React.useState<AdminUser | null>(null)
  const [pendingSnippetDelete, setPendingSnippetDelete] =
    React.useState<AdminSnippet | null>(null)

  // ---- all hooks above; the auth-gate rendering happens after ----

  // ---- auth gate (after all hooks) ----
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!session?.user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not authorized</h1>
          <p className="text-gray-600 mb-6">
            You need an admin account to view this page.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to wizard
              </Link>
            </Button>
          </div>
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

  // Toggle a per-user tab-visibility flag.
  const toggleCapability = async (
    u: AdminUser,
    key: "can_see_setup_clients" | "can_see_setups",
    value: boolean,
  ) => {
    setBusyUserId(u.id)
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, [key]: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Update failed (${res.status})`)
      toast.success(
        `${u.email}: ${key === "can_see_setup_clients" ? "Setup Clients" : "Setups"} ${value ? "enabled" : "disabled"}`,
      )
      // Optimistic local patch so the UI feels instant even before the reload.
      await mutateUsers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setBusyUserId(null)
    }
  }

  // The actual delete is invoked from the ConfirmDialog's onConfirm —
  // the inline row button only opens the dialog now.
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
    if (!userQuery.trim()) return true
    const q = userQuery.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name?.toLowerCase().includes(q) ?? false)
    )
  })

  const filteredSnippets = snippets.filter((s) => {
    if (!snippetQuery.trim()) return true
    const q = snippetQuery.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (s.authorName?.toLowerCase().includes(q) ?? false) ||
      (s.authorEmail?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-600">
                Manage users, roles, and snippets.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Activity Dashboard banner */}
        <div className="mb-6">
          <ActivityDashboard
            activity={activity}
            isLoading={activityLoading}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            <TabButton active={tab === "users"} onClick={() => setTab("users")}>
              <Users className="w-4 h-4" />
              Users
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {users.length}
              </span>
            </TabButton>
            <TabButton active={tab === "snippets"} onClick={() => setTab("snippets")}>
              <FileText className="w-4 h-4" />
              Snippets
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {snippets.length}
              </span>
            </TabButton>
          </div>

          {tab === "users" ? (
            <div className="p-5">
              <div className="relative mb-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search users by email or name…"
                  className="pl-9 h-10 text-sm border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading users…
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-10 text-center text-gray-500">No users match.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-left">Role</th>
                        <th className="px-4 py-3 text-left">Tabs</th>
                        <th className="px-4 py-3 text-left">Snippets</th>
                        <th className="px-4 py-3 text-left">Joined</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((u) => {
                        const busy = busyUserId === u.id
                        const willBeLastAdmin =
                          u.role === "admin" && adminCount <= 1
                        return (
                          <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {u.name || "—"}
                                {u.isSelf && (
                                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500" title={u.email}>
                                {u.email}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={u.role}
                                disabled={busy || (u.isSelf && willBeLastAdmin)}
                                onChange={(e) =>
                                  changeUserRole(u, e.target.value as "user" | "admin")
                                }
                                className={cn(
                                  "h-9 rounded-md border-2 border-gray-200 bg-white px-2 text-xs font-medium focus:border-blue-500 focus:outline-none",
                                  u.role === "admin" && "border-purple-300 text-purple-700",
                                )}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1.5">
                                <CapabilityToggle
                                  label="Setup Clients"
                                  icon={<Wrench className="w-3.5 h-3.5" />}
                                  enabled={u.can_see_setup_clients}
                                  disabled={busy}
                                  onChange={(v) =>
                                    toggleCapability(u, "can_see_setup_clients", v)
                                  }
                                />
                                <CapabilityToggle
                                  label="Setups"
                                  icon={<ListChecks className="w-3.5 h-3.5" />}
                                  enabled={u.can_see_setups}
                                  disabled={busy}
                                  onChange={(v) =>
                                    toggleCapability(u, "can_see_setups", v)
                                  }
                                />
                                {u.role === "admin" && (
                                  <span className="text-[10px] text-gray-400 italic">
                                    Admin always sees all tabs
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{u.snippetCount}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy || u.isSelf || willBeLastAdmin}
                                onClick={() => setPendingUserDelete(u)}
                                className="gap-1 border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5">
              <div className="relative mb-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={snippetQuery}
                  onChange={(e) => setSnippetQuery(e.target.value)}
                  placeholder="Search snippets by title, category, or author…"
                  className="pl-9 h-10 text-sm border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              {snippetsLoading ? (
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading snippets…
                </div>
              ) : filteredSnippets.length === 0 ? (
                <div className="py-10 text-center text-gray-500">No snippets match.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Title</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">Author</th>
                        <th className="px-4 py-3 text-left">Updated</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSnippets.map((s) => {
                        const id = s.uuid ?? s.id
                        const busy = busySnippetId === id
                        return (
                          <tr key={id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900 truncate max-w-md">
                                {s.title}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-md">
                                {s.description}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                {s.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-700">
                              {s.authorName ?? "—"}
                              {s.authorEmail && (
                                <div className="text-gray-400 text-[11px]">
                                  {s.authorEmail}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              <div>{new Date(s.updatedAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-gray-400">
                                {new Date(s.updatedAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => setPendingSnippetDelete(s)}
                                className="gap-1 border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Signed in as <span className="font-semibold">{session.user.email}</span> ·{" "}
          Role: <span className="font-semibold text-purple-700">Admin</span>
        </p>
      </div>

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
              Delete <span className="font-semibold">{pendingUserDelete.email}</span>?
              Their snippets will remain (with no author).
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
              Delete <span className="font-semibold">“{pendingSnippetDelete.title}”</span>?
              This cannot be undone.
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
    </div>
  )
}

function CapabilityToggle({
  label,
  icon,
  enabled,
  disabled,
  onChange,
}: {
  label: string
  icon: React.ReactNode
  enabled: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      title={enabled ? `${label} visible to user` : `${label} hidden from user`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border-2 px-2 py-1 text-xs font-medium transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        enabled
          ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
          : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100",
      )}
    >
      {icon}
      <span>{label}</span>
      {enabled ? (
        <Eye className="w-3 h-3" />
      ) : (
        <EyeOff className="w-3 h-3" />
      )}
    </button>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-purple-600 text-purple-700 bg-purple-50/40"
          : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50",
      )}
    >
      {children}
    </button>
  )
}
