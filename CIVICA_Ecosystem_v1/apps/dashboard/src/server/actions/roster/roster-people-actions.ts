'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { people, podAssignments, rosterDayPreceptors } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import {
  addPersonSchema,
  updatePersonSchema,
  removePersonSchema,
  markPreceptorPresentSchema,
  removePreceptorSchema,
} from '@/lib/validation/roster';
import { getRequestMeta, requireRosterContext, getOrCreateActiveRosterDay } from './roster-shared';
import type { RosterActionState } from './roster-day-actions';

export async function addPersonAction(_prevState: RosterActionState, formData: FormData): Promise<RosterActionState> {
  const parsed = addPersonSchema.safeParse({
    name: formData.get('name'),
    role: formData.get('role'),
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  const [created] = await tenantDb.insert(people).values(parsed.data).returning();

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_PERSON_ADDED,
    resourceType: 'roster_person',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { role: created.role },
  });

  revalidatePath('/roster', 'layout');
  return {};
}

export async function updatePersonAction(_prevState: RosterActionState, formData: FormData): Promise<RosterActionState> {
  const parsed = updatePersonSchema.safeParse({
    personId: formData.get('personId'),
    name: formData.get('name'),
    role: formData.get('role'),
    notes: formData.get('notes') || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const { personId, ...values } = parsed.data;
  const { ipAddress, userAgent } = await getRequestMeta();

  await tenantDb.update(people).set({ ...values, updatedAt: new Date() }).where(eq(people.id, personId));

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_PERSON_UPDATED,
    resourceType: 'roster_person',
    resourceId: personId,
    success: true,
    ipAddress,
    userAgent,
    metadata: { role: values.role },
  });

  revalidatePath('/roster', 'layout');
  return {};
}

/**
 * Hard-deletes a person only if they have no roster history (no pod
 * assignments or preceptor-present records, on any day) -- otherwise
 * pod_assignments/roster_day_preceptors FKs (onDelete: 'restrict') would
 * block the delete anyway, so we check first to return a clear error.
 */
export async function removePersonAction(_prevState: RosterActionState, formData: FormData): Promise<RosterActionState> {
  const parsed = removePersonSchema.safeParse({ personId: formData.get('personId') });
  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const { personId } = parsed.data;

  const [assignment, preceptorDay] = await Promise.all([
    tenantDb.query.podAssignments.findFirst({ where: eq(podAssignments.personId, personId) }),
    tenantDb.query.rosterDayPreceptors.findFirst({ where: eq(rosterDayPreceptors.personId, personId) }),
  ]);

  if (assignment || preceptorDay) {
    return { error: 'This person has roster history and cannot be removed. Consider editing their name or role instead.' };
  }

  const { ipAddress, userAgent } = await getRequestMeta();
  const [removed] = await tenantDb.delete(people).where(eq(people.id, personId)).returning();
  if (!removed) return { error: 'Person not found.' };

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_PERSON_REMOVED,
    resourceType: 'roster_person',
    resourceId: personId,
    success: true,
    ipAddress,
    userAgent,
    metadata: { role: removed.role },
  });

  revalidatePath('/roster', 'layout');
  return {};
}

export async function markPreceptorPresentAction(_prevState: RosterActionState, formData: FormData): Promise<RosterActionState> {
  const parsed = markPreceptorPresentSchema.safeParse({ personId: formData.get('personId') });
  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const rosterDay = await getOrCreateActiveRosterDay(tenantDb);
  const { ipAddress, userAgent } = await getRequestMeta();

  const [created] = await tenantDb
    .insert(rosterDayPreceptors)
    .values({ rosterDayId: rosterDay.id, personId: parsed.data.personId })
    .onConflictDoNothing()
    .returning();

  if (created) {
    await logAuditEvent({
      actorUserId: user.id,
      clinicId,
      action: AUDIT_ACTIONS.ROSTER_PRECEPTOR_MARKED_PRESENT,
      resourceType: 'roster_preceptor',
      resourceId: created.id,
      success: true,
      ipAddress,
      userAgent,
      metadata: { rosterDayId: rosterDay.id },
    });
  }

  revalidatePath('/roster', 'layout');
  return {};
}

export async function removePreceptorAction(preceptorId: string): Promise<RosterActionState> {
  const parsed = removePreceptorSchema.safeParse({ preceptorId });
  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  const [removed] = await tenantDb
    .delete(rosterDayPreceptors)
    .where(eq(rosterDayPreceptors.id, parsed.data.preceptorId))
    .returning();

  if (!removed) return { error: 'Preceptor record not found.' };

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_PRECEPTOR_REMOVED,
    resourceType: 'roster_preceptor',
    resourceId: removed.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { rosterDayId: removed.rosterDayId },
  });

  revalidatePath('/roster', 'layout');
  return {};
}
