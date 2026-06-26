'use client';

import { useActionState, useRef } from 'react';
import {
  addProblemAction,
  updateProblemStatusAction,
  removeProblemAction,
} from '@/server/actions/emr/emr-allergy-problem-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { EmrProblem } from '@civica/db/tenant/schema';
import { Input, Label, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';
import { Panel, PanelRow, PanelEmpty, PanelRowActions, PanelSectionLabel } from './panel';
import { AddToggle } from './add-toggle';

const initialState: EmrActionState = {};

export function ProblemsSection({
  emrPatientId,
  problems,
  canEdit,
}: {
  emrPatientId: string;
  problems: EmrProblem[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(addProblemAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  const active = problems.filter((p) => p.status === 'active');
  const resolved = problems.filter((p) => p.status === 'resolved');

  return (
    <Panel title="Problem List">
      <PanelSectionLabel>Active</PanelSectionLabel>
      {active.length > 0 ? (
        active.map((problem) => <ProblemRow key={problem.id} problem={problem} canEdit={canEdit} />)
      ) : (
        <PanelEmpty>None.</PanelEmpty>
      )}

      <PanelSectionLabel>Resolved</PanelSectionLabel>
      {resolved.length > 0 ? (
        resolved.map((problem) => <ProblemRow key={problem.id} problem={problem} canEdit={canEdit} resolved />)
      ) : (
        <PanelEmpty>None.</PanelEmpty>
      )}

      {canEdit && (
        <AddToggle label="+ Add problem">
          <form ref={formRef} action={formAction} className="space-y-2">
            <input type="hidden" name="emrPatientId" value={emrPatientId} />
            <FormError message={state.error} />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="icd10Code">ICD-10</Label>
                <Input id="icd10Code" name="icd10Code" placeholder="e.g. E11.9" required />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="e.g. Type 2 Diabetes" required />
              </div>
            </div>
            <div>
              <Label htmlFor="onsetDate">Onset date</Label>
              <Input id="onsetDate" name="onsetDate" type="date" />
            </div>
            <SubmitButton variant="secondary" className="text-xs">
              Save
            </SubmitButton>
          </form>
        </AddToggle>
      )}
    </Panel>
  );
}

function ProblemRow({ problem, canEdit, resolved }: { problem: EmrProblem; canEdit: boolean; resolved?: boolean }) {
  return (
    <PanelRow>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-sm font-medium ${resolved ? 'text-[var(--muted)] line-through' : 'text-[var(--navy)]'}`}>
          {problem.description}
        </span>
        {problem.icd10Code ? (
          <span className="rounded border border-[var(--border)] bg-[var(--bg)] px-1 font-mono text-[11px] text-[var(--muted)]">
            {problem.icd10Code}
          </span>
        ) : null}
      </div>
      {problem.onsetDate ? <div className="text-xs text-[var(--text-secondary)]">Since {problem.onsetDate}</div> : null}
      {canEdit && (
        <PanelRowActions>
          <form
            action={async (formData) => {
              await updateProblemStatusAction(formData);
            }}
          >
            <input type="hidden" name="problemId" value={problem.id} />
            <input type="hidden" name="status" value={problem.status === 'active' ? 'resolved' : 'active'} />
            <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs">
              Mark {problem.status === 'active' ? 'resolved' : 'active'}
            </SubmitButton>
          </form>
          <form
            action={async (formData) => {
              await removeProblemAction(formData);
            }}
          >
            <input type="hidden" name="problemId" value={problem.id} />
            <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs">
              Delete
            </SubmitButton>
          </form>
        </PanelRowActions>
      )}
    </PanelRow>
  );
}
