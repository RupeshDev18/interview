import { z } from 'zod';
import { Recommendation, CandidateStatus } from '@intvwplt/shared';

export const submitFeedbackSchema = z.object({
  templateId: z.string().optional().nullable().or(z.literal('')),
  scores: z.record(z.string(), z.number().min(1).max(5)),
  overallScore: z.number().min(1).max(5).optional().nullable(),
  strengths: z.string().max(5000).optional().nullable().or(z.literal('')),
  weaknesses: z.string().max(5000).optional().nullable().or(z.literal('')),
  concerns: z.string().max(5000).optional().nullable().or(z.literal('')),
  recommendation: z.nativeEnum(Recommendation),
  nextCandidateStatus: z.nativeEnum(CandidateStatus).optional().nullable(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
