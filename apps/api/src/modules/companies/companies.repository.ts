import { prisma } from '../../lib/prisma';
import type { CreateCompanyInput, UpdateCompanyInput } from './companies.validator';
import type { NormalizedPagination } from '../../utils/pagination';

export const companiesRepository = {
  async findAll(pagination: NormalizedPagination, search?: string) {
    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.company.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
      }),
      prisma.company.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: { select: { users: true, candidates: true, interviews: true } },
      },
    });
  },

  async create(data: CreateCompanyInput) {
    return prisma.company.create({ data });
  },

  async update(id: string, data: UpdateCompanyInput) {
    return prisma.company.update({ where: { id }, data });
  },

  async softDelete(id: string) {
    return prisma.company.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },
};
