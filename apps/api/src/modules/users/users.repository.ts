import { prisma } from '../../lib/prisma';
import type { UserRole } from '@prisma/client';
import type { NormalizedPagination } from '../../utils/pagination';

export const usersRepository = {
  async findAll(
    pagination: NormalizedPagination,
    filters: { companyId?: string; role?: UserRole; search?: string },
  ) {
    const where = {
      deletedAt: null,
      ...(filters.companyId && { companyId: filters.companyId }),
      ...(filters.role && { role: filters.role }),
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' as const } },
          { lastName: { contains: filters.search, mode: 'insensitive' as const } },
          { email: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          // Never select passwordHash
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        company: { select: { id: true, name: true } },
        interviewer: { select: { id: true, timezone: true, isAvailable: true } },
      },
    });
  },

  async update(id: string, data: Partial<{ firstName: string; lastName: string; phone: string; isActive: boolean; companyId: string }>) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isActive: true, companyId: true,
        updatedAt: true,
      },
    });
  },

  async softDelete(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  },
};
