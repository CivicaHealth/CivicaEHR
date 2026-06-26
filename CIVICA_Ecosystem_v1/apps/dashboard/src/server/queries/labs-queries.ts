import { asc, sql } from 'drizzle-orm';
import type { TenantDb } from '@civica/db/tenant/connection';
import {
  emrLabRequests,
  emrLabTestTypes,
  labNotificationContacts,
  type EmrLabRequest,
  type EmrLabTestType,
  type LabNotificationContact,
} from '@civica/db/tenant/schema';

export type LabRequestWithPatient = EmrLabRequest & {
  patient: { id: string; firstName: string; lastName: string };
};

/**
 * Outstanding lab requests ('ordered' then 'placed') across the clinic, with
 * patient info, for the Labs tool. Once a request is completed or rejected
 * it drops off this list -- it remains visible in the patient's EMR chart as
 * a past lab, but the Labs tool only tracks work still in flight.
 * `category` filters to a single tab (General/Gynecology); omitted = "All".
 */
export async function getLabRequests(
  tenantDb: TenantDb,
  category?: 'general' | 'gynecology',
): Promise<LabRequestWithPatient[]> {
  return tenantDb.query.emrLabRequests.findMany({
    where: (t, { and, inArray, eq }) =>
      and(inArray(t.status, ['ordered', 'placed']), category ? eq(t.category, category) : undefined),
    orderBy: [
      sql`case ${emrLabRequests.status}
        when 'ordered' then 0
        when 'placed' then 1
        else 2
      end`,
      asc(emrLabRequests.orderedAt),
    ],
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Completed lab requests that a doctor hasn't reviewed yet (reviewedAt is
 * null). Powers the "Needs doctor review" section of each Labs tool tab.
 * `category` filters to a single tab (General/Gynecology); omitted = "All".
 */
export async function getLabRequestsAwaitingReview(
  tenantDb: TenantDb,
  category?: 'general' | 'gynecology',
): Promise<LabRequestWithPatient[]> {
  return tenantDb.query.emrLabRequests.findMany({
    where: (t, { and, eq, isNull }) =>
      and(eq(t.status, 'completed'), isNull(t.reviewedAt), category ? eq(t.category, category) : undefined),
    orderBy: [asc(emrLabRequests.resultAt)],
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true } },
    },
  });
}

/** A single lab request with patient info, for the split-view review page. */
export async function getLabRequestForReview(
  tenantDb: TenantDb,
  labRequestId: string,
): Promise<LabRequestWithPatient | undefined> {
  return tenantDb.query.emrLabRequests.findFirst({
    where: (t, { eq }) => eq(t.id, labRequestId),
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true } },
    },
  });
}

/** Full catalog of lab test types (enabled and disabled), for the Settings tab. */
export async function getLabTestCatalog(tenantDb: TenantDb): Promise<EmrLabTestType[]> {
  return tenantDb.query.emrLabTestTypes.findMany({
    orderBy: [asc(emrLabTestTypes.name)],
  });
}

/** Enabled lab test types only, for the EMR "+ Order lab" dropdown. */
export async function getActiveLabTestCatalog(tenantDb: TenantDb): Promise<EmrLabTestType[]> {
  return tenantDb.query.emrLabTestTypes.findMany({
    where: (t, { eq }) => eq(t.enabled, true),
    orderBy: [asc(emrLabTestTypes.name)],
  });
}

/** Email addresses to notify when a new lab request is submitted. */
export async function getLabNotificationContacts(tenantDb: TenantDb): Promise<LabNotificationContact[]> {
  return tenantDb.query.labNotificationContacts.findMany({
    orderBy: [asc(labNotificationContacts.createdAt)],
  });
}
