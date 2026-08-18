import { z } from 'zod';

export const createCandidateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().max(20).optional(),
  location: z.string().max(255).optional(),
  currentRole: z.string().max(255).optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
  skills: z.array(z.string().max(100)).default([]),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional(),
  companyId: z.string().uuid('Invalid company ID').optional(), // Admin/company-admin can set; recruiter uses own company
});

export const updateCandidateSchema = createCandidateSchema.partial();

export const updateCandidateStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'INTERVIEW_SCHEDULED',
    'INTERVIEWING',
    'NEXT_ROUND',
    'ON_HOLD',
    'REJECTED',
    'HIRED',
  ]),
});

export const candidateQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  status: z
    .enum(['NEW', 'INTERVIEW_SCHEDULED', 'INTERVIEWING', 'NEXT_ROUND', 'ON_HOLD', 'REJECTED', 'HIRED'])
    .optional(),
  skills: z.string().optional(), // comma-separated
});

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>;
export type UpdateCandidateStatusInput = z.infer<typeof updateCandidateStatusSchema>;
