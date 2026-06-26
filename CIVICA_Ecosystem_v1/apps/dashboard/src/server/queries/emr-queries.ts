import { asc, desc, count, eq, gte, lt, and, type SQL } from 'drizzle-orm';
import type { TenantDb } from '@civica/db/tenant/connection';
import { emrPatients, emrEncounters, emrAppointments, emrLabRequests, type EmrAppointment } from '@civica/db/tenant/schema';

/**
 * All EMR patients, ordered alphabetically for the patient list page.
 */
export async function getEmrPatients(tenantDb: TenantDb) {
  return tenantDb.query.emrPatients.findMany({
    orderBy: [asc(emrPatients.lastName), asc(emrPatients.firstName)],
  });
}

/**
 * A single patient's chart: demographics, allergies, problems, and all
 * encounters (each with their SOAP note, vitals, diagnoses, and medications),
 * most recent encounter first.
 */
/**
 * Dashboard overview stats: total patients, total appointments, total
 * encounters, and the 5 most recently added patients.
 */
export async function getEmrDashboardStats(tenantDb: TenantDb) {
  const [[{ patientCount }], [{ appointmentCount }], [{ encounterCount }], recentPatients] = await Promise.all([
    tenantDb.select({ patientCount: count() }).from(emrPatients),
    tenantDb.select({ appointmentCount: count() }).from(emrAppointments),
    tenantDb.select({ encounterCount: count() }).from(emrEncounters),
    tenantDb.query.emrPatients.findMany({
      orderBy: [desc(emrPatients.createdAt)],
      limit: 5,
    }),
  ]);

  return { patientCount, appointmentCount, encounterCount, recentPatients };
}

export type EmrAppointmentWithPatient = EmrAppointment & {
  patient: { id: string; firstName: string; lastName: string };
};

/**
 * Appointments list, optionally filtered by status and/or a single calendar
 * day, ordered by appointment time. Used by the appointments page.
 */
export async function getEmrAppointments(
  tenantDb: TenantDb,
  filters: { status?: EmrAppointment['status']; date?: string } = {},
): Promise<EmrAppointmentWithPatient[]> {
  const conditions: SQL[] = [];
  if (filters.status) {
    conditions.push(eq(emrAppointments.status, filters.status));
  }
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    const end = new Date(`${filters.date}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    conditions.push(gte(emrAppointments.appointmentDate, start), lt(emrAppointments.appointmentDate, end));
  }

  return tenantDb.query.emrAppointments.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [asc(emrAppointments.appointmentDate)],
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true } },
    },
  });
}

/**
 * Count of appointments per status, plus an overall total, for the
 * appointments page status tabs.
 */
export async function getEmrAppointmentCounts(tenantDb: TenantDb) {
  const rows = await tenantDb
    .select({ status: emrAppointments.status, total: count() })
    .from(emrAppointments)
    .groupBy(emrAppointments.status);

  const counts: Record<string, number> = {
    all: 0,
    scheduled: 0,
    arrived: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };
  for (const row of rows) {
    counts[row.status] = row.total;
    counts.all += row.total;
  }
  return counts;
}

export async function getEmrPatientDetail(tenantDb: TenantDb, emrPatientId: string) {
  return tenantDb.query.emrPatients.findFirst({
    where: eq(emrPatients.id, emrPatientId),
    with: {
      allergies: true,
      problems: true,
      referrals: true,
      socialHistory: true,
      labRequests: {
        orderBy: desc(emrLabRequests.orderedAt),
      },
      encounters: {
        orderBy: desc(emrEncounters.encounterDate),
        with: {
          soapNote: true,
          vitals: true,
          diagnoses: true,
          medications: true,
          labOrders: true,
        },
      },
    },
  });
}
