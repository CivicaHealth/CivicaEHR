import type { Metadata } from "next";
import Link from "next/link";
import { APP_LOGIN_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mission",
  description:
    "Civica Health's mission is to give clinics, student-run clinics, and free clinics secure, modern operational infrastructure.",
  alternates: { canonical: "/mission" },
};

const PILLARS = [
  {
    title: "Lower the barrier to good infrastructure",
    body:
      "Many student-run and free clinics run on spreadsheets, shared logins, and paper rosters. Civica Health exists to give those teams the same caliber of secure infrastructure that larger health systems take for granted.",
  },
  {
    title: "Security-conscious by default",
    body:
      "Every tool we build starts from the same foundation: server-side sessions, role-based access control, and audit logging — designed for HIPAA-aligned operations from day one.",
  },
  {
    title: "Built for the people who show up",
    body:
      "Volunteers rotate. Shifts change. Roles shift between doctor, front desk, and inventory week to week. Our access model is designed around that reality, not around a static org chart.",
  },
];

export default function MissionPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <span className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
        Our mission
      </span>
      <h1 className="mt-3 text-3xl font-bold text-[var(--navy)] sm:text-4xl">
        Patient-care infrastructure shouldn&apos;t be a luxury.
      </h1>
      <p className="mt-6 text-lg text-[var(--text-secondary)]">
        Civica Health builds the operational backbone clinics need to run safely and
        efficiently — from staff login and roles, to records, rosters, and patient
        follow-up — so that care teams of any size can spend less time on
        infrastructure and more time on patients.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-1">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md sm:p-8"
          >
            <h2 className="text-xl font-semibold text-[var(--navy)]">{pillar.title}</h2>
            <p className="mt-3 text-[var(--text-secondary)]">{pillar.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-[var(--border)] bg-[var(--accent-light)] p-8 text-center">
        <h2 className="text-xl font-semibold text-[var(--navy)]">
          Currently designed for healthcare operations teams of any size
        </h2>
        <p className="mt-3 text-[var(--text-secondary)]">
          From single-room free clinics to multi-site student-run organizations, Civica
          Health adapts to how your clinic actually runs.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={APP_LOGIN_URL}
            className="rounded-full bg-[var(--accent)] px-8 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-[var(--navy)]"
          >
            Launch Civica App
          </a>
          <Link
            href="/contact"
            className="text-base font-semibold text-[var(--accent)] hover:text-[var(--navy)]"
          >
            Get in touch &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
