"use client"

/**
 * /azure-tasks — public page route for the Azure Tasks dashboard.
 *
 * The panel handles its own full-viewport layout (filters on the left,
 * tasks on the right). The page contributes the sticky top bar with
 * the back link and ProfileMenu so the sidebar's sticky positioning
 * has a stable origin.
 *
 * Access: admins always allowed; non-admins need `canSeeAzureTasks`
 * flipped on by an admin via /admin → Users. The API routes also
 * re-check this flag so direct calls return 403.
 *
 * Snip chatbot → Azure Tasks bridge: when the chat widget fires
 * `search-azure-tasks`, it navigates to
 * `/azure-tasks?search=<q>&daysBack=<n>&from=<iso>&to=<iso>`. The
 * panel's `useQueryState` reads those URL params on mount and
 * hydrates its filter state directly — no parent↔child localStorage
 * handoff needed. (An earlier version tried to forward params via
 * localStorage, but parent effects run AFTER child effects in React,
 * so the panel read the keys too early and missed them.)
 */
import Link from "next/link"
import { ArrowLeft, ShieldAlert } from "lucide-react"

import { AzureTasksPanel } from "@/components/azure-tasks"
import { ProfileMenu } from "@/components/auth/ProfileMenu"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { canAccessAzureTasks } from "@/lib/auth"

export default function AzureTasksPage() {
  const { data: session, status } = useSession()

  // Treat the session-load as its own state, NOT as "no access".
  // `useSession()` returns `status: "loading"` on the very first render
  // before the JWT has been hydrated. During that window `user` is
  // `null`, so `canAccessAzureTasks(null)` returns false — which made
  // the page flash the "restricted" card for a moment before the real
  // session resolved and the panel mounted. We now render a neutral
  // skeleton during the load so the user never sees a misleading
  // error state.
  const user = status === "authenticated" ? session?.user : null
  const isLoading = status === "loading"
  const isAllowed = !isLoading && canAccessAzureTasks(user)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between gap-4 px-4 lg:px-6 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to wizard
          </Link>
          <ProfileMenu />
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="inline-block w-4 h-4 rounded-full border-2 border-purple-300 border-t-transparent animate-spin" />
            Checking access…
          </div>
        </div>
      ) : isAllowed ? (
        <AzureTasksPanel />
      ) : (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Azure Tasks is restricted
            </h1>
            <p className="text-sm text-gray-600 mb-4">
              {user
                ? "Your admin has not granted access to Azure Tasks. Ask them to enable it from the Admin Panel → Users tab."
                : "You need to sign in to view Azure DevOps work items."}
            </p>
            <Button asChild>
              <Link href="/">Back to wizard</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}