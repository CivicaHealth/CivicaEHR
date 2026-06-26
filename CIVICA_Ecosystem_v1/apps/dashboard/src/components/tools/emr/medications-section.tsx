'use client';

import { useActionState, useRef } from 'react';
import { addMedicationAction, removeMedicationAction } from '@/server/actions/emr/emr-diagnosis-medication-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { EmrMedication } from '@civica/db/tenant/schema';
import { Input, Label, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';
import { AddToggle } from './add-toggle';

const initialState: EmrActionState = {};

export function MedicationsSection({
  encounterId,
  medications,
  canEdit,
}: {
  encounterId: string;
  medications: EmrMedication[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(addMedicationAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <div className="border-t border-[var(--border)] px-4 py-2.5">
      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
        Medications
        {canEdit && (
          <AddToggle label="+ Add">
            <form ref={formRef} action={formAction} className="space-y-2">
              <input type="hidden" name="encounterId" value={encounterId} />
              <FormError message={state.error} />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor={`name-${encounterId}`}>Name</Label>
                  <Input id={`name-${encounterId}`} name="name" required />
                </div>
                <div>
                  <Label htmlFor={`dosage-${encounterId}`}>Dosage</Label>
                  <Input id={`dosage-${encounterId}`} name="dosage" />
                </div>
                <div>
                  <Label htmlFor={`instructions-${encounterId}`}>Instructions</Label>
                  <Input id={`instructions-${encounterId}`} name="instructions" />
                </div>
              </div>
              <SubmitButton variant="secondary" className="text-xs">
                Save
              </SubmitButton>
            </form>
          </AddToggle>
        )}
      </div>
      {medications.length > 0 ? (
        <div className="space-y-1">
          {medications.map((medication) => (
            <div key={medication.id} className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[var(--navy)]">{medication.name}</span>
              {medication.dosage ? (
                <span className="rounded border border-[var(--border)] bg-[var(--bg)] px-1 font-mono text-[11px] text-[var(--muted)]">
                  {medication.dosage}
                </span>
              ) : null}
              {medication.instructions ? (
                <span className="text-xs text-[var(--text-secondary)]">{medication.instructions}</span>
              ) : null}
              {canEdit && (
                <form
                  action={async (formData) => {
                    await removeMedicationAction(formData);
                  }}
                  className="ml-auto"
                >
                  <input type="hidden" name="medicationId" value={medication.id} />
                  <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs">
                    ×
                  </SubmitButton>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : (
        <span className="text-xs text-[var(--muted)]">None recorded.</span>
      )}
    </div>
  );
}
