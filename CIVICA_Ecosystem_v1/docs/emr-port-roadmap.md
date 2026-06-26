# EMR Tool Port Roadmap

Porting `EHR_copy/` (standalone Django EHR) into the Civica monorepo as the real `emr` tool,
following the `roster` tool's architecture (Next.js + Drizzle tenant schema + server actions
+ audit logging). Permissions: `platform_admin` / `clinic_admin` / `emr` access level
`supervisor` → full CRUD; `emr` access level `staff` → view-only (`canEditEmr`).

## Phase 1 — Core Clinical Chart (done)

- Tenant schema `packages/db/src/tenant/schema/emr.ts`: `emrPatients`, `emrEncounters`,
  `emrSoapNotes`, `emrVitals`, `emrDiagnoses`, `emrMedications`, `emrAllergies`,
  `emrProblems`.
- Nullable `emrPatientId` FK + relation added to roster's `patients` table, linking roster
  check-ins to EMR charts (no UI yet).
- `canEditEmr(user, membership)` added to `@civica/permissions`.
- New `AUDIT_ACTIONS`: `EMR_PATIENT_CREATED/UPDATED`, `EMR_ENCOUNTER_CREATED/UPDATED`,
  `EMR_SOAP_NOTE_SAVED`, `EMR_VITALS_SAVED`, `EMR_DIAGNOSIS_ADDED/REMOVED`,
  `EMR_MEDICATION_ADDED/REMOVED`, `EMR_ALLERGY_ADDED/REMOVED`,
  `EMR_PROBLEM_ADDED/UPDATED/REMOVED`.
- Queries: `getEmrPatients`, `getEmrPatientDetail` in
  `apps/dashboard/src/server/queries/emr-queries.ts`.
- Server actions in `apps/dashboard/src/server/actions/emr/`: patient create, encounter
  create, SOAP note + vitals upsert, diagnosis/medication add+remove,
  allergy/problem add+update+remove. All Zod-validated, permission-checked, audited.
- UI: `/emr` patient list + add-patient form; `/emr/patients/[id]` chart page with
  demographics header, allergies/problems sections, encounters list (each with vitals, SOAP
  note, diagnoses, medications) and a new-encounter form. All edit affordances hidden when
  `!canEdit`.
- Added a `nurse@civica.dev` / `NursePass123!` demo user with `emr: 'staff'` (view-only)
  access to exercise the permission split, alongside `doctor@civica.dev`
  (`emr: 'supervisor'`, full access) and `admin@civica.dev` (platform admin, full access).
- Migration generated and applied (`packages/db/src/tenant/migrations/0002_flat_mandroid.sql`).

Follow-ups / deviations: none — patient demographics are view-only after creation in Phase 1
(no edit-patient form yet); add one in a later phase if needed.

## Phase 2 — Appointments

Port `Appointment` model: scheduling, status workflow (scheduled/checked-in/completed/
cancelled/no-show), list view tied to `emrPatients`.

## Phase 3 — Calendar UI

Calendar view for appointments (day/week), built on the Phase 2 data model.

## Phase 4 — Orders & Referrals

Port `LabOrder`, `ImagingOrder`, `Prescription`, `Referral` — order entry, status tracking,
results, linked to encounters/patients.

## Phase 5 — Social History, Documents, Roster Link UI

Port `SocialHistory` and `Document` (uploads/attachments per patient). Build UI for linking
roster check-ins to `emrPatients` via the existing `emrPatientId` FK (search/select on the
roster patient page, display linked chart link).

Deferred indefinitely (not currently planned): `PortalMessage`, `HIPAALog`/`LoginAttempt`
(Civica already has audit logging + session-based auth covering this), EMR-specific user
management (Civica has roles/memberships).
