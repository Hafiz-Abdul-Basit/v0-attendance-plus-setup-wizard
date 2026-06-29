"use client"

/**
 * ResetPasswordForm — set a new password using a one-time reset token.
 *
 * The token comes from the URL (`/reset-password?token=...`) and is
 * posted to /api/auth/reset-password. On success, redirects to
 * /login?reset=success so the user can sign in with their new password.
 */
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { KeyRound, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Could not reset password. Please try again.")
        toast.error("Reset failed")
        return
      }

      setSuccess(true)
      toast.success("Password updated")
      // Send them to /login with a banner flag so the page can show
      // "Your password has been reset".
      router.push("/login?reset=success")
      router.refresh()
    })
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <p className="text-gray-700">Password updated. Redirecting to sign in…</p>
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
          htmlFor="password"
          className="block text-sm font-semibold text-gray-900 mb-2"
        >
          New password <span className="text-gray-400 font-normal">(min 8 chars)</span>
        </label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isPending}
          className="h-11 text-base border-2 border-gray-200 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="confirm"
          className="block text-sm font-semibold text-gray-900 mb-2"
        >
          Confirm new password
        </label>
        <PasswordInput
          id="confirm"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          disabled={isPending}
          className="h-11 text-base border-2 border-gray-200 focus:ring-blue-500"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full h-11 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600",
          "hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg",
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Updating…
          </>
        ) : (
          <>
            <KeyRound className="w-4 h-4" />
            Update password
          </>
        )}
      </Button>

      <div className="text-center text-sm text-gray-600">
        Changed your mind?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  )
}