import type { Metadata } from "next";
import { ContactForm } from "./contact-form";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with the Civica Health team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <span className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
        Get in touch
      </span>
      <h1 className="mt-3 text-3xl font-bold text-[var(--navy)] sm:text-4xl">Contact us</h1>
      <p className="mt-6 text-lg text-[var(--text-secondary)]">
        Have a question about Civica Health, or want to bring your clinic onboard? Send us
        a message, or reach us directly at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--accent)]">
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Please do not submit protected health information (PHI)</strong> through
        this form. This site is for general inquiries only.
      </div>

      <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <ContactForm />
      </div>
    </div>
  );
}
