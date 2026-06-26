import { redirect } from 'next/navigation';
import { getCurrentUser, getPatientLink, type CurrentUser, type PatientLink } from '@civica/auth';
import { getTenantDbByClinicId, type TenantDb } from '@civica/db/tenant/connection';

export interface PatientContext {
  user: CurrentUser;
  link: PatientLink;
  tenantDb: TenantDb;
}

/**
 * Resolves the authenticated patient's portal context, or redirects to
 * /login if there is no valid session or the user is not a linked patient.
 *
 * This is THE security boundary for the patient portal: `link.emrPatientId`
 * is derived from the session user via patient_links, never from request
 * input. Every portal query/action must scope to this emrPatientId.
 */
export async function requirePatientContext(): Promise<PatientContext> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const link = await getPatientLink(user.id);
  if (!link) redirect('/login');

  const tenantDb = await getTenantDbByClinicId(link.clinicId);
  return { user, link, tenantDb };
}
