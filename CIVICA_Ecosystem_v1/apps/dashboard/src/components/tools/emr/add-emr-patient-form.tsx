'use client';

import { useActionState, useRef } from 'react';
import { createEmrPatientAction } from '@/server/actions/emr/emr-patient-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import { Input, Label, Select, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';

const initialState: EmrActionState = {};

export function AddEmrPatientForm() {
  const [state, formAction] = useActionState(createEmrPatientAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <FormError message={state.error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" name="lastName" required />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
        </div>
        <div>
          <Label htmlFor="sex">Sex</Label>
          <Select id="sex" name="sex" required defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" />
        </div>
      </div>
      <SubmitButton variant="secondary">Add patient</SubmitButton>
    </form>
  );
}
