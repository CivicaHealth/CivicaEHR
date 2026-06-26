import { redirect } from 'next/navigation';
import { ArrowLeft, Construction } from 'lucide-react';
import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getToolBySlug } from '@/lib/tools/registry';
import { ToolIcon } from '@/lib/tools/icons';
import { canAccessTool } from '@civica/permissions';
import { Card, CardTitle, CardDescription, Logo } from '@civica/ui';
import { LogoutButton } from '@/components/dashboard/logout-button';

/**
 * Shared shell for tool placeholder pages. Each tool route
 * (src/app/(tools)/<slug>/page.tsx) renders this with its own slug.
 * Performs the same authorization check as resolveToolLaunch, so direct
 * navigation to a tool URL is enforced even outside the dashboard launch flow.
 */
export async function ToolPlaceholderPage({ slug }: { slug: string }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const membership = await getEffectiveMembership(user);

  const tool = await getToolBySlug(slug);
  if (!tool) {
    redirect('/dashboard');
  }

  const allowed = canAccessTool(user, membership, {
    enabled: tool.enabled,
    slug: tool.slug,
    requiredRoles: tool.requiredRoles,
  });

  if (!allowed) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo href="/dashboard" />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
            <ToolIcon slug={tool.slug} className="h-6 w-6" aria-hidden="true" />
            <span className="absolute -bottom-1.5 -right-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--bg)] text-[var(--muted)]">
              <Construction className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
          <CardTitle>{tool.displayName}</CardTitle>
          <CardDescription className="max-w-md">{tool.description}</CardDescription>
          <p className="text-sm text-[var(--text-secondary)]">
            This tool is coming soon. Check back later for {tool.displayName.toLowerCase()} features.
          </p>
          <a
            href="/dashboard"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition-colors hover:text-[#256e73]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to dashboard
          </a>
        </Card>
      </main>
    </div>
  );
}
