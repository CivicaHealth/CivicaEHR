import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId } from '@civica/db/tenant/connection';
import { canAccessTool, canEditEmr } from '@civica/permissions';
import { Card, CardTitle, Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';
import { getToolBySlug } from '@/lib/tools/registry';
import { getEmrPatientDetail } from '@/server/queries/emr-queries';
import { getActiveLabTestCatalog } from '@/server/queries/labs-queries';
import {
  getEmrPatientContacts,
  getEmrPortalMessages,
  getEmrPortalRequests,
  getPatientPortalStatus,
  markPatientMessagesRead,
} from '@/server/queries/emr-portal-queries';
import { PatientChartHeader } from '@/components/tools/emr/patient-chart-header';
import { EnrollmentCodePanel } from '@/components/tools/emr/enrollment-code-panel';
import { CareContactsSection } from '@/components/tools/emr/care-contacts-section';
import { PortalMessagesPanel } from '@/components/tools/emr/portal-messages-panel';
import { PortalRequestsPanel } from '@/components/tools/emr/portal-requests-panel';
import { AllergiesSection } from '@/components/tools/emr/allergies-section';
import { ProblemsSection } from '@/components/tools/emr/problems-section';
import { SocialHistorySection } from '@/components/tools/emr/social-history-section';
import { ReferralsSection } from '@/components/tools/emr/referrals-section';
import { LabRequestsSection } from '@/components/tools/emr/lab-requests-section';
import { EncounterCard } from '@/components/tools/emr/encounter-card';
import { NewEncounterForm } from '@/components/tools/emr/new-encounter-form';
import { PhiNotice } from '@/components/tools/emr/phi-notice';
import { AddToggle } from '@/components/tools/emr/add-toggle';

export default async function EmrPatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const membership = await getEffectiveMembership(user);

  const tool = await getToolBySlug('emr');
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

  const canEdit = canEditEmr(user, membership);
  const tenantDb = await getTenantDbByClinicId(membership.clinicId);

  const patient = await getEmrPatientDetail(tenantDb, id);
  if (!patient) {
    redirect('/emr');
  }

  // Patient portal data for this chart. Opening the chart marks patient
  // messages as read (staff has now seen them).
  const [careContacts, portalMessages, portalRequests, portalStatus, labTestTypes] = await Promise.all([
    getEmrPatientContacts(tenantDb, patient.id),
    getEmrPortalMessages(tenantDb, patient.id),
    getEmrPortalRequests(tenantDb, patient.id),
    getPatientPortalStatus(patient.id),
    getActiveLabTestCatalog(tenantDb),
  ]);
  await markPatientMessagesRead(tenantDb, patient.id);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo href="/dashboard" />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <Link href="/emr" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:text-[#256e73]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to patients
        </Link>

        <PatientChartHeader patient={patient} />

        <PhiNotice />

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-6">
            <AllergiesSection emrPatientId={patient.id} allergies={patient.allergies} canEdit={canEdit} />
            <ProblemsSection emrPatientId={patient.id} problems={patient.problems} canEdit={canEdit} />
            <SocialHistorySection emrPatientId={patient.id} socialHistory={patient.socialHistory} canEdit={canEdit} />
            <ReferralsSection emrPatientId={patient.id} referrals={patient.referrals} canEdit={canEdit} />
            <LabRequestsSection
              emrPatientId={patient.id}
              labRequests={patient.labRequests}
              labTestTypes={labTestTypes}
              canEdit={canEdit}
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <CardTitle>Encounters</CardTitle>
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                {patient.encounters.length} {patient.encounters.length === 1 ? 'visit' : 'visits'} on file
              </span>
            </div>

            {canEdit && (
              <Card className="p-4">
                <AddToggle label="+ New encounter">
                  <NewEncounterForm emrPatientId={patient.id} />
                </AddToggle>
              </Card>
            )}

            {patient.encounters.length > 0 ? (
              <Card className="overflow-hidden p-0">
                {patient.encounters.map((encounter) => (
                  <EncounterCard key={encounter.id} encounter={encounter} canEdit={canEdit} />
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
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6">
              <EnrollmentCodePanel emrPatientId={patient.id} status={portalStatus} canEdit={canEdit} />
              <CareContactsSection emrPatientId={patient.id} contacts={careContacts} canEdit={canEdit} />
            </div>
            <PortalMessagesPanel emrPatientId={patient.id} messages={portalMessages} canEdit={canEdit} />
            <PortalRequestsPanel
              appointmentRequests={portalRequests.appointmentRequests}
              refillRequests={portalRequests.refillRequests}
              canEdit={canEdit}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
