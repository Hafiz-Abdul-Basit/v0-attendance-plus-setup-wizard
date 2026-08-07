"use client"

/**
 * ChatbotSettings — admin section beneath the Activity Dashboard.
 *
 * Two parts:
 *   1. Master toggle + status. The toggle flips the global
 *      `chatbot_enabled` setting. Below it, a colored dot + label
 *      summarises the current state ("Enabled for all users" /
 *      "Disabled for all users" / "Enabled for X of Y users").
 *   2. Per-user override table. The dropdown is disabled when the
 *      master toggle is OFF (overrides don't help if the widget is
 *      globally off). Admins can pin individual users to
 *      inherit / enabled / disabled.
 *
 * Style matches the rest of the admin panel: purple/indigo gradient
 * card, rounded-2xl, same chip styling as the existing
 * `CapabilityToggle` rows.
 */
import * as React from "react"
import { Loader2, MessageCircle, ShieldAlert, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  useAdminChatbotSettings,
  type ChatbotAccess,
  type ChatbotUserOverride,
} from "@/hooks/use-admin-chatbot-settings"

export function ChatbotSettings() {
  const { settings, isLoading, isError, mutate } = useAdminChatbotSettings()
  const [busyGlobal, setBusyGlobal] = React.useState(false)
  const [busyUserId, setBusyUserId] = React.useState<string | null>(null)

  const toggleGlobal = async (next: boolean) => {
    if (!settings || settings.chatbotEnabled === next) return
    setBusyGlobal(true)
    try {
      const res = await fetch("/api/admin/chatbot-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotEnabled: next }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? `Update failed (${res.status})`)
      toast.success(next ? "Chatbot enabled for all users" : "Chatbot disabled")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setBusyGlobal(false)
    }
  }

  const setUserAccess = async (
    user: ChatbotUserOverride,
    access: ChatbotAccess,
  ) => {
    if (user.access === access) return
    setBusyUserId(user.userId)
    try {
      const res = await fetch("/api/admin/chatbot-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, access }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? `Update failed (${res.status})`)
      toast.success(`${user.email}: chatbot access set to ${access}`)
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed")
    } finally {
      setBusyUserId(null)
    }
  }

  // Derive summary numbers while the top-level settings still load.
  const overrides = settings?.perUserOverrides ?? []
  const { enabledCount, overriddenCount } = React.useMemo(() => {
    const enabled = overrides.filter((u) => u.access === "enabled").length
    const overridden = overrides.filter((u) => u.access !== "inherit").length
    return { enabledCount: enabled, overriddenCount: overridden }
  }, [overrides])

  const statusLabel = React.useMemo(() => {
    if (!settings) return ""
    if (!settings.chatbotEnabled) return "Disabled for all users"
    if (overriddenCount === 0) return "Enabled for all users"
    return `Enabled for ${enabledCount} of ${overrides.length} users`
  }, [settings, enabledCount, overriddenCount, overrides.length])

  const statusColor = !settings
    ? "bg-gray-300"
    : !settings.chatbotEnabled
      ? "bg-red-500"
      : overriddenCount === 0
        ? "bg-green-500"
        : "bg-amber-500"

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 border border-purple-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Chatbot Settings
            </h2>
            <p className="text-xs text-gray-600">
              Control the in-app Snip AI assistant for users.
            </p>
          </div>
        </div>
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="px-5 py-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border-b border-red-100">
          <ShieldAlert className="w-4 h-4" />
          Failed to load chatbot settings.
          <Button
            size="sm"
            variant="outline"
            onClick={() => void mutate()}
            className="ml-auto h-7 px-2 text-xs border-red-200 text-red-700 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Master toggle + status */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <div>
            <div className="text-sm font-semibold text-gray-900">
              Enable AI Assistant for all users
            </div>
            <div className="text-xs text-gray-500">
              When off, the Snip widget is hidden for everyone regardless of
              per-user overrides.
            </div>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <StatusDot color={statusColor} label={statusLabel} />
          <Switch
            checked={Boolean(settings?.chatbotEnabled)}
            disabled={busyGlobal || !settings}
            onChange={(v) => void toggleGlobal(v)}
            label={settings?.chatbotEnabled ? "Enabled" : "Disabled"}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-purple-100" />

      {/* Per-user overrides */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Per-user overrides
            </h3>
            <p className="text-xs text-gray-500">
              Pin a user to Enabled or Disabled. Global OFF always wins.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading users…
          </div>
        ) : overrides.length === 0 ? (
          <div className="py-6 text-center text-gray-500 text-sm">
            No users yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">User</th>
                  <th className="px-3 py-2 text-left font-medium">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100">
                {overrides.map((u) => {
                  const busy = busyUserId === u.userId
                  const dropdownDisabled = busy || !settings?.chatbotEnabled
                  return (
                    <tr key={u.userId} className="hover:bg-purple-50/50">
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">
                          {u.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500" title={u.email}>
                          {u.email}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={u.access}
                          disabled={dropdownDisabled}
                          onChange={(e) =>
                            void setUserAccess(
                              u,
                              e.target.value as ChatbotAccess,
                            )
                          }
                          className={cn(
                            "h-9 rounded-md border-2 bg-white px-2 text-xs font-medium",
                            "focus:outline-none focus:border-purple-500",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            u.access === "enabled"
                              ? "border-green-300 text-green-700"
                              : u.access === "disabled"
                                ? "border-red-300 text-red-700"
                                : "border-gray-200 text-gray-600",
                          )}
                        >
                          <option value="inherit">Inherit</option>
                          <option value="enabled">Enabled</option>
                          <option value="disabled">Disabled</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs text-gray-700">
      <span
        className={cn("w-2.5 h-2.5 rounded-full", color)}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  )
}

function Switch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        checked
          ? "bg-gradient-to-br from-purple-600 to-indigo-600"
          : "bg-gray-300",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  )
}
