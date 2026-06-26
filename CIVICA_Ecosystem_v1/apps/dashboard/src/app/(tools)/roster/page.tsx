import { redirect } from 'next/navigation';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId } from '@civica/db/tenant/connection';
import { canAccessTool, canEditRoster } from '@civica/permissions';
import { Card, CardTitle, CardDescription, Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { getToolBySlug } from '@/lib/tools/registry';
import { getTodaysRoster, getPeopleList } from '@/server/queries/roster-queries';
import { StartNewDayButton } from '@/components/tools/roster/start-new-day-button';
import { PreceptorsSection } from '@/components/tools/roster/preceptors-section';
import { PodCard } from '@/components/tools/roster/pod-card';
import { CreatePodForm } from '@/components/tools/roster/create-pod-form';
import { PatientsTable } from '@/components/tools/roster/patients-table';
import { AddPatientForm } from '@/components/tools/roster/add-patient-form';
import { PeopleSection } from '@/components/tools/roster/people-section';

export default async function RosterPage() {
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
  if (!allowed) {
    redirect('/dashboard');
  }

  if (!membership) {
    redirect('/dashboard');
  }

  const canEdit = canEditRoster(user, membership);
  const tenantDb = await getTenantDbByClinicId(membership.clinicId);

  const [roster, people] = await Promise.all([getTodaysRoster(tenantDb), getPeopleList(tenantDb)]);
  const podOptions = roster.pods.map((pod) => ({ id: pod.id, name: pod.name }));

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo href="/dashboard" />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Today&apos;s roster</CardTitle>
            <CardDescription>{roster.rosterDay.rosterDate}</CardDescription>
          </div>
          {canEdit && <StartNewDayButton />}
        </div>

        <PreceptorsSection preceptors={roster.preceptors} people={people} canEdit={canEdit} />

        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Pods</CardTitle>
          </div>
          {roster.pods.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roster.pods.map((pod) => (
                <PodCard key={pod.id} pod={pod} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">No pods yet.</p>
          )}
          {canEdit && (
            <div className="mt-4">
              <CreatePodForm />
            </div>
          )}
        </Card>

        <Card className="p-6">
          <CardTitle>Today&apos;s patients</CardTitle>
          <div className="mt-4">
            <PatientsTable patients={roster.patients} />
          </div>
          {canEdit && (
            <div className="mt-4">
              <AddPatientForm pods={podOptions} />
            </div>
          )}
        </Card>

        <PeopleSection people={people} canEdit={canEdit} />
      </main>
    </div>
  );
}
