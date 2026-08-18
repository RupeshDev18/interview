import { prisma } from '../../lib/prisma';

export const interviewTypesRepository = {
  async findAll() {
    return prisma.interviewType.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      include: {
        evaluationTemplate: {
          include: {
            criteria: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string) {
    return prisma.interviewType.findFirst({
      where: { id, deletedAt: null },
      include: {
        evaluationTemplate: {
          include: {
            criteria: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
  },

  async findAllTemplates() {
    return prisma.evaluationTemplate.findMany({
      include: {
        criteria: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  },
};
