import { desc } from 'drizzle-orm';
import type { TenantDb } from '@civica/db/tenant/connection';
import { emrReferrals, type EmrReferral } from '@civica/db/tenant/schema';

export type ReferralWithPatient = EmrReferral & {
  patient: { id: string; firstName: string; lastName: string };
};

/**
 * All referrals clinic-wide, with patient name and id, newest first.
 * Status filter optional: omit to fetch all statuses.
 */
export async function getAllReferrals(
  tenantDb: TenantDb,
  status?: EmrReferral['status'],
): Promise<ReferralWithPatient[]> {
  return tenantDb.query.emrReferrals.findMany({
    where: status ? (t, { eq }) => eq(t.status, status) : undefined,
    orderBy: [desc(emrReferrals.createdAt)],
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true } },
    },
  }) as Promise<ReferralWithPatient[]>;
}
