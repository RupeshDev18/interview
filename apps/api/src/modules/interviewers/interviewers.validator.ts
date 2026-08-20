import { z } from 'zod';

export const createInterviewerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  companyId: z.string().uuid().optional(),
  bio: z.string().max(2000).optional(),
  yearsOfExperience: z.number().int().min(0).max(50).optional().default(3),
  expertise: z.array(z.string()).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  timezone: z.string().optional().default('UTC'),
  isAvailable: z.boolean().optional().default(true),
});

export const updateInterviewerSchema = createInterviewerSchema.partial();

export type CreateInterviewerInput = z.infer<typeof createInterviewerSchema>;
export type UpdateInterviewerInput = z.infer<typeof updateInterviewerSchema>;
