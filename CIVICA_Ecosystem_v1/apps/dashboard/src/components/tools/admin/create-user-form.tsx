'use client';

import { useActionState, useState, useEffect } from 'react';
import { Button, Input, Label, FormError } from '@civica/ui';
import { createUserByAdminAction, type CreateUserActionState } from '@/server/actions/admin-actions';
import { useRouter } from 'next/navigation';

interface Clinic {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
}

interface CreateUserButtonProps {
  clinics: Clinic[];
  roles: Role[];
  canAssignClinicAdmin: boolean;
}

const INITIAL: CreateUserActionState = {};

export function CreateUserButton({ clinics, roles, canAssignClinicAdmin }: CreateUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createUserByAdminAction, INITIAL);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.newUserId) {
      router.push(`/admin/users/${state.newUserId}`);
    }
  }, [state, router]);

  const assignableRoles = roles.filter((r) => {
    if (r.name === 'platform_admin') return false;
    if (r.name === 'clinic_admin' && !canAssignClinicAdmin) return false;
    return true;
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--navy)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
      >
        <span className="text-base leading-none">+</span>
        Create account
      </button>

      {open && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--navy)]">Create account</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--navy)]"
            >
              ✕
            </button>
          </div>

          <form action={action} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cu-name">Full name</Label>
                <Input id="cu-name" name="name" placeholder="Jane Smith" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu-email">Email</Label>
                <Input id="cu-email" name="email" type="email" placeholder="jane@clinic.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu-password">Temporary password</Label>
                <Input id="cu-password" name="password" type="password" placeholder="Min 10 chars, letter + digit" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu-clinic">Clinic</Label>
                <select
                  id="cu-clinic"
                  name="clinicId"
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="">Select clinic…</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu-role">Role</Label>
                <select
                  id="cu-role"
                  name="roleId"
                  required
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="">Select role…</option>
                  {assignableRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cu-status">Membership status</Label>
                <select
                  id="cu-status"
                  name="membershipStatus"
                  defaultValue="active"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="active">Active (can log in immediately)</option>
                  <option value="pending">Pending (needs admin approval)</option>
                </select>
              </div>
            </div>

            {state.error && <FormError message={state.error} />}

            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? 'Creating…' : 'Create account'}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
