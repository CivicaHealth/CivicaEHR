import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { emrAppointments } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { patchAppointmentSchema } from '@/lib/validation/emr';
import { getRequestMeta, requireEmrContext } from '@/server/actions/emr/emr-shared';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid appointment id' }, { status: 400 });
  }

  const context = await requireEmrContext();
  if ('error' in context) {
    return NextResponse.json({ error: context.error }, { status: 403 });
  }
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) {
    return NextResponse.json({ error: 'You do not have permission to edit EMR records.' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = patchAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { emrPatientId, appointmentDate, durationMinutes, reason, status, notes } = parsed.data;
  const updates: Partial<typeof emrAppointments.$inferInsert> = { updatedAt: new Date() };
  if (emrPatientId) updates.emrPatientId = emrPatientId;
  if (durationMinutes) updates.durationMinutes = durationMinutes;
  if (reason) updates.reason = reason;
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (appointmentDate) {
    const appointmentDateValue = new Date(appointmentDate);
    if (Number.isNaN(appointmentDateValue.getTime())) {
      return NextResponse.json({ error: 'Invalid date & time' }, { status: 400 });
    }
    updates.appointmentDate = appointmentDateValue;
  }

  const [updated] = await tenantDb.update(emrAppointments).set(updates).where(eq(emrAppointments.id, id)).returning();
  if (!updated) {
    return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
  }

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_APPOINTMENT_UPDATED,
    resourceType: 'emr_appointment',
    resourceId: updated.id,
    success: true,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ id: updated.id });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid appointment id' }, { status: 400 });
  }

  const context = await requireEmrContext();
  if ('error' in context) {
    return NextResponse.json({ error: context.error }, { status: 403 });
  }
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) {
    return NextResponse.json({ error: 'You do not have permission to edit EMR records.' }, { status: 403 });
  }

  const [removed] = await tenantDb.delete(emrAppointments).where(eq(emrAppointments.id, id)).returning();
  if (!removed) {
    return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
  }

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

  return NextResponse.json({ ok: true });
}
