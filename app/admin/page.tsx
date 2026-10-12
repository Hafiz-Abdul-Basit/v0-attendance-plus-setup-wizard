import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { AdminPanel } from "@/components/admin/AdminPanel"
import { ProfileMenu } from "@/components/auth/ProfileMenu"

export const metadata = {
  title: "Admin Panel | Abdul Basit Snippets",
}

// Full-viewport shell: the header stays put and each admin tab scrolls
// inside its own area (see AdminPanel), so the page itself never scrolls.
export default function AdminPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/60">
      <header className="shrink-0 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="flex items-center justify-between gap-4 px-4 lg:px-6 py-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to wizard
          </Link>
          <ProfileMenu />
        </div>
      </header>
      <AdminPanel />
    </div>
  )
}
