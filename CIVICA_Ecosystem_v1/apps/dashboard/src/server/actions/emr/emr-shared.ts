import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId, type TenantDb } from '@civica/db/tenant/connection';
import { canAccessTool, canEditEmr } from '@civica/permissions';
import type { CurrentUser, CurrentMembership } from '@civica/types';
import { getToolBySlug } from '@/lib/tools/registry';

export { getRequestMeta } from '@/server/actions/roster/roster-shared';

export interface EmrActionState {
  error?: string;
}

export interface EmrContext {
  user: CurrentUser;
  membership: CurrentMembership | null;
  clinicId: string;
  tenantDb: TenantDb;
  canEdit: boolean;
}

/**
 * Resolves the current user, membership, tenant DB, and edit permission for
 * EMR server actions. Returns an error string if the user isn't
 * authenticated, lacks EMR tool access, or has no clinic membership.
 */
export async function requireEmrContext(): Promise<EmrContext | { error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in.' };
  }

  const membership = await getEffectiveMembership(user);

  const tool = await getToolBySlug('emr');
  if (!tool) {
    return { error: 'EMR tool is not available.' };
  }

  const allowed = canAccessTool(user, membership, {
    enabled: tool.enabled,
    slug: tool.slug,
    requiredRoles: tool.requiredRoles,
  });
  if (!allowed) {
    return { error: 'You do not have access to the EMR tool.' };
  }

  if (!membership) {
    return { error: 'No clinic membership found.' };
  }

  const tenantDb = await getTenantDbByClinicId(membership.clinicId);
  const canEdit = canEditEmr(user, membership);

  return { user, membership, clinicId: membership.clinicId, tenantDb, canEdit };
}
