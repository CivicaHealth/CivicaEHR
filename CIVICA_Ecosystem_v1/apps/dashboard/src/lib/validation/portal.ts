import { z } from 'zod';

export const sendPortalMessageSchema = z.object({
  body: z.string().min(1, 'Message cannot be empty').max(5000, 'Message is too long'),
});

export const requestAppointmentSchema = z.object({
  reason: z.string().min(1, 'Please describe the reason').max(255),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
    .optional()
    .or(z.literal('')),
});

export const requestRefillSchema = z.object({
  medicationId: z.string().uuid('Select a medication'),
  note: z.string().max(255).optional().or(z.literal('')),
});

export type SendPortalMessageInput = z.infer<typeof sendPortalMessageSchema>;
export type RequestAppointmentInput = z.infer<typeof requestAppointmentSchema>;
export type RequestRefillInput = z.infer<typeof requestRefillSchema>;
