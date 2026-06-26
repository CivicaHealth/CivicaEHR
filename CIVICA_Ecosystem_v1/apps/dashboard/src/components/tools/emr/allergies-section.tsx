'use client';

import { useActionState, useRef } from 'react';
import { addAllergyAction, removeAllergyAction } from '@/server/actions/emr/emr-allergy-problem-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { EmrAllergy } from '@civica/db/tenant/schema';
import { Input, Label, Select, Badge, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';
import { Panel, PanelRow, PanelEmpty, PanelRowActions } from './panel';
import { AddToggle } from './add-toggle';

const initialState: EmrActionState = {};

const SEVERITY_VARIANT = {
  mild: 'neutral',
  moderate: 'warning',
  severe: 'danger',
} as const;

export function AllergiesSection({
  emrPatientId,
  allergies,
  canEdit,
}: {
  emrPatientId: string;
  allergies: EmrAllergy[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(addAllergyAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <Panel title="Allergies">
      {allergies.length > 0 ? (
        allergies.map((allergy) => (
          <PanelRow key={allergy.id}>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium text-[var(--navy)]">{allergy.allergen}</span>
              {allergy.severity ? (
                <Badge variant={SEVERITY_VARIANT[allergy.severity]} className="text-[10px]">
                  {allergy.severity}
                </Badge>
              ) : null}
            </div>
            {allergy.reaction ? <div className="text-xs text-[var(--text-secondary)]">{allergy.reaction}</div> : null}
            {canEdit && (
              <PanelRowActions>
                <form
                  action={async (formData) => {
                    await removeAllergyAction(formData);
                  }}
                >
                  <input type="hidden" name="allergyId" value={allergy.id} />
                  <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs">
                    Delete
                  </SubmitButton>
                </form>
              </PanelRowActions>
            )}
          </PanelRow>
        ))
      ) : (
        <PanelEmpty>No known allergies.</PanelEmpty>
      )}

      {canEdit && (
        <AddToggle label="+ Add allergy">
          <form ref={formRef} action={formAction} className="space-y-2">
            <input type="hidden" name="emrPatientId" value={emrPatientId} />
            <FormError message={state.error} />
            <div>
              <Label htmlFor="allergen">Allergen</Label>
              <Input id="allergen" name="allergen" placeholder="e.g. Penicillin" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="reaction">Reaction</Label>
                <Input id="reaction" name="reaction" placeholder="e.g. Hives" />
              </div>
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select id="severity" name="severity" defaultValue="">
                  <option value="">Unknown</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </Select>
              </div>
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
