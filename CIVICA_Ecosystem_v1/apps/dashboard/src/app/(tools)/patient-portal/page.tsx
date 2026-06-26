import Link from 'next/link';
import { CalendarDays, MessageSquare, FileText } from 'lucide-react';
import { Card, CardTitle } from '@civica/ui';
import { requirePatientContext } from '@/lib/portal/context';
import { getPortalPatient, getPortalOverview } from '@/server/queries/portal-queries';

function formatDateTime(value: Date): string {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function PatientPortalOverviewPage() {
  const { link, tenantDb } = await requirePatientContext();
  const [patient, overview] = await Promise.all([
    getPortalPatient(tenantDb, link.emrPatientId),
    getPortalOverview(tenantDb, link.emrPatientId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--navy)]">
          Welcome{patient ? `, ${patient.firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Your appointments, records, and messages with your care team.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/patient-portal/messages">
          <Card className="flex items-center gap-3 transition-shadow hover:shadow-md">
            <MessageSquare className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
            <div>
              <p className="text-2xl font-semibold text-[var(--navy)]">{overview.unreadMessages}</p>
              <p className="text-xs text-[var(--text-secondary)]">Unread messages</p>
            </div>
          </Card>
        </Link>
        <Link href="/patient-portal/records">
          <Card className="flex items-center gap-3 transition-shadow hover:shadow-md">
            <FileText className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
            <div>
              <p className="text-2xl font-semibold text-[var(--navy)]">{overview.recentShared.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Recent shared visits</p>
            </div>
          </Card>
        </Link>
        <Link href="/patient-portal/requests">
          <Card className="flex items-center gap-3 transition-shadow hover:shadow-md">
            <CalendarDays className="h-6 w-6 text-[var(--accent)]" aria-hidden="true" />
            <div>
              <p className="text-2xl font-semibold text-[var(--navy)]">{overview.upcomingAppointments.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">Upcoming appointments</p>
            </div>
          </Card>
        </Link>
      </div>

      <Card>
        <CardTitle className="mb-3 text-base">Upcoming appointments</CardTitle>
        {overview.upcomingAppointments.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No upcoming appointments.{' '}
            <Link href="/patient-portal/requests" className="font-medium text-[var(--accent)] underline">
              Request one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {overview.upcomingAppointments.map((appt) => (
              <li key={appt.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-[var(--navy)]">{appt.reason}</span>
                <span className="text-[var(--text-secondary)]">{formatDateTime(appt.appointmentDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-3 text-base">Recently shared visits</CardTitle>
        {overview.recentShared.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Your care team hasn&apos;t shared any visit summaries yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {overview.recentShared.map((enc) => (
              <li key={enc.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-[var(--navy)]">{enc.reasonForVisit}</span>
                <span className="text-[var(--text-secondary)]">{formatDateTime(enc.encounterDate)}</span>
              </li>
            ))}
          </ul>
        )}
        {overview.recentShared.length > 0 && (
          <Link
            href="/patient-portal/records"
            className="mt-3 inline-block text-sm font-medium text-[var(--accent)] underline"
          >
            View all records
          </Link>
        )}
      </Card>
    </div>
  );
}
