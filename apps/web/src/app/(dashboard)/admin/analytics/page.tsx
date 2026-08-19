'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Users,
  Calendar,
  Award,
  Building2,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService } from '@/services/admin.service';

export default function AdminAnalyticsPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: adminService.getAnalyticsOverview,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const analytics = data || {
    totalCompanies: 0,
    totalUsers: 0,
    totalCandidates: 0,
    totalInterviews: 0,
    totalInterviewers: 0,
    averageScore: null,
    candidateStatusDistribution: [],
    interviewStatusDistribution: [],
    recommendationDistribution: {},
    timeline: [],
  };

  const totalRecs = Object.values(analytics.recommendationDistribution).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sunset-cream flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center shadow-md shadow-sunset-orange/20">
              <BarChart3 className="h-4 w-4 text-sunset-cream" />
            </div>
            Platform Analytics & Executive Insights
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Real-time pipeline metrics, scorecard distributions, and interview velocity across the organization.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-[#36271D] bg-[#18110C] text-stone-300 hover:text-sunset-cream"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin text-sunset-orange' : 'text-sunset-amber'}`} />
          Refresh Data
        </Button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-[#18110C] border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Total Candidates</span>
            <Users className="h-4 w-4 text-sunset-orange" />
          </div>
          <p className="text-2xl font-bold text-sunset-cream font-mono">
            {analytics.totalCandidates}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#18110C] border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Interviews Conducted</span>
            <Calendar className="h-4 w-4 text-sunset-amber" />
          </div>
          <p className="text-2xl font-bold text-sunset-amber font-mono">
            {analytics.totalInterviews}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#18110C] border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Average Rating</span>
            <Star className="h-4 w-4 text-sunset-amber fill-sunset-amber" />
          </div>
          <p className="text-2xl font-bold text-sunset-cream font-mono">
            {analytics.averageScore ? `${analytics.averageScore} / 5` : 'N/A'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#18110C] border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Interviewer Pool</span>
            <UserCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {analytics.totalInterviewers}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#18110C] border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Organizations</span>
            <Building2 className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400 font-mono">
            {analytics.totalCompanies}
          </p>
        </div>
      </div>

      {/* Charts / Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Pipeline Distribution */}
        <section className="p-5 rounded-2xl bg-[#18110C] border border-[#36271D] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-sunset-cream flex items-center gap-2">
              <Users className="h-4 w-4 text-sunset-orange" />
              Candidate Pipeline
            </h2>
            <span className="text-xs text-stone-400 font-mono">
              {analytics.totalCandidates} Total
            </span>
          </div>

          <div className="space-y-2.5">
            {analytics.candidateStatusDistribution.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">No candidate stage data</p>
            ) : (
              analytics.candidateStatusDistribution.map((item) => {
                const pct = analytics.totalCandidates
                  ? Math.round((item.count / analytics.totalCandidates) * 100)
                  : 0;
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-300 capitalize font-medium">
                        {item.status.toLowerCase().replace('_', ' ')}
                      </span>
                      <span className="text-stone-400 font-mono">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#120B07] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sunset-orange to-sunset-amber"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Hiring Recommendations */}
        <section className="p-5 rounded-2xl bg-[#18110C] border border-[#36271D] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-sunset-cream flex items-center gap-2">
              <Award className="h-4 w-4 text-sunset-amber" />
              Scorecard Recommendations
            </h2>
            <span className="text-xs text-stone-400 font-mono">
              {totalRecs} Evaluated
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.keys(analytics.recommendationDistribution).length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">No feedback submitted yet</p>
            ) : (
              Object.entries(analytics.recommendationDistribution).map(([rec, count]) => {
                const pct = totalRecs ? Math.round((count / totalRecs) * 100) : 0;
                const isHire = rec.includes('HIRE');
                const isReject = rec.includes('REJECT');

                return (
                  <div key={rec} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-300 font-medium capitalize">
                        {rec.replace('_', ' ')}
                      </span>
                      <span className="text-stone-400 font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#120B07] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isHire
                            ? 'bg-emerald-500'
                            : isReject
                            ? 'bg-sunset-crimson'
                            : 'bg-sunset-amber'
                        }`}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Interview Status Breakdown */}
        <section className="p-5 rounded-2xl bg-[#18110C] border border-[#36271D] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-sunset-cream flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              Interview Statuses
            </h2>
            <span className="text-xs text-stone-400 font-mono">
              {analytics.totalInterviews} Total
            </span>
          </div>

          <div className="space-y-2.5">
            {analytics.interviewStatusDistribution.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">No interview data yet</p>
            ) : (
              analytics.interviewStatusDistribution.map((item) => {
                const pct = analytics.totalInterviews
                  ? Math.round((item.count / analytics.totalInterviews) * 100)
                  : 0;

                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-300 font-medium capitalize">
                        {item.status.toLowerCase().replace('_', ' ')}
                      </span>
                      <span className="text-stone-400 font-mono">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#120B07] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* 30-Day Activity Timeline Table */}
      {analytics.timeline && analytics.timeline.length > 0 && (
        <section className="p-6 rounded-2xl bg-[#18110C] border border-[#36271D] space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-sunset-cream flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sunset-orange" />
              Recent 30-Day Interview Velocity
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {analytics.timeline.slice(-12).map((day) => (
              <div
                key={day.date}
                className="p-3 rounded-xl bg-[#120B07] border border-[#36271D] text-center space-y-1"
              >
                <span className="text-[10px] text-stone-500 font-mono block">
                  {day.date}
                </span>
                <p className="text-base font-bold text-sunset-cream font-mono">
                  {day.total} <span className="text-xs font-normal text-stone-400">total</span>
                </p>
                <p className="text-[11px] text-emerald-400 font-mono">
                  {day.completed} completed
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
