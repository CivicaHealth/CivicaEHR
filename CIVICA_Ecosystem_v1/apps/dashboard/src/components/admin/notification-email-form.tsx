'use client';

import { useActionState } from 'react';
import { Input, Label, FormError } from '@civica/ui';
import { updateNotificationEmailAction, type UpdateSettingsActionState } from '@/server/actions/admin-actions';
import { SubmitButton } from '@/components/tools/roster/submit-button';

const initialState: UpdateSettingsActionState = {};

export function NotificationEmailForm({ notificationEmail }: { notificationEmail: string | null }) {
  const [state, formAction] = useActionState(updateNotificationEmailAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state.error} />
      {state.success && <p className="text-sm text-[var(--accent)]">Settings saved.</p>}
      <div>
        <Label htmlFor="notificationEmail">Notification email</Label>
        <Input
          id="notificationEmail"
          name="notificationEmail"
          type="email"
          placeholder="admin@example.com"
          defaultValue={notificationEmail ?? ''}
        />
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Sent here when a new clinic registers and needs approval. Leave blank to disable.
        </p>
      </div>
      <SubmitButton variant="secondary">Save</SubmitButton>
    </form>
  );
}
