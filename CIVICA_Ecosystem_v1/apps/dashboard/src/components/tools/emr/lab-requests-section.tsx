'use client';

import Link from 'next/link';
import { useActionState, useRef } from 'react';
import { createLabRequestAction } from '@/server/actions/labs/labs-actions';
import type { LabsActionState } from '@/server/actions/labs/labs-shared';
import type { EmrLabRequest, EmrLabTestType } from '@civica/db/tenant/schema';
import { Select, Label, Textarea, Badge, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';
import { Panel, PanelRow, PanelEmpty } from './panel';
import { AddToggle } from './add-toggle';

const initialState: LabsActionState = {};

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
  cancelled: 'Cancelled',
};

export function LabRequestsSection({
  emrPatientId,
  labRequests,
  labTestTypes,
  canEdit,
}: {
  emrPatientId: string;
  labRequests: EmrLabRequest[];
  labTestTypes: EmrLabTestType[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(createLabRequestAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <Panel title="Lab requests">
      {labRequests.length > 0 ? (
        labRequests.map((labRequest) => <LabRequestRow key={labRequest.id} labRequest={labRequest} />)
      ) : (
        <PanelEmpty>No lab requests.</PanelEmpty>
      )}

      {canEdit && (
        <AddToggle label="+ Order lab">
          <form ref={formRef} action={formAction} className="space-y-2">
            <input type="hidden" name="emrPatientId" value={emrPatientId} />
            <FormError message={state.error} />
            <div>
              <Label htmlFor="testName">Test</Label>
              <Select id="testName" name="testName" required defaultValue="">
                <option value="" disabled>
                  Select a test
                </option>
                {labTestTypes.map((testType) => (
                  <option key={testType.id} value={testType.name}>
                    {testType.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" required defaultValue="general">
                <option value="general">General</option>
                <option value="gynecology">Gynecology</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <SubmitButton variant="secondary" className="text-xs">
              Order
            </SubmitButton>
          </form>
        </AddToggle>
      )}
    </Panel>
  );
}

function LabRequestRow({ labRequest }: { labRequest: EmrLabRequest }) {
  return (
    <PanelRow>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-medium text-[var(--navy)]">{labRequest.testName}</span>
        <Badge variant={STATUS_VARIANT[labRequest.status]} className="text-[10px]">
          {STATUS_LABEL[labRequest.status]}
        </Badge>
        <Badge variant="neutral" className="text-[10px] capitalize">
          {labRequest.category}
        </Badge>
        {labRequest.status === 'completed' && (
          <Link href={`/labs/review/${labRequest.id}`} className="text-[10px] font-medium text-[var(--accent)]">
            Open in Labs →
          </Link>
        )}
      </div>
      <div className="text-xs text-[var(--text-secondary)]">
        Ordered {new Date(labRequest.orderedAt).toLocaleDateString()}
        {labRequest.placedAt ? ` · Placed ${new Date(labRequest.placedAt).toLocaleDateString()}` : ''}
        {labRequest.resultAt ? ` · Resulted ${new Date(labRequest.resultAt).toLocaleDateString()}` : ''}
        {labRequest.reviewedAt ? ` · Reviewed ${new Date(labRequest.reviewedAt).toLocaleDateString()}` : ''}
      </div>
      {labRequest.result ? <div className="text-xs text-[var(--text-secondary)]">{labRequest.result}</div> : null}
      {labRequest.doctorNote ? (
        <div className="text-xs text-[var(--navy)]">
          <span className="font-semibold">Doctor&apos;s note:</span> {labRequest.doctorNote}
        </div>
      ) : null}
    </PanelRow>
  );
}
