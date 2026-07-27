/**
 * NextAuth configuration — Credentials provider with bcrypt.
 *
 * The login flow:
 *   1. User submits email + password to NextAuth
 *   2. authorize() looks up the user in public.users (Supabase) using ONLY
 *      the columns that have been part of the schema since day one
 *      (id, email, name, password_hash, role). This keeps login working
 *      even before later migrations land.
 *   3. bcrypt.compare() verifies the password
 *   4. JWT is issued with { userId, email, role } claims
 *   5. The session callback lazily fills in canSeeSetupClients /
 *      canSeeSetups from the database (skipping the columns gracefully if
 *      they don't exist yet) — so login never breaks on missing columns.
 *
 * Sessions default to JWT strategy (no DB session table needed).
 */
import type { NextAuthOptions } from "next-auth"
import type { NextRequest } from "next/server"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

import { getSupabaseAdmin } from "@/lib/supabase"

export type Role = "user" | "admin"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase().trim()
        const supabase = getSupabaseAdmin()

        // IMPORTANT: only select columns that have existed since the
        // original schema. The two can_see_* flags are loaded lazily in the
        // session callback below, so login keeps working even if the
        // migration hasn't been applied yet.
        const { data: user, error } = await supabase
          .from("users")
          .select("id, email, name, password_hash, role")
          .eq("email", email)
          .maybeSingle()

        // Log the real Supabase error server-side so a missing-column or
        // connectivity issue doesn't masquerade as "wrong password".
        // Returning null on `error` is still correct from a security standpoint.
        if (error) {
          // eslint-disable-next-line no-console
          console.error("[auth] users.select failed:", error.message, error.code)
          return null
        }
        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: (user.role as Role) ?? "user",
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.email = user.email
        token.role = (user as { role?: Role }).role ?? "user"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId
        session.user.email = token.email
        session.user.role = (token.role as Role) ?? "user"

        // Lazy-load per-user capability flags from the DB. If the columns
        // don't exist yet (schema migration pending) the query errors out
        // and we default every flag to `false` — login still works.
        if (token.userId) {
          const flags = await loadTabVisibilityFlags(token.userId as string)
          session.user.canSeeSetupClients = flags.canSeeSetupClients
          session.user.canSeeSetups = flags.canSeeSetups
          session.user.canEditAllSnippets = flags.canEditAllSnippets
          session.user.canSeeAppMenu = flags.canSeeAppMenu
          session.user.canSeeAzureTasks = flags.canSeeAzureTasks
        } else {
          session.user.canSeeSetupClients = false
          session.user.canSeeSetups = false
          session.user.canEditAllSnippets = false
          session.user.canSeeAppMenu = false
          session.user.canSeeAzureTasks = false
        }
      }
      return session
    },
  },
}

/**
 * Lazy-load the per-user tab-visibility + capability flags from
 * `public.users`. Returns safe defaults if the columns don't exist yet
 * (migration pending) or any other DB error. Cached per request via the
 * module-level `flagsCache`.
 */
const flagsCache = new Map<
  string,
  {
    canSeeSetupClients: boolean
    canSeeSetups: boolean
    canEditAllSnippets: boolean
    canSeeAppMenu: boolean
    canSeeAzureTasks: boolean
    cachedAt: number
  }
>()
const FLAGS_TTL_MS = 30_000

export async function loadTabVisibilityFlags(userId: string): Promise<{
  canSeeSetupClients: boolean
  canSeeSetups: boolean
  canEditAllSnippets: boolean
  canSeeAppMenu: boolean
  canSeeAzureTasks: boolean
}> {
  const cached = flagsCache.get(userId)
  if (cached && Date.now() - cached.cachedAt < FLAGS_TTL_MS) {
    return {
      canSeeSetupClients: cached.canSeeSetupClients,
      canSeeSetups: cached.canSeeSetups,
      canEditAllSnippets: cached.canEditAllSnippets,
      canSeeAppMenu: cached.canSeeAppMenu,
      canSeeAzureTasks: cached.canSeeAzureTasks,
    }
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("users")
      .select("can_see_setup_clients, can_see_setups, can_edit_all_snippets, can_see_app_menu, can_see_azure_tasks")
      .eq("id", userId)
      .maybeSingle()
    if (error || !data) {
      // Most likely the columns don't exist yet — log once for diagnosis.
      if (error) {
        // eslint-disable-next-line no-console
        console.warn(
          "[auth] capability flags unavailable (run supabase/schema.sql + latest migrations to add them):",
          error.message,
        )
      }
      return {
        canSeeSetupClients: false,
        canSeeSetups: false,
        canEditAllSnippets: false,
        canSeeAppMenu: false,
        canSeeAzureTasks: false,
      }
    }
    const result = {
      canSeeSetupClients: Boolean(data.can_see_setup_clients),
      canSeeSetups: Boolean(data.can_see_setups),
      canEditAllSnippets: Boolean(data.can_edit_all_snippets),
      canSeeAppMenu: Boolean(data.can_see_app_menu),
      canSeeAzureTasks: Boolean(data.can_see_azure_tasks),
    }
    flagsCache.set(userId, { ...result, cachedAt: Date.now() })
    return result
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[auth] failed to load capability flags:", e)
    return {
      canSeeSetupClients: false,
      canSeeSetups: false,
      canEditAllSnippets: false,
      canSeeAppMenu: false,
      canSeeAzureTasks: false,
    }
  }
}

/** Exposed for the admin panel's PUT handler to invalidate the cache after a toggle. */
export function invalidateTabVisibilityCache(userId?: string) {
  if (userId) flagsCache.delete(userId)
  else flagsCache.clear()
}

/**
 * Server-only helper used by API route handlers.
 *
 * Returns either the authenticated caller (with their role) or a
 * NextResponse that the caller should return directly:
 *
 *   const auth = await requireAdmin(request)
 *   if (auth instanceof NextResponse) return auth
 *   // ...auth.userId / auth.role is safe to use
 *
 * `request` can be a NextRequest (middleware/route handler) or a
 * Node IncomingMessage (Pages API). We accept both via duck typing.
 */
export async function requireAuth(request: Request) {
  const { getToken } = await import("next-auth/jwt")
  const token = await getToken({
    req: request as unknown as NextRequest,
    secret: process.env.NEXTAUTH_SECRET,
  })
  if (!token || !token.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return {
    userId: token.userId as string,
    email: token.email as string,
    role: ((token as { role?: Role }).role ?? "user") as Role,
  }
}

export async function requireAdmin(request: Request) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth
  if (auth.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return auth
}

/**
 * Authorization helper for the Azure Tasks surface.
 *
 * Returns `true` if the signed-in user is allowed to use the Azure
 * Tasks dashboard and its API. The check is opt-in: admins always
 * pass; everyone else must have the `can_see_azure_tasks` flag set
 * by an admin via the Admin Panel.
 *
 * Pass the already-fetched `session.user` (e.g. in a server component
 * after `getServerSession`) — the helper reads role + flag. Used by
 * the /azure-tasks page and the API routes.
 */
export function canAccessAzureTasks(
  user: { role: string; canSeeAzureTasks?: boolean } | null | undefined,
): boolean {
  if (!user) return false
  if (user.role === "admin") return true
  return Boolean(user.canSeeAzureTasks)
}

/**
 * Server-only variant: enforce the same check inside a route handler.
 * On failure returns a 403 NextResponse; on success returns the auth
 * payload (so the handler can also use `auth.userId` for logging).
 *
 * Note: requires the route to have called `requireAuth` first so we
 * have the userId. We re-fetch the user's capability flag from the DB
 * (bypassing the cached JWT) so an admin's mid-session flag toggle
 * applies immediately.
 */
export async function requireAzureTasksAccess(request: Request) {
  const { getToken } = await import("next-auth/jwt")
  const token = await getToken({
    req: request as unknown as NextRequest,
    secret: process.env.NEXTAUTH_SECRET,
  })
  if (!token || !token.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = token.userId as string
  const role = (token.role as Role) ?? "user"
  if (role === "admin") {
    return { userId, email: token.email as string, role }
  }
  const flags = await loadTabVisibilityFlags(userId)
  if (!flags.canSeeAzureTasks) {
    return NextResponse.json(
      { error: "Forbidden — Azure Tasks access not granted by admin." },
      { status: 403 },
    )
  }
  return { userId, email: token.email as string, role }
}

// Helper kept around so callers that already pass a NextRequest still type-check.
// (Currently unused by route handlers, but referenced by the type-only import.)
export type AnyRequest = NextRequest | Request