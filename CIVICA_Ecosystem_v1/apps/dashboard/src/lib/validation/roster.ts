import { z } from 'zod';

export const personRoleSchema = z.enum(['preceptor', 'med_student', 'scribe', 'translator', 'shadow']);

export const addPersonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  role: personRoleSchema,
  notes: z.string().max(500).optional(),
});

export const updatePersonSchema = z.object({
  personId: z.uuid(),
  name: z.string().min(1, 'Name is required').max(200),
  role: personRoleSchema,
  notes: z.string().max(500).optional(),
});

export const removePersonSchema = z.object({
  personId: z.uuid(),
});

export const createPodSchema = z.object({
  name: z.string().min(1, 'Pod name is required').max(100),
});

export const deletePodSchema = z.object({
  podId: z.uuid(),
});

export const assignStaffSchema = z.object({
  podId: z.uuid(),
  personId: z.uuid(),
});

export const unassignStaffSchema = z.object({
  assignmentId: z.uuid(),
});

export const markPreceptorPresentSchema = z.object({
  personId: z.uuid(),
});

export const removePreceptorSchema = z.object({
  preceptorId: z.uuid(),
});

export const addPatientSchema = z.object({
  podId: z.uuid().nullable().optional(),
  prn: z.string().min(1, 'PRN is required').max(50),
  name: z.string().min(1, 'Name is required').max(200),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
});

export const reassignPatientSchema = z.object({
  patientId: z.uuid(),
  podId: z.uuid().nullable(),
});

export const removePatientSchema = z.object({
  patientId: z.uuid(),
});

export const toggleCleanupSchema = z.object({
  podId: z.uuid(),
  field: z.enum(['roomCleaned', 'cubicleCleaned']),
  value: z.boolean(),
});

export const startNewDaySchema = z.object({
  confirm: z.literal('true'),
});

export type AddPersonInput = z.infer<typeof addPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
export type RemovePersonInput = z.infer<typeof removePersonSchema>;
export type CreatePodInput = z.infer<typeof createPodSchema>;
export type DeletePodInput = z.infer<typeof deletePodSchema>;
export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
export type UnassignStaffInput = z.infer<typeof unassignStaffSchema>;
export type MarkPreceptorPresentInput = z.infer<typeof markPreceptorPresentSchema>;
export type RemovePreceptorInput = z.infer<typeof removePreceptorSchema>;
export type AddPatientInput = z.infer<typeof addPatientSchema>;
export type ReassignPatientInput = z.infer<typeof reassignPatientSchema>;
export type RemovePatientInput = z.infer<typeof removePatientSchema>;
export type ToggleCleanupInput = z.infer<typeof toggleCleanupSchema>;
export type StartNewDayInput = z.infer<typeof startNewDaySchema>;
