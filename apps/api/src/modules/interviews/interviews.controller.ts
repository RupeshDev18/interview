import type { Request, Response } from 'express';
import { interviewsService } from './interviews.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response';
import type { InterviewStatus } from '@intvwplt/shared';
import { candidateLinkService } from './candidate-link.service';

export const interviewsController = {
  async list(req: Request, res: Response): Promise<void> {
    const result = await interviewsService.list(
      {
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as string | undefined,
        candidateId: req.query.candidateId as string | undefined,
        interviewerId: req.query.interviewerId as string | undefined,
        companyId: req.query.companyId as string | undefined,
        status: req.query.status as InterviewStatus | undefined,
        roundNumber: req.query.roundNumber as string | undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        search: req.query.search as string | undefined,
      },
      req.user!,
    );

    sendPaginated(res, result.items, result.pagination);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const interview = await interviewsService.getById(id, req.user!);
    sendSuccess(res, interview);
  },

  async create(req: Request, res: Response): Promise<void> {
    const interview = await interviewsService.create(req.body, req.user!);
    sendCreated(res, interview, 'Interview scheduled successfully');
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const interview = await interviewsService.update(id, req.body, req.user!);
    sendSuccess(res, interview, 'Interview updated successfully');
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const interview = await interviewsService.updateStatus(id, req.body, req.user!);
    sendSuccess(res, interview, 'Interview status updated successfully');
  },

  async updateNotes(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const notes = await interviewsService.updateNotes(id, req.body, req.user!);
    sendSuccess(res, notes, 'Notes updated');
  },

  async updateQuestionNotes(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const questionId = req.params.questionId as string;
    const result = await interviewsService.updateQuestionNotes(
      id,
      questionId,
      req.body,
      req.user!,
    );
    sendSuccess(res, result, 'Question notes updated');
  },

  async createCandidateLink(req: Request, res: Response): Promise<void> {
    const result = await candidateLinkService.create(req.params.id as string, req.user!);
    sendSuccess(res, result, 'Candidate link generated');
  },

  async getCandidateJoinDetails(req: Request, res: Response): Promise<void> {
    const token = req.params.token as string;
    const result = await candidateLinkService.verifyToken(token);
    sendSuccess(res, result, 'Candidate interview details retrieved');
  },
};

