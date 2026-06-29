"use client"

/**
 * ForgotPasswordForm — request a password-reset email.
 *
 * Posts to /api/auth/forgot-password. The API always returns { ok: true }
 * to avoid email-enumeration leaks. In dev the API also returns
 * `devResetLink`; we surface it so the developer can click straight
 * through without configuring SMTP. In production we show the generic
 * "if an account exists…" message.
 */
import { useState, useTransition } from "react"
import Link from "next/link"
import { Mail, AlertCircle, Loader2, ArrowLeft, CheckCircle2, Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [devLink, setDevLink] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDevLink(null)

    startTransition(async () => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Something went wrong. Please try again.")
        toast.error("Could not request a reset link")
        return
      }

      const data = (await res.json().catch(() => ({}))) as {
        devResetLink?: string
      }
      setSubmitted(true)
      if (data.devResetLink) setDevLink(data.devResetLink)
      toast.success("Reset link requested")
    })
  }

  const handleCopy = async () => {
    if (!devLink) return
    try {
      await navigator.clipboard.writeText(devLink)
      toast.success("Link copied")
    } catch {
      toast.error("Copy failed")
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
          <p className="text-sm text-gray-600">
            If an account exists for{" "}
            <span className="font-semibold text-gray-800">{email}</span>, we
            sent a password-reset link. It expires in 1 hour.
          </p>
        </div>

        {devLink && (
          <Alert className="border-amber-200 bg-amber-50 text-left">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 space-y-2">
              <p className="font-semibold">Development reset link</p>
              <p>
                In production this email is sent automatically. For local
                development, use the link below.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 px-2 py-1.5 bg-white border border-amber-200 rounded text-xs font-mono break-all">
                  {devLink}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="gap-1 border-amber-300 text-amber-800 hover:bg-amber-100"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-gray-900 mb-2"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={isPending}
          className="h-11 text-base border-2 border-gray-200 focus:ring-blue-500"
        />
        <p className="mt-2 text-xs text-gray-500">
          We'll send a one-time link to reset your password.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full h-11 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600",
          "hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg",
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending link…
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            Send reset link
          </>
        )}
      </Button>

      <div className="text-center text-sm text-gray-600">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </form>
  )
}