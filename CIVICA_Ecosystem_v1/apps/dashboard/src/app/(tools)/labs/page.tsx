import { redirect } from 'next/navigation';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId } from '@civica/db/tenant/connection';
import { canAccessTool, canEditLabs } from '@civica/permissions';
import { Card, CardTitle, CardDescription, Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { getToolBySlug } from '@/lib/tools/registry';
import {
  getLabRequests,
  getLabRequestsAwaitingReview,
  getLabTestCatalog,
  getLabNotificationContacts,
} from '@/server/queries/labs-queries';
import { LabRequestsTable } from '@/components/tools/labs/lab-requests-table';
import { LabReviewQueue } from '@/components/tools/labs/lab-review-queue';
import { LabSettingsPanel } from '@/components/tools/labs/lab-settings-panel';
import { LabsTabs } from '@/components/tools/labs/labs-tabs';

export default async function LabsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const membership = await getEffectiveMembership(user);

  const tool = await getToolBySlug('labs');
  if (!tool) {
    redirect('/dashboard');
  }

  const allowed = canAccessTool(user, membership, {
    enabled: tool.enabled,
    slug: tool.slug,
    requiredRoles: tool.requiredRoles,
  });
  if (!allowed) {
    redirect('/dashboard');
  }

  if (!membership) {
    redirect('/dashboard');
  }

  const canEdit = canEditLabs(user, membership);
  const tenantDb = await getTenantDbByClinicId(membership.clinicId);

  const [generalRequests, gynoRequests, allRequests, generalReview, gynoReview, allReview] = await Promise.all([
    getLabRequests(tenantDb, 'general'),
    getLabRequests(tenantDb, 'gynecology'),
    getLabRequests(tenantDb),
    getLabRequestsAwaitingReview(tenantDb, 'general'),
    getLabRequestsAwaitingReview(tenantDb, 'gynecology'),
    getLabRequestsAwaitingReview(tenantDb),
  ]);
  const [testTypes, notificationContacts] = canEdit
    ? await Promise.all([getLabTestCatalog(tenantDb), getLabNotificationContacts(tenantDb)])
    : [[], []];

  const tabContent = (labRequests: typeof generalRequests, reviewQueue: typeof generalReview) => (
    <div className="space-y-6">
      <Card className="p-0">
        <LabRequestsTable labRequests={labRequests} canEdit={canEdit} />
      </Card>
      <LabReviewQueue labRequests={reviewQueue} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo href="/dashboard" />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <div>
          <CardTitle>Lab requests</CardTitle>
          <CardDescription>
            Lab orders placed by clinicians. {canEdit ? 'Mark requests as placed or completed.' : 'View only.'}
          </CardDescription>
        </div>

        <LabsTabs
          generalTab={tabContent(generalRequests, generalReview)}
          gynoTab={tabContent(gynoRequests, gynoReview)}
          allTab={tabContent(allRequests, allReview)}
          settingsTab={
            canEdit ? <LabSettingsPanel testTypes={testTypes} contacts={notificationContacts} /> : undefined
          }
        />
      </main>
    </div>
  );
}
