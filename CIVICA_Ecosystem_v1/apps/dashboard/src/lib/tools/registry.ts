import { asc, eq } from 'drizzle-orm';
import { controlDb } from '@civica/db/control/client';
import { toolRegistry } from '@civica/db/control/schema';
import { canAccessTool } from '@civica/permissions';
import type { CurrentUser, CurrentMembership } from '@civica/auth';

export interface ToolCardData {
  slug: string;
  displayName: string;
  description: string | null;
  iconLabel: string | null;
  internalPath: string | null;
  externalUrl: string | null;
  routeType: 'internal' | 'external';
  accessible: boolean;
}

export async function getAllTools() {
  return controlDb.query.toolRegistry.findMany({ orderBy: asc(toolRegistry.sortOrder) });
}

export async function getToolBySlug(slug: string) {
  return controlDb.query.toolRegistry.findFirst({ where: eq(toolRegistry.slug, slug) });
}

/**
 * Returns enabled tools for the dashboard, annotated with whether the
 * current user can access each one. Disabled tools are omitted entirely.
 */
export async function getDashboardTools(
  user: CurrentUser,
  membership: CurrentMembership | null,
): Promise<ToolCardData[]> {
  const tools = await getAllTools();

  return tools
    .filter((tool) => tool.enabled)
    .map((tool) => ({
      slug: tool.slug,
      displayName: tool.displayName,
      description: tool.description,
      iconLabel: tool.iconLabel,
      internalPath: tool.internalPath,
      externalUrl: tool.externalUrl,
      routeType: tool.routeType,
      accessible: canAccessTool(user, membership, {
        enabled: tool.enabled,
        slug: tool.slug,
        requiredRoles: tool.requiredRoles,
      }),
    }));
}
