'use client';

import { useActionState } from 'react';
import { generateEnrollmentCodeAction, type EnrollmentCodeState } from '@/server/actions/emr/emr-portal-actions';
import type { PortalStatus } from '@/server/queries/emr-portal-queries';
import { Badge, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { Panel } from './panel';

const initialState: EnrollmentCodeState = {};

export function EnrollmentCodePanel({
  emrPatientId,
  status,
  canEdit,
}: {
  emrPatientId: string;
  status: PortalStatus;
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(generateEnrollmentCodeAction, initialState);

  return (
    <Panel title="Portal access">
      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--text-secondary)]">Status:</span>
          {status.linked ? (
            <Badge variant="success">Linked</Badge>
          ) : status.pendingEnrollment ? (
            <Badge variant="warning">Code issued</Badge>
          ) : (
            <Badge variant="neutral">Not enrolled</Badge>
          )}
        </div>

        {status.linked && status.linkedUserEmail && (
          <p className="text-xs text-[var(--text-secondary)]">
            Patient account: <span className="font-medium text-[var(--navy)]">{status.linkedUserEmail}</span>
          </p>
        )}

        {state.code && (
          <div className="rounded-md border border-[var(--accent)] bg-[var(--accent-light)] p-3">
            <p className="text-xs text-[var(--text-secondary)]">
              Give this enrollment code to the patient. It is shown once.
            </p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wider text-[var(--navy)]">{state.code}</p>
          </div>
        )}

        {!status.linked && canEdit && (
          <form action={formAction} className="space-y-2">
            <input type="hidden" name="emrPatientId" value={emrPatientId} />
            <FormError message={state.error} />
            <SubmitButton variant="secondary" className="text-xs">
              {status.pendingEnrollment ? 'Generate a new code' : 'Generate enrollment code'}
            </SubmitButton>
          </form>
        )}
      </div>
    </Panel>
  );
}
