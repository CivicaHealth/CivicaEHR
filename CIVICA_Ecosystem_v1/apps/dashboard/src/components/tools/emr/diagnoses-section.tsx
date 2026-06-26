'use client';

import { useActionState, useRef } from 'react';
import { addDiagnosisAction, removeDiagnosisAction } from '@/server/actions/emr/emr-diagnosis-medication-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { EmrDiagnosis } from '@civica/db/tenant/schema';
import { Input, Label, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';
import { AddToggle } from './add-toggle';

const initialState: EmrActionState = {};

export function DiagnosesSection({
  encounterId,
  diagnoses,
  canEdit,
}: {
  encounterId: string;
  diagnoses: EmrDiagnosis[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(addDiagnosisAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <div className="border-t border-[var(--border)] px-4 py-2.5">
      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
        Diagnoses
        {canEdit && (
          <AddToggle label="+ Add">
            <form ref={formRef} action={formAction} className="space-y-2">
              <input type="hidden" name="encounterId" value={encounterId} />
              <FormError message={state.error} />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor={`icd10Code-${encounterId}`}>ICD-10</Label>
                  <Input id={`icd10Code-${encounterId}`} name="icd10Code" required />
                </div>
                <div className="col-span-2">
                  <Label htmlFor={`description-${encounterId}`}>Description</Label>
                  <Input id={`description-${encounterId}`} name="description" required />
                </div>
              </div>
              <SubmitButton variant="secondary" className="text-xs">
                Save
              </SubmitButton>
            </form>
          </AddToggle>
        )}
      </div>
      {diagnoses.length > 0 ? (
        <div className="space-y-1">
          {diagnoses.map((diagnosis) => (
            <div key={diagnosis.id} className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-[var(--border)] bg-[var(--bg)] px-1 font-mono text-[11px] text-[var(--muted)]">
                {diagnosis.icd10Code}
              </span>
              <span className="text-sm text-[var(--navy)]">{diagnosis.description}</span>
              {canEdit && (
                <form
                  action={async (formData) => {
                    await removeDiagnosisAction(formData);
                  }}
                  className="ml-auto"
                >
                  <input type="hidden" name="diagnosisId" value={diagnosis.id} />
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
