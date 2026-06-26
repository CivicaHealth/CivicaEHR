'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { emrReferrals } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { saveReferralSchema } from '@/lib/validation/emr';
import { getRequestMeta, requireEmrContext, type EmrActionState } from './emr-shared';

export async function saveReferralAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const rawStatus = formData.get('status');
  const rawReferralId = formData.get('referralId');
  const parsed = saveReferralSchema.safeParse({
    emrPatientId: formData.get('emrPatientId'),
    referralId: rawReferralId ? rawReferralId : undefined,
    specialistName: formData.get('specialistName'),
    specialty: formData.get('specialty'),
    reason: formData.get('reason'),
    status: rawStatus ? rawStatus : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const { emrPatientId, referralId, ...rest } = parsed.data;

  let result;
  if (referralId) {
    [result] = await tenantDb
      .update(emrReferrals)
      .set({
        specialistName: rest.specialistName,
        specialty: rest.specialty ?? '',
        reason: rest.reason ?? '',
        status: rest.status,
      })
      .where(eq(emrReferrals.id, referralId))
      .returning();
  } else {
    [result] = await tenantDb
      .insert(emrReferrals)
      .values({
        emrPatientId,
        specialistName: rest.specialistName,
        specialty: rest.specialty ?? '',
        reason: rest.reason ?? '',
        status: rest.status,
      })
      .returning();
  }

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: referralId ? AUDIT_ACTIONS.EMR_REFERRAL_UPDATED : AUDIT_ACTIONS.EMR_REFERRAL_CREATED,
    resourceType: 'emr_referral',
    resourceId: result.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${emrPatientId}`);
  return {};
}
