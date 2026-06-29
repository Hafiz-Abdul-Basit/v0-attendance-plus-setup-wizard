import type { Metadata } from "next"
import { KeyRound } from "lucide-react"

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"
import { AuthHeader } from "@/components/auth/AuthHeader"

export const metadata: Metadata = {
  title: "Reset password | Abdul Basit Snippets",
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <AuthHeader />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 mb-4 shadow-lg">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot your password?
          </h1>
          <p className="text-gray-600">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}