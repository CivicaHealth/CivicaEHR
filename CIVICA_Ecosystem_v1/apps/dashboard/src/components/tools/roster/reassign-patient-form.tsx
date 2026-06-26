'use client';

import { useActionState } from 'react';
import { reassignPatientAction } from '@/server/actions/roster/roster-patients-actions';
import type { RosterActionState } from '@/server/actions/roster/roster-day-actions';
import { FormError } from '@civica/ui';
import { SubmitButton } from './submit-button';

interface ReassignPatientFormProps {
  patientId: string;
  currentPodId: string | null;
  pods: { id: string; name: string }[];
}

const initialState: RosterActionState = {};

export function ReassignPatientForm({ patientId, currentPodId, pods }: ReassignPatientFormProps) {
  const [state, formAction] = useActionState(reassignPatientAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <FormError message={state.error} />
      <input type="hidden" name="patientId" value={patientId} />
      <select
        name="podId"
        defaultValue={currentPodId ?? ''}
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
      <SubmitButton variant="secondary">Move</SubmitButton>
    </form>
  );
}
