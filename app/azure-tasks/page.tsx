/**
 * /azure-tasks — public page route for the Azure Tasks dashboard.
 *
 * The panel handles its own full-viewport layout (filters on the left,
 * tasks on the right). The page contributes the sticky top bar with
 * the back link and ProfileMenu so the sidebar's sticky positioning
 * has a stable origin.
 *
 * Server-side access control: the page is open to admins and to users
 * who have been granted the `canSeeAzureTasks` capability from the
 * Admin Panel. The API routes also re-check this flag so a non-permitted
 * user who deep-links to /azure-tasks gets the friendly 403 below, and
 * direct API calls return 403 — no work-item data ever leaves the
 * server for an unauthorized user.
 */
import Link from "next/link"
import { getServerSession } from "next-auth"
import { ArrowLeft, ShieldAlert } from "lucide-react"

import { AzureTasksPanel } from "@/components/azure-tasks"
import { ProfileMenu } from "@/components/auth/ProfileMenu"
import { Button } from "@/components/ui/button"
import { authOptions, canAccessAzureTasks } from "@/lib/auth"

export const metadata = {
  title: "Azure Tasks | Abdul Basit",
}

export default async function AzureTasksPage() {
  // Read the session server-side so we can gate before rendering the
  // panel. `authOptions` MUST be passed — without it NextAuth skips the
  // project's `session()` callback, the `canSeeAzureTasks` flag never
  // gets populated on `session.user`, and every non-admin sees the
  // restricted card even after an admin has flipped their capability on.
  const session = await getServerSession(authOptions)
  const user = session?.user
  const isAllowed = canAccessAzureTasks(user)

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

      {isAllowed ? (
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