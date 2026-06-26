import { relations } from 'drizzle-orm';
import { pgTable, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID());
const now = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updated = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const emrPatients = pgTable('emr_patients', {
  id: id(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: text('date_of_birth').notNull(),
  sex: text('sex').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  createdAt: now(),
  updatedAt: updated(),
});

export const emrEncounters = pgTable('emr_encounters', {
  id: id(),
  emrPatientId: text('emr_patient_id').notNull().references(() => emrPatients.id, { onDelete: 'cascade' }),
  encounterDate: timestamp('encounter_date', { withTimezone: true }).notNull().defaultNow(),
  reason: text('reason'),
  reasonForVisit: text('reason_for_visit').notNull(),
  notes: text('notes'),
  providerName: text('provider_name'),
  sharedWithPatient: boolean('shared_with_patient').notNull().default(false),
  createdAt: now(),
  updatedAt: updated(),
});

export const emrSoapNotes = pgTable('emr_soap_notes', {
  id: id(),
  encounterId: text('encounter_id').notNull().references(() => emrEncounters.id, { onDelete: 'cascade' }),
  subjective: text('subjective'),
  objective: text('objective'),
  assessment: text('assessment'),
  plan: text('plan'),
  createdAt: now(),
  updatedAt: updated(),
});

export const emrVitals = pgTable('emr_vitals', {
  id: id(),
  encounterId: text('encounter_id').notNull().references(() => emrEncounters.id, { onDelete: 'cascade' }),
  bloodPressure: text('blood_pressure'),
  heartRate: text('heart_rate'),
  temperature: text('temperature'),
  respiratoryRate: text('respiratory_rate'),
  oxygenSaturation: text('oxygen_saturation'),
  weight: text('weight'),
  height: text('height'),
  weightKg: text('weight_kg'),
  heightCm: text('height_cm'),
  createdAt: now(),
  updatedAt: updated(),
});

export const emrDiagnoses = pgTable('emr_diagnoses', {
  id: id(),
  encounterId: text('encounter_id').notNull().references(() => emrEncounters.id, { onDelete: 'cascade' }),
  code: text('code'),
  icd10Code: text('icd10_code'),
  description: text('description').notNull(),
  createdAt: now(),
});

export const emrMedications = pgTable('emr_medications', {
  id: id(),
  encounterId: text('encounter_id').notNull().references(() => emrEncounters.id, { onDelete: 'cascade' }),
  name: text('name'),
  dosage: text('dosage'),
  frequency: text('frequency'),
  instructions: text('instructions'),
  createdAt: now(),
});

export const emrLabOrders = pgTable('emr_lab_orders', {
  id: id(),
  encounterId: text('encounter_id').notNull().references(() => emrEncounters.id, { onDelete: 'cascade' }),
  testName: text('test_name').notNull(),
  status: text('status').notNull().default('ordered'),
  result: text('result'),
  notes: text('notes'),
  createdAt: now(),
  updatedAt: updated(),
});

export const emrAllergies = pgTable('emr_allergies', {
  id: id(),
  emrPatientId: text('emr_patient_id').notNull().references(() => emrPatients.id, { onDelete: 'cascade' }),
  allergen: text('allergen').notNull(),
  reaction: text('reaction'),
  severity: text('severity'),
  createdAt: now(),
});

export const emrProblems = pgTable('emr_problems', {
  id: id(),
  emrPatientId: text('emr_patient_id').notNull().references(() => emrPatients.id, { onDelete: 'cascade' }),
  name: text('name'),
  icd10Code: text('icd10_code'),
  description: text('description'),
  status: text('status').notNull().default('active'),
  onsetDate: text('onset_date'),
  resolvedDate: text('resolved_date'),
  notes: text('notes'),
  createdAt: now(),
  updatedAt: updated(),
});

export const emrSocialHistory = pgTable('emr_social_history', {
  id: id(),
  emrPatientId: text('emr_patient_id').notNull().references(() => emrPatients.id, { onDelete: 'cascade' }),
  tobaccoUse: text('tobacco_use'),
  tobaccoStatus: text('tobacco_status'),
  tobaccoNote: text('tobacco_note'),
  alcoholUse: text('alcohol_use'),
  alcoholStatus: text('alcohol_status'),
  alcoholNote: text('alcohol_note'),
  drugUse: text('drug_use'),
  drugStatus: text('drug_status'),
  drugNote: text('drug_note'),
  housing: text('housing'),
  employment: text('employment'),
  occupation: text('occupation'),
  exercise: text('exercise'),
  diet: text('diet'),
  notes: text('notes'),
  createdAt: now(),
  updatedAt: updated(),
});

export const emrAppointments = pgTable('emr_appointments', {
  id: id(),
  emrPatientId: text('emr_patient_id').notNull().references(() => emrPatients.id, { onDelete: 'cascade' }),
  appointmentDate: timestamp('appointment_date', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  status: text('status').notNull().default('scheduled'),
  reason: text('reason'),
  providerName: text('provider_name'),
  notes: text('notes'),
  createdAt: now(),
  updatedAt: updated(),
});

export const emrReferrals = pgTable('emr_referrals', {
  id: id(),
  emrPatientId: text('emr_patient_id').notNull().references(() => emrPatients.id, { onDelete: 'cascade' }),
  specialistName: text('specialist_name').notNull(),
  specialty: text('specialty'),
  reason: text('reason'),
  status: text('status').notNull().default('pending'),
  referredTo: text('referred_to'),
  notes: text('notes'),
  createdAt: now(),
  updatedAt: updated(),
});

export const emrLabTestTypes = pgTable('emr_lab_test_types', {
  id: id(),
  name: text('name').notNull().unique(),
  category: text('category').notNull().default('general'),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: now(),
});

export const emrLabRequests = pgTable('emr_lab_requests', {
  id: id(),
  emrPatientId: text('emr_patient_id').notNull().references(() => emrPatients.id, { onDelete: 'cascade' }),
  testTypeId: text('test_type_id').references(() => emrLabTestTypes.id, { onDelete: 'set null' }),
  testName: text('test_name').notNull(),
  notes: text('notes'),
  category: text('category').notNull().default('general'),
  status: text('status').notNull().default('ordered'),
  orderedAt: timestamp('ordered_at', { withTimezone: true }).notNull().defaultNow(),
  placedAt: timestamp('placed_at', { withTimezone: true }),
  result: text('result'),
  resultAt: timestamp('result_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  doctorNote: text('doctor_note'),
  createdAt: now(),
  updatedAt: updated(),
});

export const labNotificationContacts = pgTable('lab_notification_contacts', {
  id: id(),
  name: text('name'),
  label: text('label'),
  email: text('email').notNull(),
  category: text('category').notNull().default('all'),
  createdAt: now(),
});

export const emrPatientContacts = pgTable('emr_patient_contacts', {
  id: id(),
  emrPatientId: text('emr_patient_id').notNull().references(() => emrPatients.id, { onDelete: 'cascade' }),
  name: text('name'),
  label: text('label'),
  email: text('email').notNull(),
  relationship: text('relationship'),
  createdAt: now(),
});

export const portalMessages = pgTable('portal_messages', {
  id: id(),
  emrPatientId: text('emr_patient_id').notNull().references(() => emrPatients.id, { onDelete: 'cascade' }),
  senderUserId: text('sender_user_id'),
  senderRole: text('sender_role').notNull(),
  body: text('body').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: now(),
});

export const emrAppointmentRequests = pgTable('emr_appointment_requests', {
  id: id(),
  emrPatientId: text('emr_patient_id').notNull().references(() => emrPatients.id, { onDelete: 'cascade' }),
  requestedDate: text('requested_date'),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('pending'),
  staffNote: text('staff_note'),
  createdAt: now(),
  updatedAt: updated(),
});

export const emrRefillRequests = pgTable('emr_refill_requests', {
  id: id(),
  emrPatientId: text('emr_patient_id').notNull().references(() => emrPatients.id, { onDelete: 'cascade' }),
  medicationId: text('medication_id').references(() => emrMedications.id, { onDelete: 'set null' }),
  message: text('message'),
  status: text('status').notNull().default('pending'),
  staffNote: text('staff_note'),
  createdAt: now(),
  updatedAt: updated(),
});

export const rosterDays = pgTable('roster_days', {
  id: id(),
  rosterDate: text('roster_date').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: now(),
  updatedAt: updated(),
});

export const pods = pgTable('pods', {
  id: id(),
  rosterDayId: text('roster_day_id').notNull().references(() => rosterDays.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  roomCleaned: boolean('room_cleaned').notNull().default(false),
  cubicleCleaned: boolean('cubicle_cleaned').notNull().default(false),
  suppliesRestocked: boolean('supplies_restocked').notNull().default(false),
  createdAt: now(),
  updatedAt: updated(),
});

export const people = pgTable('people', {
  id: id(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  email: text('email'),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: now(),
  updatedAt: updated(),
});

export const podAssignments = pgTable('pod_assignments', {
  id: id(),
  podId: text('pod_id').notNull().references(() => pods.id, { onDelete: 'cascade' }),
  personId: text('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  rosterDayId: text('roster_day_id').references(() => rosterDays.id, { onDelete: 'cascade' }),
  createdAt: now(),
});

export const rosterDayPreceptors = pgTable('roster_day_preceptors', {
  id: id(),
  rosterDayId: text('roster_day_id').notNull().references(() => rosterDays.id, { onDelete: 'cascade' }),
  personId: text('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  createdAt: now(),
});

export const patients = pgTable('patients', {
  id: id(),
  rosterDayId: text('roster_day_id').notNull().references(() => rosterDays.id, { onDelete: 'cascade' }),
  podId: text('pod_id').references(() => pods.id, { onDelete: 'set null' }),
  emrPatientId: text('emr_patient_id').references(() => emrPatients.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  prn: text('prn').notNull(),
  appointmentTime: text('appointment_time').notNull(),
  notes: text('notes'),
  createdAt: now(),
  updatedAt: updated(),
});

export const emrPatientsRelations = relations(emrPatients, ({ many, one }) => ({
  encounters: many(emrEncounters), appointments: many(emrAppointments), allergies: many(emrAllergies),
  problems: many(emrProblems), referrals: many(emrReferrals), labRequests: many(emrLabRequests),
  contacts: many(emrPatientContacts), socialHistory: one(emrSocialHistory),
}));
export const emrEncountersRelations = relations(emrEncounters, ({ one, many }) => ({
  patient: one(emrPatients, { fields: [emrEncounters.emrPatientId], references: [emrPatients.id] }),
  soapNote: one(emrSoapNotes), vitals: one(emrVitals), diagnoses: many(emrDiagnoses), medications: many(emrMedications), labOrders: many(emrLabOrders),
}));
export const emrSoapNotesRelations = relations(emrSoapNotes, ({ one }) => ({ encounter: one(emrEncounters, { fields: [emrSoapNotes.encounterId], references: [emrEncounters.id] }) }));
export const emrVitalsRelations = relations(emrVitals, ({ one }) => ({ encounter: one(emrEncounters, { fields: [emrVitals.encounterId], references: [emrEncounters.id] }) }));
export const emrDiagnosesRelations = relations(emrDiagnoses, ({ one }) => ({ encounter: one(emrEncounters, { fields: [emrDiagnoses.encounterId], references: [emrEncounters.id] }) }));
export const emrMedicationsRelations = relations(emrMedications, ({ one, many }) => ({ encounter: one(emrEncounters, { fields: [emrMedications.encounterId], references: [emrEncounters.id] }), refillRequests: many(emrRefillRequests) }));
export const emrLabOrdersRelations = relations(emrLabOrders, ({ one }) => ({ encounter: one(emrEncounters, { fields: [emrLabOrders.encounterId], references: [emrEncounters.id] }) }));
export const emrAllergiesRelations = relations(emrAllergies, ({ one }) => ({ patient: one(emrPatients, { fields: [emrAllergies.emrPatientId], references: [emrPatients.id] }) }));
export const emrProblemsRelations = relations(emrProblems, ({ one }) => ({ patient: one(emrPatients, { fields: [emrProblems.emrPatientId], references: [emrPatients.id] }) }));
export const emrSocialHistoryRelations = relations(emrSocialHistory, ({ one }) => ({ patient: one(emrPatients, { fields: [emrSocialHistory.emrPatientId], references: [emrPatients.id] }) }));
export const emrAppointmentsRelations = relations(emrAppointments, ({ one }) => ({ patient: one(emrPatients, { fields: [emrAppointments.emrPatientId], references: [emrPatients.id] }) }));
export const emrReferralsRelations = relations(emrReferrals, ({ one }) => ({ patient: one(emrPatients, { fields: [emrReferrals.emrPatientId], references: [emrPatients.id] }) }));
export const emrLabRequestsRelations = relations(emrLabRequests, ({ one }) => ({ patient: one(emrPatients, { fields: [emrLabRequests.emrPatientId], references: [emrPatients.id] }), testType: one(emrLabTestTypes, { fields: [emrLabRequests.testTypeId], references: [emrLabTestTypes.id] }) }));
export const emrPatientContactsRelations = relations(emrPatientContacts, ({ one }) => ({ patient: one(emrPatients, { fields: [emrPatientContacts.emrPatientId], references: [emrPatients.id] }) }));
export const portalMessagesRelations = relations(portalMessages, ({ one }) => ({ patient: one(emrPatients, { fields: [portalMessages.emrPatientId], references: [emrPatients.id] }) }));
export const emrAppointmentRequestsRelations = relations(emrAppointmentRequests, ({ one }) => ({ patient: one(emrPatients, { fields: [emrAppointmentRequests.emrPatientId], references: [emrPatients.id] }) }));
export const emrRefillRequestsRelations = relations(emrRefillRequests, ({ one }) => ({ patient: one(emrPatients, { fields: [emrRefillRequests.emrPatientId], references: [emrPatients.id] }), medication: one(emrMedications, { fields: [emrRefillRequests.medicationId], references: [emrMedications.id] }) }));
export const rosterDaysRelations = relations(rosterDays, ({ many }) => ({ pods: many(pods), patients: many(patients), preceptors: many(rosterDayPreceptors) }));
export const podsRelations = relations(pods, ({ one, many }) => ({ rosterDay: one(rosterDays, { fields: [pods.rosterDayId], references: [rosterDays.id] }), assignments: many(podAssignments), patients: many(patients) }));
export const peopleRelations = relations(people, ({ many }) => ({ assignments: many(podAssignments), preceptorDays: many(rosterDayPreceptors) }));
export const podAssignmentsRelations = relations(podAssignments, ({ one }) => ({ pod: one(pods, { fields: [podAssignments.podId], references: [pods.id] }), person: one(people, { fields: [podAssignments.personId], references: [people.id] }) }));
export const rosterDayPreceptorsRelations = relations(rosterDayPreceptors, ({ one }) => ({ rosterDay: one(rosterDays, { fields: [rosterDayPreceptors.rosterDayId], references: [rosterDays.id] }), person: one(people, { fields: [rosterDayPreceptors.personId], references: [people.id] }) }));
export const patientsRelations = relations(patients, ({ one }) => ({ rosterDay: one(rosterDays, { fields: [patients.rosterDayId], references: [rosterDays.id] }), pod: one(pods, { fields: [patients.podId], references: [pods.id] }), emrPatient: one(emrPatients, { fields: [patients.emrPatientId], references: [emrPatients.id] }) }));

export type EmrPatient = typeof emrPatients.$inferSelect;
export type EmrAppointment = typeof emrAppointments.$inferSelect;
export type EmrAllergy = typeof emrAllergies.$inferSelect;
export type EmrProblem = typeof emrProblems.$inferSelect;
export type EmrMedication = typeof emrMedications.$inferSelect;
export type EmrDiagnosis = typeof emrDiagnoses.$inferSelect;
export type EmrVitals = typeof emrVitals.$inferSelect;
export type EmrSoapNote = typeof emrSoapNotes.$inferSelect;
export type EmrLabOrder = typeof emrLabOrders.$inferSelect;
export type EmrReferral = typeof emrReferrals.$inferSelect;
export type EmrSocialHistory = typeof emrSocialHistory.$inferSelect;
export type EmrLabRequest = typeof emrLabRequests.$inferSelect;
export type EmrLabTestType = typeof emrLabTestTypes.$inferSelect;
export type LabNotificationContact = typeof labNotificationContacts.$inferSelect;
export type EmrPatientContact = typeof emrPatientContacts.$inferSelect;
export type PortalMessage = typeof portalMessages.$inferSelect;
export type EmrAppointmentRequest = typeof emrAppointmentRequests.$inferSelect;
export type EmrRefillRequest = typeof emrRefillRequests.$inferSelect;
export type PersonRole = 'preceptor' | 'med_student' | 'scribe' | 'translator' | 'shadow';
