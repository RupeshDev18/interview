import type { Request, Response } from 'express';
import { availabilityService } from './availability.service';
import { sendCreated, sendNoContent, sendSuccess } from '../../utils/response';
import { param } from '../../utils/request';

export const availabilityController = {
  async rules(req: Request, res: Response) { sendSuccess(res, await availabilityService.getRules(param(req.params.id), req.user!)); },
  async replaceRules(req: Request, res: Response) { sendSuccess(res, await availabilityService.replaceRules(param(req.params.id), req.body, req.user!), 'Availability updated'); },
  async exceptions(req: Request, res: Response) { sendSuccess(res, await availabilityService.listExceptions(param(req.params.id), req.query.from as string, req.query.to as string, req.user!)); },
  async createException(req: Request, res: Response) { sendCreated(res, await availabilityService.createException(param(req.params.id), req.body, req.user!), 'Availability exception created'); },
  async deleteException(req: Request, res: Response) { await availabilityService.deleteException(param(req.params.id), param(req.params.exceptionId), req.user!); sendNoContent(res); },
  async slots(req: Request, res: Response) { sendSuccess(res, await availabilityService.slots(param(req.params.id), req.query.from as string, req.query.to as string, req.query.durationMinutes as unknown as number, req.user!)); },
};
