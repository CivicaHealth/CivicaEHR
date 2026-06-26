import type { Metadata } from "next";
import { NewsletterForm } from "./newsletter-form";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Sign up to hear about Civica Health updates for clinic operations.",
  alternates: { canonical: "/newsletter" },
};

export default function NewsletterPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <span className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
        Stay in the loop
      </span>
      <h1 className="mt-3 text-3xl font-bold text-[var(--navy)] sm:text-4xl">
        Civica Health newsletter
      </h1>
      <p className="mt-6 text-lg text-[var(--text-secondary)]">
        Get occasional updates on new clinic tools, releases, and how clinics are using
        Civica Health to run their operations.
      </p>

      <div className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        <NewsletterForm />
        <p className="mt-4 text-xs text-[var(--muted)]">
          There&apos;s no mailing list set up yet — your email is sent to our team
          directly, and we are not storing it in a database.
        </p>
      </div>
    </div>
  );
}
