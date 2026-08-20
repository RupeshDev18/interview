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
        <Skeleton className="h-10 w-72 bg-surface-subtle" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-28 rounded-xl bg-surface-subtle" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl bg-surface-subtle" />
          <Skeleton className="h-72 rounded-xl bg-surface-subtle" />
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
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center text-white shadow-md shadow-black/10">
              <BarChart3 className="h-4 w-4" />
            </div>
            Platform Analytics & Executive Insights
          </h1>
          <p className="text-sm text-theme-muted mt-1">
            Real-time pipeline metrics, scorecard distributions, and interview velocity across the organization.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-theme bg-card text-theme-primary hover:bg-surface-subtle"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin text-theme-accent' : 'text-theme-muted'}`} />
          Refresh Data
        </Button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-card border border-theme hover:border-theme-accent/40 transition-colors space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-medium">Total Candidates</span>
            <Users className="h-4 w-4 text-theme-accent" />
          </div>
          <p className="text-2xl font-bold text-theme-primary font-mono">
            {analytics.totalCandidates}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-theme hover:border-theme-accent/40 transition-colors space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-medium">Interviews Conducted</span>
            <Calendar className="h-4 w-4 text-theme-accent" />
          </div>
          <p className="text-2xl font-bold text-theme-primary font-mono">
            {analytics.totalInterviews}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-theme hover:border-theme-accent/40 transition-colors space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-medium">Average Rating</span>
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-2xl font-bold text-theme-primary font-mono">
            {analytics.averageScore ? `${analytics.averageScore} / 5` : 'N/A'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-theme hover:border-theme-accent/40 transition-colors space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-medium">Interviewer Pool</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-theme-primary font-mono">
            {analytics.totalInterviewers}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-theme hover:border-theme-accent/40 transition-colors space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-medium">Organizations</span>
            <Building2 className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-theme-primary font-mono">
            {analytics.totalCompanies}
          </p>
        </div>
      </div>

      {/* Charts / Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Pipeline Distribution */}
        <section className="p-5 rounded-2xl bg-card border border-theme space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-theme-primary flex items-center gap-2">
              <Users className="h-4 w-4 text-theme-accent" />
              Candidate Pipeline
            </h2>
            <span className="text-xs text-theme-muted font-mono">
              {analytics.totalCandidates} Total
            </span>
          </div>

          <div className="space-y-2.5">
            {analytics.candidateStatusDistribution.length === 0 ? (
              <p className="text-xs text-theme-muted py-6 text-center">No candidate stage data</p>
            ) : (
              analytics.candidateStatusDistribution.map((item) => {
                const pct = analytics.totalCandidates
                  ? Math.round((item.count / analytics.totalCandidates) * 100)
                  : 0;
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-theme-primary capitalize font-medium">
                        {item.status.toLowerCase().replace('_', ' ')}
                      </span>
                      <span className="text-theme-muted font-mono">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
                      <div
                        className="h-full rounded-full bg-theme-accent"
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
        <section className="p-5 rounded-2xl bg-card border border-theme space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-theme-primary flex items-center gap-2">
              <Award className="h-4 w-4 text-theme-accent" />
              Scorecard Recommendations
            </h2>
            <span className="text-xs text-theme-muted font-mono">
              {totalRecs} Evaluated
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.keys(analytics.recommendationDistribution).length === 0 ? (
              <p className="text-xs text-theme-muted py-6 text-center">No feedback submitted yet</p>
            ) : (
              Object.entries(analytics.recommendationDistribution).map(([rec, count]) => {
                const pct = totalRecs ? Math.round((count / totalRecs) * 100) : 0;
                const isHire = rec.includes('HIRE');
                const isReject = rec.includes('REJECT');

                return (
                  <div key={rec} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-theme-primary font-medium capitalize">
                        {rec.replace('_', ' ')}
                      </span>
                      <span className="text-theme-muted font-mono">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isHire
                            ? 'bg-emerald-500'
                            : isReject
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
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
        <section className="p-5 rounded-2xl bg-card border border-theme space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-theme-primary flex items-center gap-2">
              <Calendar className="h-4 w-4 text-theme-accent" />
              Interview Statuses
            </h2>
            <span className="text-xs text-theme-muted font-mono">
              {analytics.totalInterviews} Total
            </span>
          </div>

          <div className="space-y-2.5">
            {analytics.interviewStatusDistribution.length === 0 ? (
              <p className="text-xs text-theme-muted py-6 text-center">No interview data yet</p>
            ) : (
              analytics.interviewStatusDistribution.map((item) => {
                const pct = analytics.totalInterviews
                  ? Math.round((item.count / analytics.totalInterviews) * 100)
                  : 0;

                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-theme-primary font-medium capitalize">
                        {item.status.toLowerCase().replace('_', ' ')}
                      </span>
                      <span className="text-theme-muted font-mono">
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
                      <div
                        className="h-full rounded-full bg-theme-accent"
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
        <section className="p-6 rounded-2xl bg-card border border-theme space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-theme-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-theme-accent" />
              Recent 30-Day Interview Velocity
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {analytics.timeline.slice(-12).map((day) => (
              <div
                key={day.date}
                className="p-3 rounded-xl bg-surface border border-theme text-center space-y-1"
              >
                <span className="text-[10px] text-theme-muted font-mono block">
                  {day.date}
                </span>
                <p className="text-base font-bold text-theme-primary font-mono">
                  {day.total} <span className="text-xs font-normal text-theme-muted">total</span>
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
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
