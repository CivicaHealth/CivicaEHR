'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getCurrentUser, setViewingClinic, hashClinicCode } from '@civica/auth';
import { getClinicById, activateClinic, rejectClinic, deleteClinic, createClinicByAdmin } from '@civica/db/control/clinics';
import {
  getMembershipById,
  getUserWithMembershipsById,
  updateMembershipRole,
  updateMembershipStatus,
  setUserActive,
  setUserPlatformAdmin,
  listRoles,
  setMembershipToolAccess,
  removeMembershipToolAccess,
  createUserByAdmin,
  deleteUser,
} from '@civica/db/control/users';
import { hashPassword } from '@civica/auth';
import { provisionTenantDatabase } from '@civica/db/tenant/provision';
import { setNotificationEmail } from '@civica/db/control/settings';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { isValidToolAccessLevel } from '@civica/permissions';
import { requireAdminAccess } from '@/lib/admin/access';
import { controlDb } from '@civica/db/control/client';
import { users } from '@civica/db/control/schema';
import { eq } from 'drizzle-orm';
import { notificationEmailSchema, createUserByAdminSchema, createClinicByAdminSchema } from '@/lib/validation/admin';
import { uniqueClinicIdentifiers } from '@/lib/clinics/identifiers';

async function getRequestMeta(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for');
  return {
    ipAddress: forwardedFor ? forwardedFor.split(',')[0].trim() : null,
    userAgent: headerList.get('user-agent'),
  };
}

async function requirePlatformAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.isPlatformAdmin) redirect('/dashboard');
  return user;
}

/**
 * Approves a pending clinic: provisions its tenant database, then activates
 * the clinic and its founding clinic_admin membership.
 */
export async function approveClinicAction(clinicId: string): Promise<void> {
  const user = await requirePlatformAdmin();
  const { ipAddress, userAgent } = await getRequestMeta();

  const clinic = await getClinicById(clinicId);
  if (!clinic || clinic.status !== 'pending') {
    redirect('/admin/clinics?clinicError=1');
  }

  await provisionTenantDatabase(clinic.dbIdentifier);
  await activateClinic(clinicId);

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.CLINIC_APPROVED,
    resourceType: 'clinic',
    resourceId: clinicId,
    success: true,
    ipAddress,
    userAgent,
  });

  redirect('/admin/clinics?approved=1');
}

/**
 * Rejects a pending clinic registration. No tenant database is provisioned.
 */
export async function rejectClinicAction(clinicId: string): Promise<void> {
  const user = await requirePlatformAdmin();
  const { ipAddress, userAgent } = await getRequestMeta();

  const clinic = await getClinicById(clinicId);
  if (!clinic || clinic.status !== 'pending') {
    redirect('/admin/clinics?clinicError=1');
  }

  await rejectClinic(clinicId);

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.CLINIC_REJECTED,
    resourceType: 'clinic',
    resourceId: clinicId,
    success: true,
    ipAddress,
    userAgent,
  });

  redirect('/admin/clinics?rejected=1');
}

/**
 * Permanently deletes a clinic -- pending, active, or rejected -- along
 * with its memberships, codes, and patient links. Does not drop the
 * clinic's tenant database (see deleteClinic's comment). Requires the form
 * field `confirmText` to exactly match the clinic's name, checked
 * server-side against the real record (never trusts a client-supplied
 * "expected" value) so a confirmation typo can't silently no-op into a
 * delete.
 */
export async function deleteClinicAction(formData: FormData): Promise<void> {
  const user = await requirePlatformAdmin();
  const { ipAddress, userAgent } = await getRequestMeta();

  const clinicId = String(formData.get('clinicId') ?? '');
  const confirmText = String(formData.get('confirmText') ?? '');

  const clinic = await getClinicById(clinicId);
  if (!clinic) {
    redirect('/admin/clinics?clinicError=1');
  }
  if (confirmText !== clinic.name) {
    redirect('/admin/clinics?clinicError=1');
  }

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.CLINIC_DELETED,
    resourceType: 'clinic',
    resourceId: clinicId,
    success: true,
    ipAddress,
    userAgent,
    metadata: { name: clinic.name, status: clinic.status },
  });

  await deleteClinic(clinicId);

  redirect('/admin/clinics?deleted=1');
}

/**
 * Enters "viewing as" mode for an active clinic: the platform admin's
 * dashboard and tools behave as if they were that clinic's clinic_admin.
 */
export async function enterClinicViewAction(clinicId: string): Promise<void> {
  const user = await requirePlatformAdmin();
  const { ipAddress, userAgent } = await getRequestMeta();

  const clinic = await getClinicById(clinicId);
  if (!clinic || clinic.status !== 'active') {
    redirect('/admin/clinics');
  }

  await setViewingClinic(user.sessionId, clinicId);

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.CLINIC_VIEW_ENTERED,
    resourceType: 'clinic',
    resourceId: clinicId,
    success: true,
    ipAddress,
    userAgent,
  });

  redirect('/dashboard');
}

/**
 * Exits "viewing as" mode and returns the platform admin to the Clinics
 * overview.
 */
export async function exitClinicViewAction(): Promise<void> {
  const user = await requirePlatformAdmin();
  const { ipAddress, userAgent } = await getRequestMeta();

  if (user.viewingClinicId) {
    await logAuditEvent({
      actorUserId: user.id,
      clinicId: user.viewingClinicId,
      action: AUDIT_ACTIONS.CLINIC_VIEW_EXITED,
      resourceType: 'clinic',
      resourceId: user.viewingClinicId,
      success: true,
      ipAddress,
      userAgent,
    });
  }

  await setViewingClinic(user.sessionId, null);
  redirect('/admin/clinics');
}

/**
 * Changes the role on a clinic membership. Expects `membershipId` and
 * `roleId` form fields; `roleId` is validated against the known roles list.
 */
export async function changeMembershipRoleAction(formData: FormData): Promise<void> {
  const { user: admin, clinicId } = await requireAdminAccess();
  const { ipAddress, userAgent } = await getRequestMeta();

  const membershipId = String(formData.get('membershipId') ?? '');
  const roleId = String(formData.get('roleId') ?? '');

  const membership = await getMembershipById(membershipId);
  if (!membership || (clinicId !== null && membership.clinicId !== clinicId)) {
    redirect('/admin');
  }

  const redirectTo = String(formData.get('redirectTo') ?? `/admin/users/${membership.userId}`);

  const roles = await listRoles();
  const role = roles.find((role) => role.id === roleId);
  if (!role || role.name === 'platform_admin') {
    redirect(redirectTo);
  }

  await updateMembershipRole(membershipId, roleId);

  await logAuditEvent({
    actorUserId: admin.id,
    clinicId: membership.clinicId,
    action: AUDIT_ACTIONS.ROLE_CHANGED,
    resourceType: 'clinic_membership',
    resourceId: membershipId,
    success: true,
    metadata: { userId: membership.userId, previousRoleId: membership.roleId, newRoleId: roleId },
    ipAddress,
    userAgent,
  });

  redirect(redirectTo);
}

/**
 * Changes the status (pending/active/disabled) of a clinic membership.
 */
export async function changeMembershipStatusAction(
  membershipId: string,
  status: 'pending' | 'active' | 'disabled',
): Promise<void> {
  const { user: admin, clinicId } = await requireAdminAccess();
  const { ipAddress, userAgent } = await getRequestMeta();

  const membership = await getMembershipById(membershipId);
  if (!membership || (clinicId !== null && membership.clinicId !== clinicId)) {
    redirect('/admin');
  }

  await updateMembershipStatus(membershipId, status);

  await logAuditEvent({
    actorUserId: admin.id,
    clinicId: membership.clinicId,
    action: AUDIT_ACTIONS.MEMBERSHIP_STATUS_CHANGED,
    resourceType: 'clinic_membership',
    resourceId: membershipId,
    success: true,
    metadata: { userId: membership.userId, previousStatus: membership.status, newStatus: status },
    ipAddress,
    userAgent,
  });

  redirect(`/admin/users/${membership.userId}`);
}

/**
 * Enables or disables a user's account platform-wide. An admin cannot
 * disable their own account.
 */
export async function setUserActiveAction(userId: string, isActive: boolean): Promise<void> {
  const admin = await requirePlatformAdmin();
  const { ipAddress, userAgent } = await getRequestMeta();

  if (userId === admin.id) {
    redirect(`/admin/users/${userId}`);
  }

  await setUserActive(userId, isActive);

  await logAuditEvent({
    actorUserId: admin.id,
    action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
    resourceType: 'user',
    resourceId: userId,
    success: true,
    metadata: { isActive },
    ipAddress,
    userAgent,
  });

  redirect(`/admin/users/${userId}`);
}

/**
 * Sets a 'member' user's access level for a tool (staff/supervisor), or
 * removes it entirely if `level` is empty/"none". Expects `membershipId`,
 * `toolSlug`, `level`, and `redirectTo` form fields. clinic_admin and
 * platform_admin memberships already have full access to every tool and
 * cannot be edited this way.
 */
export async function setMembershipToolAccessAction(formData: FormData): Promise<void> {
  const { user: admin, clinicId } = await requireAdminAccess();
  const { ipAddress, userAgent } = await getRequestMeta();

  const membershipId = String(formData.get('membershipId') ?? '');
  const toolSlug = String(formData.get('toolSlug') ?? '');
  const level = String(formData.get('level') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '/admin');

  const membership = await getMembershipById(membershipId);
  if (!membership || (clinicId !== null && membership.clinicId !== clinicId) || membership.role.name !== 'member') {
    redirect(redirectTo);
  }

  if (level === '' || level === 'none') {
    await removeMembershipToolAccess(membershipId, toolSlug);
  } else {
    if (!isValidToolAccessLevel(level)) {
      redirect(redirectTo);
    }
    await setMembershipToolAccess(membershipId, toolSlug, level);
  }

  await logAuditEvent({
    actorUserId: admin.id,
    clinicId: membership.clinicId,
    action: AUDIT_ACTIONS.TOOL_ACCESS_CHANGED,
    resourceType: 'clinic_membership',
    resourceId: membershipId,
    success: true,
    metadata: { userId: membership.userId, toolSlug, newLevel: level || 'none' },
    ipAddress,
    userAgent,
  });

  redirect(redirectTo);
}

/**
 * Grants or revokes platform-admin status for a user. An admin cannot
 * revoke their own platform-admin status.
 */
export async function setPlatformAdminAction(userId: string, isPlatformAdmin: boolean): Promise<void> {
  const admin = await requirePlatformAdmin();
  const { ipAddress, userAgent } = await getRequestMeta();

  if (userId === admin.id) {
    redirect(`/admin/users/${userId}`);
  }

  await setUserPlatformAdmin(userId, isPlatformAdmin);

  await logAuditEvent({
    actorUserId: admin.id,
    action: AUDIT_ACTIONS.PLATFORM_ADMIN_CHANGED,
    resourceType: 'user',
    resourceId: userId,
    success: true,
    metadata: { isPlatformAdmin },
    ipAddress,
    userAgent,
  });

  redirect(`/admin/users/${userId}`);
}

/**
 * Permanently deletes a user account -- login and every clinic membership,
 * everywhere. An admin cannot delete their own account. Requires the form
 * field `confirmText` to exactly match the user's email, checked
 * server-side against the real record (never trusts a client-supplied
 * "expected" value) so a confirmation typo can't silently no-op into a
 * delete.
 */
export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const { ipAddress, userAgent } = await getRequestMeta();

  const userId = String(formData.get('userId') ?? '');
  const confirmText = String(formData.get('confirmText') ?? '');

  if (userId === admin.id) {
    redirect('/admin?userError=1');
  }

  const target = await getUserWithMembershipsById(userId);
  if (!target) {
    redirect('/admin?userError=1');
  }
  if (confirmText !== target.email) {
    redirect(`/admin/users/${userId}?userError=1`);
  }

  await logAuditEvent({
    actorUserId: admin.id,
    action: AUDIT_ACTIONS.USER_DELETED,
    resourceType: 'user',
    resourceId: userId,
    success: true,
    ipAddress,
    userAgent,
    metadata: { email: target.email },
  });

  await deleteUser(userId);

  redirect('/admin?deleted=1');
}

export interface UpdateSettingsActionState {
  error?: string;
  success?: boolean;
}

/**
 * Sets (or clears) the address that receives platform notifications, e.g.
 * when a new clinic registers and is awaiting approval.
 */
export async function updateNotificationEmailAction(
  _prevState: UpdateSettingsActionState,
  formData: FormData,
): Promise<UpdateSettingsActionState> {
  const admin = await requirePlatformAdmin();
  const { ipAddress, userAgent } = await getRequestMeta();

  const parsed = notificationEmailSchema.safeParse({
    notificationEmail: formData.get('notificationEmail'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const email = parsed.data.notificationEmail || null;
  await setNotificationEmail(email);

  await logAuditEvent({
    actorUserId: admin.id,
    action: AUDIT_ACTIONS.PLATFORM_SETTINGS_UPDATED,
    resourceType: 'platform_settings',
    success: true,
    metadata: { notificationEmailSet: email !== null },
    ipAddress,
    userAgent,
  });

  return { success: true };
}

export interface CreateUserActionState {
  error?: string;
  success?: boolean;
  newUserId?: string;
}

/**
 * Creates a new user account with a clinic membership, invoked directly by
 * an admin without needing the user to self-register. The admin picks the
 * email, name, password, clinic, role, and whether to activate immediately.
 * A welcome email is sent so the user knows their account exists.
 */
export async function createUserByAdminAction(
  _prevState: CreateUserActionState,
  formData: FormData,
): Promise<CreateUserActionState> {
  const { user: admin } = await requireAdminAccess();
  const { ipAddress, userAgent } = await getRequestMeta();

  const parsed = createUserByAdminSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    clinicId: formData.get('clinicId'),
    roleId: formData.get('roleId'),
    membershipStatus: formData.get('membershipStatus'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { name, email, password, clinicId, roleId, membershipStatus } = parsed.data;

  // Clinic admins may not assign the clinic_admin role — only platform admins can.
  const { clinicId: adminClinicId } = await requireAdminAccess();
  if (adminClinicId !== null) {
    const roles = await listRoles();
    const selectedRole = roles.find((r) => r.id === roleId);
    if (selectedRole?.name === 'clinic_admin') {
      return { error: 'Only platform admins can assign the clinic_admin role.' };
    }
    // Clinic admins may only create accounts in their own clinic.
    if (clinicId !== adminClinicId) {
      return { error: 'You can only create accounts for your own clinic.' };
    }
  }

  const existing = await controlDb.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    return { error: 'An account with this email already exists.' };
  }

  const passwordHash = await hashPassword(password);

  const newUserId = await createUserByAdmin({ email, passwordHash, name, clinicId, roleId, membershipStatus });

  await logAuditEvent({
    actorUserId: admin.id,
    clinicId,
    action: AUDIT_ACTIONS.USER_CREATED_BY_ADMIN,
    resourceType: 'user',
    resourceId: newUserId,
    success: true,
    ipAddress,
    userAgent,
    metadata: { email, membershipStatus },
  });

  // Send welcome email — best effort, non-blocking.
  const { sendWelcomeEmail } = await import('@civica/email');
  await sendWelcomeEmail(email, name);

  return { success: true, newUserId };
}

export interface CreateClinicActionState {
  error?: string;
  success?: boolean;
  newClinicId?: string;
}

/**
 * Platform-admin-only: creates a clinic directly as 'active' and provisions
 * its tenant database immediately, skipping the pending-approval step that
 * self-registered clinics go through. Does not create a founding user --
 * use "Create account" afterward to add a clinic_admin to the new clinic.
 */
export async function createClinicByAdminAction(
  _prevState: CreateClinicActionState,
  formData: FormData,
): Promise<CreateClinicActionState> {
  const admin = await requirePlatformAdmin();
  const { ipAddress, userAgent } = await getRequestMeta();

  const parsed = createClinicByAdminSchema.safeParse({
    clinicName: formData.get('clinicName'),
    clinicCode: formData.get('clinicCode'),
    headSupervisor: formData.get('headSupervisor'),
    location: formData.get('location'),
    affiliatedInstitution: formData.get('affiliatedInstitution'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { clinicName, clinicCode, headSupervisor, location, affiliatedInstitution } = parsed.data;

  const { slug, dbIdentifier } = await uniqueClinicIdentifiers(clinicName);
  const { codeHash, codeIdentifierHash } = await hashClinicCode(clinicCode);

  await provisionTenantDatabase(dbIdentifier);

  const clinic = await createClinicByAdmin({
    slug,
    name: clinicName,
    dbIdentifier,
    headSupervisor,
    location,
    affiliatedInstitution: affiliatedInstitution || null,
    codeHash,
    codeIdentifierHash,
  });

  await logAuditEvent({
    actorUserId: admin.id,
    clinicId: clinic.id,
    action: AUDIT_ACTIONS.CLINIC_CREATED_BY_ADMIN,
    resourceType: 'clinic',
    resourceId: clinic.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { name: clinic.name },
  });

  return { success: true, newClinicId: clinic.id };
}
