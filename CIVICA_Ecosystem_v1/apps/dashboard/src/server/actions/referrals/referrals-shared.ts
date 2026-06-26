import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId, type TenantDb } from '@civica/db/tenant/connection';
import { canAccessTool, canEditReferrals } from '@civica/permissions';
import type { CurrentUser, CurrentMembership } from '@civica/types';
import { getToolBySlug } from '@/lib/tools/registry';

export { getRequestMeta } from '@/server/actions/roster/roster-shared';

export interface ReferralsActionState {
  error?: string;
}

export interface ReferralsContext {
  user: CurrentUser;
  membership: CurrentMembership | null;
  clinicId: string;
  tenantDb: TenantDb;
  canEdit: boolean;
}

export async function requireReferralsContext(): Promise<ReferralsContext | { error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in.' };
  }

  const membership = await getEffectiveMembership(user);

  const tool = await getToolBySlug('referrals');
  if (!tool) {
    return { error: 'Referrals tool is not available.' };
  }

  const allowed = canAccessTool(user, membership, {
    enabled: tool.enabled,
    slug: tool.slug,
    requiredRoles: tool.requiredRoles,
  });
  if (!allowed) {
    return { error: 'You do not have access to the Referrals tool.' };
  }

  if (!membership) {
    return { error: 'No clinic membership found.' };
  }

  const tenantDb = await getTenantDbByClinicId(membership.clinicId);
  const canEdit = canEditReferrals(user, membership);

  return { user, membership, clinicId: membership.clinicId, tenantDb, canEdit };
}
