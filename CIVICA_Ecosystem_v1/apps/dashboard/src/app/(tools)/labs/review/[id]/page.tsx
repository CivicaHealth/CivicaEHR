import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId } from '@civica/db/tenant/connection';
import { canAccessTool, canEditLabs } from '@civica/permissions';
import { Badge, Card, CardTitle, Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { getToolBySlug } from '@/lib/tools/registry';
import { getLabRequestForReview, getActiveLabTestCatalog } from '@/server/queries/labs-queries';
import { getEmrPatientDetail } from '@/server/queries/emr-queries';
import {
  getEmrPatientContacts,
  getEmrPortalMessages,
  getEmrPortalRequests,
  getPatientPortalStatus,
} from '@/server/queries/emr-portal-queries';
import { PatientChartHeader } from '@/components/tools/emr/patient-chart-header';
import { AllergiesSection } from '@/components/tools/emr/allergies-section';
import { ProblemsSection } from '@/components/tools/emr/problems-section';
import { SocialHistorySection } from '@/components/tools/emr/social-history-section';
import { ReferralsSection } from '@/components/tools/emr/referrals-section';
import { LabRequestsSection } from '@/components/tools/emr/lab-requests-section';
import { EncounterCard } from '@/components/tools/emr/encounter-card';
import { EnrollmentCodePanel } from '@/components/tools/emr/enrollment-code-panel';
import { CareContactsSection } from '@/components/tools/emr/care-contacts-section';
import { PortalMessagesPanel } from '@/components/tools/emr/portal-messages-panel';
import { PortalRequestsPanel } from '@/components/tools/emr/portal-requests-panel';
import { PhiNotice } from '@/components/tools/emr/phi-notice';
import { LabReviewForm } from '@/components/tools/labs/lab-review-form';

export default async function LabReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
  if (!allowed || !membership) {
    redirect('/dashboard');
  }

  const canEdit = canEditLabs(user, membership);
  const tenantDb = await getTenantDbByClinicId(membership.clinicId);

  const labRequest = await getLabRequestForReview(tenantDb, id);
  if (!labRequest) {
    redirect('/labs');
  }

  const patient = await getEmrPatientDetail(tenantDb, labRequest.emrPatientId);
  if (!patient) {
    redirect('/labs');
  }

  const [careContacts, portalMessages, portalRequests, portalStatus, labTestTypes] = await Promise.all([
    getEmrPatientContacts(tenantDb, patient.id),
    getEmrPortalMessages(tenantDb, patient.id),
    getEmrPortalRequests(tenantDb, patient.id),
    getPatientPortalStatus(patient.id),
    getActiveLabTestCatalog(tenantDb),
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Logo href="/dashboard" />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Link href="/labs" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[#256e73]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Labs
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Full patient chart — read-only */}
          <div className="space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2">
            <PatientChartHeader patient={patient} />
            <PhiNotice />

            <div className="grid gap-6 sm:grid-cols-[240px_1fr]">
              <div className="space-y-6">
                <AllergiesSection emrPatientId={patient.id} allergies={patient.allergies} canEdit={false} />
                <ProblemsSection emrPatientId={patient.id} problems={patient.problems} canEdit={false} />
                <SocialHistorySection emrPatientId={patient.id} socialHistory={patient.socialHistory} canEdit={false} />
                <ReferralsSection emrPatientId={patient.id} referrals={patient.referrals} canEdit={false} />
                <LabRequestsSection
                  emrPatientId={patient.id}
                  labRequests={patient.labRequests}
                  labTestTypes={labTestTypes}
                  canEdit={false}
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <CardTitle>Encounters</CardTitle>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {patient.encounters.length} {patient.encounters.length === 1 ? 'visit' : 'visits'} on file
                  </span>
                </div>
                {patient.encounters.length > 0 ? (
                  <Card className="overflow-hidden p-0">
                    {patient.encounters.map((encounter) => (
                      <EncounterCard key={encounter.id} encounter={encounter} canEdit={false} />
                    ))}
                  </Card>
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">No encounters recorded yet.</p>
                  </Card>
                )}
              </div>
            </div>

            <section className="space-y-4">
              <CardTitle>Patient Portal</CardTitle>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-6">
                  <EnrollmentCodePanel emrPatientId={patient.id} status={portalStatus} canEdit={false} />
                  <CareContactsSection emrPatientId={patient.id} contacts={careContacts} canEdit={false} />
                </div>
                <PortalMessagesPanel emrPatientId={patient.id} messages={portalMessages} canEdit={false} />
                <PortalRequestsPanel
                  appointmentRequests={portalRequests.appointmentRequests}
                  refillRequests={portalRequests.refillRequests}
                  canEdit={false}
                />
              </div>
            </section>
          </div>

          {/* Lab review panel */}
          <div className="space-y-4">
            <CardTitle>Lab review</CardTitle>
            <Card className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-semibold text-[var(--navy)]">{labRequest.testName}</span>
                <Badge variant="neutral" className="text-[10px] capitalize">
                  {labRequest.category}
                </Badge>
              </div>
              {labRequest.notes ? <p className="text-xs text-[var(--text-secondary)]">{labRequest.notes}</p> : null}
              <div className="text-xs text-[var(--text-secondary)]">
                Ordered {new Date(labRequest.orderedAt).toLocaleDateString()}
                {labRequest.resultAt ? ` · Resulted ${new Date(labRequest.resultAt).toLocaleDateString()}` : ''}
              </div>
              {labRequest.result ? (
                <p className="whitespace-pre-wrap rounded border border-[var(--border)] bg-[var(--bg)] p-2 text-sm text-[var(--navy)]">
                  {labRequest.result}
                </p>
              ) : null}
            </Card>

            {labRequest.status !== 'completed' ? (
              <Card className="p-4 text-sm text-[var(--text-secondary)]">
                This lab hasn&apos;t been completed yet, so it can&apos;t be reviewed.
              </Card>
            ) : (
              <Card className="p-4">
                <LabReviewForm
                  labRequestId={labRequest.id}
                  doctorNote={labRequest.doctorNote ?? ''}
                  reviewedAt={labRequest.reviewedAt}
                  canEdit={canEdit}
                />
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
