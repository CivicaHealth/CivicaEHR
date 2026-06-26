import { relations } from 'drizzle-orm';
import { pgTable, text, boolean, timestamp, jsonb, integer, uniqueIndex } from 'drizzle-orm/pg-core';

const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID());
const now = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updated = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
  createdAt: now(),
  updatedAt: updated(),
});

export const roles = pgTable('roles', {
  id: id(),
  name: text('name').notNull().unique(),
  label: text('label').notNull(),
});

export const clinics = pgTable('clinics', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  dbIdentifier: text('db_identifier').notNull().unique(),
  status: text('status').notNull().default('active'),
  headSupervisor: text('head_supervisor'),
  location: text('location'),
  affiliatedInstitution: text('affiliated_institution'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: now(),
  updatedAt: updated(),
});

export const clinicCodes = pgTable('clinic_codes', {
  id: id(),
  clinicId: text('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull(),
  codeIdentifierHash: text('code_identifier_hash').notNull(),
  label: text('label'),
  createdAt: now(),
});

export const clinicMemberships = pgTable('clinic_memberships', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clinicId: text('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => roles.id),
  status: text('status').notNull().default('active'),
  createdAt: now(),
  updatedAt: updated(),
});

export const membershipToolAccess = pgTable('membership_tool_access', {
  id: id(),
  membershipId: text('membership_id').notNull().references(() => clinicMemberships.id, { onDelete: 'cascade' }),
  toolSlug: text('tool_slug').notNull(),
  level: text('level').notNull(),
}, (t) => [uniqueIndex('membership_tool_access_unique').on(t.membershipId, t.toolSlug)]);

export const toolRegistry = pgTable('tool_registry', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  launchType: text('launch_type').notNull().default('internal'),
  internalPath: text('internal_path'),
  externalUrl: text('external_url'),
  enabled: boolean('enabled').notNull().default(true),
  requiredRoles: text('required_roles').array().notNull().default([]),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const sessions = pgTable('sessions', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  viewingClinicId: text('viewing_clinic_id').references(() => clinics.id, { onDelete: 'set null' }),
  createdAt: now(),
});

export const auditEvents = pgTable('audit_events', {
  id: id(),
  actorUserId: text('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  clinicId: text('clinic_id').references(() => clinics.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  success: boolean('success').notNull(),
  failureReason: text('failure_reason'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: now(),
});

export const platformSettings = pgTable('platform_settings', {
  id: text('id').primaryKey().default('default'),
  notificationEmail: text('notification_email'),
  updatedAt: updated(),
});

export const patientEnrollments = pgTable('patient_enrollments', {
  id: id(),
  clinicId: text('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  emrPatientId: text('emr_patient_id').notNull(),
  email: text('email'),
  label: text('label'),
  codeHash: text('code_hash').notNull(),
  status: text('status').notNull().default('pending'),
  claimedByUserId: text('claimed_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  createdAt: now(),
});

export const patientLinks = pgTable('patient_links', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  clinicId: text('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  emrPatientId: text('emr_patient_id').notNull(),
  createdAt: now(),
});

export const usersRelations = relations(users, ({ many }) => ({ memberships: many(clinicMemberships), sessions: many(sessions) }));
export const clinicsRelations = relations(clinics, ({ many }) => ({ memberships: many(clinicMemberships), codes: many(clinicCodes) }));
export const clinicCodesRelations = relations(clinicCodes, ({ one }) => ({
  clinic: one(clinics, { fields: [clinicCodes.clinicId], references: [clinics.id] }),
}));
export const rolesRelations = relations(roles, ({ many }) => ({ memberships: many(clinicMemberships) }));
export const clinicMembershipsRelations = relations(clinicMemberships, ({ one, many }) => ({
  user: one(users, { fields: [clinicMemberships.userId], references: [users.id] }),
  clinic: one(clinics, { fields: [clinicMemberships.clinicId], references: [clinics.id] }),
  role: one(roles, { fields: [clinicMemberships.roleId], references: [roles.id] }),
  toolAccess: many(membershipToolAccess),
}));
export const membershipToolAccessRelations = relations(membershipToolAccess, ({ one }) => ({
  membership: one(clinicMemberships, { fields: [membershipToolAccess.membershipId], references: [clinicMemberships.id] }),
}));
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
  viewingClinic: one(clinics, { fields: [sessions.viewingClinicId], references: [clinics.id] }),
}));
