import { Card, CardTitle } from '@civica/ui';
import { requirePatientContext } from '@/lib/portal/context';
import { getPortalPatient } from '@/server/queries/portal-queries';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="text-right font-medium text-[var(--navy)]">{value || '—'}</span>
    </div>
  );
}

export default async function PatientPortalProfilePage() {
  const { user, link, tenantDb } = await requirePatientContext();
  const patient = await getPortalPatient(tenantDb, link.emrPatientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--navy)]">My profile</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Your details on file. To correct anything here, message your care team.
        </p>
      </div>

      <Card>
        <CardTitle className="mb-2 text-base">Demographics</CardTitle>
        <div className="divide-y divide-[var(--border)]">
          {patient ? (
            <>
              <Field label="Name" value={`${patient.firstName} ${patient.lastName}`} />
              <Field label="Date of birth" value={formatDate(patient.dateOfBirth)} />
              <Field label="Sex" value={patient.sex} />
              <Field label="Phone" value={patient.phone ?? ''} />
              <Field label="Email" value={patient.email ?? ''} />
              <Field label="Address" value={patient.address ?? ''} />
            </>
          ) : (
            <p className="py-2 text-sm text-[var(--text-secondary)]">No chart found.</p>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-2 text-base">Account</CardTitle>
        <div className="divide-y divide-[var(--border)]">
          <Field label="Sign-in email" value={user.email} />
          <Field label="Name on account" value={user.name} />
        </div>
      </Card>
    </div>
  );
}
