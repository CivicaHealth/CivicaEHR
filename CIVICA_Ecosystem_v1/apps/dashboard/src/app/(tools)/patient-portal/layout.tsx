import { Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { PortalNav } from '@/components/tools/portal/portal-nav';
import { requirePatientContext } from '@/lib/portal/context';

/**
 * Patient portal shell. Authoritatively gates the whole portal: only a
 * signed-in, linked patient gets past requirePatientContext() (which redirects
 * to /login otherwise). proxy.ts only checks cookie presence, so this is the
 * real boundary.
 */
export default async function PatientPortalLayout({ children }: { children: React.ReactNode }) {
  await requirePatientContext();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Logo href="/patient-portal" />
            <span className="hidden rounded-full bg-[var(--accent-light)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] sm:inline-flex">
              Patient Portal
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <PortalNav />
        <div className="pt-6">{children}</div>
      </main>
    </div>
  );
}
