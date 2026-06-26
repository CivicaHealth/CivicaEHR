import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import argon2 from 'argon2';
import { controlDb } from '@civica/db/control/client';
import { clinicCodes, clinicMemberships, clinics, membershipToolAccess, patientEnrollments, patientLinks, roles, sessions, users } from '@civica/db/control/schema';
import type { CurrentMembership, CurrentUser } from '@civica/types';

export const SESSION_COOKIE = 'civica_session';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export const hashPassword = (password: string) => argon2.hash(password);
export const verifyPassword = (hash: string, password: string) => argon2.verify(hash, password);

function sha(value: string) { return createHash('sha256').update(value).digest('hex'); }
function secret() { return process.env.SESSION_SECRET ?? 'dev-session-secret-change-me'; }
function sign(value: string) { return createHmac('sha256', secret()).update(value).digest('base64url'); }

export async function createSession(input: { userId: string; ipAddress?: string | null; userAgent?: string | null }) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  await controlDb.insert(sessions).values({
    userId: input.userId,
    tokenHash: sha(token),
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
    lastActivityAt: now,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });
  return token;
}

export async function getSessionByToken(token: string) {
  const session = await controlDb.query.sessions.findFirst({ where: eq(sessions.tokenHash, sha(token)), with: { user: true } });
  if (!session) return null;
  const now = new Date();
  if (session.expiresAt < now) {
    await controlDb.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }
  return session;
}

export async function invalidateSession(token: string) {
  await controlDb.delete(sessions).where(eq(sessions.tokenHash, sha(token)));
}

export async function setSessionCookie(token: string) {
  (await cookies()).set(SESSION_COOKIE, `${token}.${sign(token)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSessionTokenFromCookies() {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const index = raw.lastIndexOf('.');
  if (index === -1) return null;
  const token = raw.slice(0, index);
  const sig = raw.slice(index + 1);
  const expected = sign(token);
  return Buffer.byteLength(sig) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? token : null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getSessionTokenFromCookies();
  if (!token) return null;
  const session = await getSessionByToken(token);
  if (!session?.user.isActive) return null;
  await controlDb.update(sessions).set({ lastActivityAt: new Date() }).where(eq(sessions.id, session.id));
  return { id: session.user.id, email: session.user.email, name: session.user.name, isActive: session.user.isActive, isPlatformAdmin: session.user.isPlatformAdmin, sessionId: session.id, viewingClinicId: session.viewingClinicId };
}

export async function getCurrentMemberships(userId: string): Promise<CurrentMembership[]> {
  const rows = await controlDb.query.clinicMemberships.findMany({ where: eq(clinicMemberships.userId, userId), with: { clinic: true, role: true, toolAccess: true } });
  return rows.map((m) => ({ clinicId: m.clinic.id, clinicName: m.clinic.name, clinicSlug: m.clinic.slug, roleName: m.role.name, status: m.status, toolAccess: m.toolAccess.map((a) => ({ toolSlug: a.toolSlug, level: a.level })) }));
}

export async function getEffectiveMembership(user: CurrentUser | null): Promise<CurrentMembership | null> {
  if (!user) return null;
  if (user.isPlatformAdmin && user.viewingClinicId) {
    const clinic = await controlDb.query.clinics.findFirst({ where: eq(clinics.id, user.viewingClinicId) });
    return clinic ? { clinicId: clinic.id, clinicName: clinic.name, clinicSlug: clinic.slug, roleName: 'clinic_admin', status: 'active', toolAccess: [] } : null;
  }
  return (await getCurrentMemberships(user.id)).find((m) => m.status === 'active') ?? null;
}

export async function setViewingClinic(sessionId: string, clinicId: string | null) {
  await controlDb.update(sessions).set({ viewingClinicId: clinicId }).where(eq(sessions.id, sessionId));
}

export async function getPatientLink(userId: string) {
  return controlDb.query.patientLinks.findFirst({ where: eq(patientLinks.userId, userId) });
}

export async function hashClinicCode(code: string) {
  return { codeHash: await hashPassword(code), codeIdentifierHash: sha(code.toLowerCase()) };
}

export async function verifyClinicCode(code: string) {
  const identifier = sha(code.toLowerCase());
  const rows = await controlDb.query.clinicCodes.findMany({ where: eq(clinicCodes.codeIdentifierHash, identifier), with: { clinic: true } });
  for (const row of rows) if (await verifyPassword(row.codeHash, code)) return row.clinic;
  return null;
}

export function generateEnrollmentCode() {
  return randomBytes(6).toString('base64url').toUpperCase();
}

export const hashEnrollmentCode = hashPassword;

export async function verifyEnrollmentCode(code: string) {
  const rows = await controlDb.query.patientEnrollments.findMany({ where: eq(patientEnrollments.status, 'pending') });
  for (const row of rows) if (await verifyPassword(row.codeHash, code)) return row;
  return null;
}
