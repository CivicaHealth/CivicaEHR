'use client';

import { useActionState } from 'react';
import { reviewLabRequestAction } from '@/server/actions/labs/labs-actions';
import type { LabsActionState } from '@/server/actions/labs/labs-shared';
import { Label, Textarea, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';

const initialState: LabsActionState = {};

export function LabReviewForm({
  labRequestId,
  doctorNote,
  reviewedAt,
  canEdit,
}: {
  labRequestId: string;
  doctorNote: string;
  reviewedAt: Date | null;
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(reviewLabRequestAction, initialState);

  if (reviewedAt) {
    return (
      <div className="space-y-1.5 rounded border border-[var(--border)] bg-[var(--bg)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Reviewed {new Date(reviewedAt).toLocaleString()}
        </p>
        <p className="whitespace-pre-wrap text-sm text-[var(--navy)]">{doctorNote}</p>
      </div>
    );
  }

  if (!canEdit) {
    return <p className="text-sm text-[var(--text-secondary)]">You do not have permission to review this lab.</p>;
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="labRequestId" value={labRequestId} />
      <FormError message={state.error} />
      <div>
        <Label htmlFor="doctorNote">Doctor&apos;s note</Label>
        <Textarea id="doctorNote" name="doctorNote" rows={5} required placeholder="Review findings, follow-up plan, etc." />
      </div>
      <SubmitButton variant="primary" className="text-xs">
        Mark reviewed
      </SubmitButton>
    </form>
  );
}
