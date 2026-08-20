import type { Request, Response } from 'express';
import { companiesService } from './companies.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response';
import type { CreateCompanyInput, UpdateCompanyInput, OnboardCompanyInput } from './companies.validator';

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
    const id = req.params.id as string;
    const company = await companiesService.getById(id);
    sendSuccess(res, company);
  },

  async create(req: Request, res: Response) {
    const company = await companiesService.create(req.body as CreateCompanyInput);
    sendCreated(res, company, 'Company created successfully');
  },

  async onboard(req: Request, res: Response) {
    const result = await companiesService.onboard(req.body as OnboardCompanyInput);
    sendCreated(res, result, 'Organization onboarded successfully with admin user');
  },

  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const company = await companiesService.update(id, req.body as UpdateCompanyInput);
    sendSuccess(res, company, 'Company updated successfully');
  },

  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    await companiesService.delete(id);
    sendNoContent(res);
  },
};
