'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { emrEncounters, emrSoapNotes, emrVitals } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { createEncounterSchema, saveSoapNoteSchema, saveVitalsSchema } from '@/lib/validation/emr';
import { getRequestMeta, requireEmrContext, type EmrActionState } from './emr-shared';

export async function createEncounterAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const parsed = createEncounterSchema.safeParse({
    emrPatientId: formData.get('emrPatientId'),
    encounterDate: formData.get('encounterDate'),
    reasonForVisit: formData.get('reasonForVisit'),
    notes: formData.get('notes'),
    bloodPressure: formData.get('bloodPressure'),
    heartRate: formData.get('heartRate'),
    temperature: formData.get('temperature'),
    respiratoryRate: formData.get('respiratoryRate'),
    oxygenSaturation: formData.get('oxygenSaturation'),
    weightKg: formData.get('weightKg'),
    heightCm: formData.get('heightCm'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const { ipAddress, userAgent } = await getRequestMeta();
  const [created] = await tenantDb
    .insert(emrEncounters)
    .values({
      emrPatientId: parsed.data.emrPatientId,
      encounterDate: new Date(parsed.data.encounterDate),
      reasonForVisit: parsed.data.reasonForVisit,
      notes: parsed.data.notes ?? '',
    })
    .returning();

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_ENCOUNTER_CREATED,
    resourceType: 'emr_encounter',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { emrPatientId: created.emrPatientId },
  });

  // Save vitals if any were provided at intake
  const { bloodPressure, heartRate, temperature, respiratoryRate, oxygenSaturation, weightKg, heightCm } = parsed.data;
  const hasAnyVital = bloodPressure || heartRate != null || temperature || respiratoryRate != null || oxygenSaturation != null || weightKg || heightCm;
  if (hasAnyVital) {
    await tenantDb.insert(emrVitals).values({
      encounterId: created.id,
      bloodPressure: bloodPressure ?? '',
      heartRate: heartRate ?? null,
      temperature: temperature ?? '',
      respiratoryRate: respiratoryRate ?? null,
      oxygenSaturation: oxygenSaturation ?? null,
      weightKg: weightKg ?? '',
      heightCm: heightCm ?? '',
    });
    await logAuditEvent({
      actorUserId: user.id,
      clinicId,
      action: AUDIT_ACTIONS.EMR_VITALS_SAVED,
      resourceType: 'emr_vitals',
      resourceId: created.id,
      success: true,
      ipAddress,
      userAgent,
    });
  }

  revalidatePath(`/emr/patients/${parsed.data.emrPatientId}`);
  return {};
}

export async function saveSoapNoteAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const parsed = saveSoapNoteSchema.safeParse({
    encounterId: formData.get('encounterId'),
    subjective: formData.get('subjective'),
    objective: formData.get('objective'),
    assessment: formData.get('assessment'),
    plan: formData.get('plan'),
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

  const { encounterId, ...fields } = parsed.data;
  const values = {
    subjective: fields.subjective ?? '',
    objective: fields.objective ?? '',
    assessment: fields.assessment ?? '',
    plan: fields.plan ?? '',
  };

  await tenantDb
    .insert(emrSoapNotes)
    .values({ encounterId, ...values })
    .onConflictDoUpdate({
      target: emrSoapNotes.encounterId,
      set: { ...values, updatedAt: new Date() },
    });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_SOAP_NOTE_SAVED,
    resourceType: 'emr_soap_note',
    resourceId: encounterId,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${encounter.emrPatientId}`);
  return {};
}

export async function saveVitalsAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const parsed = saveVitalsSchema.safeParse({
    encounterId: formData.get('encounterId'),
    bloodPressure: formData.get('bloodPressure'),
    heartRate: formData.get('heartRate'),
    temperature: formData.get('temperature'),
    respiratoryRate: formData.get('respiratoryRate'),
    oxygenSaturation: formData.get('oxygenSaturation'),
    weightKg: formData.get('weightKg'),
    heightCm: formData.get('heightCm'),
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

  const { encounterId, ...fields } = parsed.data;
  const values = {
    bloodPressure: fields.bloodPressure ?? '',
    heartRate: fields.heartRate ?? null,
    temperature: fields.temperature ?? '',
    respiratoryRate: fields.respiratoryRate ?? null,
    oxygenSaturation: fields.oxygenSaturation ?? null,
    weightKg: fields.weightKg ?? '',
    heightCm: fields.heightCm ?? '',
  };

  await tenantDb
    .insert(emrVitals)
    .values({ encounterId, ...values })
    .onConflictDoUpdate({
      target: emrVitals.encounterId,
      set: values,
    });

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_VITALS_SAVED,
    resourceType: 'emr_vitals',
    resourceId: encounterId,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${encounter.emrPatientId}`);
  return {};
}
