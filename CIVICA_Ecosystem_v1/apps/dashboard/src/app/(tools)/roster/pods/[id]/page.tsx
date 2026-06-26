import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId } from '@civica/db/tenant/connection';
import { canAccessTool, canEditRoster } from '@civica/permissions';
import { Card, CardTitle, Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { getToolBySlug } from '@/lib/tools/registry';
import { getPodDetail, getPeopleList } from '@/server/queries/roster-queries';
import { AssignStaffForm } from '@/components/tools/roster/assign-staff-form';
import { UnassignStaffButton } from '@/components/tools/roster/unassign-staff-button';
import { RemovePatientButton } from '@/components/tools/roster/remove-patient-button';
import { CleanupToggle } from '@/components/tools/roster/cleanup-toggle';
import { DeletePodButton } from '@/components/tools/roster/delete-pod-button';

export default async function PodDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const [pod, people] = await Promise.all([getPodDetail(tenantDb, id), getPeopleList(tenantDb)]);
  if (!pod) {
    redirect('/roster');
  }

  const assignedPersonIds = new Set(pod.assignments.map((assignment) => assignment.personId));
  const availablePeople = Object.values(people)
    .flat()
    .filter((person) => !assignedPersonIds.has(person.id))
    .map((person) => ({ id: person.id, name: person.name, role: person.role }));

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
          <CardTitle>{pod.name}</CardTitle>
          {canEdit && <DeletePodButton podId={pod.id} />}
        </div>

        <Card className="p-6">
          <CardTitle>Cleanup</CardTitle>
          <div className="mt-3 flex flex-wrap gap-6">
            <CleanupToggle podId={pod.id} field="roomCleaned" checked={pod.roomCleaned} disabled={!canEdit} label="Room cleaned" />
            <CleanupToggle
              podId={pod.id}
              field="cubicleCleaned"
              checked={pod.cubicleCleaned}
              disabled={!canEdit}
              label="Cubicle cleaned"
            />
          </div>
        </Card>

        <Card className="p-6">
          <CardTitle>Staff</CardTitle>
          {pod.assignments.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {pod.assignments.map((assignment) => (
                <li key={assignment.id} className="flex items-center justify-between gap-2 text-sm text-[var(--navy)]">
                  <span>{assignment.person.name}</span>
                  {canEdit && <UnassignStaffButton assignmentId={assignment.id} />}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">No staff assigned.</p>
          )}
          {canEdit && (
            <div className="mt-4">
              <AssignStaffForm podId={pod.id} availablePeople={availablePeople} />
            </div>
          )}
        </Card>

        <Card className="p-6">
          <CardTitle>Patients</CardTitle>
          {pod.patients.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {pod.patients.map((patient) => (
                <li key={patient.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={`/roster/patients/${patient.id}`} className="text-[var(--accent)] hover:underline">
                    {patient.appointmentTime} &middot; {patient.prn} &middot; {patient.name}
                  </Link>
                  {canEdit && <RemovePatientButton patientId={patient.id} />}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">No patients assigned.</p>
          )}
        </Card>
      </main>
    </div>
  );
}
