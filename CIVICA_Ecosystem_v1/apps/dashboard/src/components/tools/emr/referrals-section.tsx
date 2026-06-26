'use client';

import { useActionState, useRef } from 'react';
import { saveReferralAction } from '@/server/actions/emr/emr-referral-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { EmrReferral } from '@civica/db/tenant/schema';
import { Input, Label, Select, Textarea, Badge, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';
import { Panel, PanelRow, PanelEmpty, PanelRowActions } from './panel';
import { AddToggle } from './add-toggle';

const initialState: EmrActionState = {};

const STATUS_VARIANT = {
  pending: 'neutral',
  sent: 'accent',
  completed: 'success',
  cancelled: 'danger',
} as const;

export function ReferralsSection({
  emrPatientId,
  referrals,
  canEdit,
}: {
  emrPatientId: string;
  referrals: EmrReferral[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(saveReferralAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <Panel title="Referrals">
      {referrals.length > 0 ? (
        referrals.map((referral) => <ReferralRow key={referral.id} referral={referral} canEdit={canEdit} />)
      ) : (
        <PanelEmpty>No referrals.</PanelEmpty>
      )}

      {canEdit && (
        <AddToggle label="+ Add referral">
          <form ref={formRef} action={formAction} className="space-y-2">
            <input type="hidden" name="emrPatientId" value={emrPatientId} />
            <FormError message={state.error} />
            <div>
              <Label htmlFor="specialistName">Specialist name</Label>
              <Input id="specialistName" name="specialistName" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Input id="specialty" name="specialty" />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue="pending">
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" name="reason" rows={2} />
            </div>
            <SubmitButton variant="secondary" className="text-xs">
              Save
            </SubmitButton>
          </form>
        </AddToggle>
      )}
    </Panel>
  );
}

function ReferralRow({ referral, canEdit }: { referral: EmrReferral; canEdit: boolean }) {
  const [state, formAction] = useActionState(saveReferralAction, initialState);

  return (
    <PanelRow>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-medium text-[var(--navy)]">{referral.specialistName}</span>
        <Badge variant={STATUS_VARIANT[referral.status]} className="text-[10px]">
          {referral.status}
        </Badge>
      </div>
      {referral.specialty ? <div className="text-xs text-[var(--text-secondary)]">{referral.specialty}</div> : null}
      {canEdit && (
        <PanelRowActions>
          <details className="w-full">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--accent)]">Edit status</summary>
            <form action={formAction} className="mt-2 flex items-end gap-2">
              <input type="hidden" name="emrPatientId" value={referral.emrPatientId} />
              <input type="hidden" name="referralId" value={referral.id} />
              <input type="hidden" name="specialistName" value={referral.specialistName} />
              <input type="hidden" name="specialty" value={referral.specialty ?? ''} />
              <input type="hidden" name="reason" value={referral.reason ?? ''} />
              <FormError message={state.error} />
              <Select name="status" defaultValue={referral.status} className="text-xs">
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs">
                Save
              </SubmitButton>
            </form>
          </details>
        </PanelRowActions>
      )}
    </PanelRow>
  );
}
