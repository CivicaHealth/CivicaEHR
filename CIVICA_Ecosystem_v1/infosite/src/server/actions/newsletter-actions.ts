"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { CONTACT_NOTIFY_EMAIL } from "@/lib/site";
import { escapeHtml } from "@/lib/escape-html";

const newsletterSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export interface NewsletterActionState {
  error?: string;
  success?: boolean;
}

export async function subscribeNewsletterAction(
  _prevState: NewsletterActionState,
  formData: FormData,
): Promise<NewsletterActionState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const { email } = parsed.data;

  await sendEmail({
    to: CONTACT_NOTIFY_EMAIL,
    replyTo: email,
    subject: "New Civica Health newsletter signup",
    text: `New newsletter signup from the Civica Health info site.\n\nEmail: ${email}`,
    html: `<p>New newsletter signup from the Civica Health info site.</p><p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
  });

  return { success: true };
}
