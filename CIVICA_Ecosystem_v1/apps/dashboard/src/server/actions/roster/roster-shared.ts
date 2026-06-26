import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId, type TenantDb } from '@civica/db/tenant/connection';
import { rosterDays } from '@civica/db/tenant/schema';
import { canEditRoster } from '@civica/permissions';
import type { CurrentUser, CurrentMembership } from '@civica/types';

export interface RosterContext {
  user: CurrentUser;
  membership: CurrentMembership | null;
  clinicId: string;
  tenantDb: TenantDb;
  canEdit: boolean;
}

export async function getRequestMeta(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for');
  return {
    ipAddress: forwardedFor ? forwardedFor.split(',')[0].trim() : null,
    userAgent: headerList.get('user-agent'),
  };
}

/**
 * Resolves the current user, membership, tenant DB, and edit permission for
 * roster server actions. Returns an error string if the user isn't
 * authenticated or has no clinic membership -- callers should bail out with
 * { error } in that case rather than redirecting (server actions can't
 * redirect mid-mutation the way pages can).
 */
export async function requireRosterContext(): Promise<RosterContext | { error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in.' };
  }

  const membership = await getEffectiveMembership(user);

  if (!membership) {
    return { error: 'No clinic membership found.' };
  }

  const tenantDb = await getTenantDbByClinicId(membership.clinicId);
  const canEdit = canEditRoster(user, membership);

  return { user, membership, clinicId: membership.clinicId, tenantDb, canEdit };
}

/**
 * Returns the active roster day, creating one (dated today) if none exists
 * yet for this clinic. This bootstrap is idempotent and not gated by edit
 * permission -- without it, a clinic with only view-only users would see a
 * permanently broken empty state.
 */
export async function getOrCreateActiveRosterDay(tenantDb: TenantDb) {
  const existing = await tenantDb.query.rosterDays.findFirst({
    where: eq(rosterDays.status, 'active'),
  });
  if (existing) return existing;

  const today = new Date().toISOString().slice(0, 10);
  const [created] = await tenantDb.insert(rosterDays).values({ rosterDate: today, status: 'active' }).returning();
  return created;
}
