import { NextResponse } from 'next/server';
import { and, gte, lte } from 'drizzle-orm';
import { emrAppointments } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { saveAppointmentSchema } from '@/lib/validation/emr';
import { getRequestMeta, requireEmrContext } from '@/server/actions/emr/emr-shared';

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#2f80ed',
  arrived: '#2e7d32',
  in_progress: '#e65100',
  completed: '#27ae60',
  cancelled: '#e74c3c',
  no_show: '#e67e22',
};

export async function GET(request: Request) {
  const context = await requireEmrContext();
  if ('error' in context) {
    return NextResponse.json({ error: context.error }, { status: 403 });
  }
  const { tenantDb } = context;

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const conditions = [];
  if (start) conditions.push(gte(emrAppointments.appointmentDate, new Date(start)));
  if (end) conditions.push(lte(emrAppointments.appointmentDate, new Date(end)));

  const appointments = await tenantDb.query.emrAppointments.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: {
      patient: { columns: { id: true, firstName: true, lastName: true } },
    },
  });

  const events = appointments.map((appt) => {
    const endDate = new Date(appt.appointmentDate);
    endDate.setMinutes(endDate.getMinutes() + appt.durationMinutes);
    return {
      id: appt.id,
      title: `${appt.patient.lastName}, ${appt.patient.firstName}`,
      start: appt.appointmentDate,
      end: endDate.toISOString(),
      color: STATUS_COLORS[appt.status] ?? STATUS_COLORS.scheduled,
      extendedProps: {
        patientId: appt.emrPatientId,
        reason: appt.reason,
        status: appt.status,
        notes: appt.notes,
        duration: appt.durationMinutes,
      },
    };
  });

  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const context = await requireEmrContext();
  if ('error' in context) {
    return NextResponse.json({ error: context.error }, { status: 403 });
  }
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) {
    return NextResponse.json({ error: 'You do not have permission to edit EMR records.' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = saveAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const { emrPatientId, appointmentDate, durationMinutes, reason, status, notes } = parsed.data;
  const appointmentDateValue = new Date(appointmentDate);
  if (Number.isNaN(appointmentDateValue.getTime())) {
    return NextResponse.json({ error: 'Invalid date & time' }, { status: 400 });
  }

  const [created] = await tenantDb
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

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_APPOINTMENT_CREATED,
    resourceType: 'emr_appointment',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
