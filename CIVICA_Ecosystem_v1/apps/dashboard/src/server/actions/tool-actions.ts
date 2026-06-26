'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { resolveToolLaunch } from '@/lib/tools/launch';

/**
 * Resolves access for a tool by slug and redirects: to the tool's path if
 * allowed, back to the dashboard with an error flag if not.
 */
export async function launchToolAction(toolSlug: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const membership = await getEffectiveMembership(user);

  const result = await resolveToolLaunch(toolSlug, user, membership);

  if (!result.allowed || !result.redirectPath) {
    redirect('/dashboard?toolError=1');
  }

  redirect(result.redirectPath);
}
