'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { emrSocialHistory } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { saveSocialHistorySchema } from '@/lib/validation/emr';
import { getRequestMeta, requireEmrContext, type EmrActionState } from './emr-shared';

export async function saveSocialHistoryAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const parsed = saveSocialHistorySchema.safeParse({
    emrPatientId: formData.get('emrPatientId'),
    tobaccoStatus: formData.get('tobaccoStatus'),
    tobaccoNote: formData.get('tobaccoNote'),
    alcoholStatus: formData.get('alcoholStatus'),
    alcoholNote: formData.get('alcoholNote'),
    drugStatus: formData.get('drugStatus'),
    drugNote: formData.get('drugNote'),
    occupation: formData.get('occupation'),
    exercise: formData.get('exercise'),
    diet: formData.get('diet'),
    notes: formData.get('notes'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const { emrPatientId, ...rest } = parsed.data;
  const values = {
    tobaccoStatus: rest.tobaccoStatus || null,
    tobaccoNote: rest.tobaccoNote ?? '',
    alcoholStatus: rest.alcoholStatus || null,
    alcoholNote: rest.alcoholNote ?? '',
    drugStatus: rest.drugStatus || null,
    drugNote: rest.drugNote ?? '',
    occupation: rest.occupation ?? '',
    exercise: rest.exercise ?? '',
    diet: rest.diet ?? '',
    notes: rest.notes ?? '',
  };

  const existing = await tenantDb.query.emrSocialHistory.findFirst({
    where: eq(emrSocialHistory.emrPatientId, emrPatientId),
  });

  let result;
  if (existing) {
    [result] = await tenantDb
      .update(emrSocialHistory)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(emrSocialHistory.id, existing.id))
      .returning();
  } else {
    [result] = await tenantDb
      .insert(emrSocialHistory)
      .values({ emrPatientId, ...values })
      .returning();
  }

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_SOCIAL_HISTORY_SAVED,
    resourceType: 'emr_social_history',
    resourceId: result.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${emrPatientId}`);
  return {};
}
