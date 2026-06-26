import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security & Compliance",
  description:
    "How Civica Health approaches security: HIPAA-aligned operations, server-side sessions, role-based access, and audit logging built into every clinic tool.",
  alternates: { canonical: "/security" },
};

const PRINCIPLES = [
  {
    title: "HIPAA-aligned operations",
    body:
      "Every tool is designed around HIPAA-aligned workflows — server-side sessions, deny-by-default authorization, and audit logging are the foundation, not an afterthought.",
  },
  {
    title: "Security-conscious infrastructure",
    body:
      "Passwords are hashed with Argon2id, sessions are signed and stored server-side, and every protected action re-checks access on the server — a hidden button is never the only control.",
  },
  {
    title: "Audit logging by default",
    body:
      "Sensitive actions — logins, record access, role changes, tool launches — are logged server-side so clinics can review who accessed what, and when.",
  },
  {
    title: "Built for HIPAA-ready deployment",
    body:
      "Civica Health's architecture is built for HIPAA-ready deployment: one auth system shared across tools, no PHI in logs or URLs, and clinic-scoped data access to prevent cross-clinic exposure.",
  },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <span className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
        Security &amp; compliance
      </span>
      <h1 className="mt-3 text-3xl font-bold text-[var(--navy)] sm:text-4xl">
        Built for healthcare workflows, by design
      </h1>
      <p className="mt-6 text-lg text-[var(--text-secondary)]">
        Civica Health is designed for HIPAA-aligned operations from the ground up. We don&apos;t
        claim to be &quot;HIPAA compliant&quot; on your behalf — compliance depends on how a
        clinic configures and uses the platform — but the architecture itself is built for
        HIPAA-ready deployment.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {PRINCIPLES.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-transform hover:-translate-y-1"
          >
            <h2 className="text-lg font-semibold text-[var(--navy)]">{item.title}</h2>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-[var(--border)] bg-[var(--accent-light)] p-8 text-center">
        <h2 className="text-xl font-semibold text-[var(--navy)]">
          Have a security question about your clinic&apos;s deployment?
        </h2>
        <p className="mt-3 text-[var(--text-secondary)]">
          Reach out and we&apos;ll walk through how Civica Health fits your compliance
          requirements.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-full bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-[var(--navy)]"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
