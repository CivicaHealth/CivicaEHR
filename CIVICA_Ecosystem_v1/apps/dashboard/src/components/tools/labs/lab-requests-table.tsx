'use client';

import { useActionState, useState } from 'react';
import { updateLabRequestStatusAction } from '@/server/actions/labs/labs-actions';
import type { LabsActionState } from '@/server/actions/labs/labs-shared';
import type { LabRequestWithPatient } from '@/server/queries/labs-queries';
import { Badge, Button, FormError, Textarea } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';

const STATUS_VARIANT = {
  ordered: 'neutral',
  placed: 'accent',
  completed: 'success',
  cancelled: 'danger',
} as const;

const STATUS_LABEL: Record<string, string> = {
  ordered: 'Ordered',
  placed: 'Placed',
  completed: 'Completed',
  cancelled: 'Rejected',
};

function groupByPatient(labRequests: LabRequestWithPatient[]) {
  const groups: { patient: LabRequestWithPatient['patient']; requests: LabRequestWithPatient[] }[] = [];
  for (const labRequest of labRequests) {
    let group = groups.find((g) => g.patient.id === labRequest.patient.id);
    if (!group) {
      group = { patient: labRequest.patient, requests: [] };
      groups.push(group);
    }
    group.requests.push(labRequest);
  }
  return groups;
}

export function LabRequestsTable({
  labRequests,
  canEdit,
}: {
  labRequests: LabRequestWithPatient[];
  canEdit: boolean;
}) {
  if (labRequests.length === 0) {
    return <div className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">No lab requests found.</div>;
  }

  const groups = groupByPatient(labRequests);

  return (
    <div>
      {groups.map((group) => (
        <div key={group.patient.id} className="border-b border-[var(--border)] last:border-b-0">
          <div className="bg-[var(--bg)] px-4 py-2">
            <span className="text-sm font-semibold text-[var(--navy)]">
              {group.patient.lastName}, {group.patient.firstName}
            </span>
          </div>
          {group.requests.map((labRequest) => (
            <LabRequestRow key={labRequest.id} labRequest={labRequest} canEdit={canEdit} />
          ))}
        </div>
      ))}
    </div>
  );
}

const initialState: LabsActionState = {};

function LabRequestRow({ labRequest, canEdit }: { labRequest: LabRequestWithPatient; canEdit: boolean }) {
  const [state, formAction] = useActionState(updateLabRequestStatusAction, initialState);
  const [completing, setCompleting] = useState(false);

  return (
    <div className="flex flex-col gap-2 border-b border-[var(--border)] px-4 py-2.5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-medium text-[var(--navy)]">{labRequest.testName}</span>
          <Badge variant={STATUS_VARIANT[labRequest.status]}>{STATUS_LABEL[labRequest.status]}</Badge>
          <Badge variant="neutral" className="text-[10px] capitalize">
            {labRequest.category}
          </Badge>
        </div>
        {labRequest.notes && <div className="text-xs text-[var(--text-secondary)]">{labRequest.notes}</div>}
        <div className="text-xs text-[var(--text-secondary)]">
          <div>Ordered {new Date(labRequest.orderedAt).toLocaleDateString()}</div>
          {labRequest.placedAt ? <div>Placed {new Date(labRequest.placedAt).toLocaleDateString()}</div> : null}
          {labRequest.resultAt ? <div>Resulted {new Date(labRequest.resultAt).toLocaleDateString()}</div> : null}
          {labRequest.result ? <div className="mt-1">{labRequest.result}</div> : null}
        </div>
      </div>

      {canEdit && (labRequest.status === 'ordered' || labRequest.status === 'placed') && (
        <div className="flex flex-col gap-2 sm:w-56 sm:flex-shrink-0">
          <FormError message={state.error} />

          {labRequest.status === 'ordered' && (
            <div className="flex gap-2">
              <form action={formAction} className="flex-1">
                <input type="hidden" name="labRequestId" value={labRequest.id} />
                <input type="hidden" name="status" value="placed" />
                <SubmitButton variant="secondary" className="w-full text-xs">
                  Mark placed
                </SubmitButton>
              </form>
              <form action={formAction} className="flex-1">
                <input type="hidden" name="labRequestId" value={labRequest.id} />
                <input type="hidden" name="status" value="cancelled" />
                <SubmitButton variant="secondary" className="w-full text-xs">
                  Reject
                </SubmitButton>
              </form>
            </div>
          )}

          {labRequest.status === 'placed' &&
            (completing ? (
              <form action={formAction} className="flex flex-col gap-1.5">
                <input type="hidden" name="labRequestId" value={labRequest.id} />
                <input type="hidden" name="status" value="completed" />
                <Textarea name="result" rows={2} placeholder="Result" required className="text-xs" />
                <SubmitButton variant="secondary" className="text-xs">
                  Save result
                </SubmitButton>
              </form>
            ) : (
              <div className="flex gap-2">
                <Button type="button" variant="secondary" className="flex-1 text-xs" onClick={() => setCompleting(true)}>
                  Mark completed
                </Button>
                <form action={formAction} className="flex-1">
                  <input type="hidden" name="labRequestId" value={labRequest.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <SubmitButton variant="secondary" className="w-full text-xs">
                    Reject
                  </SubmitButton>
                </form>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
