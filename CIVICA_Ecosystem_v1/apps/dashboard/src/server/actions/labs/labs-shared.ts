import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getTenantDbByClinicId, type TenantDb } from '@civica/db/tenant/connection';
import { canAccessTool, canEditLabs } from '@civica/permissions';
import type { CurrentUser, CurrentMembership } from '@civica/types';
import { getToolBySlug } from '@/lib/tools/registry';

export { getRequestMeta } from '@/server/actions/roster/roster-shared';

export interface LabsActionState {
  error?: string;
}

export interface LabsContext {
  user: CurrentUser;
  membership: CurrentMembership | null;
  clinicId: string;
  tenantDb: TenantDb;
  canEdit: boolean;
}

/**
 * Resolves the current user, membership, tenant DB, and edit permission for
 * Labs server actions. Returns an error string if the user isn't
 * authenticated, lacks Labs tool access, or has no clinic membership.
 */
export async function requireLabsContext(): Promise<LabsContext | { error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in.' };
  }

  const membership = await getEffectiveMembership(user);

  const tool = await getToolBySlug('labs');
  if (!tool) {
    return { error: 'Labs tool is not available.' };
  }

  const allowed = canAccessTool(user, membership, {
    enabled: tool.enabled,
    slug: tool.slug,
    requiredRoles: tool.requiredRoles,
  });
  if (!allowed) {
    return { error: 'You do not have access to the Labs tool.' };
  }

  if (!membership) {
    return { error: 'No clinic membership found.' };
  }

  const tenantDb = await getTenantDbByClinicId(membership.clinicId);
  const canEdit = canEditLabs(user, membership);

  return { user, membership, clinicId: membership.clinicId, tenantDb, canEdit };
}
