'use client';

import { useTransition } from 'react';
import { toggleCleanupAction } from '@/server/actions/roster/roster-pods-actions';

interface CleanupToggleProps {
  podId: string;
  field: 'roomCleaned' | 'cubicleCleaned';
  checked: boolean;
  disabled?: boolean;
  label: string;
}

export function CleanupToggle({ podId, field, checked, disabled = false, label }: CleanupToggleProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-sm text-[var(--navy)]">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled || isPending}
        onChange={(event) => {
          const value = event.target.checked;
          startTransition(() => {
            void toggleCleanupAction(podId, field, value);
          });
        }}
        className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
      />
      {label}
    </label>
  );
}
