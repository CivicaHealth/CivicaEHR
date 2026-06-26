import { eq, and } from 'drizzle-orm';
import { controlDb } from './client';
import { clinicMemberships, membershipToolAccess, roles, users } from './schema';

export const listRoles = () => controlDb.query.roles.findMany({ orderBy: (r, { asc }) => [asc(r.name)] });
export const getMembershipById = (id: string) => controlDb.query.clinicMemberships.findFirst({ where: eq(clinicMemberships.id, id), with: { role: true } });
export const getUserWithMembershipsById = (id: string) => controlDb.query.users.findFirst({ where: eq(users.id, id), with: { memberships: { with: { clinic: true, role: true, toolAccess: true } } } });

export async function listUsersWithMemberships() {
  return controlDb.query.users.findMany({ orderBy: (u, { asc }) => [asc(u.email)], with: { memberships: { with: { clinic: true, role: true, toolAccess: true } } } });
}

export async function listActiveClinics() {
  return controlDb.query.clinics.findMany({ where: (c, { eq }) => eq(c.status, 'active'), orderBy: (c, { asc }) => [asc(c.name)] });
}

export async function updateMembershipRole(membershipId: string, roleId: string) {
  await controlDb.update(clinicMemberships).set({ roleId, updatedAt: new Date() }).where(eq(clinicMemberships.id, membershipId));
}

export async function updateMembershipStatus(membershipId: string, status: 'pending' | 'active' | 'disabled') {
  await controlDb.update(clinicMemberships).set({ status, updatedAt: new Date() }).where(eq(clinicMemberships.id, membershipId));
}

export async function setUserActive(userId: string, isActive: boolean) {
  await controlDb.update(users).set({ isActive, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function setUserPlatformAdmin(userId: string, isPlatformAdmin: boolean) {
  await controlDb.update(users).set({ isPlatformAdmin, updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function setMembershipToolAccess(membershipId: string, toolSlug: string, level: string) {
  await controlDb.insert(membershipToolAccess).values({ membershipId, toolSlug, level }).onConflictDoUpdate({
    target: [membershipToolAccess.membershipId, membershipToolAccess.toolSlug],
    set: { level },
  });
}

export async function removeMembershipToolAccess(membershipId: string, toolSlug: string) {
  await controlDb.delete(membershipToolAccess).where(and(eq(membershipToolAccess.membershipId, membershipId), eq(membershipToolAccess.toolSlug, toolSlug)));
}

export async function createUserByAdmin(input: { email: string; passwordHash: string; name: string; clinicId: string; roleId: string; membershipStatus: string }) {
  const [user] = await controlDb.insert(users).values({ email: input.email, passwordHash: input.passwordHash, name: input.name }).returning();
  await controlDb.insert(clinicMemberships).values({ userId: user.id, clinicId: input.clinicId, roleId: input.roleId, status: input.membershipStatus });
  return user.id;
}

export async function deleteUser(userId: string) {
  await controlDb.delete(users).where(eq(users.id, userId));
}
