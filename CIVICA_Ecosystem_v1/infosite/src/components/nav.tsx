import Link from "next/link";
import { Logo } from "./logo";
import { APP_LOGIN_URL } from "@/lib/site";

const LINKS = [
  { href: "/mission", label: "Mission" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/contact", label: "Contact us" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--navy)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 md:gap-4">
          <nav className="flex items-center gap-4 md:hidden">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--navy)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <a
            href={APP_LOGIN_URL}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--navy)]"
          >
            Launch App
          </a>
        </div>
      </div>
    </header>
  );
}
