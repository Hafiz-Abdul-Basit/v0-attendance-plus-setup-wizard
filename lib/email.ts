/**
 * Transactional email via Resend's REST API (https://resend.com) — no SDK,
 * just fetch.
 *
 * Configure with:
 *   RESEND_API_KEY — API key from the Resend dashboard
 *   EMAIL_FROM     — verified sender, e.g. "AttendancePlus <no-reply@raaweek12.com>"
 *
 * When either is missing, `isEmailConfigured()` is false and callers fall
 * back (sign-up skips the OTP step; password reset only logs the link).
 */
import "server-only"

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

/** Send one email. Returns false (and logs) on any failure — never throws. */
export async function sendEmail(msg: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<boolean> {
  if (!isEmailConfigured()) return false
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error("[email] Resend rejected the message:", res.status, (await res.text().catch(() => "")).slice(0, 300))
      return false
    }
    return true
  } catch (err) {
    console.error("[email] send failed:", err)
    return false
  }
}
