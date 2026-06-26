import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId } from '@civica/db/tenant/connection';
import { canAccessTool, canEditEmr } from '@civica/permissions';
import { Card, CardTitle, CardDescription, Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { getToolBySlug } from '@/lib/tools/registry';
import { getEmrPatients, getEmrDashboardStats } from '@/server/queries/emr-queries';
import { EmrPatientsTable } from '@/components/tools/emr/emr-patients-table';
import { AddEmrPatientForm } from '@/components/tools/emr/add-emr-patient-form';
import { DashboardStats } from '@/components/tools/emr/dashboard-stats';
import { PhiNotice } from '@/components/tools/emr/phi-notice';
import { AddToggle } from '@/components/tools/emr/add-toggle';

export default async function EmrPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const membership = await getEffectiveMembership(user);

  const tool = await getToolBySlug('emr');
  if (!tool) {
    redirect('/dashboard');
  }

  const allowed = canAccessTool(user, membership, {
    enabled: tool.enabled,
    slug: tool.slug,
    requiredRoles: tool.requiredRoles,
  });
  if (!allowed || !membership) {
    redirect('/dashboard');
  }

  const canEdit = canEditEmr(user, membership);
  const tenantDb = await getTenantDbByClinicId(membership.clinicId);

  const [patients, stats] = await Promise.all([getEmrPatients(tenantDb), getEmrDashboardStats(tenantDb)]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo href="/dashboard" />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>Electronic Medical Records</CardTitle>
            <CardDescription>Patient charts for {membership.clinicName}</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/emr/appointments"
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--slate)] hover:bg-[var(--bg)]"
            >
              Appointments
            </Link>
            <div className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              {patients.length} {patients.length === 1 ? 'patient' : 'patients'}
            </div>
          </div>
        </div>

        <PhiNotice />

        <DashboardStats {...stats} />

        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-6 py-4">
            <CardTitle>Patients</CardTitle>
            {canEdit && (
              <AddToggle label="+ Add patient">
                <AddEmrPatientForm />
              </AddToggle>
            )}
          </div>
          <div className="p-6">
            <EmrPatientsTable patients={patients} />
          </div>
        </Card>
      </main>
    </div>
  );
}
