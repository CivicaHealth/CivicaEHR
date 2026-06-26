import Link from "next/link";
import { Logo } from "./logo";
import { APP_LOGIN_URL } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-[var(--text-secondary)]">
              Software infrastructure for clinics.
            </p>
          </div>
          <div className="flex gap-10">
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-[var(--navy)]">Site</span>
              <Link href="/mission" className="text-[var(--text-secondary)] hover:text-[var(--navy)]">
                Mission
              </Link>
              <Link href="/newsletter" className="text-[var(--text-secondary)] hover:text-[var(--navy)]">
                Newsletter
              </Link>
              <Link href="/contact" className="text-[var(--text-secondary)] hover:text-[var(--navy)]">
                Contact
              </Link>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-[var(--navy)]">Platform</span>
              <a href={APP_LOGIN_URL} className="text-[var(--text-secondary)] hover:text-[var(--navy)]">
                Launch app
              </a>
              <Link href="/security" className="text-[var(--text-secondary)] hover:text-[var(--navy)]">
                Security
              </Link>
              <Link href="/privacy" className="text-[var(--text-secondary)] hover:text-[var(--navy)]">
                Privacy
              </Link>
              <Link href="/terms" className="text-[var(--text-secondary)] hover:text-[var(--navy)]">
                Terms
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-10 text-xs text-[var(--muted)]">
          &copy; {new Date().getFullYear()} Civica Health. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
