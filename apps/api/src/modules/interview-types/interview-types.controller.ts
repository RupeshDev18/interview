import type { Request, Response } from 'express';
import { interviewTypesService } from './interview-types.service';
import { sendSuccess } from '../../utils/response';

export const interviewTypesController = {
  async list(_req: Request, res: Response): Promise<void> {
    const types = await interviewTypesService.list();
    sendSuccess(res, types);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const type = await interviewTypesService.getById(id);
    sendSuccess(res, type);
  },

  async listTemplates(_req: Request, res: Response): Promise<void> {
    const templates = await interviewTypesService.listTemplates();
    sendSuccess(res, templates);
  },
};
