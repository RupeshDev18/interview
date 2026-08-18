import { prisma } from '../../lib/prisma';
import type { CandidateStatus } from '@prisma/client';
import type { NormalizedPagination } from '../../utils/pagination';

export const candidatesRepository = {
  async findAll(
    pagination: NormalizedPagination,
    filters: {
      companyId?: string;
      status?: CandidateStatus;
      search?: string;
      skills?: string[];
    },
  ) {
    const where = {
      deletedAt: null,
      ...(filters.companyId && { companyId: filters.companyId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' as const } },
          { lastName: { contains: filters.search, mode: 'insensitive' as const } },
          { email: { contains: filters.search, mode: 'insensitive' as const } },
          { currentRole: { contains: filters.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(filters.skills?.length && {
        skills: { hasSome: filters.skills },
      }),
    };

    const [items, total] = await prisma.$transaction([
      prisma.candidate.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
        include: {
          resumes: {
            where: { isActive: true },
            orderBy: { uploadedAt: 'desc' },
            take: 1,
            select: { id: true, fileName: true, uploadedAt: true },
          },
          _count: { select: { interviews: true } },
        },
      }),
      prisma.candidate.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string, companyId?: string) {
    return prisma.candidate.findFirst({
      where: { id, deletedAt: null, ...(companyId && { companyId }) },
      include: {
        company: { select: { id: true, name: true } },
        resumes: {
          where: { isActive: true },
          orderBy: { uploadedAt: 'desc' },
          select: { id: true, fileName: true, fileUrl: true, storageKey: true, mimeType: true, fileSize: true, uploadedAt: true },
        },
        interviews: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: { roundNumber: 'asc' },
          include: {
            interviewType: { select: { id: true, name: true, durationMinutes: true } },
            interviewer: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
            feedback: { select: { recommendation: true, overallScore: true } },
          },
        },
      },
    });
  },

  async create(data: {
    companyId: string;
    createdById: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    location?: string;
    currentRole?: string;
    experienceYears?: number;
    skills: string[];
    linkedinUrl?: string;
  }) {
    return prisma.candidate.create({ data });
  },

  async update(id: string, data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    currentRole: string;
    experienceYears: number;
    skills: string[];
    linkedinUrl: string;
    status: CandidateStatus;
  }>) {
    return prisma.candidate.update({ where: { id }, data });
  },

  async updateStatus(id: string, status: CandidateStatus) {
    return prisma.candidate.update({ where: { id }, data: { status } });
  },

  async softDelete(id: string) {
    return prisma.candidate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async countByStatus(companyId: string) {
    const results = await prisma.candidate.groupBy({
      by: ['status'],
      where: { companyId, deletedAt: null },
      _count: { status: true },
    });
    return results.reduce(
      (acc, r) => ({ ...acc, [r.status]: r._count.status }),
      {} as Record<CandidateStatus, number>,
    );
  },
};
