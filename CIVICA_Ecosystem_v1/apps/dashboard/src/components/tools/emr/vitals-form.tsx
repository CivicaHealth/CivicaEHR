'use client';

import { useActionState } from 'react';
import { saveVitalsAction } from '@/server/actions/emr/emr-encounter-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { EmrVitals } from '@civica/db/tenant/schema';
import { Input, Label, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';

const initialState: EmrActionState = {};

const STATS: { key: keyof EmrVitals; label: string; unit: string }[] = [
  { key: 'bloodPressure', label: 'BP', unit: 'mmHg' },
  { key: 'heartRate', label: 'HR', unit: 'bpm' },
  { key: 'temperature', label: 'Temp', unit: '°F' },
  { key: 'respiratoryRate', label: 'RR', unit: '/min' },
  { key: 'oxygenSaturation', label: 'SpO2', unit: '%' },
  { key: 'weightKg', label: 'Weight', unit: 'kg' },
  { key: 'heightCm', label: 'Height', unit: 'cm' },
];

export function hasVitals(vitals: EmrVitals | null | undefined) {
  return !!vitals && STATS.some((s) => vitals[s.key]);
}

export function VitalsSummary({ vitals }: { vitals: EmrVitals | null | undefined }) {
  if (!hasVitals(vitals)) return null;
  const present = STATS.filter((s) => vitals![s.key]);
  return (
    <div className="border-t border-[var(--border)] px-4 py-2.5">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Vitals</div>
      <div className="flex flex-wrap gap-4">
        {present.map((s) => (
          <div key={s.key} className="flex flex-col items-center">
            <span className="font-mono text-base font-semibold leading-none text-[var(--navy)]">{String(vitals![s.key])}</span>
            <span className="mt-0.5 text-[10px] text-[var(--muted)]">{s.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VitalsForm({
  encounterId,
  vitals,
  onClose,
}: {
  encounterId: string;
  vitals: EmrVitals | null | undefined;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(saveVitalsAction, initialState);

  return (
    <div className="border-t border-[var(--border)] px-4 py-2.5">
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="encounterId" value={encounterId} />
        <FormError message={state.error} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <Label htmlFor={`bloodPressure-${encounterId}`}>BP</Label>
            <Input id={`bloodPressure-${encounterId}`} name="bloodPressure" defaultValue={vitals?.bloodPressure ?? ''} />
          </div>
          <div>
            <Label htmlFor={`heartRate-${encounterId}`}>HR</Label>
            <Input id={`heartRate-${encounterId}`} name="heartRate" type="number" defaultValue={vitals?.heartRate ?? ''} />
          </div>
          <div>
            <Label htmlFor={`temperature-${encounterId}`}>Temp</Label>
            <Input id={`temperature-${encounterId}`} name="temperature" defaultValue={vitals?.temperature ?? ''} />
          </div>
          <div>
            <Label htmlFor={`respiratoryRate-${encounterId}`}>RR</Label>
            <Input
              id={`respiratoryRate-${encounterId}`}
              name="respiratoryRate"
              type="number"
              defaultValue={vitals?.respiratoryRate ?? ''}
            />
          </div>
          <div>
            <Label htmlFor={`oxygenSaturation-${encounterId}`}>SpO2</Label>
            <Input
              id={`oxygenSaturation-${encounterId}`}
              name="oxygenSaturation"
              type="number"
              defaultValue={vitals?.oxygenSaturation ?? ''}
            />
          </div>
          <div>
            <Label htmlFor={`weightKg-${encounterId}`}>Weight (kg)</Label>
            <Input id={`weightKg-${encounterId}`} name="weightKg" defaultValue={vitals?.weightKg ?? ''} />
          </div>
          <div>
            <Label htmlFor={`heightCm-${encounterId}`}>Height (cm)</Label>
            <Input id={`heightCm-${encounterId}`} name="heightCm" defaultValue={vitals?.heightCm ?? ''} />
          </div>
        </div>
        <div className="flex gap-2">
          <SubmitButton variant="secondary" className="text-xs">
            Save vitals
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
