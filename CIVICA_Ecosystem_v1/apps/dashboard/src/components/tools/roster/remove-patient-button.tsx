'use client';

import { removePatientAction } from '@/server/actions/roster/roster-patients-actions';
import { SubmitButton } from './submit-button';

export function RemovePatientButton({ patientId }: { patientId: string }) {
  return (
    <form
      action={async () => {
        await removePatientAction(patientId);
      }}
    >
      <SubmitButton variant="ghost" className="px-2 py-1 text-xs">
        Remove patient
      </SubmitButton>
    </form>
  );
}
