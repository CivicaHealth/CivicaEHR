'use client';

import { useActionState, useRef, useState } from 'react';
import { saveSocialHistoryAction } from '@/server/actions/emr/emr-social-history-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { EmrSocialHistory } from '@civica/db/tenant/schema';
import { Input, Label, Select, Textarea, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { Panel, PanelRow, PanelEmpty } from './panel';

const initialState: EmrActionState = {};

export function SocialHistorySection({
  emrPatientId,
  socialHistory,
  canEdit,
}: {
  emrPatientId: string;
  socialHistory: EmrSocialHistory | null | undefined;
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(saveSocialHistoryAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [editing, setEditing] = useState(false);

  const rows: { label: string; value: string | null | undefined }[] = [
    { label: 'Tobacco', value: socialHistory?.tobaccoStatus },
    { label: 'Alcohol', value: socialHistory?.alcoholStatus },
    { label: 'Drugs', value: socialHistory?.drugStatus },
    { label: 'Occupation', value: socialHistory?.occupation },
    { label: 'Exercise', value: socialHistory?.exercise },
    { label: 'Diet', value: socialHistory?.diet },
  ];
  const notes = [socialHistory?.tobaccoNote, socialHistory?.alcoholNote, socialHistory?.drugNote]
    .filter(Boolean)
    .join(' · ');
  const hasAny = rows.some((r) => r.value) || socialHistory?.notes;

  if (!canEdit) {
    return (
      <Panel title="Social History">
        {hasAny ? (
          <>
            {rows
              .filter((r) => r.value)
              .map((r) => (
                <PanelRow key={r.label} className="cursor-default">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded border border-[var(--border)] bg-[var(--bg)] px-1 font-mono text-[11px] text-[var(--muted)]">
                      {r.label}
                    </span>
                    <span className="text-sm capitalize text-[var(--navy)]">{r.value}</span>
                  </div>
                </PanelRow>
              ))}
            {socialHistory?.notes ? (
              <PanelRow className="cursor-default">
                <div className="text-xs italic text-[var(--text-secondary)]">{socialHistory.notes}</div>
              </PanelRow>
            ) : null}
          </>
        ) : (
          <PanelEmpty>No social history recorded.</PanelEmpty>
        )}
      </Panel>
    );
  }

  return (
    <Panel
      title="Social History"
    >
      {!editing && (
        <>
          {hasAny ? (
            <>
              {rows
                .filter((r) => r.value)
                .map((r) => (
                  <PanelRow key={r.label} className="cursor-default">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded border border-[var(--border)] bg-[var(--bg)] px-1 font-mono text-[11px] text-[var(--muted)]">
                        {r.label}
                      </span>
                      <span className="text-sm capitalize text-[var(--navy)]">{r.value}</span>
                    </div>
                  </PanelRow>
                ))}
              {socialHistory?.notes ? (
                <PanelRow className="cursor-default">
                  <div className="text-xs italic text-[var(--text-secondary)]">{socialHistory.notes}</div>
                </PanelRow>
              ) : null}
            </>
          ) : (
            <PanelEmpty>No social history recorded.</PanelEmpty>
          )}
          <div className="border-t border-[var(--border)] px-1 py-1.5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded px-2 py-0.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-light)]"
            >
              Edit
            </button>
          </div>
          {notes ? null : null}
        </>
      )}

      {editing && (
        <form ref={formRef} action={formAction} className="space-y-2 p-3">
          <input type="hidden" name="emrPatientId" value={emrPatientId} />
          <FormError message={state.error} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="tobaccoStatus">Tobacco</Label>
              <Select id="tobaccoStatus" name="tobaccoStatus" defaultValue={socialHistory?.tobaccoStatus ?? ''}>
                <option value="">— Select —</option>
                <option value="never">Never</option>
                <option value="former">Former</option>
                <option value="current">Current</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="tobaccoNote">Tobacco note</Label>
              <Input id="tobaccoNote" name="tobaccoNote" defaultValue={socialHistory?.tobaccoNote ?? ''} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="alcoholStatus">Alcohol</Label>
              <Select id="alcoholStatus" name="alcoholStatus" defaultValue={socialHistory?.alcoholStatus ?? ''}>
                <option value="">— Select —</option>
                <option value="never">Never</option>
                <option value="occasional">Occasional</option>
                <option value="moderate">Moderate</option>
                <option value="heavy">Heavy</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="alcoholNote">Alcohol note</Label>
              <Input id="alcoholNote" name="alcoholNote" defaultValue={socialHistory?.alcoholNote ?? ''} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="drugStatus">Recreational drugs</Label>
              <Select id="drugStatus" name="drugStatus" defaultValue={socialHistory?.drugStatus ?? ''}>
                <option value="">— Select —</option>
                <option value="never">Never</option>
                <option value="former">Former</option>
                <option value="current">Current</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="drugNote">Drug note</Label>
              <Input id="drugNote" name="drugNote" defaultValue={socialHistory?.drugNote ?? ''} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="occupation">Occupation</Label>
              <Input id="occupation" name="occupation" defaultValue={socialHistory?.occupation ?? ''} />
            </div>
            <div>
              <Label htmlFor="exercise">Exercise</Label>
              <Input id="exercise" name="exercise" defaultValue={socialHistory?.exercise ?? ''} />
            </div>
          </div>
          <div>
            <Label htmlFor="diet">Diet</Label>
            <Input id="diet" name="diet" defaultValue={socialHistory?.diet ?? ''} />
          </div>
          <div>
            <Label htmlFor="notes">Additional notes</Label>
            <Textarea id="notes" name="notes" rows={2} defaultValue={socialHistory?.notes ?? ''} />
          </div>
          <div className="flex gap-2">
            <SubmitButton variant="secondary" className="text-xs">
              Save
            </SubmitButton>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--navy)]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Panel>
  );
}
