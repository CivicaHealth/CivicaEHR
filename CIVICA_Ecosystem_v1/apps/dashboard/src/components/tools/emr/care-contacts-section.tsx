'use client';

import { useActionState, useRef } from 'react';
import { addCareContactAction, removeCareContactAction } from '@/server/actions/emr/emr-portal-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { EmrPatientContact } from '@civica/db/tenant/schema';
import { Input, Label, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';
import { Panel, PanelRow, PanelEmpty, PanelRowActions } from './panel';
import { AddToggle } from './add-toggle';

const initialState: EmrActionState = {};

export function CareContactsSection({
  emrPatientId,
  contacts,
  canEdit,
}: {
  emrPatientId: string;
  contacts: EmrPatientContact[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(addCareContactAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <Panel title="Care contacts (portal notifications)">
      {contacts.length > 0 ? (
        contacts.map((c) => (
          <PanelRow key={c.id}>
            <div className="text-sm font-medium text-[var(--navy)]">{c.email}</div>
            {c.label ? <div className="text-xs text-[var(--text-secondary)]">{c.label}</div> : null}
            {canEdit && (
              <PanelRowActions>
                <form
                  action={async (formData) => {
                    await removeCareContactAction(formData);
                  }}
                >
                  <input type="hidden" name="contactId" value={c.id} />
                  <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs">
                    Remove
                  </SubmitButton>
                </form>
              </PanelRowActions>
            )}
          </PanelRow>
        ))
      ) : (
        <PanelEmpty>No care contacts. Add emails to notify of new patient messages.</PanelEmpty>
      )}

      {canEdit && (
        <AddToggle label="+ Add contact">
          <form ref={formRef} action={formAction} className="space-y-2">
            <input type="hidden" name="emrPatientId" value={emrPatientId} />
            <FormError message={state.error} />
            <div>
              <Label htmlFor="contact-email">Email</Label>
              <Input id="contact-email" name="email" type="email" placeholder="responsible@example.com" required />
            </div>
            <div>
              <Label htmlFor="contact-label">Label (optional)</Label>
              <Input id="contact-label" name="label" placeholder="e.g. Primary nurse" />
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
