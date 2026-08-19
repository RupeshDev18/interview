import { z } from 'zod';
import { Difficulty } from '@intvwplt/shared';

export const createQuestionSchema = z.object({
  category: z.string().min(1, 'Category is required').max(100),
  technology: z.string().max(100).optional(),
  question: z.string().min(5, 'Question text must be at least 5 characters').max(2000),
  expectedAnswer: z.string().max(5000).optional(),
  difficulty: z.nativeEnum(Difficulty),
  tags: z.array(z.string().max(50)).default([]),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const addInterviewQuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required').max(2000).optional(),
  category: z.string().max(100).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  expectedAnswer: z.string().max(5000).optional(),
  bankQuestionId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).optional(),
}).refine((data) => data.questionText || data.bankQuestionId, {
  message: 'Provide questionText or bankQuestionId',
  path: ['questionText'],
});

export const questionsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(['category', 'technology', 'difficulty', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  technology: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  tags: z.string().optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type AddInterviewQuestionInput = z.infer<typeof addInterviewQuestionSchema>;
