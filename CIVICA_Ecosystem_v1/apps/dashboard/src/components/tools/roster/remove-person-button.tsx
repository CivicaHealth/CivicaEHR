'use client';

import { useActionState } from 'react';
import { removePersonAction } from '@/server/actions/roster/roster-people-actions';
import type { RosterActionState } from '@/server/actions/roster/roster-day-actions';
import { SubmitButton } from './submit-button';

const initialState: RosterActionState = {};

export function RemovePersonButton({ personId }: { personId: string }) {
  const [state, formAction] = useActionState(removePersonAction, initialState);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="personId" value={personId} />
      <SubmitButton variant="ghost" className="px-2 py-1 text-xs">
        Remove
      </SubmitButton>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
    </form>
  );
}
