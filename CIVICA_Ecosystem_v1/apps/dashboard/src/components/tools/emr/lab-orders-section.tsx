'use client';

import { useActionState, useRef } from 'react';
import { saveLabOrderAction } from '@/server/actions/emr/emr-lab-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { EmrLabOrder } from '@civica/db/tenant/schema';
import { Input, Label, Select, Textarea, Badge, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';
import { AddToggle } from './add-toggle';

const initialState: EmrActionState = {};

const STATUS_VARIANT = {
  ordered: 'accent',
  completed: 'success',
  cancelled: 'neutral',
} as const;

export function LabOrdersSection({
  encounterId,
  labOrders,
  canEdit,
}: {
  encounterId: string;
  labOrders: EmrLabOrder[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(saveLabOrderAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  if (labOrders.length === 0 && !canEdit) return null;

  return (
    <div className="border-t border-[var(--border)] px-4 py-2.5">
      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
        Labs
        {canEdit && (
          <AddToggle label="+ Lab">
            <form ref={formRef} action={formAction} className="space-y-2">
              <input type="hidden" name="encounterId" value={encounterId} />
              <FormError message={state.error} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`testName-${encounterId}`}>Test name</Label>
                  <Input id={`testName-${encounterId}`} name="testName" required />
                </div>
                <div>
                  <Label htmlFor={`labStatus-${encounterId}`}>Status</Label>
                  <Select id={`labStatus-${encounterId}`} name="status" defaultValue="ordered">
                    <option value="ordered">Ordered</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor={`labResult-${encounterId}`}>Result</Label>
                <Textarea id={`labResult-${encounterId}`} name="result" rows={2} />
              </div>
              <SubmitButton variant="secondary" className="text-xs">
                Save
              </SubmitButton>
            </form>
          </AddToggle>
        )}
      </div>
      {labOrders.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {labOrders.map((lab) => (
            <Badge key={lab.id} variant={STATUS_VARIANT[lab.status]} title={lab.result || undefined}>
              {lab.testName}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
