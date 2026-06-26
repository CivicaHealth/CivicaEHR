'use client';

import { useActionState, useRef } from 'react';
import { createEncounterAction } from '@/server/actions/emr/emr-encounter-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import { Input, Label, Textarea, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';

const initialState: EmrActionState = {};

export function NewEncounterForm({ emrPatientId }: { emrPatientId: string }) {
  const [state, formAction] = useActionState(createEncounterAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  const now = new Date();
  const defaultDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="emrPatientId" value={emrPatientId} />
      <FormError message={state.error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="encounterDate">Date / time</Label>
          <Input id="encounterDate" name="encounterDate" type="datetime-local" required defaultValue={defaultDate} />
        </div>
        <div>
          <Label htmlFor="reasonForVisit">Reason for visit</Label>
          <Input id="reasonForVisit" name="reasonForVisit" required />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Vitals</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <Label htmlFor="ne-bloodPressure">BP (mmHg)</Label>
            <Input id="ne-bloodPressure" name="bloodPressure" placeholder="120/80" />
          </div>
          <div>
            <Label htmlFor="ne-heartRate">HR (bpm)</Label>
            <Input id="ne-heartRate" name="heartRate" type="number" placeholder="72" />
          </div>
          <div>
            <Label htmlFor="ne-temperature">Temp (°F)</Label>
            <Input id="ne-temperature" name="temperature" placeholder="98.6" />
          </div>
          <div>
            <Label htmlFor="ne-respiratoryRate">RR (/min)</Label>
            <Input id="ne-respiratoryRate" name="respiratoryRate" type="number" placeholder="16" />
          </div>
          <div>
            <Label htmlFor="ne-oxygenSaturation">SpO2 (%)</Label>
            <Input id="ne-oxygenSaturation" name="oxygenSaturation" type="number" placeholder="98" />
          </div>
          <div>
            <Label htmlFor="ne-weightKg">Weight (kg)</Label>
            <Input id="ne-weightKg" name="weightKg" placeholder="70" />
          </div>
          <div>
            <Label htmlFor="ne-heightCm">Height (cm)</Label>
            <Input id="ne-heightCm" name="heightCm" placeholder="170" />
          </div>
        </div>
      </div>

      <SubmitButton variant="secondary">New encounter</SubmitButton>
    </form>
  );
}
