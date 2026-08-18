import type { Request, Response } from 'express';
import { companiesService } from './companies.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response';
import type { CreateCompanyInput, UpdateCompanyInput } from './companies.validator';

export const companiesController = {
  async list(req: Request, res: Response) {
    const result = await companiesService.list({
      page: req.query.page as string,
      limit: req.query.limit as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      search: req.query.search as string,
    });
    sendSuccess(res, result);
  },

  async getById(req: Request, res: Response) {
    const company = await companiesService.getById(req.params.id);
    sendSuccess(res, company);
  },

  async create(req: Request, res: Response) {
    const company = await companiesService.create(req.body as CreateCompanyInput);
    sendCreated(res, company, 'Company created successfully');
  },

  async update(req: Request, res: Response) {
    const company = await companiesService.update(req.params.id, req.body as UpdateCompanyInput);
    sendSuccess(res, company, 'Company updated successfully');
  },

  async delete(req: Request, res: Response) {
    await companiesService.delete(req.params.id);
    sendNoContent(res);
  },
};
