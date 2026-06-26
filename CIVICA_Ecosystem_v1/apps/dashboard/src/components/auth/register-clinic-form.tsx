'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerClinicAction, type RegisterClinicActionState } from '@/server/actions/auth-actions';
import { Button, Input, Label, FormError, PasswordInput } from '@civica/ui';

const initialState: RegisterClinicActionState = {};

export function RegisterClinicForm() {
  const [state, formAction, pending] = useActionState(registerClinicAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-4 text-sm text-[var(--text-secondary)]">
        <p className="text-[var(--navy)]">
          Thanks! Your clinic registration has been submitted for review. A Civica platform
          admin will verify the details and activate your clinic.
        </p>
        <p>You&apos;ll be able to sign in once your clinic is approved.</p>
        <Link href="/login" className="font-medium text-[var(--accent)] underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <div>
        <Label htmlFor="clinicName">Clinic name</Label>
        <Input id="clinicName" name="clinicName" type="text" required />
      </div>

      <div>
        <Label htmlFor="clinicCode">Clinic code</Label>
        <Input id="clinicCode" name="clinicCode" type="text" required minLength={6} />
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Choose a code your staff will use to register under this clinic.
        </p>
      </div>

      <div>
        <Label htmlFor="headSupervisor">Head supervisor</Label>
        <Input id="headSupervisor" name="headSupervisor" type="text" required />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" type="text" required />
      </div>

      <div>
        <Label htmlFor="affiliatedInstitution">Affiliated institution (optional)</Label>
        <Input id="affiliatedInstitution" name="affiliatedInstitution" type="text" />
      </div>

      <div className="border-t border-[var(--border)] pt-4">
        <p className="mb-3 text-sm font-medium text-[var(--navy)]">Your admin account</p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" type="text" autoComplete="name" required />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" name="password" autoComplete="new-password" required />
          </div>
        </div>
      </div>

      <Button type="submit" loading={pending} className="w-full">
        {pending ? 'Submitting...' : 'Submit clinic for review'}
      </Button>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Joining an existing clinic?{' '}
        <Link href="/register" className="font-medium text-[var(--accent)] underline">
          Register with a clinic code
        </Link>
      </p>
    </form>
  );
}
