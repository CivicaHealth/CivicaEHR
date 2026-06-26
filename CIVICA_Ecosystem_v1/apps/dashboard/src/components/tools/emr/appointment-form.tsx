'use client';

import { useActionState, useRef } from 'react';
import { saveAppointmentAction } from '@/server/actions/emr/emr-appointment-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { EmrAppointment } from '@civica/db/tenant/schema';
import { Input, Label, Select, Textarea, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';

const initialState: EmrActionState = {};

const STATUS_OPTIONS = [
  ['scheduled', 'Scheduled'],
  ['arrived', 'Arrived'],
  ['in_progress', 'In Progress'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['no_show', 'No Show'],
] as const;

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AppointmentForm({
  patients,
  appointment,
  defaultPatientId,
}: {
  patients: { id: string; firstName: string; lastName: string }[];
  appointment?: EmrAppointment;
  defaultPatientId?: string;
}) {
  const [state, formAction] = useActionState(saveAppointmentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {appointment && <input type="hidden" name="appointmentId" value={appointment.id} />}
      <FormError message={state.error} />

      <div>
        <Label htmlFor={`patient-${appointment?.id ?? 'new'}`}>Patient</Label>
        <Select
          id={`patient-${appointment?.id ?? 'new'}`}
          name="emrPatientId"
          required
          defaultValue={appointment?.emrPatientId ?? defaultPatientId ?? ''}
          disabled={Boolean(appointment)}
        >
          <option value="" disabled>
            Select…
          </option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.lastName}, {patient.firstName}
            </option>
          ))}
        </Select>
        {appointment && <input type="hidden" name="emrPatientId" value={appointment.emrPatientId} />}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`date-${appointment?.id ?? 'new'}`}>Date & time</Label>
          <Input
            id={`date-${appointment?.id ?? 'new'}`}
            name="appointmentDate"
            type="datetime-local"
            required
            defaultValue={appointment ? toLocalInputValue(new Date(appointment.appointmentDate)) : ''}
          />
        </div>
        <div>
          <Label htmlFor={`duration-${appointment?.id ?? 'new'}`}>Duration</Label>
          <Select
            id={`duration-${appointment?.id ?? 'new'}`}
            name="durationMinutes"
            defaultValue={String(appointment?.durationMinutes ?? 30)}
          >
            <option value="10">10 min</option>
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 hr</option>
            <option value="90">1 hr 30 min</option>
            <option value="120">2 hrs</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor={`reason-${appointment?.id ?? 'new'}`}>Reason for visit</Label>
        <Input
          id={`reason-${appointment?.id ?? 'new'}`}
          name="reason"
          required
          defaultValue={appointment?.reason ?? ''}
          placeholder="e.g. Annual physical"
        />
      </div>

      <div>
        <Label htmlFor={`status-${appointment?.id ?? 'new'}`}>Status</Label>
        <Select id={`status-${appointment?.id ?? 'new'}`} name="status" defaultValue={appointment?.status ?? 'scheduled'}>
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor={`notes-${appointment?.id ?? 'new'}`}>Notes</Label>
        <Textarea id={`notes-${appointment?.id ?? 'new'}`} name="notes" rows={2} defaultValue={appointment?.notes ?? ''} />
      </div>

      <SubmitButton variant="secondary">{appointment ? 'Save changes' : 'Schedule appointment'}</SubmitButton>
    </form>
  );
}
