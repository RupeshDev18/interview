import { prisma } from '../../lib/prisma';
import type { Prisma, Recommendation } from '@prisma/client';

export const feedbackRepository = {
  async findByInterviewId(interviewId: string) {
    return prisma.interviewFeedback.findUnique({
      where: { interviewId },
      include: {
        template: {
          include: {
            criteria: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        interviewer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  },

  async upsert(data: {
    interviewId: string;
    interviewerId: string;
    templateId?: string;
    scores: Record<string, number>;
    overallScore?: number;
    strengths?: string;
    weaknesses?: string;
    concerns?: string;
    recommendation: Recommendation;
    submittedAt?: Date;
  }) {
    return prisma.interviewFeedback.upsert({
      where: { interviewId: data.interviewId },
      create: {
        interviewId: data.interviewId,
        interviewerId: data.interviewerId,
        templateId: data.templateId,
        scores: data.scores as Prisma.InputJsonValue,
        overallScore: data.overallScore ? (data.overallScore as unknown as Prisma.Decimal) : undefined,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        concerns: data.concerns,
        recommendation: data.recommendation,
        submittedAt: data.submittedAt || new Date(),
      },
      update: {
        templateId: data.templateId,
        scores: data.scores as Prisma.InputJsonValue,
        overallScore: data.overallScore ? (data.overallScore as unknown as Prisma.Decimal) : undefined,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        concerns: data.concerns,
        recommendation: data.recommendation,
        submittedAt: data.submittedAt || new Date(),
      },
      include: {
        template: {
          include: {
            criteria: true,
          },
        },
        interviewer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  },
};
