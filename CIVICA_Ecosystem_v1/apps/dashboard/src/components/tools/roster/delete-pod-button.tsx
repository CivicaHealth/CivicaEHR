'use client';

import { useState } from 'react';
import { deletePodAction } from '@/server/actions/roster/roster-pods-actions';
import { Button } from '@civica/ui';
import { SubmitButton } from './submit-button';

export function DeletePodButton({ podId }: { podId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="ghost" onClick={() => setConfirming(true)}>
        Delete pod
      </Button>
    );
  }

  return (
    <form
      action={async () => {
        await deletePodAction(podId);
      }}
      className="flex items-center gap-2"
    >
      <span className="text-sm text-[var(--text-secondary)]">Delete this pod and unassign its staff/patients?</span>
      <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
      <SubmitButton variant="primary">Confirm</SubmitButton>
    </form>
  );
}
