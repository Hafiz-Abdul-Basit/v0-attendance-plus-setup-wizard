/**
 * NextAuth catch-all route — exports the same handler for GET and POST.
 * Configuration lives in lib/auth.ts so it can be reused by NextAuth() server
 * helpers and middleware.
 */
import NextAuth from "next-auth"

import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
