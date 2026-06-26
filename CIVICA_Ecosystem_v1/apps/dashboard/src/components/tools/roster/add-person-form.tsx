'use client';

import { useActionState, useRef } from 'react';
import { addPersonAction } from '@/server/actions/roster/roster-people-actions';
import type { RosterActionState } from '@/server/actions/roster/roster-day-actions';
import { Input, FormError } from '@civica/ui';
import { SubmitButton } from './submit-button';
import { useResetOnSuccess } from './use-reset-on-success';
import { PERSON_ROLES, PERSON_ROLE_LABELS } from './roles';

const initialState: RosterActionState = {};

export function AddPersonForm() {
  const [state, formAction] = useActionState(addPersonAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <FormError message={state.error} />
      <div className="min-w-[10rem] flex-1">
        <Input name="name" placeholder="Name" required aria-label="Name" />
      </div>
      <select
        name="role"
        required
        defaultValue="med_student"
        className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--navy)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/25"
        aria-label="Role"
      >
        {PERSON_ROLES.map((role) => (
          <option key={role} value={role}>
            {PERSON_ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      <SubmitButton variant="secondary">Add person</SubmitButton>
    </form>
  );
}
