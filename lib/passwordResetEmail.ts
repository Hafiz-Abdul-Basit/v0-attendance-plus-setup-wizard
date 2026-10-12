/**
 * sendPasswordResetEmail — production hand-off for forgot-password.
 *
 * Sends the reset link through `lib/email.ts` (Resend) when RESEND_API_KEY
 * and EMAIL_FROM are set. Without them it only logs that nothing was sent;
 * in dev the API route also returns the link so the flow can be tested
 * without an email account.
 *
 * MUST NOT throw — the API route treats email delivery as best-effort (the
 * user already got a generic "if an account exists…" response to avoid
 * account enumeration).
 */
import { isEmailConfigured, sendEmail } from "@/lib/email"

export async function sendPasswordResetEmail(
  email: string,
  url: string,
): Promise<void> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.warn(
        "[passwordResetEmail] RESEND_API_KEY / EMAIL_FROM not set — reset email not sent.",
      )
    }
    return
  }
  await sendEmail({
    to: email,
    subject: "Reset your password",
    text: `Use this link to reset your password. It expires in 1 hour.\n\n${url}\n\nIf you didn't ask for this, ignore this email.`,
    html: `<p>Use the link below to reset your password. It expires in 1 hour.</p><p><a href="${url}">${url}</a></p><p>If you didn't ask for this, ignore this email.</p>`,
  })
}
