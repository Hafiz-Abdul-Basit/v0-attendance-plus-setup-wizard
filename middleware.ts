/**
 * Next.js middleware — gate the whole app behind authentication.
 *
 * Behaviour:
 * - If the user has no valid NextAuth JWT, redirect them to /login.
 * - /login, /register, /api/auth/*, and Next.js internals/_next/static/* are
 *   excluded so the login flow itself can render and so static assets work.
 * - All other paths (including /api/snippets) require auth, but POST /api/auth/*
 *   is also excluded so the register endpoint is reachable while logged out.
 *
 * To make a new public route, add it to the matcher below.
 */
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (token) {
    // Already signed in — bounce away from auth pages back to the app.
    if (pathname === "/login" || pathname === "/register") {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      url.search = ""
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Not signed in — only allow the public auth paths.
  const publicPaths = ["/login", "/register"]
  const isAuthApi = pathname.startsWith("/api/auth/")
  if (publicPaths.includes(pathname) || isAuthApi) {
    return NextResponse.next()
  }

  // Everything else: redirect to /login, preserving the intended destination.
  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.search = `?callbackUrl=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(url)
}

// Run on every path except static assets and image optimization.
// /api/* IS included so unauthenticated POST/PUT to /api/snippets gets a
// redirect (browser will follow) — for true 401 JSON responses, add an
// explicit check in each route handler (we do this in /api/snippets/*).
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|images|Develop|apple|placeholder|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)",
  ],
}
