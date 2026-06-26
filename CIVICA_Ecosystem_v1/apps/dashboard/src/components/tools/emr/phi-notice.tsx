import { ShieldCheck } from 'lucide-react';

export function PhiNotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--accent)]" aria-hidden="true" />
      <p>
        This page contains Protected Health Information (PHI). Access is logged and audited. Do not share, screenshot,
        or copy this information outside of approved clinical workflows.
      </p>
    </div>
  );
}
