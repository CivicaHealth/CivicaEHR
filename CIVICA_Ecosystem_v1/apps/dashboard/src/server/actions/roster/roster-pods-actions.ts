'use server';

import { revalidatePath } from 'next/cache';
import { desc, eq } from 'drizzle-orm';
import { pods, podAssignments } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import {
  createPodSchema,
  assignStaffSchema,
  toggleCleanupSchema,
} from '@/lib/validation/roster';
import { getRequestMeta, requireRosterContext, getOrCreateActiveRosterDay } from './roster-shared';
import type { RosterActionState } from './roster-day-actions';

export async function createPodAction(_prevState: RosterActionState, formData: FormData): Promise<RosterActionState> {
  const parsed = createPodSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const rosterDay = await getOrCreateActiveRosterDay(tenantDb);
  const { ipAddress, userAgent } = await getRequestMeta();

  const lastPod = await tenantDb.query.pods.findFirst({
    where: eq(pods.rosterDayId, rosterDay.id),
    orderBy: desc(pods.sortOrder),
  });
  const sortOrder = (lastPod?.sortOrder ?? -1) + 1;

  const [created] = await tenantDb
    .insert(pods)
    .values({ rosterDayId: rosterDay.id, name: parsed.data.name, sortOrder })
    .returning();

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_POD_CREATED,
    resourceType: 'roster_pod',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { rosterDayId: rosterDay.id },
  });

  revalidatePath('/roster', 'layout');
  return {};
}

export async function deletePodAction(podId: string): Promise<RosterActionState> {
  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  const [removed] = await tenantDb.delete(pods).where(eq(pods.id, podId)).returning();
  if (!removed) return { error: 'Pod not found.' };

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_POD_DELETED,
    resourceType: 'roster_pod',
    resourceId: removed.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { rosterDayId: removed.rosterDayId },
  });

  revalidatePath('/roster', 'layout');
  return {};
}

export async function assignStaffAction(_prevState: RosterActionState, formData: FormData): Promise<RosterActionState> {
  const parsed = assignStaffSchema.safeParse({
    podId: formData.get('podId'),
    personId: formData.get('personId'),
  });
  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const pod = await tenantDb.query.pods.findFirst({ where: eq(pods.id, parsed.data.podId) });
  if (!pod) return { error: 'Pod not found.' };

  const { ipAddress, userAgent } = await getRequestMeta();

  const [created] = await tenantDb
    .insert(podAssignments)
    .values({ podId: pod.id, personId: parsed.data.personId, rosterDayId: pod.rosterDayId })
    .onConflictDoNothing()
    .returning();

  if (created) {
    await logAuditEvent({
      actorUserId: user.id,
      clinicId,
      action: AUDIT_ACTIONS.ROSTER_STAFF_ASSIGNED,
      resourceType: 'roster_pod_assignment',
      resourceId: created.id,
      success: true,
      ipAddress,
      userAgent,
      metadata: { podId: pod.id },
    });
  }

  revalidatePath('/roster', 'layout');
  return {};
}

export async function unassignStaffAction(assignmentId: string): Promise<RosterActionState> {
  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  const [removed] = await tenantDb.delete(podAssignments).where(eq(podAssignments.id, assignmentId)).returning();
  if (!removed) return { error: 'Assignment not found.' };

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_STAFF_UNASSIGNED,
    resourceType: 'roster_pod_assignment',
    resourceId: removed.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { podId: removed.podId },
  });

  revalidatePath('/roster', 'layout');
  return {};
}

export async function toggleCleanupAction(podId: string, field: 'roomCleaned' | 'cubicleCleaned', value: boolean): Promise<RosterActionState> {
  const parsed = toggleCleanupSchema.safeParse({ podId, field, value });
  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  const updates = field === 'roomCleaned' ? { roomCleaned: value } : { cubicleCleaned: value };
  const [updated] = await tenantDb
    .update(pods)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(pods.id, podId))
    .returning();
  if (!updated) return { error: 'Pod not found.' };

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_CLEANUP_UPDATED,
    resourceType: 'roster_pod',
    resourceId: podId,
    success: true,
    ipAddress,
    userAgent,
    metadata: { field, value },
  });

  revalidatePath('/roster', 'layout');
  return {};
}
