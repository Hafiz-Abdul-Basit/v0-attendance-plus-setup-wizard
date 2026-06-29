import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { AdminPanel } from "@/components/admin/AdminPanel"
import { ProfileMenu } from "@/components/auth/ProfileMenu"

export const metadata = {
  title: "Admin Panel | Abdul Basit Snippets",
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
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
      <AdminPanel />
    </div>
  )
}