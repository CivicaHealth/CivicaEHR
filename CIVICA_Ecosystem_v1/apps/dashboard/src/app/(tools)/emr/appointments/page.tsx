import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId } from '@civica/db/tenant/connection';
import { canAccessTool, canEditEmr } from '@civica/permissions';
import { Card, CardTitle, CardDescription, Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { getToolBySlug } from '@/lib/tools/registry';
import { getEmrAppointments, getEmrAppointmentCounts, getEmrPatients } from '@/server/queries/emr-queries';
import { AppointmentsTable } from '@/components/tools/emr/appointments-table';
import { AppointmentForm } from '@/components/tools/emr/appointment-form';
import { AppointmentCalendar } from '@/components/tools/emr/appointment-calendar';
import { PhiNotice } from '@/components/tools/emr/phi-notice';
import { AddToggle } from '@/components/tools/emr/add-toggle';
import type { EmrAppointment } from '@civica/db/tenant/schema';

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no_show', label: 'No Show' },
];

export default async function EmrAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string }>;
}) {
  const { status, date } = await searchParams;

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

  const statusFilter = status as EmrAppointment['status'] | undefined;
  const [appointments, counts, patients] = await Promise.all([
    getEmrAppointments(tenantDb, { status: statusFilter, date }),
    getEmrAppointmentCounts(tenantDb),
    getEmrPatients(tenantDb),
  ]);

  const queryFor = (tabKey: string) => {
    const params = new URLSearchParams();
    if (tabKey) params.set('status', tabKey);
    if (date) params.set('date', date);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo href="/dashboard" />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Link href="/emr" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[#256e73]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to EMR
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>Appointments</CardTitle>
            <CardDescription>{appointments.length} appointment{appointments.length === 1 ? '' : 's'} shown</CardDescription>
          </div>
          <form method="get" className="flex items-center gap-2">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <label htmlFor="date" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Date
            </label>
            <input
              id="date"
              type="date"
              name="date"
              defaultValue={date ?? ''}
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--navy)]"
            />
            <button type="submit" className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--slate)] hover:bg-[var(--bg)]">
              Filter
            </button>
            {date ? (
              <Link href={`/emr/appointments${queryFor(status ?? '')}`} className="text-sm font-medium text-[var(--accent)]">
                Clear
              </Link>
            ) : null}
          </form>
        </div>

        <PhiNotice />

        <AppointmentCalendar patients={patients} canEdit={canEdit} />

        <div className="flex flex-wrap gap-1 border-b border-[var(--border)]">
          {STATUS_TABS.map((tab) => {
            const active = (status ?? '') === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/emr/appointments${queryFor(tab.key)}`}
                className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
                  active
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--navy)]'
                }`}
              >
                {tab.label}
                <span className="rounded-full bg-[var(--bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                  {counts[tab.key || 'all'] ?? 0}
                </span>
              </Link>
            );
          })}
        </div>

        {canEdit && (
          <Card className="p-4">
            <AddToggle label="+ New appointment">
              <AppointmentForm patients={patients} />
            </AddToggle>
          </Card>
        )}

        <Card className="overflow-hidden p-0">
          <AppointmentsTable appointments={appointments} patients={patients} canEdit={canEdit} />
        </Card>
      </main>
    </div>
  );
}
