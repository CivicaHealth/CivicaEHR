'use client';

import { useActionState, useRef } from 'react';
import {
  addLabTestTypeAction,
  toggleLabTestTypeAction,
  removeLabTestTypeAction,
  addLabNotificationContactAction,
  removeLabNotificationContactAction,
} from '@/server/actions/labs/labs-actions';
import type { LabsActionState } from '@/server/actions/labs/labs-shared';
import type { EmrLabTestType, LabNotificationContact } from '@civica/db/tenant/schema';
import { Badge, FormError, Input, Label, Select } from '@civica/ui';
import { Panel, PanelRow, PanelEmpty } from '@/components/tools/emr/panel';
import { AddToggle } from '@/components/tools/emr/add-toggle';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';

const initialState: LabsActionState = {};

export function LabSettingsPanel({
  testTypes,
  contacts,
}: {
  testTypes: EmrLabTestType[];
  contacts: LabNotificationContact[];
}) {
  return (
    <div className="space-y-6">
      <LabTestCatalogPanel testTypes={testTypes} />
      <LabNotificationContactsPanel contacts={contacts} />
    </div>
  );
}

function LabTestCatalogPanel({ testTypes }: { testTypes: EmrLabTestType[] }) {
  const [addState, addAction] = useActionState(addLabTestTypeAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, addState);

  return (
    <Panel title="Orderable lab tests">
      {testTypes.length > 0 ? (
        testTypes.map((testType) => <LabTestTypeRow key={testType.id} testType={testType} />)
      ) : (
        <PanelEmpty>No lab tests configured yet.</PanelEmpty>
      )}

      <AddToggle label="+ Add lab test">
        <form ref={formRef} action={addAction} className="space-y-2">
          <FormError message={addState.error} />
          <div>
            <Label htmlFor="name">Test name</Label>
            <Input id="name" name="name" required />
          </div>
          <SubmitButton variant="secondary" className="text-xs">
            Add
          </SubmitButton>
        </form>
      </AddToggle>
    </Panel>
  );
}

function LabTestTypeRow({ testType }: { testType: EmrLabTestType }) {
  const [toggleState, toggleAction] = useActionState(toggleLabTestTypeAction, initialState);
  const [removeState, removeAction] = useActionState(removeLabTestTypeAction, initialState);

  return (
    <PanelRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-[var(--navy)]">{testType.name}</span>
          <Badge variant={testType.enabled ? 'success' : 'neutral'} className="text-[10px]">
            {testType.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <FormError message={toggleState.error ?? removeState.error} />
          <form action={toggleAction}>
            <input type="hidden" name="labTestTypeId" value={testType.id} />
            <input type="hidden" name="enabled" value={testType.enabled ? 'false' : 'true'} />
            <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs">
              {testType.enabled ? 'Disable' : 'Enable'}
            </SubmitButton>
          </form>
          <form action={removeAction}>
            <input type="hidden" name="labTestTypeId" value={testType.id} />
            <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs text-rose-600 hover:text-rose-700">
              Remove
            </SubmitButton>
          </form>
        </div>
      </div>
    </PanelRow>
  );
}

function LabNotificationContactsPanel({ contacts }: { contacts: LabNotificationContact[] }) {
  const [addState, addAction] = useActionState(addLabNotificationContactAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, addState);

  return (
    <Panel title="Notification emails">
      {contacts.length > 0 ? (
        contacts.map((contact) => <LabNotificationContactRow key={contact.id} contact={contact} />)
      ) : (
        <PanelEmpty>No notification emails configured yet.</PanelEmpty>
      )}

      <AddToggle label="+ Add notification email">
        <form ref={formRef} action={addAction} className="space-y-2">
          <FormError message={addState.error} />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="label">Label (optional)</Label>
            <Input id="label" name="label" placeholder="e.g. Lab front desk" />
          </div>
          <div>
            <Label htmlFor="category">Notify for</Label>
            <Select id="category" name="category" required defaultValue="all">
              <option value="general">General</option>
              <option value="gynecology">Gynecology</option>
              <option value="all">All</option>
            </Select>
          </div>
          <SubmitButton variant="secondary" className="text-xs">
            Add
          </SubmitButton>
        </form>
      </AddToggle>
    </Panel>
  );
}

function LabNotificationContactRow({ contact }: { contact: LabNotificationContact }) {
  const [removeState, removeAction] = useActionState(removeLabNotificationContactAction, initialState);

  return (
    <PanelRow>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm text-[var(--navy)]">
          {contact.email}
          {contact.label ? <span className="text-xs text-[var(--text-secondary)]">({contact.label})</span> : null}
          <Badge variant="neutral" className="text-[10px]">
            {contact.category}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <FormError message={removeState.error} />
          <form action={removeAction}>
            <input type="hidden" name="contactId" value={contact.id} />
            <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs text-rose-600 hover:text-rose-700">
              Remove
            </SubmitButton>
          </form>
        </div>
      </div>
    </PanelRow>
  );
}
