import { z } from 'zod';
import { Recommendation, CandidateStatus } from '@intvwplt/shared';

export const submitFeedbackSchema = z.object({
  templateId: z.string().uuid().optional(),
  scores: z.record(z.string(), z.number().min(1).max(5)),
  overallScore: z.number().min(1).max(5).optional(),
  strengths: z.string().max(5000).optional(),
  weaknesses: z.string().max(5000).optional(),
  concerns: z.string().max(5000).optional(),
  recommendation: z.nativeEnum(Recommendation),
  nextCandidateStatus: z.nativeEnum(CandidateStatus).optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
