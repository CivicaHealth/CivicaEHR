'use client';

import { useActionState } from 'react';
import { saveSoapNoteAction } from '@/server/actions/emr/emr-encounter-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { EmrSoapNote } from '@civica/db/tenant/schema';
import { Label, Textarea, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';

const initialState: EmrActionState = {};

const SECTIONS: { key: keyof EmrSoapNote; label: string }[] = [
  { key: 'subjective', label: 'S' },
  { key: 'objective', label: 'O' },
  { key: 'assessment', label: 'A' },
  { key: 'plan', label: 'P' },
];

export function hasSoapNote(soapNote: EmrSoapNote | null | undefined) {
  return !!soapNote && SECTIONS.some((s) => soapNote[s.key]);
}

function truncate(text: string, length = 120) {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

export function SoapPreview({ soapNote }: { soapNote: EmrSoapNote | null | undefined }) {
  if (!hasSoapNote(soapNote)) return null;
  return (
    <div className="border-t border-[var(--border)] px-4 py-2.5">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">SOAP Note</div>
      <div className="space-y-1">
        {SECTIONS.filter((s) => soapNote![s.key]).map((s) => (
          <div key={s.key} className="flex gap-2 text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
            <span className="w-3.5 shrink-0 pt-px text-[11px] font-bold text-[var(--muted)]">{s.label}</span>
            <span>{truncate(String(soapNote![s.key]))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SoapNoteForm({
  encounterId,
  soapNote,
  onClose,
}: {
  encounterId: string;
  soapNote: EmrSoapNote | null | undefined;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(saveSoapNoteAction, initialState);

  return (
    <div className="border-t border-[var(--border)] px-4 py-2.5">
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="encounterId" value={encounterId} />
        <FormError message={state.error} />
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label htmlFor={`subjective-${encounterId}`}>Subjective</Label>
            <Textarea id={`subjective-${encounterId}`} name="subjective" rows={3} defaultValue={soapNote?.subjective ?? ''} />
          </div>
          <div>
            <Label htmlFor={`objective-${encounterId}`}>Objective</Label>
            <Textarea id={`objective-${encounterId}`} name="objective" rows={3} defaultValue={soapNote?.objective ?? ''} />
          </div>
          <div>
            <Label htmlFor={`assessment-${encounterId}`}>Assessment</Label>
            <Textarea id={`assessment-${encounterId}`} name="assessment" rows={3} defaultValue={soapNote?.assessment ?? ''} />
          </div>
          <div>
            <Label htmlFor={`plan-${encounterId}`}>Plan</Label>
            <Textarea id={`plan-${encounterId}`} name="plan" rows={3} defaultValue={soapNote?.plan ?? ''} />
          </div>
        </div>
        <div className="flex gap-2">
          <SubmitButton variant="secondary" className="text-xs">
            Save SOAP note
          </SubmitButton>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--navy)]"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
}
