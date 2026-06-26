import nodemailer from "nodemailer";

interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

/**
 * Mirrors @civica/email's transporter setup (same SMTP_* env var names) so
 * the dashboard and info site can share one SMTP provider/credentials.
 */
function getTransporter() {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });

  return transporter;
}

export async function sendEmail({ to, subject, text, html, replyTo }: SendEmailInput): Promise<void> {
  const client = getTransporter();

  if (!client) {
    console.log(`[email] (SMTP not configured) would send "${subject}" to ${to}`);
    return;
  }

  try {
    await client.sendMail({
      from: process.env.SMTP_FROM ?? "Civica Health <civicahealth@gmail.com>",
      to,
      replyTo,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("[email] failed to send", subject, "to", to, err);
  }
}
