'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { rosterDays } from '@civica/db/tenant/schema';
import { logAuditEvent, AUDIT_ACTIONS } from '@civica/audit';
import { startNewDaySchema } from '@/lib/validation/roster';
import { getRequestMeta, requireRosterContext, getOrCreateActiveRosterDay } from './roster-shared';

export interface RosterActionState {
  error?: string;
}

/**
 * Archives the current active roster day and creates a fresh one dated
 * today. Pods, staff assignments, patients, and present-preceptors from the
 * archived day remain in the DB (future history) but are no longer "today's"
 * since the UI only ever queries the active day. The clinic-wide people list
 * is untouched.
 */
export async function startNewDayAction(_prevState: RosterActionState, formData: FormData): Promise<RosterActionState> {
  const parsed = startNewDaySchema.safeParse({ confirm: formData.get('confirm') });
  if (!parsed.success) {
    return { error: 'Please confirm before starting a new day.' };
  }

  const context = await requireRosterContext();
  if ('error' in context) return context;
  const { user, membership, clinicId, tenantDb, canEdit } = context;
  const { ipAddress, userAgent } = await getRequestMeta();

  if (!canEdit) {
    return { error: 'You do not have permission to start a new day.' };
  }

  const previous = await getOrCreateActiveRosterDay(tenantDb);

  const today = new Date().toISOString().slice(0, 10);
  const [created] = await tenantDb.transaction(async (tx) => {
    await tx.update(rosterDays).set({ status: 'archived', updatedAt: new Date() }).where(eq(rosterDays.id, previous.id));
    return tx.insert(rosterDays).values({ rosterDate: today, status: 'active' }).returning();
  });

  await logAuditEvent({
    actorUserId: user.id,
    clinicId,
    action: AUDIT_ACTIONS.ROSTER_DAY_STARTED,
    resourceType: 'roster_day',
    resourceId: created.id,
    success: true,
    ipAddress,
    userAgent,
    metadata: { previousRosterDayId: previous.id, role: membership?.roleName },
  });

  revalidatePath('/roster', 'layout');
  return {};
}
