'use client';

import { useActionState, useState } from 'react';
import { startNewDayAction, type RosterActionState } from '@/server/actions/roster/roster-day-actions';
import { Button, FormError } from '@civica/ui';
import { SubmitButton } from './submit-button';

const initialState: RosterActionState = {};

export function StartNewDayButton() {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction] = useActionState(startNewDayAction, initialState);

  if (!confirming) {
    return (
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        Start new day
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <FormError message={state.error} />
      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--text-secondary)]">
          Reset pods, patients &amp; cleanup for a new day?
        </span>
        <input type="hidden" name="confirm" value="true" />
        <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
        <SubmitButton variant="primary">Confirm</SubmitButton>
      </div>
    </form>
  );
}
