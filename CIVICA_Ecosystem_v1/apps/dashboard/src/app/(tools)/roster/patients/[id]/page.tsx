import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { eq, asc } from 'drizzle-orm';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId } from '@civica/db/tenant/connection';
import { pods } from '@civica/db/tenant/schema';
import { canAccessTool, canEditRoster } from '@civica/permissions';
import { Card, CardTitle, Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { getToolBySlug } from '@/lib/tools/registry';
import { getPatientDetail } from '@/server/queries/roster-queries';
import { ReassignPatientForm } from '@/components/tools/roster/reassign-patient-form';
import { RemovePatientButton } from '@/components/tools/roster/remove-patient-button';

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const membership = await getEffectiveMembership(user);

  const tool = await getToolBySlug('roster');
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

  const canEdit = canEditRoster(user, membership);
  const tenantDb = await getTenantDbByClinicId(membership.clinicId);

  const patient = await getPatientDetail(tenantDb, id);
  if (!patient) {
    redirect('/roster');
  }

  const podOptions = await tenantDb.query.pods.findMany({
    where: eq(pods.rosterDayId, patient.rosterDayId),
    orderBy: asc(pods.sortOrder),
  });

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo href="/dashboard" />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Link href="/roster" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[#256e73]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to roster
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{patient.name}</CardTitle>
          {canEdit && <RemovePatientButton patientId={patient.id} />}
        </div>

        <Card className="p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">PRN</dt>
              <dd className="mt-1 text-[var(--navy)]">{patient.prn}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Appointment time</dt>
              <dd className="mt-1 text-[var(--navy)]">{patient.appointmentTime}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <CardTitle>Pod</CardTitle>
          <p className="mt-2 text-sm text-[var(--navy)]">
            {patient.pod ? (
              <Link href={`/roster/pods/${patient.pod.id}`} className="text-[var(--accent)] hover:underline">
                {patient.pod.name}
              </Link>
            ) : (
              'Unassigned'
            )}
          </p>

          {patient.pod && patient.pod.assignments.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Pod staff</h3>
              <ul className="mt-1 space-y-1">
                {patient.pod.assignments.map((assignment) => (
                  <li key={assignment.id} className="text-sm text-[var(--navy)]">
                    {assignment.person.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canEdit && (
            <div className="mt-4">
              <ReassignPatientForm patientId={patient.id} currentPodId={patient.podId} pods={podOptions} />
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
