import type { Metadata } from "next"
import Link from "next/link"
import { UserPlus } from "lucide-react"

import { RegisterForm } from "@/components/auth/RegisterForm"
import { AuthHeader } from "@/components/auth/AuthHeader"

export const metadata: Metadata = {
  title: "Create account | Abdul Basit Snippets",
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <AuthHeader />
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 mb-4 shadow-lg">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
          <p className="text-gray-600">Get instant access to the snippet library and setup wizard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <RegisterForm />

          <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}