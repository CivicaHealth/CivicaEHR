'use client';

import { useActionState } from 'react';
import { markPreceptorPresentAction } from '@/server/actions/roster/roster-people-actions';
import type { RosterActionState } from '@/server/actions/roster/roster-day-actions';
import { FormError } from '@civica/ui';
import { SubmitButton } from './submit-button';

interface MarkPreceptorFormProps {
  availablePreceptors: { id: string; name: string }[];
}

const initialState: RosterActionState = {};

export function MarkPreceptorForm({ availablePreceptors }: MarkPreceptorFormProps) {
  const [state, formAction] = useActionState(markPreceptorPresentAction, initialState);

  if (availablePreceptors.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">All known preceptors are marked present.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <FormError message={state.error} />
      <select
        name="personId"
        required
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--navy)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25"
        aria-label="Preceptor"
      >
        {availablePreceptors.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>
      <SubmitButton variant="secondary">Mark present</SubmitButton>
    </form>
  );
}
