'use client';

import { useActionState, useRef } from 'react';
import { sendStaffPortalMessageAction } from '@/server/actions/emr/emr-portal-actions';
import type { EmrActionState } from '@/server/actions/emr/emr-shared';
import type { PortalMessage } from '@civica/db/tenant/schema';
import { Textarea, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { useResetOnSuccess } from '@/components/tools/roster/use-reset-on-success';
import { Panel } from './panel';

const initialState: EmrActionState = {};

function formatDateTime(value: Date): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function PortalMessagesPanel({
  emrPatientId,
  messages,
  canEdit,
}: {
  emrPatientId: string;
  messages: PortalMessage[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(sendStaffPortalMessageAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useResetOnSuccess(formRef, state);

  return (
    <Panel title="Patient messages">
      <div className="space-y-3 px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No messages yet.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {messages.map((msg) => {
              const staff = msg.senderRole === 'staff';
              return (
                <li key={msg.id} className={`flex ${staff ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      staff
                        ? 'bg-[var(--accent)] text-white'
                        : 'border border-[var(--border)] bg-[var(--bg)] text-[var(--navy)]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    <p className={`mt-1 text-[10px] ${staff ? 'text-white/70' : 'text-[var(--text-secondary)]'}`}>
                      {staff ? 'Staff' : 'Patient'} · {formatDateTime(msg.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {canEdit && (
          <form ref={formRef} action={formAction} className="space-y-2 border-t border-[var(--border)] pt-3">
            <input type="hidden" name="emrPatientId" value={emrPatientId} />
            <FormError message={state.error} />
            <Textarea name="body" rows={2} required maxLength={5000} placeholder="Reply to the patient..." />
            <div className="flex justify-end">
              <SubmitButton variant="secondary" className="text-xs">
                Send reply
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </Panel>
  );
}
