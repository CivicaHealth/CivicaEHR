import { redirect } from 'next/navigation';
import { getCurrentUser, getEffectiveMembership, type CurrentUser } from '@civica/auth';

/**
 * Admin section access: platform admins browsing platform-wide manage all
 * clinics (`clinicId: null`); clinic admins (including a platform admin
 * "viewing as" a clinic) manage only that clinic's users (`clinicId` set).
 * Anyone else is redirected to the dashboard.
 */
export interface AdminAccess {
  user: CurrentUser;
  clinicId: string | null;
}

export async function requireAdminAccess(): Promise<AdminAccess> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  if (user.isPlatformAdmin && !user.viewingClinicId) {
    return { user, clinicId: null };
  }

  const membership = await getEffectiveMembership(user);
  if (membership?.roleName === 'clinic_admin' && membership.status === 'active') {
    return { user, clinicId: membership.clinicId };
  }

  redirect('/dashboard');
}
