'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction, type AuthActionState } from '@/server/actions/auth-actions';
import { Button, Input, Label, FormError, PasswordInput } from '@civica/ui';

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>

      <Button type="submit" loading={pending} className="w-full">
        {pending ? 'Signing in...' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        Need an account?{' '}
        <Link href="/register" className="font-medium text-[var(--accent)] underline">
          Register
        </Link>
      </p>
      <p className="text-center text-sm text-[var(--text-secondary)]">
        Registering a new clinic?{' '}
        <Link href="/register-clinic" className="font-medium text-[var(--accent)] underline">
          Register your clinic
        </Link>
      </p>
    </form>
  );
}
