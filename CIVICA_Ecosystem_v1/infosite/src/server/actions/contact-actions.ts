"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { CONTACT_NOTIFY_EMAIL } from "@/lib/site";
import { escapeHtml } from "@/lib/escape-html";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.email("Enter a valid email address"),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export interface ContactActionState {
  error?: string;
  success?: boolean;
}

export async function submitContactAction(
  _prevState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your input and try again." };
  }

  const { name, email, message } = parsed.data;

  await sendEmail({
    to: CONTACT_NOTIFY_EMAIL,
    replyTo: email,
    subject: `Civica Health contact form: ${name}`,
    text: `New message from the Civica Health info site contact form.\n\nFrom: ${name} <${email}>\n\n${message}`,
    html: `<p>New message from the Civica Health info site contact form.</p><p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`,
  });

  return { success: true };
}
