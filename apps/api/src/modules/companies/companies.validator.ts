import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255).trim(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const updateCompanySchema = createCompanySchema.partial();

export const onboardCompanySchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(255).trim(),
  companyEmail: z.string().email('Invalid company email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  adminFirstName: z.string().min(1, 'Admin first name is required').max(100).trim(),
  adminLastName: z.string().min(1, 'Admin last name is required').max(100).trim(),
  adminEmail: z.string().email('Invalid admin email').toLowerCase().trim(),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type OnboardCompanyInput = z.infer<typeof onboardCompanySchema>;
