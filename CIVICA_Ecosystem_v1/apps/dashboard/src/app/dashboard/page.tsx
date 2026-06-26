import { getCurrentUser, getEffectiveMembership } from '@civica/auth';
import { getDashboardTools } from '@/lib/tools/registry';
import { UserSummaryCard } from '@/components/dashboard/user-summary-card';
import { ToolGrid } from '@/components/dashboard/tool-grid';

export default async function DashboardPage() {
  // Layout guarantees a valid session; getCurrentUser() is cheap (single query).
  const user = (await getCurrentUser())!;
  const membership = await getEffectiveMembership(user);
  const tools = await getDashboardTools(user, membership);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--navy)]">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Here&apos;s your account overview and the tools available to you.
        </p>
      </div>

      <UserSummaryCard user={user} membership={membership} />

      <div>
        <h2 className="mb-1 text-lg font-semibold tracking-tight text-[var(--navy)]">Tools</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">Launch a clinic tool below.</p>
        <ToolGrid tools={tools} />
      </div>
    </div>
  );
}
