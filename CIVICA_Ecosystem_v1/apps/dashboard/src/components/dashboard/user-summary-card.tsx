import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card } from '@civica/ui';
import type { CurrentUser, CurrentMembership } from '@civica/auth';

const STATUS_LABELS: Record<CurrentMembership['status'], string> = {
  pending: 'Pending approval',
  active: 'Active',
  disabled: 'Disabled',
};

const STATUS_BADGE_CLASSES: Record<CurrentMembership['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  disabled: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
};

const STATUS_ICONS: Record<CurrentMembership['status'], typeof CheckCircle2> = {
  pending: Clock,
  active: CheckCircle2,
  disabled: XCircle,
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function UserSummaryCard({ user, membership }: { user: CurrentUser; membership: CurrentMembership | null }) {
  return (
    <Card className="p-7">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)] text-base font-semibold text-[var(--accent)]">
          {initials(user.name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-[var(--navy)]">{user.name}</h2>
          <p className="truncate text-sm text-[var(--text-secondary)]">{user.email}</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[var(--text-secondary)]">Role</dt>
          <dd className="mt-0.5 font-medium text-[var(--navy)]">
            {user.isPlatformAdmin ? 'Platform admin' : membership?.roleName ?? '—'}
          </dd>
        </div>

        <div>
          <dt className="text-[var(--text-secondary)]">Clinic</dt>
          <dd className="mt-0.5 font-medium text-[var(--navy)]">{membership?.clinicName ?? '—'}</dd>
        </div>

        <div>
          <dt className="text-[var(--text-secondary)]">Membership status</dt>
          <dd className="mt-1">
            {membership ? (
              (() => {
                const StatusIcon = STATUS_ICONS[membership.status];
                return (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[membership.status]}`}
                  >
                    <StatusIcon className="h-3 w-3" aria-hidden="true" />
                    {STATUS_LABELS[membership.status]}
                  </span>
                );
              })()
            ) : (
              <span className="font-medium text-[var(--navy)]">{user.isPlatformAdmin ? 'N/A' : 'No clinic membership'}</span>
            )}
          </dd>
        </div>
      </dl>

      {membership?.status === 'pending' && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Your membership is pending approval. Tools will become available once a clinic
            administrator activates your account.
          </p>
        </div>
      )}
    </Card>
  );
}
