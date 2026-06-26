import { z } from 'zod';

// Empty string clears the notification email (disables notifications).
export const notificationEmailSchema = z.object({
  notificationEmail: z.union([z.literal(''), z.email('Enter a valid email address')]),
});

function meetsPasswordPolicy(pw: string): boolean {
  return pw.length >= 10 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
}

export const createUserByAdminSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.email('Enter a valid email address'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .refine(meetsPasswordPolicy, 'Password must include a letter and a digit'),
  clinicId: z.string().uuid('Select a clinic'),
  roleId: z.string().uuid('Select a role'),
  membershipStatus: z.enum(['pending', 'active']).default('active'),
});

export const createClinicByAdminSchema = z.object({
  clinicName: z.string().min(1, 'Clinic name is required').max(200),
  clinicCode: z.string().min(6, 'Clinic code must be at least 6 characters').max(100),
  headSupervisor: z.string().min(1, 'Head supervisor is required').max(200),
  location: z.string().min(1, 'Location is required').max(200),
  affiliatedInstitution: z.string().max(200).optional().or(z.literal('')),
});
