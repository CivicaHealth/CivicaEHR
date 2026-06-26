import Link from 'next/link';
import { UserX } from 'lucide-react';
import { listUsersWithMemberships, listRoles, listActiveClinics } from '@civica/db/control/users';
import { getAllTools } from '@/lib/tools/registry';
import { Card, CardTitle, CardDescription, Input, Button, Badge, Select } from '@civica/ui';
import { requireAdminAccess } from '@/lib/admin/access';
import { changeMembershipRoleAction, setMembershipToolAccessAction } from '@/server/actions/admin-actions';
import { CreateUserButton } from '@/components/tools/admin/create-user-form';

const MEMBERSHIP_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  active: 'success',
  disabled: 'danger',
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; deleted?: string; userError?: string }>;
}) {
  const { q, deleted, userError } = await searchParams;
  const { user: admin, clinicId } = await requireAdminAccess();

  const [users, allRoles, allTools, activeClinics] = await Promise.all([
    listUsersWithMemberships(q, clinicId ?? undefined, admin.id),
    listRoles(),
    getAllTools(),
    listActiveClinics(),
  ]);
  const assignableRoles = allRoles.filter((role) => role.name !== 'platform_admin');
  const assignableTools = allTools.filter((tool) => tool.slug !== 'admin');
  const redirectTo = q ? `/admin?q=${encodeURIComponent(q)}` : '/admin';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--navy)]">Admin</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {clinicId === null
              ? 'Manage user roles and access across the platform.'
              : 'Manage roles and membership status for users in your clinic.'}
          </p>
        </div>
        <CreateUserButton
          clinics={activeClinics}
          roles={allRoles}
          canAssignClinicAdmin={clinicId === null}
        />
      </div>

      {deleted && (
        <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
          Account deleted.
        </div>
      )}
      {userError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          Couldn&apos;t delete that account — it may not exist, or you can&apos;t delete your own account.
        </div>
      )}

      <form className="mb-4">
        <Input type="search" name="q" placeholder="Search by name or email" defaultValue={q ?? ''} />
      </form>

      <div className="space-y-4">
        {users.length === 0 && (
          <Card>
            <CardDescription>No users found.</CardDescription>
          </Card>
        )}

        {users.map((user) => (
          <Card key={user.id} className="space-y-2 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Link href={`/admin/users/${user.id}`} className="transition-colors hover:text-[var(--accent)]">
                  <span className="font-medium text-[var(--navy)]">{user.name}</span>
                </Link>
                <span className="text-sm text-[var(--text-secondary)]">{user.email}</span>
                {!user.isActive && (
                  <Badge variant="danger">
                    <UserX className="h-3.5 w-3.5" aria-hidden="true" />
                    Disabled
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              {user.clinicMemberships.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)]">No clinic memberships</p>
              )}

              {user.clinicMemberships.map((membership) => {
                const accessByTool = Object.fromEntries(membership.toolAccess.map((ta) => [ta.toolSlug, ta.level]));

                return (
                  <details key={membership.id} className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]">
                    <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-3 py-2 text-sm">
                      <Badge variant={MEMBERSHIP_STATUS_VARIANT[membership.status]}>{membership.status}</Badge>
                      {clinicId === null && (
                        <span className="font-medium text-[var(--navy)]">{membership.clinic.name}</span>
                      )}
                      <span className="text-[var(--text-secondary)]">{membership.role.name}</span>
                      <span className="ml-auto text-xs text-[var(--text-secondary)] group-open:hidden">
                        Click to manage
                      </span>
                    </summary>

                    <div className="space-y-3 border-t border-[var(--border)] px-3 py-3">
                      <form action={changeMembershipRoleAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="membershipId" value={membership.id} />
                        <input type="hidden" name="redirectTo" value={redirectTo} />
                        <span className="text-sm text-[var(--text-secondary)]">Role</span>
                        <Select name="roleId" defaultValue={membership.roleId} className="py-1 text-xs">
                          {assignableRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit" variant="secondary" className="px-2.5 py-1 text-xs">
                          Save
                        </Button>
                      </form>

                      {membership.role.name === 'member' && (
                        <div className="grid grid-cols-1 gap-2 border-t border-[var(--border)] pt-3 sm:grid-cols-2 lg:grid-cols-3">
                          {assignableTools.map((tool) => (
                            <form
                              key={tool.slug}
                              action={setMembershipToolAccessAction}
                              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
                            >
                              <input type="hidden" name="membershipId" value={membership.id} />
                              <input type="hidden" name="toolSlug" value={tool.slug} />
                              <input type="hidden" name="redirectTo" value={redirectTo} />
                              <span className="text-sm text-[var(--text-secondary)]">{tool.displayName}</span>
                              <span className="flex items-center gap-1.5">
                                <Select name="level" defaultValue={accessByTool[tool.slug] ?? 'none'} className="py-1 text-xs">
                                  <option value="none">No access</option>
                                  <option value="viewer">Viewer</option>
                                  <option value="supervisor">Supervisor</option>
                                </Select>
                                <Button type="submit" variant="secondary" className="px-2 py-1 text-xs">
                                  Save
                                </Button>
                              </span>
                            </form>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
