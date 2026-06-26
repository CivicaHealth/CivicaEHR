import type { CurrentMembership, CurrentUser } from '@civica/types';

export const ROLE_NAMES = ['platform_admin', 'clinic_admin', 'member', 'doctor', 'nurse', 'front_desk', 'billing', 'inventory_manager', 'patient', 'auditor'] as const;
const EDIT_ROLES = new Set(['clinic_admin', 'doctor', 'nurse']);
const TOOL_BY_ROLE: Record<string, string[]> = {
  doctor: ['emr', 'labs', 'referrals', 'roster', 'patient-portal'],
  nurse: ['emr', 'labs', 'roster', 'patient-portal'],
  front_desk: ['roster', 'patient-portal'],
  billing: ['billing'],
  inventory_manager: ['inventory'],
  auditor: ['emr', 'labs', 'referrals', 'roster'],
  patient: ['patient-portal'],
};

export function canAccessTool(user: CurrentUser | null, membership: CurrentMembership | null, tool: { slug: string; requiredRoles?: string[] | null }) {
  if (!user) return false;
  if (user.isPlatformAdmin) return true;
  if (!membership || membership.status !== 'active') return false;
  if (membership.roleName === 'clinic_admin') return true;
  if (tool.requiredRoles?.includes(membership.roleName)) return true;
  if (TOOL_BY_ROLE[membership.roleName]?.includes(tool.slug)) return true;
  return Boolean(membership.toolAccess?.some((a) => a.toolSlug === tool.slug));
}

function canEditTool(user: CurrentUser | null, membership: CurrentMembership | null, slug: string) {
  if (!canAccessTool(user, membership, { slug })) return false;
  if (user?.isPlatformAdmin) return true;
  if (!membership) return false;
  if (EDIT_ROLES.has(membership.roleName)) return true;
  return membership.toolAccess?.some((a) => a.toolSlug === slug && a.level === 'supervisor') ?? false;
}

export const canEditEmr = (u: CurrentUser | null, m: CurrentMembership | null) => canEditTool(u, m, 'emr');
export const canEditLabs = (u: CurrentUser | null, m: CurrentMembership | null) => canEditTool(u, m, 'labs');
export const canEditRoster = (u: CurrentUser | null, m: CurrentMembership | null) => canEditTool(u, m, 'roster');
export const canEditReferrals = (u: CurrentUser | null, m: CurrentMembership | null) => canEditTool(u, m, 'referrals');
export const isValidToolAccessLevel = (level: string) => ['staff', 'supervisor'].includes(level);
