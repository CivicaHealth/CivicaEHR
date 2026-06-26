import { Card, CardTitle, Badge } from '@civica/ui';
import { requirePatientContext } from '@/lib/portal/context';
import { getPortalRequests } from '@/server/queries/portal-queries';
import { AppointmentRequestForm } from '@/components/tools/portal/appointment-request-form';
import { RefillRequestForm } from '@/components/tools/portal/refill-request-form';

function statusVariant(status: string): 'accent' | 'success' | 'danger' {
  if (status === 'approved') return 'success';
  if (status === 'declined') return 'danger';
  return 'accent';
}

function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function PatientPortalRequestsPage() {
  const { link, tenantDb } = await requirePatientContext();
  const { appointmentRequests, refillRequests, refillableMeds } = await getPortalRequests(
    tenantDb,
    link.emrPatientId,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--navy)]">Requests</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Ask your clinic for an appointment or a prescription refill. Staff review every request.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-3 text-base">Request an appointment</CardTitle>
          <AppointmentRequestForm />
        </Card>

        <Card>
          <CardTitle className="mb-3 text-base">Request a refill</CardTitle>
          <RefillRequestForm medications={refillableMeds} />
        </Card>
      </div>

      <Card>
        <CardTitle className="mb-3 text-base">Your appointment requests</CardTitle>
        {appointmentRequests.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No appointment requests yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {appointmentRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-[var(--navy)]">
                  {r.reason}
                  {r.preferredDate ? ` · prefers ${formatDate(r.preferredDate)}` : ''}
                </span>
                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-3 text-base">Your refill requests</CardTitle>
        {refillRequests.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No refill requests yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {refillRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-[var(--navy)]">{r.medication?.name ?? 'Medication'}</span>
                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
