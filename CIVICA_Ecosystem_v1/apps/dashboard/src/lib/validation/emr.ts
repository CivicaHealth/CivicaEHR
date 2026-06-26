import { z } from 'zod';

export const emrSexSchema = z.enum(['male', 'female', 'other']);
export const emrAllergySeveritySchema = z.enum(['mild', 'moderate', 'severe']);
export const emrProblemStatusSchema = z.enum(['active', 'resolved']);
export const emrReferralStatusSchema = z.enum(['pending', 'sent', 'completed', 'cancelled']);
export const emrLabOrderStatusSchema = z.enum(['ordered', 'completed', 'cancelled']);
export const emrTobaccoStatusSchema = z.enum(['never', 'former', 'current']);
export const emrAlcoholStatusSchema = z.enum(['never', 'occasional', 'moderate', 'heavy']);
export const emrDrugStatusSchema = z.enum(['never', 'former', 'current']);
export const emrAppointmentStatusSchema = z.enum([
  'scheduled',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);

export const createEmrPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  sex: emrSexSchema,
  phone: z.string().max(20).optional(),
  email: z.union([z.email(), z.literal('')]).optional(),
  address: z.string().max(2000).optional(),
});

export const createEncounterSchema = z.object({
  emrPatientId: z.uuid(),
  encounterDate: z.string().min(1, 'Encounter date is required'),
  reasonForVisit: z.string().min(1, 'Reason for visit is required').max(255),
  notes: z.string().max(4000).optional(),
  // Optional vitals captured at intake
  bloodPressure: z.string().max(20).optional(),
  heartRate: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  temperature: z.string().max(20).optional(),
  respiratoryRate: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  oxygenSaturation: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  weightKg: z.string().max(20).optional(),
  heightCm: z.string().max(20).optional(),
});

export const saveSoapNoteSchema = z.object({
  encounterId: z.uuid(),
  subjective: z.string().max(8000).optional(),
  objective: z.string().max(8000).optional(),
  assessment: z.string().max(8000).optional(),
  plan: z.string().max(8000).optional(),
});

export const saveVitalsSchema = z.object({
  encounterId: z.uuid(),
  bloodPressure: z.string().max(20).optional(),
  heartRate: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  temperature: z.string().max(20).optional(),
  respiratoryRate: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  oxygenSaturation: z.coerce.number().int().positive().optional().or(z.literal('').transform(() => undefined)),
  weightKg: z.string().max(20).optional(),
  heightCm: z.string().max(20).optional(),
});

export const addDiagnosisSchema = z.object({
  encounterId: z.uuid(),
  icd10Code: z.string().min(1, 'ICD-10 code is required').max(20),
  description: z.string().min(1, 'Description is required').max(255),
});

export const removeDiagnosisSchema = z.object({
  diagnosisId: z.uuid(),
});

export const addMedicationSchema = z.object({
  encounterId: z.uuid(),
  name: z.string().min(1, 'Medication name is required').max(255),
  dosage: z.string().max(100).optional(),
  instructions: z.string().max(2000).optional(),
});

export const removeMedicationSchema = z.object({
  medicationId: z.uuid(),
});

export const addAllergySchema = z.object({
  emrPatientId: z.uuid(),
  allergen: z.string().min(1, 'Allergen is required').max(255),
  reaction: z.string().max(255).optional(),
  severity: emrAllergySeveritySchema.optional(),
});

export const removeAllergySchema = z.object({
  allergyId: z.uuid(),
});

export const addProblemSchema = z.object({
  emrPatientId: z.uuid(),
  icd10Code: z.string().min(1, 'ICD-10 code is required').max(20),
  description: z.string().min(1, 'Description is required').max(255),
  onsetDate: z.string().optional(),
});

export const updateProblemStatusSchema = z.object({
  problemId: z.uuid(),
  status: emrProblemStatusSchema,
});

export const removeProblemSchema = z.object({
  problemId: z.uuid(),
});

export const saveLabOrderSchema = z.object({
  encounterId: z.uuid(),
  labOrderId: z.uuid().optional(),
  testName: z.string().min(1, 'Test name is required').max(255),
  status: emrLabOrderStatusSchema.optional(),
  result: z.string().max(8000).optional(),
});

export const saveReferralSchema = z.object({
  emrPatientId: z.uuid(),
  referralId: z.uuid().optional(),
  specialistName: z.string().min(1, 'Specialist name is required').max(255),
  specialty: z.string().max(255).optional(),
  reason: z.string().max(4000).optional(),
  status: emrReferralStatusSchema.optional(),
});

export const saveSocialHistorySchema = z.object({
  emrPatientId: z.uuid(),
  tobaccoStatus: z.union([emrTobaccoStatusSchema, z.literal('')]).optional(),
  tobaccoNote: z.string().max(255).optional(),
  alcoholStatus: z.union([emrAlcoholStatusSchema, z.literal('')]).optional(),
  alcoholNote: z.string().max(255).optional(),
  drugStatus: z.union([emrDrugStatusSchema, z.literal('')]).optional(),
  drugNote: z.string().max(255).optional(),
  occupation: z.string().max(255).optional(),
  exercise: z.string().max(255).optional(),
  diet: z.string().max(255).optional(),
  notes: z.string().max(4000).optional(),
});

export const saveAppointmentSchema = z.object({
  emrPatientId: z.uuid(),
  appointmentId: z.uuid().optional(),
  appointmentDate: z.string().min(1, 'Date & time is required'),
  durationMinutes: z.coerce.number().int().positive().max(1440).optional(),
  reason: z.string().min(1, 'Reason is required').max(255),
  status: emrAppointmentStatusSchema.optional(),
  notes: z.string().max(4000).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.uuid(),
  status: emrAppointmentStatusSchema,
});

export const deleteAppointmentSchema = z.object({
  appointmentId: z.uuid(),
});

export const patchAppointmentSchema = z.object({
  emrPatientId: z.uuid().optional(),
  appointmentDate: z.string().min(1).optional(),
  durationMinutes: z.coerce.number().int().positive().max(1440).optional(),
  reason: z.string().min(1).max(255).optional(),
  status: emrAppointmentStatusSchema.optional(),
  notes: z.string().max(4000).optional(),
});

export const emrLabCategorySchema = z.enum(['general', 'gynecology']);
export const labNotificationCategorySchema = z.enum(['general', 'gynecology', 'all']);

export const createLabRequestSchema = z.object({
  emrPatientId: z.uuid(),
  testName: z.string().min(1, 'Test name is required').max(255),
  category: emrLabCategorySchema,
  notes: z.string().max(2000).optional(),
});

export const updateLabRequestStatusSchema = z.object({
  labRequestId: z.uuid(),
  status: z.enum(['placed', 'completed', 'cancelled']),
  result: z.string().max(8000).optional(),
});

export const reviewLabRequestSchema = z.object({
  labRequestId: z.uuid(),
  doctorNote: z.string().min(1, 'A note is required').max(8000),
});

export const addLabTestTypeSchema = z.object({
  name: z.string().min(1, 'Test name is required').max(255),
});

export const toggleLabTestTypeSchema = z.object({
  labTestTypeId: z.uuid(),
  enabled: z.coerce.boolean(),
});

export const removeLabTestTypeSchema = z.object({
  labTestTypeId: z.uuid(),
});

export const addLabNotificationContactSchema = z.object({
  email: z.email('Enter a valid email address'),
  label: z.string().max(100).optional(),
  category: labNotificationCategorySchema,
});

export const removeLabNotificationContactSchema = z.object({
  contactId: z.uuid(),
});

export type CreateEmrPatientInput = z.infer<typeof createEmrPatientSchema>;
export type CreateEncounterInput = z.infer<typeof createEncounterSchema>;
export type SaveSoapNoteInput = z.infer<typeof saveSoapNoteSchema>;
export type SaveVitalsInput = z.infer<typeof saveVitalsSchema>;
export type AddDiagnosisInput = z.infer<typeof addDiagnosisSchema>;
export type AddMedicationInput = z.infer<typeof addMedicationSchema>;
export type AddAllergyInput = z.infer<typeof addAllergySchema>;
export type AddProblemInput = z.infer<typeof addProblemSchema>;
export type SaveLabOrderInput = z.infer<typeof saveLabOrderSchema>;
export type SaveReferralInput = z.infer<typeof saveReferralSchema>;
export type SaveAppointmentInput = z.infer<typeof saveAppointmentSchema>;
export type SaveSocialHistoryInput = z.infer<typeof saveSocialHistorySchema>;
