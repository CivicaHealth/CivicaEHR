import { eq } from 'drizzle-orm';
import { controlDb } from './client';
import { clinicCodes, clinicMemberships, clinics, patientLinks } from './schema';

export const getClinicById = (id: string) => controlDb.query.clinics.findFirst({ where: eq(clinics.id, id) });

export async function activateClinic(id: string) {
  await controlDb.update(clinics).set({ status: 'active', isActive: true, updatedAt: new Date() }).where(eq(clinics.id, id));
  await controlDb.update(clinicMemberships).set({ status: 'active', updatedAt: new Date() }).where(eq(clinicMemberships.clinicId, id));
}

export async function rejectClinic(id: string) {
  await controlDb.update(clinics).set({ status: 'rejected', isActive: false, updatedAt: new Date() }).where(eq(clinics.id, id));
}

export async function deleteClinic(id: string) {
  await controlDb.delete(patientLinks).where(eq(patientLinks.clinicId, id));
  await controlDb.delete(clinicCodes).where(eq(clinicCodes.clinicId, id));
  await controlDb.delete(clinicMemberships).where(eq(clinicMemberships.clinicId, id));
  await controlDb.delete(clinics).where(eq(clinics.id, id));
}

export async function createClinicByAdmin(input: {
  slug: string; name: string; dbIdentifier: string; headSupervisor: string; location: string; affiliatedInstitution: string | null; codeHash: string; codeIdentifierHash: string;
}) {
  const [clinic] = await controlDb.insert(clinics).values({
    slug: input.slug, name: input.name, dbIdentifier: input.dbIdentifier, status: 'active',
    headSupervisor: input.headSupervisor, location: input.location, affiliatedInstitution: input.affiliatedInstitution, isActive: true,
  }).returning();
  await controlDb.insert(clinicCodes).values({ clinicId: clinic.id, codeHash: input.codeHash, codeIdentifierHash: input.codeIdentifierHash, label: 'Admin-created registration code' });
  return clinic;
}

export async function listClinicsWithMemberCounts() {
  const rows = await controlDb.query.clinics.findMany({ with: { memberships: true }, orderBy: (t, { asc }) => [asc(t.name)] });
  return rows.map((clinic) => ({ ...clinic, memberCount: clinic.memberships.length }));
}
