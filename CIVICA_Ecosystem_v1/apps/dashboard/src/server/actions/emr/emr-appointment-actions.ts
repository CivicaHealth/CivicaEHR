'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { emrAppointments } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { saveAppointmentSchema, updateAppointmentStatusSchema, deleteAppointmentSchema } from '@/lib/validation/emr';
import { getRequestMeta, requireEmrContext, type EmrActionState } from './emr-shared';

export async function saveAppointmentAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const rawAppointmentId = formData.get('appointmentId');
  const rawStatus = formData.get('status');
  const rawDuration = formData.get('durationMinutes');
  const parsed = saveAppointmentSchema.safeParse({
    emrPatientId: formData.get('emrPatientId'),
    appointmentId: rawAppointmentId ? rawAppointmentId : undefined,
    appointmentDate: formData.get('appointmentDate'),
    durationMinutes: rawDuration ? rawDuration : undefined,
    reason: formData.get('reason'),
    status: rawStatus ? rawStatus : undefined,
    notes: formData.get('notes'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const { emrPatientId, appointmentId, appointmentDate, durationMinutes, reason, status, notes } = parsed.data;
  const appointmentDateValue = new Date(appointmentDate);
  if (Number.isNaN(appointmentDateValue.getTime())) {
    return { error: 'Invalid date & time' };
  }

  let result;
  if (appointmentId) {
    [result] = await tenantDb
      .update(emrAppointments)
      .set({
        appointmentDate: appointmentDateValue,
        durationMinutes: durationMinutes ?? 30,
        reason,
        status: status ?? 'scheduled',
        notes: notes ?? '',
        updatedAt: new Date(),
      })
      .where(eq(emrAppointments.id, appointmentId))
      .returning();
  } else {
    [result] = await tenantDb
      .insert(emrAppointments)
      .values({
        emrPatientId,
        appointmentDate: appointmentDateValue,
        durationMinutes: durationMinutes ?? 30,
        reason,
        status: status ?? 'scheduled',
        notes: notes ?? '',
      })
      .returning();
  }

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: appointmentId ? AUDIT_ACTIONS.EMR_APPOINTMENT_UPDATED : AUDIT_ACTIONS.EMR_APPOINTMENT_CREATED,
    resourceType: 'emr_appointment',
    resourceId: result.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/emr/appointments');
  revalidatePath('/emr');
  return {};
}

export async function updateAppointmentStatusAction(formData: FormData): Promise<EmrActionState> {
  const parsed = updateAppointmentStatusSchema.safeParse({
    appointmentId: formData.get('appointmentId'),
    status: formData.get('status'),
  });
  if (!parsed.success) return { error: 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const [updated] = await tenantDb
    .update(emrAppointments)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(emrAppointments.id, parsed.data.appointmentId))
    .returning();
  if (!updated) return { error: 'Appointment not found.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_APPOINTMENT_STATUS_CHANGED,
    resourceType: 'emr_appointment',
    resourceId: updated.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { status: updated.status },
  });

  revalidatePath('/emr/appointments');
  revalidatePath('/emr');
  return {};
}

export async function deleteAppointmentAction(formData: FormData): Promise<EmrActionState> {
  const parsed = deleteAppointmentSchema.safeParse({ appointmentId: formData.get('appointmentId') });
  if (!parsed.success) return { error: 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const [removed] = await tenantDb
    .delete(emrAppointments)
    .where(eq(emrAppointments.id, parsed.data.appointmentId))
    .returning();
  if (!removed) return { error: 'Appointment not found.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_APPOINTMENT_DELETED,
    resourceType: 'emr_appointment',
    resourceId: removed.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/emr/appointments');
  revalidatePath('/emr');
  return {};
}
