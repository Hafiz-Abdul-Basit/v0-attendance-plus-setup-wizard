"use client"

/**
 * AuthHeader — top-right profile menu for pages that don't render their
 * own navigation header (login, register, admin, etc.).
 *
 * The wizard page renders its own <ProfileMenu> inline inside its header
 * so the two never overlap. This component exists so the profile UI is
 * still discoverable on the auth and admin pages.
 */
import { ProfileMenu } from "@/components/auth/ProfileMenu"

export function AuthHeader() {
  return (
    <div className="fixed top-3 right-4 z-40">
      <ProfileMenu compact />
    </div>
  )
}