import { z } from 'zod';
import { InterviewStatus, Difficulty } from '@intvwplt/shared';

export const createInterviewSchema = z.object({
  candidateId: z.string().uuid('Valid candidate ID is required'),
  interviewerId: z.string().uuid('Valid interviewer ID is required'),
  interviewTypeId: z.string().uuid('Valid interview type ID is required'),
  companyId: z.string().uuid().optional(),
  scheduledStart: z.string().datetime('scheduledStart must be an ISO datetime string'),
  scheduledEnd: z.string().datetime('scheduledEnd must be an ISO datetime string'),
  timezone: z.string().default('UTC'),
  roundNumber: z.number().int().min(1).default(1),
  notes: z.string().max(5000).optional(),
  initialQuestions: z
    .array(
      z.object({
        questionText: z.string().min(1, 'Question text is required'),
        category: z.string().optional(),
        difficulty: z.nativeEnum(Difficulty).optional(),
        expectedAnswer: z.string().optional(),
      }),
    )
    .optional(),
}).refine((data) => new Date(data.scheduledStart) < new Date(data.scheduledEnd), {
  message: 'scheduledStart must be before scheduledEnd',
  path: ['scheduledEnd'],
});

export const updateInterviewSchema = z.object({
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  timezone: z.string().optional(),
  interviewerId: z.string().uuid().optional(),
  interviewTypeId: z.string().uuid().optional(),
  roundNumber: z.number().int().min(1).optional(),
  notes: z.string().max(5000).optional(),
});

export const updateInterviewStatusSchema = z.object({
  status: z.nativeEnum(InterviewStatus),
  cancelReason: z.string().max(500).optional(),
});

export const updateInterviewNotesSchema = z.object({
  notes: z.string().max(20000, 'Notes cannot exceed 20000 characters'),
});

export const updateQuestionNotesSchema = z.object({
  candidateAnswer: z.string().optional(),
  interviewerNotes: z.string().optional(),
  score: z.number().int().min(1).max(5).optional(),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type UpdateInterviewStatusInput = z.infer<typeof updateInterviewStatusSchema>;
export type UpdateInterviewNotesInput = z.infer<typeof updateInterviewNotesSchema>;
export type UpdateQuestionNotesInput = z.infer<typeof updateQuestionNotesSchema>;
