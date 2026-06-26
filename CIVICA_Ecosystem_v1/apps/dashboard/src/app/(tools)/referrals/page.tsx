import { redirect } from 'next/navigation';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId } from '@civica/db/tenant/connection';
import { canAccessTool, canEditReferrals } from '@civica/permissions';
import { Card, CardTitle, CardDescription, Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { getToolBySlug } from '@/lib/tools/registry';
import { getAllReferrals } from '@/server/queries/referrals-queries';
import { ReferralsTable } from '@/components/tools/referrals/referrals-table';

export default async function ReferralsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const membership = await getEffectiveMembership(user);

  const tool = await getToolBySlug('referrals');
  if (!tool) {
    redirect('/dashboard');
  }

  const allowed = canAccessTool(user, membership, {
    enabled: tool.enabled,
    slug: tool.slug,
    requiredRoles: tool.requiredRoles,
  });
  if (!allowed || !membership) {
    redirect('/dashboard');
  }

  const canEdit = canEditReferrals(user, membership);
  const tenantDb = await getTenantDbByClinicId(membership.clinicId);

  const [pending, sent, completed, cancelled] = await Promise.all([
    getAllReferrals(tenantDb, 'pending'),
    getAllReferrals(tenantDb, 'sent'),
    getAllReferrals(tenantDb, 'completed'),
    getAllReferrals(tenantDb, 'cancelled'),
  ]);

  const total = pending.length + sent.length + completed.length + cancelled.length;

  const Section = ({
    title,
    count,
    children,
  }: {
    title: string;
    count: number;
    children: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-[var(--navy)]">{title}</h2>
        <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
          {count}
        </span>
      </div>
      <Card className="p-0">{children}</Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo href="/dashboard" />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div>
          <CardTitle>Referrals</CardTitle>
          <CardDescription>
            All patient referrals across the clinic — {total} total. Click a patient name to open their EMR chart.
            {canEdit
              ? ' Supervisors can update referral status inline.'
              : ' Contact a supervisor to update referral status.'}
          </CardDescription>
        </div>

        <Section title="Pending" count={pending.length}>
          <ReferralsTable referrals={pending} canEdit={canEdit} />
        </Section>

        <Section title="Sent" count={sent.length}>
          <ReferralsTable referrals={sent} canEdit={canEdit} />
        </Section>

        <Section title="Completed" count={completed.length}>
          <ReferralsTable referrals={completed} canEdit={canEdit} />
        </Section>

        {cancelled.length > 0 && (
          <Section title="Cancelled" count={cancelled.length}>
            <ReferralsTable referrals={cancelled} canEdit={canEdit} />
          </Section>
        )}
      </main>
    </div>
  );
}
