'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { emrEncounters, emrDiagnoses, emrMedications } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import {
  addDiagnosisSchema,
  removeDiagnosisSchema,
  addMedicationSchema,
  removeMedicationSchema,
} from '@/lib/validation/emr';
import { getRequestMeta, requireEmrContext, type EmrActionState } from './emr-shared';

export async function addDiagnosisAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const parsed = addDiagnosisSchema.safeParse({
    encounterId: formData.get('encounterId'),
    icd10Code: formData.get('icd10Code'),
    description: formData.get('description'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const encounter = await tenantDb.query.emrEncounters.findFirst({ where: eq(emrEncounters.id, parsed.data.encounterId) });
  if (!encounter) return { error: 'Encounter not found.' };

  const [created] = await tenantDb.insert(emrDiagnoses).values(parsed.data).returning();

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_DIAGNOSIS_ADDED,
    resourceType: 'emr_diagnosis',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${encounter.emrPatientId}`);
  return {};
}

export async function removeDiagnosisAction(formData: FormData): Promise<EmrActionState> {
  const parsed = removeDiagnosisSchema.safeParse({ diagnosisId: formData.get('diagnosisId') });
  if (!parsed.success) return { error: 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const [removed] = await tenantDb.delete(emrDiagnoses).where(eq(emrDiagnoses.id, parsed.data.diagnosisId)).returning();
  if (!removed) return { error: 'Diagnosis not found.' };

  const encounter = await tenantDb.query.emrEncounters.findFirst({ where: eq(emrEncounters.id, removed.encounterId) });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_DIAGNOSIS_REMOVED,
    resourceType: 'emr_diagnosis',
    resourceId: removed.id,
    success: true,
    ipAddress,
    userAgent,
  });

  if (encounter) revalidatePath(`/emr/patients/${encounter.emrPatientId}`);
  return {};
}

export async function addMedicationAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const parsed = addMedicationSchema.safeParse({
    encounterId: formData.get('encounterId'),
    name: formData.get('name'),
    dosage: formData.get('dosage'),
    instructions: formData.get('instructions'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const encounter = await tenantDb.query.emrEncounters.findFirst({ where: eq(emrEncounters.id, parsed.data.encounterId) });
  if (!encounter) return { error: 'Encounter not found.' };

  const [created] = await tenantDb
    .insert(emrMedications)
    .values({ ...parsed.data, dosage: parsed.data.dosage ?? '', instructions: parsed.data.instructions ?? '' })
    .returning();

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_MEDICATION_ADDED,
    resourceType: 'emr_medication',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${encounter.emrPatientId}`);
  return {};
}

export async function removeMedicationAction(formData: FormData): Promise<EmrActionState> {
  const parsed = removeMedicationSchema.safeParse({ medicationId: formData.get('medicationId') });
  if (!parsed.success) return { error: 'Invalid input' };

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const [removed] = await tenantDb.delete(emrMedications).where(eq(emrMedications.id, parsed.data.medicationId)).returning();
  if (!removed) return { error: 'Medication not found.' };

  const encounter = await tenantDb.query.emrEncounters.findFirst({ where: eq(emrEncounters.id, removed.encounterId) });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_MEDICATION_REMOVED,
    resourceType: 'emr_medication',
    resourceId: removed.id,
    success: true,
    ipAddress,
    userAgent,
  });

  if (encounter) revalidatePath(`/emr/patients/${encounter.emrPatientId}`);
  return {};
}
