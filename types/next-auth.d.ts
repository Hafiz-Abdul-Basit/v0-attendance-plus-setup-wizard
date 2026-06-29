/**
 * Module augmentation so `session.user.id`, `session.user.role`,
 * `session.user.email`, and the per-user tab-visibility flags are
 * strongly typed everywhere we read the NextAuth session.
 *
 * NextAuth v4 requires the augmentation file to be picked up by tsconfig
 * (the existing tsconfig.json already includes **\/*.ts so this is
 * automatically in scope).
 */
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: "user" | "admin"
      canSeeSetupClients: boolean
      canSeeSetups: boolean
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: "user" | "admin"
    canSeeSetupClients?: boolean
    canSeeSetups?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string
    email: string
    role: "user" | "admin"
    canSeeSetupClients?: boolean
    canSeeSetups?: boolean
  }
}