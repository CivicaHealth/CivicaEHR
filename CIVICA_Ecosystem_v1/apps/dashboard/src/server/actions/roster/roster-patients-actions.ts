'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { patients, pods } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { addPatientSchema, reassignPatientSchema } from '@/lib/validation/roster';
import { getRequestMeta, requireRosterContext, getOrCreateActiveRosterDay } from './roster-shared';
import type { RosterActionState } from './roster-day-actions';

export async function addPatientAction(_prevState: RosterActionState, formData: FormData): Promise<RosterActionState> {
  const rawPodId = formData.get('podId');
  const parsed = addPatientSchema.safeParse({
    podId: rawPodId ? rawPodId : null,
    prn: formData.get('prn'),
    name: formData.get('name'),
    appointmentTime: formData.get('appointmentTime'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const rosterDay = await getOrCreateActiveRosterDay(tenantDb);
  const { podId, ...rest } = parsed.data;

  if (podId) {
    const pod = await tenantDb.query.pods.findFirst({ where: eq(pods.id, podId) });
    if (!pod || pod.rosterDayId !== rosterDay.id) return { error: 'Pod not found.' };
  }

  const { ipAddress, userAgent } = await getRequestMeta();
  const [created] = await tenantDb
    .insert(patients)
    .values({ ...rest, podId: podId ?? null, rosterDayId: rosterDay.id })
    .returning();

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_PATIENT_ADDED,
    resourceType: 'roster_patient',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { podId: created.podId },
  });

  revalidatePath('/roster', 'layout');
  return {};
}

export async function reassignPatientAction(_prevState: RosterActionState, formData: FormData): Promise<RosterActionState> {
  const rawPodId = formData.get('podId');
  const parsed = reassignPatientSchema.safeParse({
    patientId: formData.get('patientId'),
    podId: rawPodId ? rawPodId : null,
  });
  if (!parsed.success) {
    return { error: 'Invalid input' };
  }

  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const existing = await tenantDb.query.patients.findFirst({ where: eq(patients.id, parsed.data.patientId) });
  if (!existing) return { error: 'Patient not found.' };

  if (parsed.data.podId) {
    const pod = await tenantDb.query.pods.findFirst({ where: eq(pods.id, parsed.data.podId) });
    if (!pod || pod.rosterDayId !== existing.rosterDayId) return { error: 'Pod not found.' };
  }

  const { ipAddress, userAgent } = await getRequestMeta();
  await tenantDb
    .update(patients)
    .set({ podId: parsed.data.podId, updatedAt: new Date() })
    .where(eq(patients.id, parsed.data.patientId));

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_PATIENT_REASSIGNED,
    resourceType: 'roster_patient',
    resourceId: parsed.data.patientId,
    success: true,
    ipAddress,
    userAgent,
    metadata: { fromPodId: existing.podId, toPodId: parsed.data.podId },
  });

  revalidatePath('/roster', 'layout');
  return {};
}

export async function removePatientAction(patientId: string): Promise<RosterActionState> {
  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit the roster.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  const [removed] = await tenantDb.delete(patients).where(eq(patients.id, patientId)).returning();
  if (!removed) return { error: 'Patient not found.' };

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_PATIENT_REMOVED,
    resourceType: 'roster_patient',
    resourceId: removed.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { podId: removed.podId },
  });

  revalidatePath('/roster', 'layout');
  return {};
}
