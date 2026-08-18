import type { Request, Response } from 'express';
import { usersService } from './users.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response';
import type { UserRole } from '@prisma/client';

export const usersController = {
  async list(req: Request, res: Response) {
    const result = await usersService.list({
      page: req.query.page as string,
      limit: req.query.limit as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      companyId: req.query.companyId as string,
      role: req.query.role as UserRole,
      search: req.query.search as string,
    });
    sendSuccess(res, result);
  },

  async getById(req: Request, res: Response) {
    const id = req.params.id as string;
    const user = await usersService.getById(id);
    sendSuccess(res, user);
  },

  async create(req: Request, res: Response) {
    const user = await usersService.create(req.body);
    sendCreated(res, user, 'User created successfully');
  },

  async update(req: Request, res: Response) {
    const id = req.params.id as string;
    const user = await usersService.update(id, req.body);
    sendSuccess(res, user, 'User updated');
  },

  async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    await usersService.delete(id);
    sendNoContent(res);
  },
};
