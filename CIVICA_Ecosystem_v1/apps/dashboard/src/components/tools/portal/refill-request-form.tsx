'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Button, Input, Label, Select, FormError } from '@civica/ui';
import { requestRefillAction, type PortalActionState } from '@/server/actions/portal-actions';

const initialState: PortalActionState = {};

export interface RefillableMed {
  id: string;
  name: string;
  dosage: string | null;
}

export function RefillRequestForm({ medications }: { medications: RefillableMed[] }) {
  const [state, formAction, pending] = useActionState(requestRefillAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  if (medications.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        No medications are available for refill. Medications appear here once your care team shares the
        visit they were prescribed in.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <FormError message={state.error} />
      <div>
        <Label htmlFor="refill-med">Medication</Label>
        <Select id="refill-med" name="medicationId" required defaultValue="" className="w-full">
          <option value="" disabled>
            Select a medication
          </option>
          {medications.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.dosage ? ` — ${m.dosage}` : ''}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="refill-note">Note (optional)</Label>
        <Input id="refill-note" name="note" type="text" maxLength={255} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {pending ? 'Submitting...' : 'Request refill'}
        </Button>
      </div>
    </form>
  );
}
