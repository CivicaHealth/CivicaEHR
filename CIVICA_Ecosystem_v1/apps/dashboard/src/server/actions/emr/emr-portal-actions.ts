'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { controlDb } from '@civica/db/control/client';
import { patientEnrollments } from '@civica/db/control/schema';
import {
  emrPatients,
  emrPatientContacts,
  emrEncounters,
  portalMessages,
  emrAppointmentRequests,
  emrRefillRequests,
} from '@civica/db/tenant/schema';
import { hashEnrollmentCode, generateEnrollmentCode } from '@civica/auth';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { sendPatientMessageNotification } from '@civica/email';
import { getLinkedPatientEmail } from '@/server/queries/emr-portal-queries';
import { getRequestMeta, requireEmrContext, type EmrActionState } from './emr-shared';

export interface EnrollmentCodeState {
  error?: string;
  code?: string;
}

const uuidSchema = z.string().uuid();

function portalLoginUrl(): string {
  const base = process.env.APP_URL ?? '';
  return `${base}/login`;
}

/**
 * Generates a one-time portal enrollment code for an EMR chart. The plaintext
 * code is returned to the caller exactly once (to read out / hand to the
 * patient) and only its hash is stored. Mirrors the chart's name/email so the
 * patient registration flow can soft-check them.
 */
export async function generateEnrollmentCodeAction(
  _prevState: EnrollmentCodeState,
  formData: FormData,
): Promise<EnrollmentCodeState> {
  const parsed = uuidSchema.safeParse(formData.get('emrPatientId'));
  if (!parsed.success) return { error: 'Invalid patient.' };
  const emrPatientId = parsed.data;

  const context = await requireEmrContext();
  if ('error' in context) return { error: context.error };
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to manage portal access.' };

  const patient = await tenantDb.query.emrPatients.findFirst({ where: eq(emrPatients.id, emrPatientId) });
  if (!patient) return { error: 'Patient not found.' };

  const code = generateEnrollmentCode();
  const { codeHash, codeIdentifierHash } = await hashEnrollmentCode(code);

  await controlDb.insert(patientEnrollments).values({
    clinicId,
    emrPatientId,
    codeHash,
    codeIdentifierHash,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email ?? '',
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.PATIENT_ENROLLMENT_CREATED,
    resourceType: 'patient_enrollment',
    resourceId: emrPatientId,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${emrPatientId}`);
  return { code };
}

const addContactSchema = z.object({
  emrPatientId: uuidSchema,
  email: z.email('Enter a valid email'),
  label: z.string().max(100).optional().or(z.literal('')),
});

export async function addCareContactAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const parsed = addContactSchema.safeParse({
    emrPatientId: formData.get('emrPatientId'),
    email: formData.get('email'),
    label: formData.get('label') ?? '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  await tenantDb
    .insert(emrPatientContacts)
    .values({
      emrPatientId: parsed.data.emrPatientId,
      email: parsed.data.email,
      label: parsed.data.label ? parsed.data.label : '',
    })
    .onConflictDoNothing();

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.PATIENT_CARE_CONTACT_ADDED,
    resourceType: 'emr_patient_contact',
    resourceId: parsed.data.emrPatientId,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${parsed.data.emrPatientId}`);
  return {};
}

export async function removeCareContactAction(formData: FormData): Promise<EmrActionState> {
  const parsed = uuidSchema.safeParse(formData.get('contactId'));
  if (!parsed.success) return { error: 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const [removed] = await tenantDb
    .delete(emrPatientContacts)
    .where(eq(emrPatientContacts.id, parsed.data))
    .returning();
  if (!removed) return { error: 'Contact not found.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.PATIENT_CARE_CONTACT_REMOVED,
    resourceType: 'emr_patient_contact',
    resourceId: removed.emrPatientId,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${removed.emrPatientId}`);
  return {};
}

const shareEncounterSchema = z.object({
  encounterId: uuidSchema,
  share: z.enum(['true', 'false']),
});

/** Toggles whether an encounter's visit summary is visible in the patient portal. */
export async function shareEncounterAction(formData: FormData): Promise<EmrActionState> {
  const parsed = shareEncounterSchema.safeParse({
    encounterId: formData.get('encounterId'),
    share: formData.get('share'),
  });
  if (!parsed.success) return { error: 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const share = parsed.data.share === 'true';
  const [updated] = await tenantDb
    .update(emrEncounters)
    .set({ sharedWithPatient: share })
    .where(eq(emrEncounters.id, parsed.data.encounterId))
    .returning();
  if (!updated) return { error: 'Encounter not found.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.RECORD_SHARED_WITH_PATIENT,
    resourceType: 'emr_encounter',
    resourceId: updated.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { shared: share },
  });

  revalidatePath(`/emr/patients/${updated.emrPatientId}`);
  return {};
}

const staffMessageSchema = z.object({
  emrPatientId: uuidSchema,
  body: z.string().min(1, 'Message cannot be empty').max(5000),
});

/** Staff reply in the patient message thread; notifies the patient (PHI-free). */
export async function sendStaffPortalMessageAction(
  _prevState: EmrActionState,
  formData: FormData,
): Promise<EmrActionState> {
  const parsed = staffMessageSchema.safeParse({
    emrPatientId: formData.get('emrPatientId'),
    body: formData.get('body'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to message patients.' };

  await tenantDb.insert(portalMessages).values({
    emrPatientId: parsed.data.emrPatientId,
    senderUserId: user.id,
    senderRole: 'staff',
    body: parsed.data.body,
  });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.PORTAL_MESSAGE_SENT,
    resourceType: 'portal_message',
    resourceId: parsed.data.emrPatientId,
    success: true,
    ipAddress,
    userAgent,
    metadata: { senderRole: 'staff' },
  });

  const patientEmail = await getLinkedPatientEmail(parsed.data.emrPatientId);
  if (patientEmail) await sendPatientMessageNotification(patientEmail, portalLoginUrl());

  revalidatePath(`/emr/patients/${parsed.data.emrPatientId}`);
  return {};
}

const updateRequestSchema = z.object({
  requestId: uuidSchema,
  status: z.enum(['approved', 'declined']),
  staffNote: z.string().max(255).optional().or(z.literal('')),
});

export async function updateAppointmentRequestAction(formData: FormData): Promise<EmrActionState> {
  const parsed = updateRequestSchema.safeParse({
    requestId: formData.get('requestId'),
    status: formData.get('status'),
    staffNote: formData.get('staffNote') ?? '',
  });
  if (!parsed.success) return { error: 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const [updated] = await tenantDb
    .update(emrAppointmentRequests)
    .set({ status: parsed.data.status, staffNote: parsed.data.staffNote ?? '', updatedAt: new Date() })
    .where(eq(emrAppointmentRequests.id, parsed.data.requestId))
    .returning();
  if (!updated) return { error: 'Request not found.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_APPOINTMENT_REQUEST_UPDATED,
    resourceType: 'emr_appointment_request',
    resourceId: updated.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { status: updated.status },
  });

  revalidatePath(`/emr/patients/${updated.emrPatientId}`);
  return {};
}

export async function updateRefillRequestAction(formData: FormData): Promise<EmrActionState> {
  const parsed = updateRequestSchema.safeParse({
    requestId: formData.get('requestId'),
    status: formData.get('status'),
    staffNote: formData.get('staffNote') ?? '',
  });
  if (!parsed.success) return { error: 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const [updated] = await tenantDb
    .update(emrRefillRequests)
    .set({ status: parsed.data.status, staffNote: parsed.data.staffNote ?? '', updatedAt: new Date() })
    .where(eq(emrRefillRequests.id, parsed.data.requestId))
    .returning();
  if (!updated) return { error: 'Request not found.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_REFILL_REQUEST_UPDATED,
    resourceType: 'emr_refill_request',
    resourceId: updated.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { status: updated.status },
  });

  revalidatePath(`/emr/patients/${updated.emrPatientId}`);
  return {};
}
