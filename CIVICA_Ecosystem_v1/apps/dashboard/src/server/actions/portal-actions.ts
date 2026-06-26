'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { portalMessages, emrAppointmentRequests, emrRefillRequests } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { sendPortalMessageNotification } from '@civica/email';
import { requirePatientContext } from '@/lib/portal/context';
import { getCareContactEmails, isMedicationRefillable } from '@/server/queries/portal-queries';
import {
  sendPortalMessageSchema,
  requestAppointmentSchema,
  requestRefillSchema,
} from '@/lib/validation/portal';

export interface PortalActionState {
  error?: string;
}

async function getRequestMeta(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for');
  return {
    ipAddress: forwardedFor ? forwardedFor.split(',')[0].trim() : null,
    userAgent: headerList.get('user-agent'),
  };
}

function portalUrl(path: string): string {
  const base = process.env.APP_URL ?? '';
  return `${base}${path}`;
}

/**
 * Patient sends a secure message to their care team. Emails every care-contact
 * address on the chart a PHI-free "you have a new message" notification.
 */
export async function sendPortalMessageAction(
  _prevState: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const parsed = sendPortalMessageSchema.safeParse({ body: formData.get('body') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const { user, link, tenantDb } = await requirePatientContext();

  await tenantDb.insert(portalMessages).values({
    emrPatientId: link.emrPatientId,
    senderUserId: user.id,
    senderRole: 'patient',
    body: parsed.data.body,
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId: link.clinicId,
    action: AUDIT_ACTIONS.PORTAL_MESSAGE_SENT,
    resourceType: 'portal_message',
    success: true,
    ipAddress,
    userAgent,
    metadata: { senderRole: 'patient' },
  });

  // Notify care contacts -- PHI-free, never includes the message body.
  const contacts = await getCareContactEmails(tenantDb, link.emrPatientId);
  await Promise.all(contacts.map((email) => sendPortalMessageNotification(email, portalUrl('/login'))));

  revalidatePath('/patient-portal/messages');
  revalidatePath('/patient-portal');
  return {};
}

/** Patient requests an appointment; staff confirm/schedule it in the EMR. */
export async function requestAppointmentAction(
  _prevState: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const parsed = requestAppointmentSchema.safeParse({
    reason: formData.get('reason'),
    preferredDate: formData.get('preferredDate') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const { user, link, tenantDb } = await requirePatientContext();

  const [created] = await tenantDb
    .insert(emrAppointmentRequests)
    .values({
      emrPatientId: link.emrPatientId,
      reason: parsed.data.reason,
      preferredDate: parsed.data.preferredDate ? parsed.data.preferredDate : null,
    })
    .returning();

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId: link.clinicId,
    action: AUDIT_ACTIONS.PATIENT_APPOINTMENT_REQUESTED,
    resourceType: 'emr_appointment_request',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/patient-portal/requests');
  return {};
}

/** Patient requests a refill on one of their shared medications. */
export async function requestRefillAction(
  _prevState: PortalActionState,
  formData: FormData,
): Promise<PortalActionState> {
  const parsed = requestRefillSchema.safeParse({
    medicationId: formData.get('medicationId'),
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const { user, link, tenantDb } = await requirePatientContext();

  // IDOR guard: the medication must belong to an encounter shared with THIS patient.
  const allowed = await isMedicationRefillable(tenantDb, link.emrPatientId, parsed.data.medicationId);
  if (!allowed) return { error: 'That medication is not available for refill.' };

  const [created] = await tenantDb
    .insert(emrRefillRequests)
    .values({
      emrPatientId: link.emrPatientId,
      medicationId: parsed.data.medicationId,
      note: parsed.data.note ? parsed.data.note : '',
    })
    .returning();

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId: link.clinicId,
    action: AUDIT_ACTIONS.PATIENT_REFILL_REQUESTED,
    resourceType: 'emr_refill_request',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/patient-portal/requests');
  return {};
}
