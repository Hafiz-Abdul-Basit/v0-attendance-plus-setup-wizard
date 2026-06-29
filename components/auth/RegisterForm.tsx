"use client"

import { useState, useTransition } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { UserPlus, AlertCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

export function RegisterForm() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Registration failed" }))
        setError(data.error ?? "Registration failed. Please try again.")
        toast.error("Registration failed")
        return
      }

      // Auto-sign-in after successful registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (!signInRes || signInRes.error) {
        setError("Account created but auto sign-in failed. Please log in manually.")
        toast.error("Please log in manually")
        router.push("/login")
        return
      }

      // The freshly-registered user might be the very first one — and therefore
      // an admin. Send them straight to /admin so the experience matches what
      // admins expect; everyone else lands on the wizard.
      const session = await getSession()
      const target = session?.user?.role === "admin" ? "/admin" : "/"

      toast.success("Account created")
      router.push(target)
      router.refresh()
    })
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
        <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
          Name <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          disabled={isPending}
          className="h-11 text-base border-2 border-gray-200 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
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
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
          Password <span className="text-gray-400 font-normal">(min 8 chars)</span>
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

      <Button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full h-11 gap-2 bg-gradient-to-r from-purple-600 to-indigo-600",
          "hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg",
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating account…
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Create account
          </>
        )}
      </Button>
    </form>
  )
}
