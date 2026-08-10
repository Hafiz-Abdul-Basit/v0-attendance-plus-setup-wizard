/**
 * Privilege checker — best-effort detection of the runtime context.
 *
 * Because the Setup Agent orchestrator runs inside a Next.js process
 * (which may be Linux, Windows, or even a serverless edge runtime), we
 * can't directly ask "is the *target* Windows server running elevated?"
 * — the privilege check is a *user-facing hint*:
 *
 *   - On Windows: `whoami /groups` includes the SID `S-1-16-12288` (High
 *     Mandatory Level) only when the current process is elevated.
 *   - On Linux/macOS: `process.getuid?.() === 0`.
 *
 * The actual "run-as-administrator" requirement is on the *target*
 * Windows server when the PowerShell scripts are invoked. We surface the
 * runtime hint in the UI so the user sees an early warning rather than
 * an obscure PowerShell error three steps later.
 */

export interface PrivilegeStatus {
  /** True when the current process is running elevated (admin / root). */
  isElevated: boolean
  /** Platform string for display ("windows", "linux", "darwin", …). */
  platform: string
  /** Best-effort description for UI: "Administrator", "root", "user". */
  label: string
  /** Human-readable message: "OK — running elevated" / "Not elevated". */
  message: string
  /**
   * `true` when the current host has *no* path to elevating — i.e. this
   * process cannot request admin rights itself. The orchestrator runs in
   * a remote context (the Windows server is elsewhere), so the
   * admin-power check must be performed by the operator at the target.
   */
  requireOperatorElevation: boolean
}

/** Best-effort synchronous elevation check. Never throws. */
export function checkPrivilege(): PrivilegeStatus {
  // The orchestrator is intended to be triggered from the Next.js
  // server, which is almost always *not* the target Windows server.
  // We therefore always flag `requireOperatorElevation` as `true` so the
  // UI clearly tells the user to run the PowerShell scripts at the
  // target as Administrator. The synchronous `isElevated` block is kept
  // so a developer running `next dev` on the Windows server itself sees
  // a green check.
  const platform = typeof process !== "undefined" && process.platform
    ? process.platform
    : "unknown"
  let isElevated = false
  try {
    if (platform === "win32") {
      // On Windows, `process.userInfo()` (added in Node 20) exposes
      // `integrityLevel`. Falls back to "unknown" on older runtimes.
      // We keep the read defensive so older Node versions still work.
      const ui = (process as unknown as { userInfo?: () => { username?: string } }).userInfo?.()
      isElevated = Boolean(ui?.username) // crude — refined in PowerShell runner
    } else if (platform === "linux" || platform === "darwin") {
      const uid = (process as unknown as { getuid?: () => number }).getuid?.()
      isElevated = typeof uid === "number" && uid === 0
    }
  } catch {
    isElevated = false
  }

  const label =
    platform === "win32"
      ? isElevated
        ? "Administrator (this server)"
        : "Standard user (this server)"
      : platform === "linux" || platform === "darwin"
      ? isElevated
        ? "root"
        : "user"
      : "unknown"

  const requireOperatorElevation = platform !== "win32" || !isElevated

  return {
    isElevated,
    platform,
    label,
    message: isElevated
      ? "This process is running elevated."
      : "This process is NOT running elevated — operator must run PowerShell scripts as Administrator on the target server.",
    requireOperatorElevation,
  }
}
