'use client';

import { useActionState, useState, useEffect } from 'react';
import { Button, Input, Label, FormError } from '@civica/ui';
import { createClinicByAdminAction, type CreateClinicActionState } from '@/server/actions/admin-actions';
import { useRouter } from 'next/navigation';

const INITIAL: CreateClinicActionState = {};

function CreateClinicPanel({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(createClinicByAdminAction, INITIAL);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state, router]);

  if (state.success) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--navy)]">
          Clinic created and active — its tenant database is ready. Use &quot;Create account&quot; to add
          a clinic_admin, or staff can self-register with the registration code you set.
        </p>
        <Button type="button" variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cc-name">Clinic name</Label>
          <Input id="cc-name" name="clinicName" placeholder="Springfield Free Clinic" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cc-code">Registration code</Label>
          <Input id="cc-code" name="clinicCode" placeholder="Min 6 characters" minLength={6} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cc-supervisor">Head supervisor</Label>
          <Input id="cc-supervisor" name="headSupervisor" placeholder="Dr. Jane Smith" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cc-location">Location</Label>
          <Input id="cc-location" name="location" placeholder="Springfield, IL" required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="cc-institution">Affiliated institution (optional)</Label>
          <Input id="cc-institution" name="affiliatedInstitution" placeholder="State University School of Medicine" />
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">
        The clinic is created active immediately and its tenant database is provisioned right away
        — staff can join with the registration code above as soon as you create an account for them.
      </p>

      {state.error && <FormError message={state.error} />}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? 'Creating…' : 'Create clinic'}
      </Button>
    </form>
  );
}

export function CreateClinicButton() {
  const [open, setOpen] = useState(false);
  // Bumped every time the panel re-opens, forcing CreateClinicPanel to
  // remount so a stale success/error state from a previous open doesn't
  // carry over.
  const [instance, setInstance] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!open) setInstance((n) => n + 1);
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--navy)] transition-colors hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
      >
        <span className="text-base leading-none">+</span>
        Create clinic
      </button>

      {open && (
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--navy)]">Create clinic</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--navy)]"
            >
              ✕
            </button>
          </div>

          <CreateClinicPanel key={instance} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
