import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { LogIn } from "lucide-react"

import { LoginForm } from "@/components/auth/LoginForm"
import { AuthHeader } from "@/components/auth/AuthHeader"

export const metadata: Metadata = {
  title: "Sign in | Abdul Basit Snippets",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <AuthHeader />
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 shadow-lg">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to access the AttendancePlus Setup Wizard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <Suspense fallback={<div className="h-64 animate-pulse rounded bg-gray-100" />}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Create one
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Press <kbd className="px-1.5 py-1.5 bg-white rounded text-xs border border-gray-200">Esc</kbd> to close
        </p>
      </div>
    </div>
  )
}