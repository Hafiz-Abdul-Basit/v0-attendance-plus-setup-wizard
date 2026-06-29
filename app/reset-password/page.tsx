import type { Metadata } from "next"
import Link from "next/link"
import { AlertCircle, KeyRound } from "lucide-react"

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm"
import { AuthHeader } from "@/components/auth/AuthHeader"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Set new password | Abdul Basit Snippets",
}

interface ResetPasswordPageProps {
  searchParams: { token?: string }
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const token = searchParams?.token?.trim() ?? ""

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-100 flex items-center justify-center px-4 py-12">
      <AuthHeader />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 mb-4 shadow-lg">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set a new password
          </h1>
          <p className="text-gray-600">
            Choose a strong password you don't use anywhere else.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="space-y-5 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Invalid or missing reset link
                </h2>
                <p className="text-sm text-gray-600">
                  This page expects a one-time reset token in the URL. Please
                  request a new reset link from the sign-in page.
                </p>
              </div>
              <Link href="/forgot-password">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Request a new link
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}