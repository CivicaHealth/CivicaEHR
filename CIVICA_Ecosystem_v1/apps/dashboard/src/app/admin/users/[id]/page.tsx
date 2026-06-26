import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getUserWithMembershipsById, listRoles } from '@civica/db/control/users';
import { getAllTools } from '@/lib/tools/registry';
import { Card, CardTitle, CardDescription, Button, Badge, Select } from '@civica/ui';
import { requireAdminAccess } from '@/lib/admin/access';
import {
  changeMembershipRoleAction,
  changeMembershipStatusAction,
  setUserActiveAction,
  setPlatformAdminAction,
  setMembershipToolAccessAction,
  deleteUserAction,
} from '@/server/actions/admin-actions';
import { ConfirmDeleteForm } from '@/components/admin/confirm-delete-form';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  active: 'success',
  disabled: 'danger',
};

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ userError?: string }>;
}) {
  const { id } = await params;
  const { userError } = await searchParams;
  const { user: admin, clinicId } = await requireAdminAccess();

  const [user, allRoles, allTools] = await Promise.all([getUserWithMembershipsById(id), listRoles(), getAllTools()]);
  if (!user) {
    notFound();
  }
  const assignableTools = allTools.filter((tool) => tool.slug !== 'admin');

  // Clinic admins may only view/manage memberships in their own clinic.
  const memberships = clinicId === null ? user.clinicMemberships : user.clinicMemberships.filter((m) => m.clinicId === clinicId);
  if (clinicId !== null && memberships.length === 0) {
    notFound();
  }
  // platform_admin is a cross-clinic user flag, not an assignable membership role.
  const roles = allRoles.filter((role) => role.name !== 'platform_admin');

  const isSelf = user.id === admin.id;
  const canManageAccount = clinicId === null && !isSelf;

  return (
    <>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--navy)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Admin
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--navy)]">{user.name}</h1>
        <CardDescription>{user.email}</CardDescription>
      </div>

      {userError && (
        <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          That didn&apos;t match — type the email exactly to confirm deletion.
        </div>
      )}

      {clinicId === null && (
        <Card className="mb-6 space-y-4">
          <CardTitle>Account</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Active' : 'Disabled'}</Badge>
            {user.isPlatformAdmin && <Badge variant="accent">Platform admin</Badge>}
          </div>

          {canManageAccount ? (
            <>
              <div className="flex flex-wrap gap-2">
                <form action={setUserActiveAction.bind(null, user.id, !user.isActive)}>
                  <Button type="submit" variant={user.isActive ? 'secondary' : 'primary'} className="px-3 py-1.5 text-xs">
                    {user.isActive ? 'Disable account' : 'Enable account'}
                  </Button>
                </form>
                <form action={setPlatformAdminAction.bind(null, user.id, !user.isPlatformAdmin)}>
                  <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
                    {user.isPlatformAdmin ? 'Revoke platform admin' : 'Grant platform admin'}
                  </Button>
                </form>
              </div>
              <div className="border-t border-[var(--border)] pt-4">
                <ConfirmDeleteForm
                  action={deleteUserAction}
                  hiddenFields={{ userId: user.id }}
                  confirmValue={user.email}
                  confirmLabel={`Type "${user.email}" to permanently delete this account and every clinic membership it has.`}
                  triggerLabel="Delete account"
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              You cannot change your own account status, platform-admin access, or delete your own account.
            </p>
          )}
        </Card>
      )}

      <div className="mb-3">
        <CardTitle>Clinic memberships</CardTitle>
      </div>

      <div className="space-y-4">
        {memberships.length === 0 && <CardDescription>This user has no clinic memberships.</CardDescription>}
        {memberships.map((membership) => (
          <Card key={membership.id} className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{membership.clinic.name}</CardTitle>
              <Badge variant={STATUS_VARIANT[membership.status]}>{membership.status}</Badge>
            </div>

            <form action={changeMembershipRoleAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="membershipId" value={membership.id} />
              <label htmlFor={`role-${membership.id}`} className="text-sm text-[var(--text-secondary)]">
                Role
              </label>
              <Select id={`role-${membership.id}`} name="roleId" defaultValue={membership.roleId}>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
                Save role
              </Button>
            </form>

            {membership.role.name === 'member' && (
              <div className="space-y-2 border-t border-[var(--border)] pt-4">
                <p className="text-sm font-medium text-[var(--navy)]">Tool access</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {assignableTools.map((tool) => {
                    const access = membership.toolAccess.find((ta) => ta.toolSlug === tool.slug);
                    return (
                      <form
                        key={tool.slug}
                        action={setMembershipToolAccessAction}
                        className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
                      >
                        <input type="hidden" name="membershipId" value={membership.id} />
                        <input type="hidden" name="toolSlug" value={tool.slug} />
                        <input type="hidden" name="redirectTo" value={`/admin/users/${user.id}`} />
                        <span className="text-sm text-[var(--text-secondary)]">{tool.displayName}</span>
                        <span className="flex items-center gap-1.5">
                          <Select name="level" defaultValue={access?.level ?? 'none'} className="py-1 text-xs">
                            <option value="none">No access</option>
                            <option value="viewer">Viewer</option>
                            <option value="supervisor">Supervisor</option>
                          </Select>
                          <Button type="submit" variant="secondary" className="px-2 py-1 text-xs">
                            Save
                          </Button>
                        </span>
                      </form>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
              {membership.status !== 'active' && (
                <form action={changeMembershipStatusAction.bind(null, membership.id, 'active')}>
                  <Button type="submit" variant="primary" className="px-3 py-1.5 text-xs">
                    Activate
                  </Button>
                </form>
              )}
              {membership.status !== 'disabled' && (
                <form action={changeMembershipStatusAction.bind(null, membership.id, 'disabled')}>
                  <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
                    Disable
                  </Button>
                </form>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
