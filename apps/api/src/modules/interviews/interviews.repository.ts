import { prisma } from '../../lib/prisma';
import type { Prisma, InterviewStatus } from '@prisma/client';
import type { NormalizedPagination } from '../../utils/pagination';

export const interviewsRepository = {
  async findAll(
    pagination: NormalizedPagination,
    filters: {
      companyId?: string;
      candidateId?: string;
      interviewerId?: string;
      status?: InterviewStatus;
      roundNumber?: number;
      from?: Date;
      to?: Date;
      search?: string;
    },
  ) {
    const where: Prisma.InterviewWhereInput = {
      ...(filters.companyId && { companyId: filters.companyId }),
      ...(filters.candidateId && { candidateId: filters.candidateId }),
      ...(filters.interviewerId && { interviewerId: filters.interviewerId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.roundNumber && { roundNumber: filters.roundNumber }),
      ...(filters.from || filters.to
        ? {
            scheduledStart: {
              ...(filters.from && { gte: filters.from }),
              ...(filters.to && { lte: filters.to }),
            },
          }
        : {}),
      ...(filters.search && {
        OR: [
          { candidate: { firstName: { contains: filters.search, mode: 'insensitive' } } },
          { candidate: { lastName: { contains: filters.search, mode: 'insensitive' } } },
          { candidate: { email: { contains: filters.search, mode: 'insensitive' } } },
          { interviewer: { user: { firstName: { contains: filters.search, mode: 'insensitive' } } } },
          { interviewer: { user: { lastName: { contains: filters.search, mode: 'insensitive' } } } },
          { interviewType: { name: { contains: filters.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              currentRole: true,
              experienceYears: true,
              skills: true,
              status: true,
            },
          },
          interviewer: {
            select: {
              id: true,
              userId: true,
              bio: true,
              yearsOfExperience: true,
              expertise: true,
              technologies: true,
              timezone: true,
              isAvailable: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
          interviewType: {
            include: {
              evaluationTemplate: {
                include: {
                  criteria: {
                    orderBy: { sortOrder: 'asc' },
                  },
                },
              },
            },
          },
          feedback: {
            include: {
              template: {
                include: {
                  criteria: true,
                },
              },
            },
          },
          questions: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: {
          scheduledStart: 'desc',
        },
      }),
      prisma.interview.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string, companyId?: string) {
    const where: Prisma.InterviewWhereInput = {
      id,
      ...(companyId && { companyId }),
    };

    return prisma.interview.findFirst({
      where,
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            currentRole: true,
            experienceYears: true,
            skills: true,
            status: true,
            resumes: {
              where: { isActive: true },
              orderBy: { uploadedAt: 'desc' },
              take: 1,
            },
          },
        },
        interviewer: {
          select: {
            id: true,
            userId: true,
            bio: true,
            yearsOfExperience: true,
            expertise: true,
            technologies: true,
            timezone: true,
            isAvailable: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        interviewType: {
          include: {
            evaluationTemplate: {
              include: {
                criteria: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        feedback: {
          include: {
            template: {
              include: {
                criteria: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        questions: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  },

  async findOverlappingInterviews(params: {
    interviewerId: string;
    start: Date;
    end: Date;
    excludeInterviewId?: string;
  }) {
    return prisma.interview.findMany({
      where: {
        interviewerId: params.interviewerId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...(params.excludeInterviewId && { id: { not: params.excludeInterviewId } }),
        scheduledStart: { lt: params.end },
        scheduledEnd: { gt: params.start },
      },
    });
  },

  async create(data: {
    candidateId: string;
    interviewerId: string;
    companyId: string;
    interviewTypeId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    timezone: string;
    roundNumber: number;
    notes?: string;
    createdById: string;
    initialQuestions?: Array<{
      questionText: string;
      category?: string;
      difficulty?: any;
      expectedAnswer?: string;
    }>;
  }) {
    return prisma.interview.create({
      data: {
        candidateId: data.candidateId,
        interviewerId: data.interviewerId,
        companyId: data.companyId,
        interviewTypeId: data.interviewTypeId,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        timezone: data.timezone,
        roundNumber: data.roundNumber,
        notes: data.notes,
        createdById: data.createdById,
        ...(data.initialQuestions && data.initialQuestions.length > 0
          ? {
              questions: {
                create: data.initialQuestions.map((q, idx) => ({
                  questionText: q.questionText,
                  category: q.category,
                  difficulty: q.difficulty,
                  expectedAnswer: q.expectedAnswer,
                  sortOrder: idx,
                })),
              },
            }
          : {}),
      },
      include: {
        candidate: true,
        interviewer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        company: true,
        interviewType: true,
        questions: true,
      },
    });
  },

  async update(id: string, data: Prisma.InterviewUpdateInput) {
    return prisma.interview.update({
      where: { id },
      data,
      include: {
        candidate: true,
        interviewer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        company: true,
        interviewType: true,
        feedback: true,
        questions: true,
      },
    });
  },

  async updateNotes(id: string, notes: string) {
    return prisma.interview.update({
      where: { id },
      data: { notes },
      select: {
        id: true,
        notes: true,
        updatedAt: true,
      },
    });
  },

  async updateQuestionNotes(
    questionId: string,
    data: {
      candidateAnswer?: string;
      interviewerNotes?: string;
      score?: number;
    },
  ) {
    return prisma.interviewQuestion.update({
      where: { id: questionId },
      data,
    });
  },

  async addQuestion(data: {
    interviewId: string;
    questionText: string;
    category?: string;
    expectedAnswer?: string;
    sortOrder?: number;
  }) {
    return prisma.interviewQuestion.create({
      data: {
        interviewId: data.interviewId,
        questionText: data.questionText,
        category: data.category,
        expectedAnswer: data.expectedAnswer,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  },
};
