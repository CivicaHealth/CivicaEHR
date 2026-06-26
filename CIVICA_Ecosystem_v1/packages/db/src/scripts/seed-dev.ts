import pg from 'pg';
import { eq } from 'drizzle-orm';
import { loadEnvLocal } from '@civica/config';
import { hashPassword, hashClinicCode } from '@civica/auth';
import { controlDb } from '../control/client';
import { clinicCodes, clinicMemberships, clinics, patientLinks, roles, toolRegistry, users } from '../control/schema';
import { provisionTenantDatabase } from '../tenant/provision';
import { getTenantDb } from '../tenant/connection';
import {
  emrAllergies,
  emrAppointments,
  emrDiagnoses,
  emrEncounters,
  emrLabRequests,
  emrLabTestTypes,
  emrMedications,
  emrPatients,
  emrProblems,
  emrReferrals,
  emrSoapNotes,
  emrVitals,
  labNotificationContacts,
  patients,
  people,
  podAssignments,
  pods,
  portalMessages,
  rosterDayPreceptors,
  rosterDays,
} from '../tenant/schema';
import { createControlSchema } from './schema-sql';

loadEnvLocal(process.cwd());

const DB_IDENTIFIER = 'civica_demo_clinic';
const PASSWORD = 'CivicaDev123!';

async function ensureDatabase() {
  const controlUrl = new URL(process.env.DATABASE_URL_CONTROL ?? 'postgres://civica:civica@localhost:54329/civica_dev');
  const dbName = controlUrl.pathname.slice(1);
  const adminUrl = new URL(controlUrl);
  adminUrl.pathname = '/postgres';
  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  const exists = await client.query('select 1 from pg_database where datname=$1', [dbName]);
  if (exists.rowCount === 0) await client.query(`create database "${dbName}"`);
  await client.end();
}

async function upsertRole(name: string, label: string) {
  const [row] = await controlDb.insert(roles).values({ id: name, name, label }).onConflictDoUpdate({
    target: roles.name,
    set: { label },
  }).returning();
  return row;
}

async function upsertUser(email: string, name: string, isPlatformAdmin = false) {
  const passwordHash = await hashPassword(PASSWORD);
  const [row] = await controlDb.insert(users).values({ id: email, email, name, passwordHash, isPlatformAdmin }).onConflictDoUpdate({
    target: users.email,
    set: { name, passwordHash, isPlatformAdmin, isActive: true, updatedAt: new Date() },
  }).returning();
  return row;
}

async function main() {
  await ensureDatabase();
  await createControlSchema(controlDb);

  const roleRows = new Map<string, { id: string }>();
  for (const [name, label] of [
    ['platform_admin', 'Civica Admin'],
    ['clinic_admin', 'Clinic Admin'],
    ['member', 'Member'],
    ['doctor', 'Doctor'],
    ['nurse', 'Nurse'],
    ['front_desk', 'Front Desk'],
    ['billing', 'Billing'],
    ['inventory_manager', 'Inventory Manager'],
    ['patient', 'Patient'],
    ['auditor', 'Auditor'],
  ]) roleRows.set(name, await upsertRole(name, label));

  const [clinic] = await controlDb.insert(clinics).values({
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'demo-clinic',
    name: 'Civica Demo Clinic',
    dbIdentifier: DB_IDENTIFIER,
    status: 'active',
    isActive: true,
    headSupervisor: 'Dr. Demo Supervisor',
    location: 'Local Development',
  }).onConflictDoUpdate({
    target: clinics.slug,
    set: { name: 'Civica Demo Clinic', dbIdentifier: DB_IDENTIFIER, status: 'active', isActive: true, updatedAt: new Date() },
  }).returning();

  const clinicCode = await hashClinicCode('DEMO-CLINIC');
  await controlDb.insert(clinicCodes).values({
    id: '00000000-0000-4000-8000-000000000002',
    clinicId: clinic.id,
    codeHash: clinicCode.codeHash,
    codeIdentifierHash: clinicCode.codeIdentifierHash,
    label: 'Demo registration code',
  }).onConflictDoNothing();

  const accountRoles: [string, string, string, boolean?][] = [
    ['admin@civica.dev', 'Civica Admin', 'platform_admin', true],
    ['clinic-admin@civica.dev', 'Clinic Admin', 'clinic_admin'],
    ['doctor@civica.dev', 'Demo Doctor', 'doctor'],
    ['nurse@civica.dev', 'Demo Nurse', 'nurse'],
    ['front-desk@civica.dev', 'Front Desk', 'front_desk'],
    ['billing@civica.dev', 'Billing User', 'billing'],
    ['inventory@civica.dev', 'Inventory Manager', 'inventory_manager'],
    ['auditor@civica.dev', 'Auditor User', 'auditor'],
    ['patient@civica.dev', 'Demo Patient', 'patient'],
  ];
  const usersByEmail = new Map<string, { id: string }>();
  for (const [email, name, roleName, platform] of accountRoles) {
    const user = await upsertUser(email, name, Boolean(platform));
    usersByEmail.set(email, user);
    if (roleName !== 'platform_admin') {
      await controlDb.insert(clinicMemberships).values({
        id: `${email}:membership`,
        userId: user.id,
        clinicId: clinic.id,
        roleId: roleRows.get(roleName)!.id,
        status: 'active',
      }).onConflictDoNothing();
    }
  }

  const tools = [
    ['emr', 'EMR', 'Patient charts, appointments, notes, and orders.', '/emr', ['clinic_admin', 'doctor', 'nurse', 'auditor'], 10],
    ['labs', 'Labs', 'Lab request queue and review workflow.', '/labs', ['clinic_admin', 'doctor', 'nurse', 'auditor'], 20],
    ['referrals', 'Referrals', 'Track patient referral status.', '/referrals', ['clinic_admin', 'doctor', 'auditor'], 30],
    ['roster', 'Roster', 'Daily clinic pods, staff, and patient flow.', '/roster', ['clinic_admin', 'doctor', 'nurse', 'front_desk', 'auditor'], 40],
    ['patient-portal', 'Patient Portal', 'Patient-facing records, requests, and messages.', '/patient-portal', ['patient'], 50],
    ['inventory', 'Inventory', 'Inventory placeholder for development.', '/inventory', ['clinic_admin', 'inventory_manager'], 60],
    ['billing', 'Billing', 'Billing placeholder for development.', '/billing', ['clinic_admin', 'billing'], 70],
  ] as const;
  for (const [slug, name, description, internalPath, requiredRoles, sortOrder] of tools) {
    await controlDb.insert(toolRegistry).values({ id: slug, slug, name, description, internalPath, requiredRoles: [...requiredRoles], sortOrder }).onConflictDoUpdate({
      target: toolRegistry.slug,
      set: { name, description, internalPath, requiredRoles: [...requiredRoles], sortOrder, enabled: true },
    });
  }

  await provisionTenantDatabase(DB_IDENTIFIER);
  const tenantDb = getTenantDb(DB_IDENTIFIER);

  const [demoPatient] = await tenantDb.insert(emrPatients).values({
    id: '00000000-0000-4000-8000-000000000101',
    firstName: 'Riley',
    lastName: 'Patient',
    dateOfBirth: '1992-04-12',
    sex: 'female',
    phone: '555-0100',
    email: 'patient@civica.dev',
    address: '123 Local Dev Lane',
  }).onConflictDoNothing().returning();

  const patientId = demoPatient?.id ?? '00000000-0000-4000-8000-000000000101';
  await controlDb.insert(patientLinks).values({ id: '00000000-0000-4000-8000-000000000102', userId: usersByEmail.get('patient@civica.dev')!.id, clinicId: clinic.id, emrPatientId: patientId }).onConflictDoNothing();

  const [encounter] = await tenantDb.insert(emrEncounters).values({ id: '00000000-0000-4000-8000-000000000201', emrPatientId: patientId, reasonForVisit: 'Annual check-in', reason: 'Annual check-in', providerName: 'Demo Doctor', sharedWithPatient: true }).onConflictDoNothing().returning();
  const encounterId = encounter?.id ?? '00000000-0000-4000-8000-000000000201';
  await tenantDb.insert(emrSoapNotes).values({ id: '00000000-0000-4000-8000-000000000202', encounterId, subjective: 'Feeling well overall.', objective: 'No acute distress.', assessment: 'Routine preventive visit.', plan: 'Follow up in one year.' }).onConflictDoNothing();
  await tenantDb.insert(emrVitals).values({ id: '00000000-0000-4000-8000-000000000203', encounterId, bloodPressure: '118/74', heartRate: '72', temperature: '98.4 F', oxygenSaturation: '99%' }).onConflictDoNothing();
  await tenantDb.insert(emrDiagnoses).values({ id: '00000000-0000-4000-8000-000000000204', encounterId, code: 'Z00.00', description: 'General adult medical exam' }).onConflictDoNothing();
  await tenantDb.insert(emrMedications).values({ id: '00000000-0000-4000-8000-000000000205', encounterId, name: 'Vitamin D', dosage: '1000 IU', frequency: 'Daily' }).onConflictDoNothing();
  await tenantDb.insert(emrAllergies).values({ id: '00000000-0000-4000-8000-000000000206', emrPatientId: patientId, allergen: 'Penicillin', reaction: 'Rash', severity: 'moderate' }).onConflictDoNothing();
  await tenantDb.insert(emrProblems).values({ id: '00000000-0000-4000-8000-000000000207', emrPatientId: patientId, name: 'Seasonal allergies', status: 'active' }).onConflictDoNothing();
  await tenantDb.insert(emrAppointments).values({ id: '00000000-0000-4000-8000-000000000208', emrPatientId: patientId, appointmentDate: new Date(Date.now() + 86400000), reason: 'Follow-up', providerName: 'Demo Doctor' }).onConflictDoNothing();
  await tenantDb.insert(emrReferrals).values({ id: '00000000-0000-4000-8000-000000000209', emrPatientId: patientId, specialistName: 'Local Optometry', specialty: 'Optometry', reason: 'Routine vision exam', status: 'pending' }).onConflictDoNothing();
  await tenantDb.insert(emrLabTestTypes).values([{ id: '00000000-0000-4000-8000-000000000301', name: 'CBC', category: 'general' }, { id: '00000000-0000-4000-8000-000000000302', name: 'A1C', category: 'general' }]).onConflictDoNothing();
  await tenantDb.insert(emrLabRequests).values({ id: '00000000-0000-4000-8000-000000000303', emrPatientId: patientId, testTypeId: '00000000-0000-4000-8000-000000000301', testName: 'CBC', category: 'general', status: 'ordered' }).onConflictDoNothing();
  await tenantDb.insert(labNotificationContacts).values({ id: '00000000-0000-4000-8000-000000000304', name: 'Demo Lab Reviewer', email: 'doctor@civica.dev' }).onConflictDoNothing();
  await tenantDb.insert(portalMessages).values({ id: '00000000-0000-4000-8000-000000000305', emrPatientId: patientId, senderUserId: usersByEmail.get('doctor@civica.dev')!.id, senderRole: 'staff', body: 'Welcome to the demo patient portal.' }).onConflictDoNothing();

  const today = new Date().toISOString().slice(0, 10);
  await tenantDb.insert(rosterDays).values({ id: '00000000-0000-4000-8000-000000000401', rosterDate: today, status: 'active' }).onConflictDoNothing();
  await tenantDb.insert(pods).values([{ id: '00000000-0000-4000-8000-000000000402', rosterDayId: '00000000-0000-4000-8000-000000000401', name: 'Pod A', sortOrder: 1 }, { id: '00000000-0000-4000-8000-000000000403', rosterDayId: '00000000-0000-4000-8000-000000000401', name: 'Pod B', sortOrder: 2 }]).onConflictDoNothing();
  await tenantDb.insert(people).values([{ id: '00000000-0000-4000-8000-000000000404', name: 'Dr. Preceptor', role: 'preceptor' }, { id: '00000000-0000-4000-8000-000000000405', name: 'Medical Student', role: 'med_student' }, { id: '00000000-0000-4000-8000-000000000406', name: 'Clinic Scribe', role: 'scribe' }]).onConflictDoNothing();
  await tenantDb.insert(podAssignments).values([{ id: '00000000-0000-4000-8000-000000000407', podId: '00000000-0000-4000-8000-000000000402', personId: '00000000-0000-4000-8000-000000000405' }, { id: '00000000-0000-4000-8000-000000000408', podId: '00000000-0000-4000-8000-000000000402', personId: '00000000-0000-4000-8000-000000000406' }]).onConflictDoNothing();
  await tenantDb.insert(rosterDayPreceptors).values({ id: '00000000-0000-4000-8000-000000000409', rosterDayId: '00000000-0000-4000-8000-000000000401', personId: '00000000-0000-4000-8000-000000000404' }).onConflictDoNothing();
  await tenantDb.insert(patients).values({ id: '00000000-0000-4000-8000-000000000410', rosterDayId: '00000000-0000-4000-8000-000000000401', podId: '00000000-0000-4000-8000-000000000402', emrPatientId: patientId, name: 'Riley Patient', prn: 'PRN-001', appointmentTime: '09:00' }).onConflictDoNothing();

  console.log('Seed complete.');
  console.log(`Dev password for all accounts: ${PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
