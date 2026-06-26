import { controlDb } from '@civica/db/control/client';
import { auditEvents } from '@civica/db/control/schema';

export const AUDIT_ACTIONS = new Proxy({}, { get: (_target, prop) => String(prop) }) as Record<string, string>;

export async function logAuditEvent(event: {
  actorUserId?: string | null;
  clinicId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  success: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
}) {
  await controlDb.insert(auditEvents).values({
    actorUserId: event.actorUserId ?? null,
    clinicId: event.clinicId ?? null,
    action: event.action,
    resourceType: event.resourceType ?? null,
    resourceId: event.resourceId ?? null,
    success: event.success,
    failureReason: event.failureReason ?? null,
    ipAddress: event.ipAddress ?? null,
    userAgent: event.userAgent ?? null,
    metadata: event.metadata ?? null,
  });
}
