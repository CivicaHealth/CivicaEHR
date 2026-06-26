'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { emrLabRequests, emrLabTestTypes, labNotificationContacts } from '@civica/db/tenant/schema';
import { controlDb } from '@civica/db/control/client';
import { patientLinks, users } from '@civica/db/control/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import {
  sendLabRequestNotification,
  sendLabResultReadyNotification,
  sendLabReviewNeededNotification,
} from '@civica/email';
import {
  createLabRequestSchema,
  updateLabRequestStatusSchema,
  reviewLabRequestSchema,
  addLabTestTypeSchema,
  toggleLabTestTypeSchema,
  removeLabTestTypeSchema,
  addLabNotificationContactSchema,
  removeLabNotificationContactSchema,
} from '@/lib/validation/emr';
import { requireEmrContext } from '@/server/actions/emr/emr-shared';
import { getRequestMeta, requireLabsContext, type LabsActionState } from './labs-shared';

function labsUrl(): string {
  const base = process.env.APP_URL ?? '';
  return `${base}/labs`;
}

/**
 * Order a new lab for a patient from the EMR chart. Requires EMR edit
 * access (not Labs access) -- this is the "ordering" side of the workflow.
 * The test name must match an enabled entry in the Labs settings catalog.
 * Notifies any registered lab contacts that a new request came in.
 */
export async function createLabRequestAction(
  _prevState: LabsActionState,
  formData: FormData,
): Promise<LabsActionState> {
  const parsed = createLabRequestSchema.safeParse({
    emrPatientId: formData.get('emrPatientId'),
    testName: formData.get('testName'),
    category: formData.get('category'),
    notes: formData.get('notes'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const { emrPatientId, testName, category, notes } = parsed.data;

  const testType = await tenantDb.query.emrLabTestTypes.findFirst({
    where: (t, { and, eq }) => and(eq(t.name, testName), eq(t.enabled, true)),
  });
  if (!testType) return { error: 'Select a valid lab test from the list.' };

  const [result] = await tenantDb
    .insert(emrLabRequests)
    .values({ emrPatientId, testName, category, notes: notes ?? '' })
    .returning();

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.LAB_REQUEST_CREATED,
    resourceType: 'emr_lab_request',
    resourceId: result.id,
    success: true,
    ipAddress,
    userAgent,
  });

  const contacts = await tenantDb.query.labNotificationContacts.findMany({
    where: (t, { inArray }) => inArray(t.category, [category, 'all']),
  });
  const url = labsUrl();
  await Promise.all(contacts.map((contact) => sendLabRequestNotification(contact.email, url)));

  revalidatePath(`/emr/patients/${emrPatientId}`);
  revalidatePath('/labs');
  return {};
}

const STATUS_AUDIT_ACTION = {
  placed: AUDIT_ACTIONS.LAB_REQUEST_PLACED,
  completed: AUDIT_ACTIONS.LAB_REQUEST_COMPLETED,
  cancelled: AUDIT_ACTIONS.LAB_REQUEST_CANCELLED,
} as const;

/**
 * Lab-side fulfillment: transition a lab request to placed/completed/cancelled.
 * Marking a request "placed" automatically stamps placedAt with the current
 * time; marking it "completed" stamps resultAt and stores the result.
 * Requires Labs edit access.
 */
export async function updateLabRequestStatusAction(
  _prevState: LabsActionState,
  formData: FormData,
): Promise<LabsActionState> {
  const rawResult = formData.get('result');
  const parsed = updateLabRequestStatusSchema.safeParse({
    labRequestId: formData.get('labRequestId'),
    status: formData.get('status'),
    result: rawResult ? rawResult : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireLabsContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit lab requests.' };

  const { labRequestId, status, result } = parsed.data;

  const labRequest = await tenantDb.query.emrLabRequests.findFirst({
    where: eq(emrLabRequests.id, labRequestId),
  });
  if (!labRequest) return { error: 'Lab request not found.' };

  if (status === 'completed' && !result?.trim()) {
    return { error: 'A result is required to complete a lab request.' };
  }

  const updates: Partial<typeof emrLabRequests.$inferInsert> = { status };
  if (status === 'placed') {
    updates.placedAt = new Date();
  } else if (status === 'completed') {
    updates.resultAt = new Date();
    updates.result = result;
  }

  await tenantDb.update(emrLabRequests).set(updates).where(eq(emrLabRequests.id, labRequestId));

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: STATUS_AUDIT_ACTION[status],
    resourceType: 'emr_lab_request',
    resourceId: labRequestId,
    success: true,
    ipAddress,
    userAgent,
  });

  // Notify the patient that their results are ready, if they have a portal account.
  if (status === 'completed') {
    const link = await controlDb.query.patientLinks.findFirst({
      where: eq(patientLinks.emrPatientId, labRequest.emrPatientId),
    });
    if (link) {
      const patientUser = await controlDb.query.users.findFirst({
        where: eq(users.id, link.userId),
      });
      if (patientUser?.email) {
        const portalUrl = `${process.env.APP_URL ?? ''}/patient-portal`;
        await sendLabResultReadyNotification(patientUser.email, portalUrl);
      }
    }

    const reviewers = await tenantDb.query.labNotificationContacts.findMany({
      where: (t, { inArray }) => inArray(t.category, [labRequest.category, 'all']),
    });
    const url = labsUrl();
    await Promise.all(reviewers.map((contact) => sendLabReviewNeededNotification(contact.email, url)));
  }

  revalidatePath('/labs');
  revalidatePath(`/emr/patients/${labRequest.emrPatientId}`);
  return {};
}

/**
 * Doctor review phase: a lab can only be reviewed once it's 'completed' (the
 * "only after labs have been done" rule) -- this is the terminal step that
 * makes a lab request truly finished from the Labs tool's perspective.
 */
export async function reviewLabRequestAction(
  _prevState: LabsActionState,
  formData: FormData,
): Promise<LabsActionState> {
  const parsed = reviewLabRequestSchema.safeParse({
    labRequestId: formData.get('labRequestId'),
    doctorNote: formData.get('doctorNote'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireLabsContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to review lab requests.' };

  const { labRequestId, doctorNote } = parsed.data;

  const labRequest = await tenantDb.query.emrLabRequests.findFirst({
    where: eq(emrLabRequests.id, labRequestId),
  });
  if (!labRequest) return { error: 'Lab request not found.' };
  if (labRequest.status !== 'completed') {
    return { error: 'This lab has not been completed yet -- it cannot be reviewed.' };
  }

  await tenantDb
    .update(emrLabRequests)
    .set({ doctorNote, reviewedAt: new Date(), reviewedByUserId: user.id })
    .where(eq(emrLabRequests.id, labRequestId));

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.LAB_REQUEST_REVIEWED,
    resourceType: 'emr_lab_request',
    resourceId: labRequestId,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/labs');
  revalidatePath(`/labs/review/${labRequestId}`);
  revalidatePath(`/emr/patients/${labRequest.emrPatientId}`);
  return {};
}

/** Adds a new orderable lab test type to the catalog. Requires Labs edit access. */
export async function addLabTestTypeAction(
  _prevState: LabsActionState,
  formData: FormData,
): Promise<LabsActionState> {
  const parsed = addLabTestTypeSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireLabsContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to manage Labs settings.' };

  const [result] = await tenantDb.insert(emrLabTestTypes).values({ name: parsed.data.name }).returning();

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.LAB_TEST_TYPE_ADDED,
    resourceType: 'emr_lab_test_type',
    resourceId: result.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/labs');
  return {};
}

/** Enables or disables a lab test type. Disabled tests no longer appear in the EMR order dropdown. */
export async function toggleLabTestTypeAction(
  _prevState: LabsActionState,
  formData: FormData,
): Promise<LabsActionState> {
  const parsed = toggleLabTestTypeSchema.safeParse({
    labTestTypeId: formData.get('labTestTypeId'),
    enabled: formData.get('enabled'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireLabsContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to manage Labs settings.' };

  const { labTestTypeId, enabled } = parsed.data;

  await tenantDb.update(emrLabTestTypes).set({ enabled }).where(eq(emrLabTestTypes.id, labTestTypeId));

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.LAB_TEST_TYPE_UPDATED,
    resourceType: 'emr_lab_test_type',
    resourceId: labTestTypeId,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/labs');
  return {};
}

/** Removes a lab test type from the catalog entirely. Requires Labs edit access. */
export async function removeLabTestTypeAction(
  _prevState: LabsActionState,
  formData: FormData,
): Promise<LabsActionState> {
  const parsed = removeLabTestTypeSchema.safeParse({ labTestTypeId: formData.get('labTestTypeId') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireLabsContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to manage Labs settings.' };

  const { labTestTypeId } = parsed.data;

  await tenantDb.delete(emrLabTestTypes).where(eq(emrLabTestTypes.id, labTestTypeId));

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.LAB_TEST_TYPE_REMOVED,
    resourceType: 'emr_lab_test_type',
    resourceId: labTestTypeId,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/labs');
  return {};
}

/** Registers an email address to receive notifications for new lab requests. */
export async function addLabNotificationContactAction(
  _prevState: LabsActionState,
  formData: FormData,
): Promise<LabsActionState> {
  const parsed = addLabNotificationContactSchema.safeParse({
    email: formData.get('email'),
    label: formData.get('label'),
    category: formData.get('category'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireLabsContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to manage Labs settings.' };

  const { email, label, category } = parsed.data;

  const existing = await tenantDb.query.labNotificationContacts.findFirst({
    where: (t, { eq }) => eq(t.email, email),
  });
  if (existing) return { error: 'This email is already registered for notifications.' };

  const [result] = await tenantDb
    .insert(labNotificationContacts)
    .values({ email, label: label ?? '', category })
    .returning();

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.LAB_NOTIFICATION_CONTACT_ADDED,
    resourceType: 'lab_notification_contact',
    resourceId: result.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/labs');
  return {};
}

/** Removes a registered lab notification contact. Requires Labs edit access. */
export async function removeLabNotificationContactAction(
  _prevState: LabsActionState,
  formData: FormData,
): Promise<LabsActionState> {
  const parsed = removeLabNotificationContactSchema.safeParse({ contactId: formData.get('contactId') });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireLabsContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to manage Labs settings.' };

  const { contactId } = parsed.data;

  await tenantDb.delete(labNotificationContacts).where(eq(labNotificationContacts.id, contactId));

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.LAB_NOTIFICATION_CONTACT_REMOVED,
    resourceType: 'lab_notification_contact',
    resourceId: contactId,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/labs');
  return {};
}
