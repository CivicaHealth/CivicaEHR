import { and, asc, desc, eq, gte, count, isNull } from 'drizzle-orm';
import type { TenantDb } from '@civica/db/tenant/connection';
import {
  emrPatients,
  emrEncounters,
  emrAppointments,
  emrAllergies,
  emrProblems,
  emrMedications,
  portalMessages,
  emrAppointmentRequests,
  emrRefillRequests,
} from '@civica/db/tenant/schema';

/** Patient demographics for the profile/header. */
export async function getPortalPatient(tenantDb: TenantDb, emrPatientId: string) {
  return tenantDb.query.emrPatients.findFirst({ where: eq(emrPatients.id, emrPatientId) });
}

/**
 * Overview data: next upcoming appointments, the most recently shared visit
 * summaries, and the count of unread messages from staff.
 */
export async function getPortalOverview(tenantDb: TenantDb, emrPatientId: string) {
  const now = new Date();
  const [upcomingAppointments, recentShared, [{ unread }]] = await Promise.all([
    tenantDb.query.emrAppointments.findMany({
      where: and(eq(emrAppointments.emrPatientId, emrPatientId), gte(emrAppointments.appointmentDate, now)),
      orderBy: [asc(emrAppointments.appointmentDate)],
      limit: 5,
    }),
    tenantDb.query.emrEncounters.findMany({
      where: and(eq(emrEncounters.emrPatientId, emrPatientId), eq(emrEncounters.sharedWithPatient, true)),
      orderBy: [desc(emrEncounters.encounterDate)],
      limit: 3,
    }),
    tenantDb
      .select({ unread: count() })
      .from(portalMessages)
      .where(
        and(
          eq(portalMessages.emrPatientId, emrPatientId),
          eq(portalMessages.senderRole, 'staff'),
          isNull(portalMessages.readAt),
        ),
      ),
  ]);

  return { upcomingAppointments, recentShared, unreadMessages: unread };
}

/**
 * Records the patient may see: only encounters explicitly shared by staff
 * (with their visit-summary children), plus the always-factual allergy and
 * problem lists.
 */
export async function getPortalRecords(tenantDb: TenantDb, emrPatientId: string) {
  const [sharedEncounters, allergies, problems] = await Promise.all([
    tenantDb.query.emrEncounters.findMany({
      where: and(eq(emrEncounters.emrPatientId, emrPatientId), eq(emrEncounters.sharedWithPatient, true)),
      orderBy: [desc(emrEncounters.encounterDate)],
      with: { soapNote: true, diagnoses: true, medications: true, labOrders: true },
    }),
    tenantDb.query.emrAllergies.findMany({ where: eq(emrAllergies.emrPatientId, emrPatientId) }),
    tenantDb.query.emrProblems.findMany({
      where: eq(emrProblems.emrPatientId, emrPatientId),
      orderBy: [asc(emrProblems.status)],
    }),
  ]);

  return { sharedEncounters, allergies, problems };
}

/** All of the patient's appointments, soonest first. */
export async function getPortalAppointments(tenantDb: TenantDb, emrPatientId: string) {
  return tenantDb.query.emrAppointments.findMany({
    where: eq(emrAppointments.emrPatientId, emrPatientId),
    orderBy: [desc(emrAppointments.appointmentDate)],
  });
}

/** The full message thread for this patient, oldest first. */
export async function getPortalMessages(tenantDb: TenantDb, emrPatientId: string) {
  return tenantDb.query.portalMessages.findMany({
    where: eq(portalMessages.emrPatientId, emrPatientId),
    orderBy: [asc(portalMessages.createdAt)],
  });
}

/**
 * Marks all staff-sent messages for this patient as read. Called when the
 * patient opens their message thread.
 */
export async function markStaffMessagesRead(tenantDb: TenantDb, emrPatientId: string) {
  await tenantDb
    .update(portalMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(portalMessages.emrPatientId, emrPatientId),
        eq(portalMessages.senderRole, 'staff'),
        isNull(portalMessages.readAt),
      ),
    );
}

/**
 * Data for the requests page: existing appointment + refill requests, and the
 * patient's shareable medications (from shared encounters) for the refill form.
 */
export async function getPortalRequests(tenantDb: TenantDb, emrPatientId: string) {
  const [appointmentRequests, refillRequests, refillableMeds] = await Promise.all([
    tenantDb.query.emrAppointmentRequests.findMany({
      where: eq(emrAppointmentRequests.emrPatientId, emrPatientId),
      orderBy: [desc(emrAppointmentRequests.createdAt)],
    }),
    tenantDb.query.emrRefillRequests.findMany({
      where: eq(emrRefillRequests.emrPatientId, emrPatientId),
      orderBy: [desc(emrRefillRequests.createdAt)],
      with: { medication: { columns: { id: true, name: true } } },
    }),
    // Medications belonging to encounters that have been shared with the patient.
    tenantDb
      .select({ id: emrMedications.id, name: emrMedications.name, dosage: emrMedications.dosage })
      .from(emrMedications)
      .innerJoin(emrEncounters, eq(emrMedications.encounterId, emrEncounters.id))
      .where(and(eq(emrEncounters.emrPatientId, emrPatientId), eq(emrEncounters.sharedWithPatient, true))),
  ]);

  return { appointmentRequests, refillRequests, refillableMeds };
}

/** Verifies a medication id belongs to a shared encounter for this patient (IDOR guard). */
export async function isMedicationRefillable(
  tenantDb: TenantDb,
  emrPatientId: string,
  medicationId: string,
): Promise<boolean> {
  const rows = await tenantDb
    .select({ id: emrMedications.id })
    .from(emrMedications)
    .innerJoin(emrEncounters, eq(emrMedications.encounterId, emrEncounters.id))
    .where(
      and(
        eq(emrMedications.id, medicationId),
        eq(emrEncounters.emrPatientId, emrPatientId),
        eq(emrEncounters.sharedWithPatient, true),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Care-contact email addresses to notify of patient activity. */
export async function getCareContactEmails(tenantDb: TenantDb, emrPatientId: string): Promise<string[]> {
  const rows = await tenantDb.query.emrPatientContacts.findMany({
    where: (c, { eq: e }) => e(c.emrPatientId, emrPatientId),
    columns: { email: true },
  });
  return rows.map((r) => r.email);
}
