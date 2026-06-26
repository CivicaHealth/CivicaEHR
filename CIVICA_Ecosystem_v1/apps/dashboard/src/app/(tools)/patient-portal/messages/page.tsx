import { Card, CardTitle } from '@civica/ui';
import { requirePatientContext } from '@/lib/portal/context';
import { getPortalMessages, markStaffMessagesRead } from '@/server/queries/portal-queries';
import { MessageForm } from '@/components/tools/portal/message-form';

function formatDateTime(value: Date): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function PatientPortalMessagesPage() {
  const { user, link, tenantDb } = await requirePatientContext();
  const messages = await getPortalMessages(tenantDb, link.emrPatientId);
  // Opening the thread marks staff messages as read.
  await markStaffMessagesRead(tenantDb, link.emrPatientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--navy)]">Messages</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Secure messages between you and your care team. Do not use this for emergencies.
        </p>
      </div>

      <Card>
        <CardTitle className="mb-4 text-base">Conversation</CardTitle>
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No messages yet. Start the conversation below.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((msg) => {
              const mine = msg.senderUserId === user.id;
              return (
                <li key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      mine
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--bg)] text-[var(--navy)] border border-[var(--border)]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-[var(--text-secondary)]'}`}>
                      {mine ? 'You' : 'Care team'} · {formatDateTime(msg.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-3 text-base">New message</CardTitle>
        <MessageForm />
      </Card>
    </div>
  );
}
