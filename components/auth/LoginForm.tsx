"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { LogIn, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"
  const justReset = searchParams.get("reset") === "success"

  // Use refs + state together so that even if the component re-mounts (e.g.
  // because of a Suspense boundary re-render triggered by useSearchParams
  // or router.refresh()), the user's email/password are preserved on the
  // next attempt. The previous useTransition-based version caused the form
  // to "reset" on the first failed attempt because the Suspense boundary
  // re-mounted the component after the awaited signIn() resolved.
  const emailRef = useRef<HTMLInputElement | null>(null)
  const passwordRef = useRef<HTMLInputElement | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  // Re-sync refs into state on mount in case the component re-mounted.
  useEffect(() => {
    if (emailRef.current && emailRef.current.value && !email) {
      setEmail(emailRef.current.value)
    }
    if (passwordRef.current && passwordRef.current.value && !password) {
      setPassword(passwordRef.current.value)
    }
  }, [email, password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (!res || res.error) {
        setError("Invalid email or password. Please try again.")
        toast.error("Login failed")
        return
      }

      // Decide destination: admins land on /admin by default; everyone else
      // honors the original callbackUrl.
      const session = await getSession()
      const isAdmin = session?.user?.role === "admin"
      const target =
        isAdmin && (!callbackUrl || callbackUrl === "/" || callbackUrl === "/login")
          ? "/admin"
          : callbackUrl

      toast.success("Signed in")
      // Use a hard navigation so server components pick up the new JWT
      // cookie immediately (router.push + router.refresh can race with
      // cookie propagation, causing the gate to redirect back to /login).
      window.location.href = target
    } catch {
      setError("Login failed. Please try again.")
      toast.error("Login failed")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {justReset && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            Your password has been reset. Sign in with your new password.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
          Email
        </label>
        <Input
          id="email"
          ref={emailRef}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={isPending}
          className="h-11 text-base border-2 border-gray-200 focus:ring-blue-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          ref={passwordRef}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isPending}
          className="h-11 text-base border-2 border-gray-200 focus:ring-blue-500"
        />
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
            Signing in…
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Sign in
          </>
        )}
      </Button>
    </form>
  )
}