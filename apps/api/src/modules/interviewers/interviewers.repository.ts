import { prisma } from '../../lib/prisma';
import type { Prisma } from '@prisma/client';

export const interviewersRepository = {
  async findAll(params: { companyId?: string; isAvailable?: boolean; search?: string }) {
    const where: Prisma.InterviewerWhereInput = {
      deletedAt: null,
      ...(params.isAvailable !== undefined && { isAvailable: params.isAvailable }),
      ...(params.companyId && {
        user: {
          companyId: params.companyId,
          deletedAt: null,
          isActive: true,
        },
      }),
      ...(params.search && {
        OR: [
          { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
          { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
          { user: { email: { contains: params.search, mode: 'insensitive' } } },
          { expertise: { has: params.search } },
          { technologies: { has: params.search } },
        ],
      }),
    };

    return prisma.interviewer.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            companyId: true,
          },
        },
      },
      orderBy: {
        user: { firstName: 'asc' },
      },
    });
  },

  async findById(id: string) {
    return prisma.interviewer.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            companyId: true,
          },
        },
      },
    });
  },

  async findByUserId(userId: string) {
    return prisma.interviewer.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            companyId: true,
          },
        },
      },
    });
  },
};
