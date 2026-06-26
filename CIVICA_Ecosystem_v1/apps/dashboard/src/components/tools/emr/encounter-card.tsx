'use client';

import { useState } from 'react';
import type { getEmrPatientDetail } from '@/server/queries/emr-queries';
import { shareEncounterAction } from '@/server/actions/emr/emr-portal-actions';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { SoapNoteForm, SoapPreview, hasSoapNote } from './soap-note-form';
import { VitalsForm, VitalsSummary, hasVitals } from './vitals-form';
import { DiagnosesSection } from './diagnoses-section';
import { MedicationsSection } from './medications-section';
import { LabOrdersSection } from './lab-orders-section';

type Encounter = NonNullable<Awaited<ReturnType<typeof getEmrPatientDetail>>>['encounters'][number];

export function EncounterCard({ encounter, canEdit }: { encounter: Encounter; canEdit: boolean }) {
  const [open, setOpen] = useState<'vitals' | 'soap' | null>(null);
  const date = new Date(encounter.encounterDate);

  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[13px] font-semibold text-[var(--navy)]">
            {date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
          <span className="text-sm text-[var(--text-secondary)]">{encounter.reasonForVisit}</span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {encounter.sharedWithPatient && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
              Shared
            </span>
          )}
          {canEdit && (
            <form action={async (fd) => { await shareEncounterAction(fd); }}>
              <input type="hidden" name="encounterId" value={encounter.id} />
              <input type="hidden" name="share" value={encounter.sharedWithPatient ? 'false' : 'true'} />
              <SubmitButton variant="ghost" className="px-2 py-1 text-[11.5px]">
                {encounter.sharedWithPatient ? 'Unshare' : 'Share with patient'}
              </SubmitButton>
            </form>
          )}
          <button
            type="button"
            onClick={() => setOpen(open === 'vitals' ? null : 'vitals')}
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {hasVitals(encounter.vitals) ? 'Vitals ✓' : '+ Vitals'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(open === 'soap' ? null : 'soap')}
            className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {hasSoapNote(encounter.soapNote) ? 'SOAP ✓' : '+ SOAP'}
          </button>
        </div>
      </div>

      {encounter.notes ? (
        <p className="whitespace-pre-wrap border-t border-[var(--border)] px-4 py-2.5 text-sm text-[var(--navy)]">
          {encounter.notes}
        </p>
      ) : null}

      {open === 'vitals' ? (
        canEdit ? (
          <VitalsForm encounterId={encounter.id} vitals={encounter.vitals} onClose={() => setOpen(null)} />
        ) : (
          <VitalsSummary vitals={encounter.vitals} />
        )
      ) : (
        <VitalsSummary vitals={encounter.vitals} />
      )}

      <DiagnosesSection encounterId={encounter.id} diagnoses={encounter.diagnoses} canEdit={canEdit} />

      <MedicationsSection encounterId={encounter.id} medications={encounter.medications} canEdit={canEdit} />

      <LabOrdersSection encounterId={encounter.id} labOrders={encounter.labOrders} canEdit={canEdit} />

      {open === 'soap' ? (
        canEdit ? (
          <SoapNoteForm encounterId={encounter.id} soapNote={encounter.soapNote} onClose={() => setOpen(null)} />
        ) : (
          <SoapPreview soapNote={encounter.soapNote} />
        )
      ) : (
        <SoapPreview soapNote={encounter.soapNote} />
      )}
    </div>
  );
}
