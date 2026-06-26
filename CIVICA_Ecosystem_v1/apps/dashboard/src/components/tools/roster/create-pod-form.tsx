'use client';

import { useActionState, useRef } from 'react';
import { createPodAction } from '@/server/actions/roster/roster-pods-actions';
import type { RosterActionState } from '@/server/actions/roster/roster-day-actions';
import { Input, FormError } from '@civica/ui';
import { SubmitButton } from './submit-button';
import { useResetOnSuccess } from './use-reset-on-success';

const initialState: RosterActionState = {};

export function CreatePodForm() {
  const [state, formAction] = useActionState(createPodAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
      <FormError message={state.error} />
      <div className="min-w-[10rem] flex-1">
        <Input name="name" placeholder="Pod name" required aria-label="Pod name" />
      </div>
      <SubmitButton variant="secondary">New pod</SubmitButton>
    </form>
  );
}
