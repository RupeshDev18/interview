import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
  role: z.enum(['ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER']),
  companyId: z.string().optional().nullable().or(z.literal('')),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).trim().optional(),
  lastName: z.string().min(1).max(100).trim().optional(),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
  role: z.enum(['ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER']).optional(),
  isActive: z.boolean().optional(),
  companyId: z.string().optional().nullable().or(z.literal('')),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
