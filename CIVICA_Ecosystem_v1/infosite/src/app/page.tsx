import Image from "next/image";
import Link from "next/link";
import { APP_LOGIN_URL } from "@/lib/site";

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--accent-light)] via-[var(--bg)] to-[var(--bg)]"
        />
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
          <Image
            src="/CIVICA_logo_transparent.png"
            alt="Civica Health"
            width={220}
            height={64}
            priority
            className="animate-fade-up mb-8 h-16 w-auto object-contain"
          />
          <span className="animate-fade-up mb-4 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent)] [animation-delay:80ms]">
            Built for healthcare workflows
          </span>
          <h1 className="animate-fade-up text-2xl font-bold tracking-tight text-[var(--navy)] sm:text-3xl [animation-delay:120ms]">
            Civica Health
          </h1>
          <p className="animate-fade-up mt-3 max-w-3xl text-4xl font-bold tracking-tight text-[var(--navy)] sm:text-5xl md:text-6xl [animation-delay:160ms]">
            Software infrastructure for clinics, built around the way care actually happens.
          </p>
          <p className="animate-fade-up mt-6 max-w-2xl text-lg text-[var(--text-secondary)] [animation-delay:220ms]">
            Civica Health gives clinics, student-run clinics, and free clinics one secure
            place to manage staff access, records, rosters, and patient follow-up —
            so volunteers and care teams can focus on patients, not paperwork.
          </p>
          <div className="animate-fade-up mt-10 flex flex-col items-center gap-4 sm:flex-row [animation-delay:280ms]">
            <a
              href={APP_LOGIN_URL}
              className="rounded-full bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:bg-[var(--navy)]"
            >
              Launch Civica App
            </a>
            <Link
              href="/contact"
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-8 py-3 text-base font-semibold text-[var(--navy)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "One secure login",
              body: "Staff sign in once and launch every clinic tool from a single, audited dashboard.",
            },
            {
              title: "Built for volunteers",
              body: "Designed with student-run and free clinics in mind, where staff and volunteers rotate often.",
            },
            {
              title: "HIPAA-ready architecture",
              body: "Server-side sessions, role-based access, and audit logging form the foundation of every tool.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-[var(--navy)]">{card.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
                Security &amp; compliance
              </span>
              <h2 className="mt-2 text-xl font-bold text-[var(--navy)] sm:text-2xl">
                Designed for HIPAA-aligned operations from day one.
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
                Server-side sessions, deny-by-default authorization, and audit logging are
                built into every Civica Health tool — not bolted on afterward.
              </p>
            </div>
            <Link
              href="/security"
              className="shrink-0 rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--navy)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Read about our security &rarr;
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-[var(--navy)] sm:text-3xl">
            Ready to bring your clinic onto Civica Health?
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">
            Reach out and we&apos;ll help you get your clinic&apos;s tools set up.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={APP_LOGIN_URL}
              className="rounded-full bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-[var(--navy)]"
            >
              Launch Civica App
            </a>
            <Link
              href="/mission"
              className="text-base font-semibold text-[var(--accent)] hover:text-[var(--navy)]"
            >
              Read our mission &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
