import { redirect } from 'next/navigation';
import { Building2, MapPin, Users } from 'lucide-react';
import { listClinicsWithMemberCounts } from '@civica/db/control/clinics';
import { Card, CardTitle, CardDescription, Button } from '@civica/ui';
import { requireAdminAccess } from '@/lib/admin/access';
import { approveClinicAction, rejectClinicAction, enterClinicViewAction, deleteClinicAction } from '@/server/actions/admin-actions';
import { ConfirmDeleteForm } from '@/components/admin/confirm-delete-form';
import { CreateClinicButton } from '@/components/tools/admin/create-clinic-form';

const CLINIC_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

export default async function AdminClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{ approved?: string; rejected?: string; deleted?: string; clinicError?: string }>;
}) {
  const { clinicId } = await requireAdminAccess();
  if (clinicId !== null) {
    redirect('/admin');
  }

  const { approved, rejected, deleted, clinicError } = await searchParams;
  const clinics = await listClinicsWithMemberCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--navy)]">Clinics</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Review pending clinic registrations and switch into a clinic&apos;s dashboard.
          </p>
        </div>
        <CreateClinicButton />
      </div>

      {approved && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700"
        >
          Clinic approved.
        </div>
      )}
      {rejected && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700"
        >
          Clinic rejected.
        </div>
      )}
      {deleted && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700"
        >
          Clinic deleted.
        </div>
      )}
      {clinicError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          Couldn&apos;t find that pending clinic — it may have already been handled.
        </div>
      )}

      <div className="space-y-4">
        {clinics.map((clinic) => (
          <Card key={clinic.id} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{clinic.name}</CardTitle>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CLINIC_STATUS_STYLES[clinic.status]}`}>
                  {clinic.status}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-sm text-[var(--text-secondary)] sm:flex-row sm:flex-wrap sm:gap-4">
                {clinic.headSupervisor && (
                  <span className="inline-flex items-center gap-1.5">{clinic.headSupervisor}</span>
                )}
                {clinic.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {clinic.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  {clinic.memberCount} member{clinic.memberCount === 1 ? '' : 's'}
                </span>
              </div>
              {clinic.affiliatedInstitution && (
                <CardDescription className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  {clinic.affiliatedInstitution}
                </CardDescription>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2 sm:w-56">
              <div className="flex gap-2">
                {clinic.status === 'pending' && (
                  <>
                    <form action={rejectClinicAction.bind(null, clinic.id)}>
                      <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
                        Reject
                      </Button>
                    </form>
                    <form action={approveClinicAction.bind(null, clinic.id)}>
                      <Button type="submit" variant="primary" className="px-3 py-1.5 text-xs">
                        Approve
                      </Button>
                    </form>
                  </>
                )}
                {clinic.status === 'active' && (
                  <form action={enterClinicViewAction.bind(null, clinic.id)}>
                    <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
                      View dashboard
                    </Button>
                  </form>
                )}
              </div>
              <ConfirmDeleteForm
                action={deleteClinicAction}
                hiddenFields={{ clinicId: clinic.id }}
                confirmValue={clinic.name}
                confirmLabel={`Type "${clinic.name}" to permanently delete this clinic and all its memberships.`}
                triggerLabel="Delete clinic"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
