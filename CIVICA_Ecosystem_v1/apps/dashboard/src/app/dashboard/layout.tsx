import { redirect } from 'next/navigation';
import { Building2, Eye } from 'lucide-react';
import { getCurrentUser, getEffectiveMembership, getPatientLink } from '@civica/auth';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { ExitClinicViewButton } from '@/components/dashboard/exit-clinic-view-button';
import { Logo } from '@civica/ui';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (user.isPlatformAdmin && !user.viewingClinicId) {
    redirect('/admin/clinics');
  }

  // Patients are not staff and must never see the dashboard tool grid.
  const patientLink = await getPatientLink(user.id);
  if (patientLink) {
    redirect('/patient-portal');
  }

  const membership = await getEffectiveMembership(user);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {user.viewingClinicId && membership && (
        <div className="flex items-center justify-center gap-2 bg-[var(--navy)] px-4 py-2 text-center text-xs font-medium text-white">
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          Viewing as admin of {membership.clinicName}
          <ExitClinicViewButton />
        </div>
      )}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Logo href="/dashboard" />
            {membership && (
              <span className="hidden items-center gap-1.5 rounded-full bg-[var(--accent-light)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] sm:inline-flex">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                {membership.clinicName}
              </span>
            )}
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
