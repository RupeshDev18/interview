import type { Request, Response } from 'express';
import { interviewersService } from './interviewers.service';
import { sendSuccess } from '../../utils/response';

export const interviewersController = {
  async list(req: Request, res: Response): Promise<void> {
    const isAvailable =
      req.query.isAvailable === 'true'
        ? true
        : req.query.isAvailable === 'false'
        ? false
        : undefined;

    const interviewers = await interviewersService.list(
      {
        isAvailable,
        search: req.query.search as string | undefined,
      },
      req.user!,
    );

    sendSuccess(res, interviewers);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const interviewer = await interviewersService.getById(id);
    sendSuccess(res, interviewer);
  },

  async getMine(req: Request, res: Response): Promise<void> {
    const interviewer = await interviewersService.getByUserId(req.user!.id);
    sendSuccess(res, interviewer);
  },
};
