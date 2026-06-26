'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { emrReferrals } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { emrReferralStatusSchema } from '@/lib/validation/emr';
import { z } from 'zod';
import { getRequestMeta, requireReferralsContext, type ReferralsActionState } from './referrals-shared';

const updateReferralStatusSchema = z.object({
  referralId: z.uuid(),
  emrPatientId: z.uuid(),
  status: emrReferralStatusSchema,
});

export async function updateReferralStatusAction(
  _prevState: ReferralsActionState,
  formData: FormData,
): Promise<ReferralsActionState> {
  const parsed = updateReferralStatusSchema.safeParse({
    referralId: formData.get('referralId'),
    emrPatientId: formData.get('emrPatientId'),
    status: formData.get('status'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireReferralsContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to update referrals.' };

  const { referralId, emrPatientId, status } = parsed.data;

  const referral = await tenantDb.query.emrReferrals.findFirst({
    where: eq(emrReferrals.id, referralId),
  });
  if (!referral) return { error: 'Referral not found.' };

  await tenantDb.update(emrReferrals).set({ status }).where(eq(emrReferrals.id, referralId));

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.EMR_REFERRAL_UPDATED,
    resourceType: 'emr_referral',
    resourceId: referralId,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath('/referrals');
  revalidatePath(`/emr/patients/${emrPatientId}`);
  return {};
}
