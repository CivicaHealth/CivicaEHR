'use client';

import {
  updateAppointmentRequestAction,
  updateRefillRequestAction,
} from '@/server/actions/emr/emr-portal-actions';
import type { EmrAppointmentRequest, EmrRefillRequest } from '@civica/db/tenant/schema';
import { Badge } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';
import { Panel, PanelRow, PanelEmpty, PanelSectionLabel } from './panel';

type RefillRequestWithMed = EmrRefillRequest & { medication: { id: string; name: string } | null };

function statusVariant(status: string): 'accent' | 'success' | 'danger' {
  if (status === 'approved') return 'success';
  if (status === 'declined') return 'danger';
  return 'accent';
}

function Decision({
  requestId,
  action,
}: {
  requestId: string;
  action: (formData: FormData) => Promise<unknown>;
}) {
  return (
    <div className="mt-1 flex gap-1.5">
      <form action={async (fd) => { await action(fd); }}>
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="status" value="approved" />
        <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs">
          Approve
        </SubmitButton>
      </form>
      <form action={async (fd) => { await action(fd); }}>
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="status" value="declined" />
        <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs">
          Decline
        </SubmitButton>
      </form>
    </div>
  );
}

export function PortalRequestsPanel({
  appointmentRequests,
  refillRequests,
  canEdit,
}: {
  appointmentRequests: EmrAppointmentRequest[];
  refillRequests: RefillRequestWithMed[];
  canEdit: boolean;
}) {
  return (
    <Panel title="Patient requests">
      <PanelSectionLabel>Appointments</PanelSectionLabel>
      {appointmentRequests.length === 0 ? (
        <PanelEmpty>No appointment requests.</PanelEmpty>
      ) : (
        appointmentRequests.map((r) => (
          <PanelRow key={r.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-[var(--navy)]">{r.reason}</span>
              <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
            </div>
            {r.preferredDate && (
              <div className="text-xs text-[var(--text-secondary)]">Prefers: {r.preferredDate}</div>
            )}
            {canEdit && r.status === 'pending' && (
              <Decision requestId={r.id} action={updateAppointmentRequestAction} />
            )}
          </PanelRow>
        ))
      )}

      <PanelSectionLabel>Refills</PanelSectionLabel>
      {refillRequests.length === 0 ? (
        <PanelEmpty>No refill requests.</PanelEmpty>
      ) : (
        refillRequests.map((r) => (
          <PanelRow key={r.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-[var(--navy)]">{r.medication?.name ?? 'Medication'}</span>
              <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
            </div>
            {r.note ? <div className="text-xs text-[var(--text-secondary)]">{r.note}</div> : null}
            {canEdit && r.status === 'pending' && (
              <Decision requestId={r.id} action={updateRefillRequestAction} />
            )}
          </PanelRow>
        ))
      )}
    </Panel>
  );
}
