'use client';

import { unassignStaffAction } from '@/server/actions/roster/roster-pods-actions';
import { SubmitButton } from './submit-button';

export function UnassignStaffButton({ assignmentId }: { assignmentId: string }) {
  return (
    <form
      action={async () => {
        await unassignStaffAction(assignmentId);
      }}
    >
      <SubmitButton variant="ghost" className="px-2 py-1 text-xs">
        Remove
      </SubmitButton>
    </form>
  );
}
