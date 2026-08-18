import type { Request, Response } from 'express';
import { candidatesService } from './candidates.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response';
import type { CandidateStatus } from '@prisma/client';

export const candidatesController = {
  async list(req: Request, res: Response) {
    const result = await candidatesService.list(
      {
        page: req.query.page as string,
        limit: req.query.limit as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as string,
        search: req.query.search as string,
        status: req.query.status as CandidateStatus,
        skills: req.query.skills as string,
      },
      req.user!,
    );
    sendSuccess(res, result);
  },

  async getById(req: Request, res: Response) {
    const id = req.params.id as string;
    const candidate = await candidatesService.getById(id, req.user!);
    sendSuccess(res, candidate);
  },

  async getDossier(req: Request, res: Response) {
    const id = req.params.id as string;
    const dossier = await candidatesService.getDossier(id, req.user!);
    sendSuccess(res, dossier);
  },

  async create(req: Request, res: Response) {
    const candidate = await candidatesService.create(req.body, req.user!);
    sendCreated(res, candidate, 'Candidate created successfully');
  },

  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const candidate = await candidatesService.update(id, req.body, req.user!);
    sendSuccess(res, candidate, 'Candidate updated successfully');
  },

  async updateStatus(req: Request, res: Response) {
    const id = req.params.id as string;
    const candidate = await candidatesService.updateStatus(id, req.body, req.user!);
    sendSuccess(res, candidate, 'Candidate status updated');
  },

  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    await candidatesService.delete(id, req.user!);
    sendNoContent(res);
  },

  async getPipelineCounts(req: Request, res: Response) {
    const counts = await candidatesService.getPipelineCounts(req.user!);
    sendSuccess(res, counts);
  },
};
