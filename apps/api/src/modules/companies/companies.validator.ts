import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255).trim(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url('Invalid URL').optional(),
  logoUrl: z.string().url('Invalid URL').optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
