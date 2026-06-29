"use client"

/**
 * ProfileMenu — avatar + dropdown menu (Admin Panel link, Logout).
 *
 * Renders inline in a header row (not floating). It's intentionally a
 * controlled component: the parent decides when to mount it. Pass an
 * `align` of "right" to right-align the dropdown, otherwise it opens
 * to the left.
 */
import * as React from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { ChevronDown, LogOut, ShieldCheck, User as UserIcon } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

function initialsFor(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "?"
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export interface ProfileMenuProps {
  /** "right" anchors the dropdown to the right edge of the trigger. */
  align?: "right" | "left"
  /** Optional className applied to the wrapping div for layout control. */
  className?: string
  /** Compact trigger: avatar only, no name/role label. */
  compact?: boolean
}

export function ProfileMenu({ align = "right", className, compact = false }: ProfileMenuProps) {
  const { data: session, status } = useSession()
  const [open, setOpen] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  if (status === "loading" || !session?.user) return null

  const { name, email, role } = session.user
  const isAdmin = role === "admin"

  const handleLogout = async () => {
    setOpen(false)
    toast.success("Signed out")
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <div
      ref={wrapperRef}
      className={cn("relative", className)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full transition-all",
          compact ? "p-0.5" : "pl-1 pr-2 py-1",
          "bg-white border border-gray-200 shadow-sm",
          "hover:shadow-md hover:border-blue-300",
          "focus:outline-none focus:ring-2 focus:ring-blue-300",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
      >
        <div
          className={cn(
            "rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow",
            compact ? "w-8 h-8 text-xs" : "w-8 h-8 text-xs",
          )}
        >
          {initialsFor(name, email)}
        </div>
        {!compact && (
          <>
            <div className="hidden sm:flex flex-col items-start leading-tight pr-1">
              <span className="text-sm font-semibold text-gray-800 max-w-[10rem] truncate">
                {name || email}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                {isAdmin ? "Administrator" : "Member"}
              </span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-gray-500 transition-transform",
                open && "rotate-180 text-blue-600",
              )}
            />
          </>
        )}
        {compact && (
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-500 transition-transform mr-1",
              open && "rotate-180 text-blue-600",
            )}
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute mt-2 w-72 z-50 origin-top-right",
            align === "right" ? "right-0" : "left-0",
            "bg-white border border-gray-200 rounded-2xl shadow-2xl",
            "ring-1 ring-black/5 overflow-hidden",
            "animate-in fade-in slide-in-from-top-2 duration-150",
          )}
        >
          <div className="px-4 py-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-base font-bold shadow">
                {initialsFor(name, email)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {name || "Unnamed user"}
                </div>
                <div
                  className="text-xs text-gray-600 truncate"
                  title={email ?? ""}
                >
                  {email}
                </div>
                <div className="mt-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      isAdmin
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-gray-100 text-gray-700 border border-gray-200",
                    )}
                  >
                    {isAdmin ? (
                      <ShieldCheck className="w-3 h-3" />
                    ) : (
                      <UserIcon className="w-3 h-3" />
                    )}
                    {isAdmin ? "Admin" : "User"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm",
                isAdmin
                  ? "text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                  : "text-gray-400 cursor-not-allowed pointer-events-none",
              )}
              aria-disabled={!isAdmin}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Panel
              {!isAdmin && (
                <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-400">
                  Restricted
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "w-full text-left flex items-center gap-2 px-4 py-2 text-sm",
                "text-red-600 hover:bg-red-50",
              )}
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}