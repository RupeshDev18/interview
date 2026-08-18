import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@intvwplt/shared';

export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
  sortBy?: string;
  sortOrder?: string;
}

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function normalizePagination(
  options: PaginationOptions,
  defaultSortBy = 'createdAt',
): NormalizedPagination {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(options.limit) || DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * limit;
  const sortOrder: 'asc' | 'desc' = options.sortOrder === 'asc' ? 'asc' : 'desc';
  const sortBy = options.sortBy || defaultSortBy;

  return { page, limit, skip, sortBy, sortOrder };
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
