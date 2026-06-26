'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { emrLabOrders, emrEncounters } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { saveLabOrderSchema } from '@/lib/validation/emr';
import { getRequestMeta, requireEmrContext, type EmrActionState } from './emr-shared';

export async function saveLabOrderAction(_prevState: EmrActionState, formData: FormData): Promise<EmrActionState> {
  const rawStatus = formData.get('status');
  const rawLabOrderId = formData.get('labOrderId');
  const parsed = saveLabOrderSchema.safeParse({
    encounterId: formData.get('encounterId'),
    labOrderId: rawLabOrderId ? rawLabOrderId : undefined,
    testName: formData.get('testName'),
    status: rawStatus ? rawStatus : undefined,
    result: formData.get('result'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const context = await requireEmrContext();
  if ('error' in context) return context;
  const { user, clinicId, tenantDb, canEdit } = context;
  if (!canEdit) return { error: 'You do not have permission to edit EMR records.' };

  const { encounterId, labOrderId, ...rest } = parsed.data;

  const encounter = await tenantDb.query.emrEncounters.findFirst({
    where: eq(emrEncounters.id, encounterId),
  });
  if (!encounter) return { error: 'Encounter not found.' };

  let result;
  if (labOrderId) {
    [result] = await tenantDb
      .update(emrLabOrders)
      .set({ testName: rest.testName, status: rest.status, result: rest.result ?? '' })
      .where(eq(emrLabOrders.id, labOrderId))
      .returning();
  } else {
    [result] = await tenantDb
      .insert(emrLabOrders)
      .values({ encounterId, testName: rest.testName, status: rest.status, result: rest.result ?? '' })
      .returning();
  }

  const { ipAddress, userAgent } = await getRequestMeta();
  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: labOrderId ? AUDIT_ACTIONS.EMR_LAB_ORDER_UPDATED : AUDIT_ACTIONS.EMR_LAB_ORDER_CREATED,
    resourceType: 'emr_lab_order',
    resourceId: result.id,
    success: true,
    ipAddress,
    userAgent,
  });

  revalidatePath(`/emr/patients/${encounter.emrPatientId}`);
  return {};
}
