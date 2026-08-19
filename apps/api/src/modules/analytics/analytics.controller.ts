import type { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { sendSuccess } from '../../utils/response';

export const analyticsController = {
  async getOverview(req: Request, res: Response): Promise<void> {
    const data = await analyticsService.getOverview(req.user!);
    sendSuccess(res, data, 'Analytics overview retrieved');
  },
};
