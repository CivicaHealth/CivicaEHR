'use client';

import { removePreceptorAction } from '@/server/actions/roster/roster-people-actions';
import { SubmitButton } from './submit-button';

export function RemovePreceptorButton({ preceptorId }: { preceptorId: string }) {
  return (
    <form
      action={async () => {
        await removePreceptorAction(preceptorId);
      }}
    >
      <SubmitButton variant="ghost" className="px-2 py-1 text-xs">
        Remove
      </SubmitButton>
    </form>
  );
}
