import { asc, eq } from 'drizzle-orm';
import type { TenantDb } from '@civica/db/tenant/connection';
import { pods, people, patients, rosterDayPreceptors } from '@civica/db/tenant/schema';
import { getOrCreateActiveRosterDay } from '@/server/actions/roster/roster-shared';

/**
 * Everything needed to render the /roster overview: today's pods (with
 * assignment/patient counts and cleanup status), the list of preceptors
 * present today, and today's patients.
 */
export async function getTodaysRoster(tenantDb: TenantDb) {
  const rosterDay = await getOrCreateActiveRosterDay(tenantDb);

  const [podRows, preceptorRows, patientRows] = await Promise.all([
    tenantDb.query.pods.findMany({
      where: eq(pods.rosterDayId, rosterDay.id),
      orderBy: asc(pods.sortOrder),
      with: {
        assignments: { with: { person: true } },
        patients: true,
      },
    }),
    tenantDb.query.rosterDayPreceptors.findMany({
      where: eq(rosterDayPreceptors.rosterDayId, rosterDay.id),
      with: { person: true },
    }),
    tenantDb.query.patients.findMany({
      where: eq(patients.rosterDayId, rosterDay.id),
      orderBy: asc(patients.appointmentTime),
      with: { pod: true },
    }),
  ]);

  return { rosterDay, pods: podRows, preceptors: preceptorRows, patients: patientRows };
}

export async function getPodDetail(tenantDb: TenantDb, podId: string) {
  return tenantDb.query.pods.findFirst({
    where: eq(pods.id, podId),
    with: {
      assignments: { with: { person: true } },
      patients: { orderBy: asc(patients.appointmentTime) },
    },
  });
}

export async function getPatientDetail(tenantDb: TenantDb, patientId: string) {
  return tenantDb.query.patients.findFirst({
    where: eq(patients.id, patientId),
    with: {
      pod: {
        with: {
          assignments: { with: { person: true } },
        },
      },
    },
  });
}

/**
 * The clinic-wide people list, grouped by role, for the People management
 * section and "assign staff"/"add preceptor" pickers.
 */
export async function getPeopleList(tenantDb: TenantDb) {
  const rows = await tenantDb.query.people.findMany({ orderBy: asc(people.name) });

  const grouped: Record<string, typeof rows> = {
    preceptor: [],
    med_student: [],
    scribe: [],
    translator: [],
    shadow: [],
  };

  for (const person of rows) {
    grouped[person.role]?.push(person);
  }

  return grouped;
}
