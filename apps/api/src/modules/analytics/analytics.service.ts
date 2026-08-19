import { prisma } from '../../lib/prisma';
import type { UserRole } from '@prisma/client';

export const analyticsService = {
  async getOverview(user: { role: string; companyId?: string }) {
    const isSuperAdmin = user.role === 'ADMIN';
    const companyFilter = isSuperAdmin ? {} : { companyId: user.companyId };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCompanies,
      totalUsers,
      totalCandidates,
      candidatesByStatus,
      totalInterviews,
      interviewsByStatus,
      recentInterviews,
      feedbackList,
      interviewersCount,
    ] = await Promise.all([
      isSuperAdmin ? prisma.company.count({ where: { deletedAt: null } }) : 1,
      prisma.user.count({
        where: {
          deletedAt: null,
          ...(isSuperAdmin ? {} : { companyId: user.companyId }),
        },
      }),
      prisma.candidate.count({
        where: {
          deletedAt: null,
          ...companyFilter,
        },
      }),
      prisma.candidate.groupBy({
        by: ['status'],
        where: {
          deletedAt: null,
          ...companyFilter,
        },
        _count: { status: true },
      }),
      prisma.interview.count({
        where: companyFilter,
      }),
      prisma.interview.groupBy({
        by: ['status'],
        where: companyFilter,
        _count: { status: true },
      }),
      prisma.interview.findMany({
        where: {
          ...companyFilter,
          scheduledStart: { gte: thirtyDaysAgo },
        },
        select: {
          scheduledStart: true,
          status: true,
        },
        orderBy: { scheduledStart: 'asc' },
      }),
      prisma.interviewFeedback.findMany({
        where: isSuperAdmin
          ? {}
          : { interview: { companyId: user.companyId } },
        select: {
          recommendation: true,
          overallScore: true,
        },
      }),
      prisma.interviewer.count({
        where: {
          deletedAt: null,
          ...(isSuperAdmin
            ? {}
            : { user: { companyId: user.companyId } }),
        },
      }),
    ]);

    // Aggregate feedback recommendations
    const recommendationsCount = feedbackList.reduce(
      (acc, fb) => {
        acc[fb.recommendation] = (acc[fb.recommendation] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate average score
    const scores = feedbackList
      .map((f) => (f.overallScore ? Number(f.overallScore) : null))
      .filter((s): s is number => s !== null);
    const averageScore =
      scores.length > 0
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : null;

    // Aggregate monthly/daily timeline for charts
    const timelineMap: Record<string, { total: number; completed: number }> = {};
    recentInterviews.forEach((i) => {
      const dateKey = i.scheduledStart.toISOString().slice(0, 10);
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { total: 0, completed: 0 };
      }
      timelineMap[dateKey].total += 1;
      if (i.status === 'COMPLETED') {
        timelineMap[dateKey].completed += 1;
      }
    });

    const timeline = Object.entries(timelineMap).map(([date, data]) => ({
      date,
      total: data.total,
      completed: data.completed,
    }));

    return {
      totalCompanies,
      totalUsers,
      totalCandidates,
      totalInterviews,
      totalInterviewers: interviewersCount,
      averageScore,
      candidateStatusDistribution: candidatesByStatus.map((c) => ({
        status: c.status,
        count: c._count.status,
      })),
      interviewStatusDistribution: interviewsByStatus.map((i) => ({
        status: i.status,
        count: i._count.status,
      })),
      recommendationDistribution: recommendationsCount,
      timeline,
    };
  },
};
