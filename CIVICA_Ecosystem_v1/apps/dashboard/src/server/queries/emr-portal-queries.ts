import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import type { TenantDb } from '@civica/db/tenant/connection';
import { controlDb } from '@civica/db/control/client';
import { patientLinks, patientEnrollments, users } from '@civica/db/control/schema';
import {
  emrPatientContacts,
  portalMessages,
  emrAppointmentRequests,
  emrRefillRequests,
} from '@civica/db/tenant/schema';

/** Care-contact emails for a patient (staff-managed). */
export async function getEmrPatientContacts(tenantDb: TenantDb, emrPatientId: string) {
  return tenantDb.query.emrPatientContacts.findMany({
    where: eq(emrPatientContacts.emrPatientId, emrPatientId),
    orderBy: [asc(emrPatientContacts.createdAt)],
  });
}

/** Full message thread for the staff chart view, oldest first. */
export async function getEmrPortalMessages(tenantDb: TenantDb, emrPatientId: string) {
  return tenantDb.query.portalMessages.findMany({
    where: eq(portalMessages.emrPatientId, emrPatientId),
    orderBy: [asc(portalMessages.createdAt)],
  });
}

/** Marks patient-sent messages as read when staff open the chart thread. */
export async function markPatientMessagesRead(tenantDb: TenantDb, emrPatientId: string) {
  await tenantDb
    .update(portalMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(portalMessages.emrPatientId, emrPatientId),
        eq(portalMessages.senderRole, 'patient'),
        isNull(portalMessages.readAt),
      ),
    );
}

/** Pending-first appointment and refill requests for the staff requests panel. */
export async function getEmrPortalRequests(tenantDb: TenantDb, emrPatientId: string) {
  const [appointmentRequests, refillRequests] = await Promise.all([
    tenantDb.query.emrAppointmentRequests.findMany({
      where: eq(emrAppointmentRequests.emrPatientId, emrPatientId),
      orderBy: [asc(emrAppointmentRequests.status), desc(emrAppointmentRequests.createdAt)],
    }),
    tenantDb.query.emrRefillRequests.findMany({
      where: eq(emrRefillRequests.emrPatientId, emrPatientId),
      orderBy: [asc(emrRefillRequests.status), desc(emrRefillRequests.createdAt)],
      with: { medication: { columns: { id: true, name: true } } },
    }),
  ]);
  return { appointmentRequests, refillRequests };
}

export interface PortalStatus {
  linked: boolean;
  linkedUserEmail: string | null;
  pendingEnrollment: boolean;
}

/**
 * Control-DB portal status for an EMR chart: whether a login has claimed it,
 * the claiming user's email, and whether an unclaimed enrollment code exists.
 */
export async function getPatientPortalStatus(emrPatientId: string): Promise<PortalStatus> {
  const link = await controlDb.query.patientLinks.findFirst({
    where: eq(patientLinks.emrPatientId, emrPatientId),
  });

  let linkedUserEmail: string | null = null;
  if (link) {
    const user = await controlDb.query.users.findFirst({ where: eq(users.id, link.userId) });
    linkedUserEmail = user?.email ?? null;
  }

  const pending = await controlDb.query.patientEnrollments.findFirst({
    where: and(eq(patientEnrollments.emrPatientId, emrPatientId), eq(patientEnrollments.status, 'pending')),
  });

  return { linked: Boolean(link), linkedUserEmail, pendingEnrollment: Boolean(pending) };
}

/** Login email of the patient linked to a chart, for staff->patient notifications. */
export async function getLinkedPatientEmail(emrPatientId: string): Promise<string | null> {
  const link = await controlDb.query.patientLinks.findFirst({
    where: eq(patientLinks.emrPatientId, emrPatientId),
  });
  if (!link) return null;
  const user = await controlDb.query.users.findFirst({ where: eq(users.id, link.userId) });
  return user?.email ?? null;
}
