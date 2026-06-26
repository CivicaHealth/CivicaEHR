import { sql, type SQL } from 'drizzle-orm';
import type { controlDb } from '../control/client';
import type { TenantDb } from '../tenant/connection';

type AnyDb = typeof controlDb | TenantDb;

async function run(db: AnyDb, statements: SQL[]) {
  for (const statement of statements) await db.execute(statement);
}

export async function createControlSchema(db: typeof controlDb) {
  await run(db, [
    sql`create table if not exists users (id text primary key, email text not null unique, password_hash text not null, name text not null, is_active boolean not null default true, is_platform_admin boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists roles (id text primary key, name text not null unique, label text not null)`,
    sql`create table if not exists clinics (id text primary key, slug text not null unique, name text not null, db_identifier text not null unique, status text not null default 'active', head_supervisor text, location text, affiliated_institution text, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists clinic_codes (id text primary key, clinic_id text not null references clinics(id) on delete cascade, code_hash text not null, code_identifier_hash text not null, label text, created_at timestamptz not null default now())`,
    sql`create table if not exists clinic_memberships (id text primary key, user_id text not null references users(id) on delete cascade, clinic_id text not null references clinics(id) on delete cascade, role_id text not null references roles(id), status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists membership_tool_access (id text primary key, membership_id text not null references clinic_memberships(id) on delete cascade, tool_slug text not null, level text not null, unique(membership_id, tool_slug))`,
    sql`create table if not exists tool_registry (id text primary key, slug text not null unique, name text not null, description text not null, launch_type text not null default 'internal', internal_path text, external_url text, enabled boolean not null default true, required_roles text[] not null default '{}', sort_order integer not null default 0)`,
    sql`create table if not exists sessions (id text primary key, user_id text not null references users(id) on delete cascade, token_hash text not null unique, expires_at timestamptz not null, last_activity_at timestamptz not null, ip_address text, user_agent text, viewing_clinic_id text references clinics(id) on delete set null, created_at timestamptz not null default now())`,
    sql`create table if not exists audit_events (id text primary key, actor_user_id text references users(id) on delete set null, clinic_id text references clinics(id) on delete set null, action text not null, resource_type text, resource_id text, success boolean not null, failure_reason text, ip_address text, user_agent text, metadata jsonb, created_at timestamptz not null default now())`,
    sql`create table if not exists platform_settings (id text primary key default 'default', notification_email text, updated_at timestamptz not null default now())`,
    sql`create table if not exists patient_enrollments (id text primary key, clinic_id text not null references clinics(id) on delete cascade, emr_patient_id text not null, email text, code_hash text not null, status text not null default 'pending', claimed_by_user_id text references users(id) on delete set null, claimed_at timestamptz, created_at timestamptz not null default now())`,
    sql`create table if not exists patient_links (id text primary key, user_id text not null references users(id) on delete cascade, clinic_id text not null references clinics(id) on delete cascade, emr_patient_id text not null, created_at timestamptz not null default now())`,
    sql`alter table patient_enrollments add column if not exists label text`,
  ]);
}

export async function createTenantSchema(db: TenantDb) {
  await run(db, [
    sql`create table if not exists emr_patients (id text primary key, first_name text not null, last_name text not null, date_of_birth text not null, sex text not null, phone text, email text, address text, emergency_contact_name text, emergency_contact_phone text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists emr_encounters (id text primary key, emr_patient_id text not null references emr_patients(id) on delete cascade, encounter_date timestamptz not null default now(), reason text not null, provider_name text, shared_with_patient boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists emr_soap_notes (id text primary key, encounter_id text not null references emr_encounters(id) on delete cascade, subjective text, objective text, assessment text, plan text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists emr_vitals (id text primary key, encounter_id text not null references emr_encounters(id) on delete cascade, blood_pressure text, heart_rate text, temperature text, respiratory_rate text, oxygen_saturation text, weight text, height text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists emr_diagnoses (id text primary key, encounter_id text not null references emr_encounters(id) on delete cascade, code text, description text not null, created_at timestamptz not null default now())`,
    sql`create table if not exists emr_medications (id text primary key, encounter_id text not null references emr_encounters(id) on delete cascade, name text not null, dosage text, frequency text, instructions text, created_at timestamptz not null default now())`,
    sql`create table if not exists emr_lab_orders (id text primary key, encounter_id text not null references emr_encounters(id) on delete cascade, test_name text not null, status text not null default 'ordered', result text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists emr_allergies (id text primary key, emr_patient_id text not null references emr_patients(id) on delete cascade, allergen text not null, reaction text, severity text, created_at timestamptz not null default now())`,
    sql`create table if not exists emr_problems (id text primary key, emr_patient_id text not null references emr_patients(id) on delete cascade, name text not null, status text not null default 'active', onset_date text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists emr_social_history (id text primary key, emr_patient_id text not null references emr_patients(id) on delete cascade, tobacco_use text, alcohol_use text, drug_use text, housing text, employment text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists emr_appointments (id text primary key, emr_patient_id text not null references emr_patients(id) on delete cascade, appointment_date timestamptz not null, duration_minutes integer not null default 30, status text not null default 'scheduled', reason text, provider_name text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists emr_referrals (id text primary key, emr_patient_id text not null references emr_patients(id) on delete cascade, specialty text not null, reason text not null, status text not null default 'pending', referred_to text, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists emr_lab_test_types (id text primary key, name text not null unique, category text not null default 'general', enabled boolean not null default true, created_at timestamptz not null default now())`,
    sql`create table if not exists emr_lab_requests (id text primary key, emr_patient_id text not null references emr_patients(id) on delete cascade, test_type_id text references emr_lab_test_types(id) on delete set null, test_name text not null, category text not null default 'general', status text not null default 'ordered', ordered_at timestamptz not null default now(), placed_at timestamptz, result text, result_at timestamptz, reviewed_at timestamptz, doctor_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists lab_notification_contacts (id text primary key, name text not null, email text not null, created_at timestamptz not null default now())`,
    sql`create table if not exists emr_patient_contacts (id text primary key, emr_patient_id text not null references emr_patients(id) on delete cascade, name text not null, email text not null, relationship text, created_at timestamptz not null default now())`,
    sql`create table if not exists portal_messages (id text primary key, emr_patient_id text not null references emr_patients(id) on delete cascade, sender_user_id text, sender_role text not null, body text not null, read_at timestamptz, created_at timestamptz not null default now())`,
    sql`create table if not exists emr_appointment_requests (id text primary key, emr_patient_id text not null references emr_patients(id) on delete cascade, requested_date text, reason text not null, status text not null default 'pending', staff_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists emr_refill_requests (id text primary key, emr_patient_id text not null references emr_patients(id) on delete cascade, medication_id text references emr_medications(id) on delete set null, message text, status text not null default 'pending', staff_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists roster_days (id text primary key, roster_date text not null, status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists pods (id text primary key, roster_day_id text not null references roster_days(id) on delete cascade, name text not null, sort_order integer not null default 0, room_cleaned boolean not null default false, supplies_restocked boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists people (id text primary key, name text not null, role text not null, email text, phone text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`create table if not exists pod_assignments (id text primary key, pod_id text not null references pods(id) on delete cascade, person_id text not null references people(id) on delete cascade, created_at timestamptz not null default now())`,
    sql`create table if not exists roster_day_preceptors (id text primary key, roster_day_id text not null references roster_days(id) on delete cascade, person_id text not null references people(id) on delete cascade, created_at timestamptz not null default now())`,
    sql`create table if not exists patients (id text primary key, roster_day_id text not null references roster_days(id) on delete cascade, pod_id text references pods(id) on delete set null, emr_patient_id text references emr_patients(id) on delete set null, name text not null, prn text not null, appointment_time text not null, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
    sql`alter table emr_encounters add column if not exists reason_for_visit text`,
    sql`alter table emr_encounters alter column reason drop not null`,
    sql`alter table emr_encounters add column if not exists notes text`,
    sql`update emr_encounters set reason_for_visit = coalesce(reason_for_visit, reason, 'Visit')`,
    sql`alter table emr_encounters alter column reason_for_visit set not null`,
    sql`alter table emr_vitals add column if not exists weight_kg text`,
    sql`alter table emr_vitals add column if not exists height_cm text`,
    sql`alter table emr_diagnoses add column if not exists icd10_code text`,
    sql`alter table emr_problems add column if not exists icd10_code text`,
    sql`alter table emr_problems add column if not exists description text`,
    sql`alter table emr_problems alter column name drop not null`,
    sql`alter table emr_problems add column if not exists resolved_date text`,
    sql`alter table emr_social_history add column if not exists tobacco_status text`,
    sql`alter table emr_social_history add column if not exists tobacco_note text`,
    sql`alter table emr_social_history add column if not exists alcohol_status text`,
    sql`alter table emr_social_history add column if not exists alcohol_note text`,
    sql`alter table emr_social_history add column if not exists drug_status text`,
    sql`alter table emr_social_history add column if not exists drug_note text`,
    sql`alter table emr_social_history add column if not exists occupation text`,
    sql`alter table emr_social_history add column if not exists exercise text`,
    sql`alter table emr_social_history add column if not exists diet text`,
    sql`alter table emr_referrals add column if not exists specialist_name text`,
    sql`alter table emr_referrals alter column specialty drop not null`,
    sql`alter table emr_referrals alter column reason drop not null`,
    sql`update emr_referrals set specialist_name = coalesce(specialist_name, referred_to, 'Specialist')`,
    sql`alter table emr_referrals alter column specialist_name set not null`,
    sql`alter table emr_lab_requests add column if not exists notes text`,
    sql`alter table lab_notification_contacts add column if not exists label text`,
    sql`alter table lab_notification_contacts alter column name drop not null`,
    sql`alter table lab_notification_contacts add column if not exists category text not null default 'all'`,
    sql`alter table emr_patient_contacts add column if not exists label text`,
    sql`alter table emr_patient_contacts alter column name drop not null`,
    sql`alter table pods add column if not exists cubicle_cleaned boolean not null default false`,
    sql`alter table people add column if not exists notes text`,
    sql`alter table pod_assignments add column if not exists roster_day_id text references roster_days(id) on delete cascade`,
  ]);
}
