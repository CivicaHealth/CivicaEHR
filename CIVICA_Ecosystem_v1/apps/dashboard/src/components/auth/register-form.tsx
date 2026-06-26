'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerAction, type AuthActionState } from '@/server/actions/auth-actions';
import { Button, Input, Label, FormError, PasswordInput } from '@civica/ui';

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

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

      <div>
        <Label htmlFor="clinicCode">Clinic code</Label>
        <Input id="clinicCode" name="clinicCode" type="text" required />
        <p className="mt-1 text-xs text-[var(--text-secondary)]">Provided by your clinic administrator.</p>
      </div>

      <div>
        <Label htmlFor="requestedRole">I am joining as</Label>
        <select
          id="requestedRole"
          name="requestedRole"
          defaultValue="member"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--navy)]"
        >
          <option value="member">A staff member</option>
          <option value="clinic_admin">A clinic admin</option>
        </select>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Your account will need to be admitted by an existing admin before you can sign in.
        </p>
      </div>

      <Button type="submit" loading={pending} className="w-full">
        {pending ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[var(--accent)] underline">
          Sign in
        </Link>
      </p>
      <p className="text-center text-sm text-[var(--text-secondary)]">
        Registering a new clinic?{' '}
        <Link href="/register-clinic" className="font-medium text-[var(--accent)] underline">
          Register your clinic
        </Link>
      </p>
      <p className="text-center text-sm text-[var(--text-secondary)]">
        Are you a patient?{' '}
        <Link href="/register/patient" className="font-medium text-[var(--accent)] underline">
          Register with an enrollment code
        </Link>
      </p>
    </form>
  );
}
