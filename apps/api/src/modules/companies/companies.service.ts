import { companiesRepository } from './companies.repository';
import { NotFoundError } from '../../utils/errors';
import { normalizePagination, buildPaginationMeta } from '../../utils/pagination';
import type { CreateCompanyInput, UpdateCompanyInput } from './companies.validator';
import type { PaginationQuery } from '@intvwplt/shared';

export const companiesService = {
  async list(query: PaginationQuery & { search?: string }) {
    const pagination = normalizePagination(query, 'createdAt');
    const { items, total } = await companiesRepository.findAll(pagination, query.search);
    return {
      items,
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  },

  async getById(id: string) {
    const company = await companiesRepository.findById(id);
    if (!company) throw new NotFoundError('Company');
    return company;
  },

  async create(data: CreateCompanyInput) {
    return companiesRepository.create(data);
  },

  async update(id: string, data: UpdateCompanyInput) {
    await companiesService.getById(id); // 404 if not found
    return companiesRepository.update(id, data);
  },

  async delete(id: string) {
    await companiesService.getById(id);
    await companiesRepository.softDelete(id);
  },
};
