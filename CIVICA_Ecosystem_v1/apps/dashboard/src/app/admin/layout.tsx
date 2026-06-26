import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { requireAdminAccess } from '@/lib/admin/access';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { clinicId } = await requireAdminAccess();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Logo href="/dashboard" />
            {clinicId === null ? (
              <nav className="flex items-center gap-4">
                <Link
                  href="/admin/clinics"
                  className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--navy)]"
                >
                  Clinics
                </Link>
                <Link
                  href="/admin"
                  className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--navy)]"
                >
                  Users
                </Link>
                <Link
                  href="/admin/settings"
                  className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--navy)]"
                >
                  Settings
                </Link>
              </nav>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--navy)]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Dashboard
              </Link>
            )}
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
