"use client";

import { useActionState } from "react";
import {
  subscribeNewsletterAction,
  type NewsletterActionState,
} from "@/server/actions/newsletter-actions";

const initialState: NewsletterActionState = {};

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeNewsletterAction, initialState);

  if (state.success) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--accent-light)] p-6 text-center">
        <p className="font-semibold text-[var(--navy)]">Thanks for signing up!</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          We&apos;ve noted your interest — there&apos;s no mailing list running yet, so
          we&apos;ll reach out directly once updates go live.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm text-[var(--navy)] outline-none focus:border-[var(--accent)]"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--navy)] disabled:opacity-60"
      >
        {pending ? "Sending..." : "Notify me"}
      </button>
      {state.error && (
        <p className="self-center text-sm text-red-600 sm:ml-2">{state.error}</p>
      )}
    </form>
  );
}
