import { canAccessTool } from '@civica/permissions';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { getToolBySlug } from '@/lib/tools/registry';
import type { CurrentUser, CurrentMembership } from '@civica/auth';

export interface ToolLaunchResult {
  allowed: boolean;
  redirectPath?: string;
  reason?: string;
}

/**
 * Resolves whether the current user may launch a tool by slug, logging the
 * attempt and outcome to the audit log. Does not redirect itself — callers
 * (server actions / page components) act on the returned result.
 */
export async function resolveToolLaunch(
  toolSlug: string,
  user: CurrentUser,
  membership: CurrentMembership | null,
): Promise<ToolLaunchResult> {
  await logAuditEvent({
    actorUserId: user.id,
    clinicId: membership?.clinicId ?? null,
    action: AUDIT_ACTIONS.TOOL_LAUNCH_ATTEMPT,
    resourceType: 'tool',
    resourceId: toolSlug,
    success: true,
  });

  const tool = await getToolBySlug(toolSlug);

  if (!tool) {
    await logAuditEvent({
      actorUserId: user.id,
      clinicId: membership?.clinicId ?? null,
      action: AUDIT_ACTIONS.TOOL_LAUNCH_DENIED,
      resourceType: 'tool',
      resourceId: toolSlug,
      success: false,
      failureReason: 'not_found',
    });
    return { allowed: false, reason: 'not_found' };
  }

  const allowed = canAccessTool(user, membership, {
    enabled: tool.enabled,
    slug: tool.slug,
    requiredRoles: tool.requiredRoles,
  });

  if (!allowed) {
    await logAuditEvent({
      actorUserId: user.id,
      clinicId: membership?.clinicId ?? null,
      action: AUDIT_ACTIONS.TOOL_LAUNCH_DENIED,
      resourceType: 'tool',
      resourceId: toolSlug,
      success: false,
      failureReason: 'access_denied',
    });
    return { allowed: false, reason: 'access_denied' };
  }

  await logAuditEvent({
    actorUserId: user.id,
    clinicId: membership?.clinicId ?? null,
    action: AUDIT_ACTIONS.TOOL_LAUNCH_SUCCESS,
    resourceType: 'tool',
    resourceId: toolSlug,
    success: true,
  });

  const redirectPath =
    tool.routeType === 'internal' ? (tool.internalPath ?? `/tools/${tool.slug}`) : (tool.externalUrl ?? undefined);

  return { allowed: true, redirectPath };
}
