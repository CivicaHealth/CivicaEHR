'use client';

import { useActionState } from 'react';
import { assignStaffAction } from '@/server/actions/roster/roster-pods-actions';
import type { RosterActionState } from '@/server/actions/roster/roster-day-actions';
import { FormError } from '@civica/ui';
import { SubmitButton } from './submit-button';

interface AssignStaffFormProps {
  podId: string;
  availablePeople: { id: string; name: string; role: string }[];
}

const initialState: RosterActionState = {};

export function AssignStaffForm({ podId, availablePeople }: AssignStaffFormProps) {
  const [state, formAction] = useActionState(assignStaffAction, initialState);

  if (availablePeople.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">No one left to assign.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <FormError message={state.error} />
      <input type="hidden" name="podId" value={podId} />
      <select
        name="personId"
        required
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--navy)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25"
        aria-label="Person"
      >
        {availablePeople.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>
      <SubmitButton variant="secondary">Add staff</SubmitButton>
    </form>
  );
}
