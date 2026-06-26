'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Button, Textarea, FormError } from '@civica/ui';
import { sendPortalMessageAction, type PortalActionState } from '@/server/actions/portal-actions';

const initialState: PortalActionState = {};

export function MessageForm() {
  const [state, formAction, pending] = useActionState(sendPortalMessageAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the textarea after a successful send (no error returned).
  useEffect(() => {
    if (!pending && !state.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <FormError message={state.error} />
      <Textarea
        name="body"
        rows={3}
        required
        maxLength={5000}
        placeholder="Write a message to your care team..."
        aria-label="Message to your care team"
      />
      <div className="flex justify-end">
        <Button type="submit" loading={pending}>
          {pending ? 'Sending...' : 'Send message'}
        </Button>
      </div>
    </form>
  );
}
