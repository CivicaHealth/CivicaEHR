'use server';

import { revalidatePath } from 'next/cache';
import { emrPatients } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { createEmrPatientSchema } from '@/lib/validation/emr';
import { getRequestMeta, requireEmrContext, type EmrActionState } from './emr-shared';

export async function createEmrPatientAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const parsed = createEmrPatientSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    dateOfBirth: formData.get('dateOfBirth'),
    sex: formData.get('sex'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
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
    .insert(emrPatients)
    .values({
      ...parsed.data,
      phone: parsed.data.phone ?? '',
      email: parsed.data.email ?? '',
      address: parsed.data.address ?? '',
    })
    .returning();

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_PATIENT_CREATED,
    resourceType: 'emr_patient',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/emr', 'layout');
  return {};
}
