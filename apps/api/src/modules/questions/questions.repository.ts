import { prisma } from '../../lib/prisma';
import type { Difficulty, Prisma } from '@prisma/client';
import type { NormalizedPagination } from '../../utils/pagination';

export const questionsRepository = {
  // ── Question Bank ──────────────────────────────────────────────────────────

  async findAll(
    pagination: NormalizedPagination,
    filters: {
      search?: string;
      category?: string;
      technology?: string;
      difficulty?: Difficulty;
      tags?: string[];
    },
  ) {
    const where: Prisma.QuestionBankWhereInput = {
      deletedAt: null,
      isActive: true,
      ...(filters.category && { category: { equals: filters.category, mode: 'insensitive' as const } }),
      ...(filters.technology && { technology: { equals: filters.technology, mode: 'insensitive' as const } }),
      ...(filters.difficulty && { difficulty: filters.difficulty }),
      ...(filters.tags?.length && { tags: { hasSome: filters.tags } }),
      ...(filters.search && {
        OR: [
          { question: { contains: filters.search, mode: 'insensitive' as const } },
          { category: { contains: filters.search, mode: 'insensitive' as const } },
          { technology: { contains: filters.search, mode: 'insensitive' as const } },
          { tags: { has: filters.search } },
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.questionBank.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
      }),
      prisma.questionBank.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return prisma.questionBank.findFirst({
      where: { id, deletedAt: null },
    });
  },

  async create(data: {
    category: string;
    technology?: string;
    question: string;
    expectedAnswer?: string;
    difficulty: Difficulty;
    tags: string[];
    createdById: string;
  }) {
    return prisma.questionBank.create({ data });
  },

  async update(id: string, data: Partial<{
    category: string;
    technology: string;
    question: string;
    expectedAnswer: string;
    difficulty: Difficulty;
    tags: string[];
    isActive: boolean;
  }>) {
    return prisma.questionBank.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    return prisma.questionBank.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },

  async getDistinctCategories(): Promise<string[]> {
    const results = await prisma.questionBank.findMany({
      where: { deletedAt: null, isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return results.map((r) => r.category);
  },

  async getDistinctTechnologies(): Promise<string[]> {
    const results = await prisma.questionBank.findMany({
      where: { deletedAt: null, isActive: true, technology: { not: null } },
      select: { technology: true },
      distinct: ['technology'],
      orderBy: { technology: 'asc' },
    });
    return results.map((r) => r.technology!);
  },

  // ── Interview Questions ────────────────────────────────────────────────────

  async addInterviewQuestion(data: {
    interviewId: string;
    questionText: string;
    category?: string;
    difficulty?: Difficulty;
    expectedAnswer?: string;
    bankQuestionId?: string;
    sortOrder?: number;
  }) {
    // Get current max sortOrder
    const maxSort = await prisma.interviewQuestion.aggregate({
      where: { interviewId: data.interviewId },
      _max: { sortOrder: true },
    });
    const nextOrder = (maxSort._max.sortOrder ?? -1) + 1;

    return prisma.interviewQuestion.create({
      data: {
        interviewId: data.interviewId,
        questionText: data.questionText,
        category: data.category,
        difficulty: data.difficulty,
        expectedAnswer: data.expectedAnswer,
        bankQuestionId: data.bankQuestionId,
        sortOrder: data.sortOrder ?? nextOrder,
      },
    });
  },

  async deleteInterviewQuestion(questionId: string) {
    return prisma.interviewQuestion.delete({ where: { id: questionId } });
  },

  async findInterviewQuestion(interviewId: string, questionId: string) {
    return prisma.interviewQuestion.findFirst({
      where: { id: questionId, interviewId },
    });
  },

  async findInterviewQuestionIds(interviewId: string) {
    const questions = await prisma.interviewQuestion.findMany({
      where: { interviewId },
      select: { id: true },
    });
    return questions.map((question) => question.id);
  },

  async reorderInterviewQuestions(
    interviewId: string,
    orderedIds: string[],
  ) {
    const updates = orderedIds.map((id, idx) =>
      prisma.interviewQuestion.update({
        where: { id },
        data: { sortOrder: idx },
      }),
    );
    return prisma.$transaction(updates);
  },
};
