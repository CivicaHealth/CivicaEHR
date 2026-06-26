'use client';

import Link from 'next/link';
import { updateAppointmentStatusAction, deleteAppointmentAction } from '@/server/actions/emr/emr-appointment-actions';
import type { EmrAppointmentWithPatient } from '@/server/queries/emr-queries';
import { Badge, Select } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { AddToggle } from './add-toggle';
import { AppointmentForm } from './appointment-form';

const STATUS_VARIANT = {
  scheduled: 'accent',
  arrived: 'success',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'warning',
} as const;

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  arrived: 'Arrived',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const STATUS_OPTIONS = Object.entries(STATUS_LABEL);

export function AppointmentsTable({
  appointments,
  patients,
  canEdit,
}: {
  appointments: EmrAppointmentWithPatient[];
  patients: { id: string; firstName: string; lastName: string }[];
  canEdit: boolean;
}) {
  if (appointments.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">No appointments found.</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
            <th className="px-4 py-2 font-semibold">Date & time</th>
            <th className="px-4 py-2 font-semibold">Patient</th>
            <th className="px-4 py-2 font-semibold">Reason</th>
            <th className="px-4 py-2 font-semibold">Duration</th>
            <th className="px-4 py-2 font-semibold">Status</th>
            {canEdit && <th className="px-4 py-2 font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => {
            const date = new Date(appt.appointmentDate);
            return (
              <tr key={appt.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="whitespace-nowrap px-4 py-2 align-top">
                  <div className="font-mono text-xs">{date.toLocaleDateString()}</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-4 py-2 align-top">
                  <Link href={`/emr/patients/${appt.patient.id}`} className="font-medium text-[var(--navy)] hover:text-[var(--accent)]">
                    {appt.patient.lastName}, {appt.patient.firstName}
                  </Link>
                </td>
                <td className="px-4 py-2 align-top">{appt.reason}</td>
                <td className="px-4 py-2 align-top text-xs text-[var(--text-secondary)]">
                  {appt.durationMinutes < 60 ? `${appt.durationMinutes} min` : `${(appt.durationMinutes / 60).toFixed(appt.durationMinutes % 60 === 0 ? 0 : 1)} hr`}
                </td>
                <td className="px-4 py-2 align-top">
                  <Badge variant={STATUS_VARIANT[appt.status]}>{STATUS_LABEL[appt.status]}</Badge>
                </td>
                {canEdit && (
                  <td className="px-4 py-2 align-top">
                    <div className="flex flex-col gap-2">
                      <form
                        action={async (formData) => {
                          await updateAppointmentStatusAction(formData);
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <input type="hidden" name="appointmentId" value={appt.id} />
                        <Select name="status" defaultValue={appt.status} className="py-1 text-xs">
                          {STATUS_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </Select>
                        <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs">
                          Set
                        </SubmitButton>
                      </form>
                      <AddToggle label="Edit">
                        <AppointmentForm appointment={appt} patients={patients} />
                      </AddToggle>
                      <form
                        action={async (formData) => {
                          await deleteAppointmentAction(formData);
                        }}
                      >
                        <input type="hidden" name="appointmentId" value={appt.id} />
                        <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs text-rose-600 hover:text-rose-700">
                          Delete
                        </SubmitButton>
                      </form>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
