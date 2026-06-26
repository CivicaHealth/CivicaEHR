'use client';

import { useState, type ReactNode } from 'react';

export function AddToggle({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded px-1.5 py-0.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-light)]"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="border-b border-[var(--border)] p-3">
      {children}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--navy)]"
      >
        Cancel
      </button>
    </div>
  );
}
