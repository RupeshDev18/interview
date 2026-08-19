import { questionsRepository } from './questions.repository';
import { interviewsRepository } from '../interviews/interviews.repository';
import { NotFoundError, AuthorizationError, ValidationError } from '../../utils/errors';
import { normalizePagination, buildPaginationMeta } from '../../utils/pagination';
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
  AddInterviewQuestionInput,
} from './questions.validator';
import type { Difficulty } from '@prisma/client';

interface RequestingUser {
  id: string;
  role: string;
  companyId?: string;
}

export const questionsService = {
  // ── Question Bank CRUD ─────────────────────────────────────────────────────

  async list(query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
    search?: string;
    category?: string;
    technology?: string;
    difficulty?: Difficulty;
    tags?: string;
  }) {
    const pagination = normalizePagination(query, 'category');
    const tagsFilter = query.tags?.split(',').map((t) => t.trim()).filter(Boolean);

    const { items, total } = await questionsRepository.findAll(pagination, {
      search: query.search,
      category: query.category,
      technology: query.technology,
      difficulty: query.difficulty,
      tags: tagsFilter,
    });

    return { items, pagination: buildPaginationMeta(total, pagination.page, pagination.limit) };
  },

  async getById(id: string) {
    const q = await questionsRepository.findById(id);
    if (!q) throw new NotFoundError('Question');
    return q;
  },

  async create(input: CreateQuestionInput, user: RequestingUser) {
    return questionsRepository.create({
      category: input.category,
      technology: input.technology,
      question: input.question,
      expectedAnswer: input.expectedAnswer,
      difficulty: input.difficulty as Difficulty,
      tags: input.tags,
      createdById: user.id,
    });
  },

  async update(id: string, input: UpdateQuestionInput) {
    await questionsService.getById(id);
    return questionsRepository.update(id, input as Parameters<typeof questionsRepository.update>[1]);
  },

  async delete(id: string) {
    await questionsService.getById(id);
    return questionsRepository.softDelete(id);
  },

  async getCategories() {
    return questionsRepository.getDistinctCategories();
  },

  async getTechnologies() {
    return questionsRepository.getDistinctTechnologies();
  },

  // ── Interview-scoped questions ─────────────────────────────────────────────

  async addToInterview(
    interviewId: string,
    input: AddInterviewQuestionInput,
    user: RequestingUser,
  ) {
    const companyId = user.role === 'ADMIN' ? undefined : user.companyId;
    const interview = await interviewsRepository.findById(interviewId, companyId);
    if (!interview) throw new NotFoundError('Interview');

    if (user.role === 'INTERVIEWER' && interview.interviewer.userId !== user.id) {
      throw new AuthorizationError('Not authorized to modify this interview');
    }

    // If pulling from the bank, snapshot the bank question text
    let questionText = input.questionText;
    let expectedAnswer = input.expectedAnswer;
    let category = input.category;
    let difficulty = input.difficulty as Difficulty | undefined;
    if (input.bankQuestionId) {
      const bankQ = await questionsRepository.findById(input.bankQuestionId);
      if (!bankQ) throw new NotFoundError('Question');
      questionText = bankQ.question;
      expectedAnswer = expectedAnswer ?? bankQ.expectedAnswer ?? undefined;
      category = category ?? bankQ.category;
      difficulty = difficulty ?? bankQ.difficulty;
    }

    if (!questionText) throw new ValidationError('Question text is required');

    return questionsRepository.addInterviewQuestion({
      interviewId,
      questionText,
      category,
      difficulty,
      expectedAnswer,
      bankQuestionId: input.bankQuestionId,
      sortOrder: input.sortOrder,
    });
  },

  async deleteFromInterview(
    interviewId: string,
    questionId: string,
    user: RequestingUser,
  ) {
    const companyId = user.role === 'ADMIN' ? undefined : user.companyId;
    const interview = await interviewsRepository.findById(interviewId, companyId);
    if (!interview) throw new NotFoundError('Interview');

    // Only assigned interviewer or admin/recruiter can delete questions
    if (user.role === 'INTERVIEWER' && interview.interviewer.userId !== user.id) {
      throw new AuthorizationError('Not authorized to modify this interview');
    }

    const question = await questionsRepository.findInterviewQuestion(interviewId, questionId);
    if (!question) throw new NotFoundError('Interview question');

    return questionsRepository.deleteInterviewQuestion(questionId);
  },

  async reorderInterviewQuestions(
    interviewId: string,
    orderedIds: string[],
    user: RequestingUser,
  ) {
    const companyId = user.role === 'ADMIN' ? undefined : user.companyId;
    const interview = await interviewsRepository.findById(interviewId, companyId);
    if (!interview) throw new NotFoundError('Interview');

    if (user.role === 'INTERVIEWER' && interview.interviewer.userId !== user.id) {
      throw new AuthorizationError('Not authorized to modify this interview');
    }

    const currentIds = await questionsRepository.findInterviewQuestionIds(interviewId);
    if (
      orderedIds.length !== currentIds.length ||
      new Set(orderedIds).size !== orderedIds.length ||
      orderedIds.some((id) => !currentIds.includes(id))
    ) {
      throw new ValidationError('orderedIds must contain every interview question exactly once');
    }

    return questionsRepository.reorderInterviewQuestions(interviewId, orderedIds);
  },
};
