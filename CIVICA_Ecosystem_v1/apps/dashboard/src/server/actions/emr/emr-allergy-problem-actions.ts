'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { emrAllergies, emrProblems } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import {
  addAllergySchema,
  removeAllergySchema,
  addProblemSchema,
  updateProblemStatusSchema,
  removeProblemSchema,
} from '@/lib/validation/emr';
import { getRequestMeta, requireEmrContext, type EmrActionState } from './emr-shared';

export async function addAllergyAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const rawSeverity = formData.get('severity');
  const parsed = addAllergySchema.safeParse({
    emrPatientId: formData.get('emrPatientId'),
    allergen: formData.get('allergen'),
    reaction: formData.get('reaction'),
    severity: rawSeverity ? rawSeverity : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const [created] = await tenantDb
    .insert(emrAllergies)
    .values({ ...parsed.data, reaction: parsed.data.reaction ?? '' })
    .returning();

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_ALLERGY_ADDED,
    resourceType: 'emr_allergy',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${parsed.data.emrPatientId}`);
  return {};
}

export async function removeAllergyAction(formData: FormData): Promise<EmrActionState> {
  const parsed = removeAllergySchema.safeParse({ allergyId: formData.get('allergyId') });
  if (!parsed.success) return { error: 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const [removed] = await tenantDb.delete(emrAllergies).where(eq(emrAllergies.id, parsed.data.allergyId)).returning();
  if (!removed) return { error: 'Allergy not found.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_ALLERGY_REMOVED,
    resourceType: 'emr_allergy',
    resourceId: removed.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${removed.emrPatientId}`);
  return {};
}

export async function addProblemAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const rawOnset = formData.get('onsetDate');
  const parsed = addProblemSchema.safeParse({
    emrPatientId: formData.get('emrPatientId'),
    icd10Code: formData.get('icd10Code'),
    description: formData.get('description'),
    onsetDate: rawOnset ? rawOnset : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const { onsetDate, ...rest } = parsed.data;
  const [created] = await tenantDb
    .insert(emrProblems)
    .values({ ...rest, onsetDate: onsetDate ?? null })
    .returning();

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_PROBLEM_ADDED,
    resourceType: 'emr_problem',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${parsed.data.emrPatientId}`);
  return {};
}

export async function updateProblemStatusAction(formData: FormData): Promise<EmrActionState> {
  const parsed = updateProblemStatusSchema.safeParse({
    problemId: formData.get('problemId'),
    status: formData.get('status'),
  });
  if (!parsed.success) return { error: 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const today = new Date().toISOString().slice(0, 10);
  const [updated] = await tenantDb
    .update(emrProblems)
    .set({ status: parsed.data.status, resolvedDate: parsed.data.status === 'resolved' ? today : null })
    .where(eq(emrProblems.id, parsed.data.problemId))
    .returning();
  if (!updated) return { error: 'Problem not found.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_PROBLEM_UPDATED,
    resourceType: 'emr_problem',
    resourceId: updated.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { status: updated.status },
  });

  revalidatePath(`/emr/patients/${updated.emrPatientId}`);
  return {};
}

export async function removeProblemAction(formData: FormData): Promise<EmrActionState> {
  const parsed = removeProblemSchema.safeParse({ problemId: formData.get('problemId') });
  if (!parsed.success) return { error: 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const [removed] = await tenantDb.delete(emrProblems).where(eq(emrProblems.id, parsed.data.problemId)).returning();
  if (!removed) return { error: 'Problem not found.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_PROBLEM_REMOVED,
    resourceType: 'emr_problem',
    resourceId: removed.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${removed.emrPatientId}`);
  return {};
}
