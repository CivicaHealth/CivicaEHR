'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Button, Input, Label, Textarea, FormError } from '@civica/ui';
import { requestAppointmentAction, type PortalActionState } from '@/server/actions/portal-actions';

const initialState: PortalActionState = {};

export function AppointmentRequestForm() {
  const [state, formAction, pending] = useActionState(requestAppointmentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <FormError message={state.error} />
      <div>
        <Label htmlFor="appt-reason">Reason for visit</Label>
        <Textarea id="appt-reason" name="reason" rows={2} required maxLength={255} />
      </div>
      <div>
        <Label htmlFor="appt-date">Preferred date (optional)</Label>
        <Input id="appt-date" name="preferredDate" type="date" />
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {pending ? 'Submitting...' : 'Request appointment'}
        </Button>
      </div>
    </form>
  );
}
