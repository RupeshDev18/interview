import type { Request, Response } from 'express';
import { questionsService } from './questions.service';
import { sendCreated, sendNoContent, sendPaginated, sendSuccess } from '../../utils/response';
import { param } from '../../utils/request';

export const questionsController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await questionsService.list(req.query);
    sendPaginated(res, result.items, result.pagination);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const question = await questionsService.getById(param(req.params.id));
    sendSuccess(res, question);
  },

  async create(req: Request, res: Response): Promise<void> {
    const question = await questionsService.create(req.body, req.user!);
    sendCreated(res, question, 'Question created');
  },

  async update(req: Request, res: Response): Promise<void> {
    const question = await questionsService.update(param(req.params.id), req.body);
    sendSuccess(res, question, 'Question updated');
  },

  async delete(req: Request, res: Response): Promise<void> {
    await questionsService.delete(param(req.params.id));
    sendNoContent(res);
  },

  async getCategories(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await questionsService.getCategories());
  },

  async getTechnologies(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, await questionsService.getTechnologies());
  },

  async addToInterview(req: Request, res: Response): Promise<void> {
    const question = await questionsService.addToInterview(param(req.params.interviewId), req.body, req.user!);
    sendCreated(res, question, 'Question added to interview');
  },

  async deleteFromInterview(req: Request, res: Response): Promise<void> {
    await questionsService.deleteFromInterview(
      param(req.params.interviewId),
      param(req.params.questionId),
      req.user!,
    );
    sendNoContent(res);
  },

  async reorderInterviewQuestions(req: Request, res: Response): Promise<void> {
    const questions = await questionsService.reorderInterviewQuestions(
      param(req.params.interviewId),
      req.body.orderedIds,
      req.user!,
    );
    sendSuccess(res, questions, 'Interview questions reordered');
  },
};
