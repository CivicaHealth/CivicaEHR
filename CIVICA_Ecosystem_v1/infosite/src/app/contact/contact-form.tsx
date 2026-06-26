"use client";

import { useActionState } from "react";
import { submitContactAction, type ContactActionState } from "@/server/actions/contact-actions";
import { CONTACT_EMAIL } from "@/lib/site";

const initialState: ContactActionState = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent-light)] p-6 text-center">
        <p className="font-semibold text-[var(--navy)]">Message sent!</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Thanks for reaching out — we&apos;ll get back to you soon. You can also email us
          directly at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--accent)]">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium text-[var(--navy)]">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--navy)] outline-none focus:border-[var(--accent)]"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-[var(--navy)]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--navy)] outline-none focus:border-[var(--accent)]"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-sm font-medium text-[var(--navy)]">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--navy)] outline-none focus:border-[var(--accent)]"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--navy)] disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
