'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerPatientAction, type AuthActionState } from '@/server/actions/auth-actions';
import { Button, Input, Label, FormError, PasswordInput } from '@civica/ui';

const initialState: AuthActionState = {};

export function PatientRegisterForm() {
  const [state, formAction, pending] = useActionState(registerPatientAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <div>
        <Label htmlFor="enrollmentCode">Enrollment code</Label>
        <Input id="enrollmentCode" name="enrollmentCode" type="text" required />
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          The code your clinic gave you (looks like PT-XXXX-XXXX).
        </p>
      </div>

      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" type="text" autoComplete="name" required />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Use the email your clinic has on file for you.
        </p>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required />
      </div>

      <Button type="submit" loading={pending} className="w-full">
        {pending ? 'Creating account...' : 'Create patient account'}
      </Button>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[var(--accent)] underline">
          Sign in
        </Link>
      </p>
      <p className="text-center text-sm text-[var(--text-secondary)]">
        Clinic staff?{' '}
        <Link href="/register" className="font-medium text-[var(--accent)] underline">
          Register as a staff member
        </Link>
      </p>
    </form>
  );
}
