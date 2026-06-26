'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { updateReferralStatusAction } from '@/server/actions/referrals/referrals-actions';
import type { ReferralsActionState } from '@/server/actions/referrals/referrals-shared';
import type { ReferralWithPatient } from '@/server/queries/referrals-queries';
import { Badge, Select, FormError } from '@civica/ui';
import { SubmitButton } from '@/components/tools/roster/submit-button';

const STATUS_VARIANT = {
  pending: 'neutral',
  sent: 'accent',
  completed: 'success',
  cancelled: 'danger',
} as const;

const STATUS_LABEL = {
  pending: 'Pending',
  sent: 'Sent',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

function ReferralRow({ referral, canEdit }: { referral: ReferralWithPatient; canEdit: boolean }) {
  const [state, formAction] = useActionState<ReferralsActionState, FormData>(updateReferralStatusAction, {});
  const patientName = `${referral.patient.firstName} ${referral.patient.lastName}`;
  const created = new Date(referral.createdAt);

  return (
    <tr className="border-b border-[var(--border)] last:border-b-0">
      <td className="px-4 py-3">
        <Link
          href={`/emr/patients/${referral.patient.id}`}
          className="font-medium text-[var(--accent)] hover:underline"
        >
          {patientName}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-[var(--navy)]">{referral.specialistName}</td>
      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{referral.specialty || '—'}</td>
      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
        {referral.reason || '—'}
      </td>
      <td className="px-4 py-3">
        <Badge variant={STATUS_VARIANT[referral.status]} className="text-[11px]">
          {STATUS_LABEL[referral.status]}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-[var(--muted)]">
        {created.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
      </td>
      <td className="px-4 py-3">
        {canEdit ? (
          <form action={formAction} className="flex items-center gap-1.5">
            <input type="hidden" name="referralId" value={referral.id} />
            <input type="hidden" name="emrPatientId" value={referral.emrPatientId} />
            <FormError message={state.error} />
            <Select name="status" defaultValue={referral.status} className="py-0.5 text-xs">
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <SubmitButton variant="ghost" className="px-1.5 py-0.5 text-xs">
              Save
            </SubmitButton>
          </form>
        ) : (
          <Link
            href={`/emr/patients/${referral.patient.id}`}
            className="text-xs font-medium text-[var(--accent)] hover:underline"
          >
            View chart
          </Link>
        )}
      </td>
    </tr>
  );
}

export function ReferralsTable({
  referrals,
  canEdit,
}: {
  referrals: ReferralWithPatient[];
  canEdit: boolean;
}) {
  if (referrals.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">No referrals found.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
            <th className="px-4 py-2.5">Patient</th>
            <th className="px-4 py-2.5">Specialist</th>
            <th className="px-4 py-2.5">Specialty</th>
            <th className="px-4 py-2.5">Reason</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Created</th>
            <th className="px-4 py-2.5">{canEdit ? 'Update' : 'Chart'}</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <ReferralRow key={r.id} referral={r} canEdit={canEdit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
