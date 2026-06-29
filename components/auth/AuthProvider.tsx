"use client"

/**
 * Client-side SessionProvider wrapper. Mount once near the root in app/layout.tsx.
 * Mirrors the pattern of the existing ClientLayout.tsx (also a thin client
 * component used to keep `app/layout.tsx` a server component).
 */
import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
