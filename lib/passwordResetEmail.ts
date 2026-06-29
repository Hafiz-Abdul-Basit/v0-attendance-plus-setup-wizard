/**
 * sendPasswordResetEmail — production hand-off for forgot-password.
 *
 * In dev we don't actually send email — the API route logs the link and
 * returns it directly so the developer can test the full flow without
 * an SMTP/Resend/SendGrid account. In production you'll want to wire
 * up a real transactional email provider here.
 *
 * TODO (production): pick one and uncomment its block. Replace the
 * RESEND_API_KEY / SENDGRID_API_KEY env var with whatever your provider
 * expects.
 *
 *   // Option 1 — Resend (https://resend.com)
 *   import { Resend } from "resend"
 *   const resend = new Resend(process.env.RESEND_API_KEY!)
 *   await resend.emails.send({
 *     from: "no-reply@your-domain.com",
 *     to: email,
 *     subject: "Reset your password",
 *     html: `<p>Click below to reset your password. The link expires in 1 hour.</p>
 *            <p><a href="${url}">${url}</a></p>`,
 *   })
 *
 *   // Option 2 — SendGrid
 *   import sgMail from "@sendgrid/mail"
 *   sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
 *   await sgMail.send({ to: email, from: "...", subject: "...", html: `...${url}...` })
 *
 *   // Option 3 — Supabase Auth (replace the /api/auth/forgot-password
 *   // route entirely with supabase.auth.resetPasswordForEmail instead).
 */
export async function sendPasswordResetEmail(
  email: string,
  url: string,
): Promise<void> {
  // Intentionally a no-op in dev. In prod, replace this with one of the
  // providers above. The function MUST NOT throw — the API route treats
  // email send failures as best-effort (the user already got a generic
  // "if an account exists…" success response to avoid enumeration).
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console.warn(
      "[passwordResetEmail] production: sendPasswordResetEmail is a no-op. " +
        "Wire up Resend / SendGrid before going live.",
      { email, url },
    )
  }
}