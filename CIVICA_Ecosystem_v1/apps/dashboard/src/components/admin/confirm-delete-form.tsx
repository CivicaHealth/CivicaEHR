'use client';

import { useState } from 'react';
import { Button, Input } from '@civica/ui';

interface ConfirmDeleteFormProps {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string>;
  /** The exact string the admin must type, e.g. a clinic name or email. */
  confirmValue: string;
  confirmLabel: string;
  triggerLabel?: string;
  pendingLabel?: string;
}

/**
 * GitHub-style destructive-action guard: the action button stays disabled
 * until the admin types `confirmValue` exactly. This is a fat-finger guard
 * only -- the real check is server-side (the action re-derives the expected
 * value from the database row, never trusts what the client submits).
 */
export function ConfirmDeleteForm({
  action,
  hiddenFields,
  confirmValue,
  confirmLabel,
  triggerLabel = 'Delete',
  pendingLabel = 'Deleting…',
}: ConfirmDeleteFormProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false);
  const matches = typed === confirmValue;

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700"
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
    );
  }

  return (
    <form
      action={action}
      onSubmit={() => setPending(true)}
      className="flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3"
    >
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <p className="text-xs text-rose-700">{confirmLabel}</p>
      <Input
        name="confirmText"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        className="text-xs"
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          disabled={!matches || pending}
          className="bg-rose-600 px-3 py-1.5 text-xs hover:bg-rose-700"
        >
          {pending ? pendingLabel : triggerLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-xs"
          onClick={() => {
            setOpen(false);
            setTyped('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
