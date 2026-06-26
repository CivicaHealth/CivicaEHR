'use client';

import { useActionState, useRef } from 'react';
import { addPatientAction } from '@/server/actions/roster/roster-patients-actions';
import type { RosterActionState } from '@/server/actions/roster/roster-day-actions';
import { Input, FormError } from '@civica/ui';
import { SubmitButton } from './submit-button';
import { useResetOnSuccess } from './use-reset-on-success';

interface AddPatientFormProps {
  pods: { id: string; name: string }[];
}

const initialState: RosterActionState = {};

export function AddPatientForm({ pods }: AddPatientFormProps) {
  const [state, formAction] = useActionState(addPatientAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <FormError message={state.error} />
      <div className="w-28">
        <Input name="prn" placeholder="PRN" required aria-label="PRN" />
      </div>
      <div className="min-w-[10rem] flex-1">
        <Input name="name" placeholder="Patient name" required aria-label="Patient name" />
      </div>
      <div className="w-32">
        <Input name="appointmentTime" type="time" required aria-label="Appointment time" />
      </div>
      <select
        name="podId"
        defaultValue=""
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--navy)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25"
        aria-label="Pod"
      >
        <option value="">Unassigned</option>
        {pods.map((pod) => (
          <option key={pod.id} value={pod.id}>
            {pod.name}
          </option>
        ))}
      </select>
      <SubmitButton variant="secondary">Add patient</SubmitButton>
    </form>
  );
}
