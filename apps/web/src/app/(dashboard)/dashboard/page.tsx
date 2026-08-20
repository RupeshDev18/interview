'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Award,
  Clock,
  PlayCircle,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  Star,
  Activity,
  Briefcase,
  ExternalLink,
  RefreshCw,
  Shield,
  Building2,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-auth';
import { interviewsService } from '@/services/interviews.service';
import { candidatesService } from '@/services/candidates.service';
import { ScheduleInterviewModal } from '@/features/interviews/components/ScheduleInterviewModal';
import { AddCandidateModal } from '@/features/candidates/components/AddCandidateModal';
import { InterviewDetailDrawer } from '@/features/interviews/components/InterviewDetailDrawer';
import { FeedbackFormModal } from '@/features/interviews/components/FeedbackFormModal';
import type { InterviewDto, CandidateSummary } from '@intvwplt/shared';
import { format, isPast, formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const user = useCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN';
  const hasAdminAccess = isAdmin || isCompanyAdmin;

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [feedbackInterview, setFeedbackInterview] = useState<InterviewDto | null>(null);

  // Load interviews
  const {
    data: interviewsData,
    isLoading: isLoadingInterviews,
    refetch: refetchInterviews,
    isFetching: isFetchingInterviews,
  } = useQuery({
    queryKey: ['dashboard-interviews'],
    queryFn: () => interviewsService.list({ limit: 50 }),
  });

  // Load candidates
  const {
    data: candidatesData,
    isLoading: isLoadingCandidates,
    refetch: refetchCandidates,
    isFetching: isFetchingCandidates,
  } = useQuery({
    queryKey: ['dashboard-candidates'],
    queryFn: () => candidatesService.list({ limit: 50 }),
  });

  const interviews: InterviewDto[] = interviewsData?.items || [];
  const candidates: CandidateSummary[] = candidatesData?.items || [];

  const handleRefresh = () => {
    refetchInterviews();
    refetchCandidates();
  };

  // Metrics
  const totalInterviews = interviews.length;
  const scheduledCount = interviews.filter(
    (i: InterviewDto) => i.status === 'SCHEDULED' || i.status === 'CONFIRMED',
  ).length;

  const feedbacks = interviews
    .map((i) => i.feedback)
    .filter((f): f is NonNullable<typeof f> => !!f);
  const scores = feedbacks
    .map((f) => (f.overallScore ? Number(f.overallScore) : null))
    .filter((s): s is number => s !== null);
  const averageTechScore =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : '4.8';

  const pendingScorecards = interviews.filter(
    (i: InterviewDto) => i.status === 'COMPLETED' && !i.feedback,
  ).length;

  // Upcoming interviews (future or today)
  const upcomingInterviews = interviews
    .filter(
      (i: InterviewDto) =>
        i.status === 'SCHEDULED' ||
        i.status === 'CONFIRMED' ||
        i.status === 'IN_PROGRESS',
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center shadow-md shadow-black/10">
              <LayoutDashboard className="h-4 w-4 text-white" />
            </div>
            Technical Hiring Command Center
          </h1>
          <p className="text-sm text-theme-muted mt-1">
            Real-time hiring velocity, candidate pipelines, and technical round consensus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetchingInterviews || isFetchingCandidates}
            className="border-theme bg-card text-theme-primary hover:bg-surface-subtle"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${
                isFetchingInterviews || isFetchingCandidates
                  ? 'animate-spin text-theme-accent'
                  : 'text-theme-muted'
              }`}
            />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddCandidateOpen(true)}
            variant="outline"
            className="bg-card hover:bg-surface-subtle text-theme-primary border-theme text-xs font-semibold gap-1.5"
          >
            <Users className="h-4 w-4 text-theme-accent" /> Add Candidate
          </Button>

          <Button
            size="sm"
            onClick={() => setIsScheduleModalOpen(true)}
            className="gradient-theme-btn text-xs font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" /> Schedule Interview
          </Button>
        </div>
      </div>

      {/* Admin Quick Access Bar */}
      {hasAdminAccess && (
        <div className="p-4 rounded-xl bg-card border border-theme shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-theme-primary text-sm">
                  {isAdmin ? 'System Administrator Portal' : 'Company Administration'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-theme-accent/15 text-theme-accent border border-theme-accent/20">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-theme-muted">
                Quick access to organization governance, analytics, and permissions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 text-xs border-theme bg-surface text-theme-primary hover:bg-surface-subtle"
            >
              <Link href="/admin/analytics">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5 text-theme-accent" />
                Analytics
              </Link>
            </Button>

            {isAdmin && (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-theme bg-surface text-theme-primary hover:bg-surface-subtle"
                >
                  <Link href="/admin/companies">
                    <Building2 className="h-3.5 w-3.5 mr-1.5 text-theme-accent" />
                    Companies
                  </Link>
                </Button>

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-theme bg-surface text-theme-primary hover:bg-surface-subtle"
                >
                  <Link href="/admin/users">
                    <Shield className="h-3.5 w-3.5 mr-1.5 text-theme-accent" />
                    Users
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 5-Card Metric Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-card border border-theme hover:border-theme-accent/40 transition-colors space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-medium">Total Interviews</span>
            <Calendar className="h-4 w-4 text-theme-accent" />
          </div>
          <p className="text-2xl font-bold text-theme-primary font-mono">{totalInterviews}</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-theme hover:border-theme-accent/40 transition-colors space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-medium">Scheduled</span>
            <Clock className="h-4 w-4 text-theme-accent" />
          </div>
          <p className="text-2xl font-bold text-theme-primary font-mono">{scheduledCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-theme hover:border-theme-accent/40 transition-colors space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-medium">Active Candidates</span>
            <Users className="h-4 w-4 text-theme-accent" />
          </div>
          <p className="text-2xl font-bold text-theme-primary font-mono">{candidates.length}</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-theme hover:border-theme-accent/40 transition-colors space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-medium">Avg Tech Score</span>
            <Star className="h-4 w-4 text-theme-accent fill-theme-accent" />
          </div>
          <p className="text-2xl font-bold text-theme-primary font-mono">{averageTechScore} / 5.0</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-theme hover:border-theme-accent/40 transition-colors space-y-1 shadow-sm">
          <div className="flex items-center justify-between text-theme-muted">
            <span className="text-xs font-medium">Pending Feedback</span>
            <Award className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-theme-primary font-mono">{pendingScorecards}</p>
        </div>
      </div>

      {/* Main Grid: Left Column (Upcoming & Live) + Right Column (Pipeline & Consensus) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming & Scheduled Interviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card p-5 rounded-2xl border border-theme shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-theme-accent" />
                <h3 className="text-base font-bold text-theme-primary">Upcoming Technical Rounds</h3>
              </div>
              <Link
                href="/interviews"
                className="text-xs text-theme-accent hover:underline flex items-center gap-1 font-semibold"
              >
                View Full Ledger <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {isLoadingInterviews ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-surface-subtle animate-pulse" />
                ))}
              </div>
            ) : upcomingInterviews.length === 0 ? (
              <div className="p-8 text-center bg-surface-subtle rounded-xl border border-theme">
                <Clock className="h-8 w-8 text-theme-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs text-theme-muted">No upcoming interviews scheduled today.</p>
                <Button
                  size="sm"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="mt-3 text-xs gradient-theme-btn font-semibold"
                >
                  Schedule an Interview
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingInterviews.map((intv) => {
                  const isLive = intv.status === 'IN_PROGRESS';
                  return (
                    <div
                      key={intv.id}
                      onClick={() => setSelectedInterviewId(intv.id)}
                      className="p-4 rounded-xl bg-surface border border-theme hover:border-theme-accent/40 hover:bg-surface-subtle transition-all cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                            isLive
                              ? 'bg-theme-accent text-white animate-pulse'
                              : 'bg-theme-accent-light text-theme-primary border border-theme'
                          }`}
                        >
                          R{intv.roundNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-theme-primary group-hover:text-theme-accent transition-colors">
                              {intv.candidate.firstName} {intv.candidate.lastName}
                            </span>
                            <span className="text-xs text-theme-muted">
                              ({intv.candidate.currentRole || 'Candidate'})
                            </span>
                          </div>
                          <p className="text-xs text-theme-muted mt-0.5">
                            {intv.interviewType.name} • Assigned:{' '}
                            {intv.interviewer.user.firstName} {intv.interviewer.user.lastName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-semibold text-theme-primary block font-mono">
                            {format(new Date(intv.scheduledStart), 'h:mm a')}
                          </span>
                          <span className="text-[11px] text-theme-muted font-mono">
                            {formatDistanceToNow(new Date(intv.scheduledStart), { addSuffix: true })}
                          </span>
                        </div>
                        {isLive && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-theme-accent text-white animate-pulse">
                            LIVE NOW
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Candidate Pipeline */}
          <div className="bg-card p-5 rounded-2xl border border-theme shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-theme-accent" />
                <h3 className="text-base font-bold text-theme-primary">Candidate Pipeline Snapshot</h3>
              </div>
              <Link
                href="/candidates"
                className="text-xs text-theme-accent hover:underline flex items-center gap-1 font-semibold"
              >
                View Pipeline <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidates.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  href="/candidates"
                  className="p-3.5 rounded-xl bg-surface border border-theme hover:border-theme-accent/40 hover:bg-surface-subtle transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-theme-primary group-hover:text-theme-accent transition-colors">
                        {c.firstName} {c.lastName}
                      </h4>
                      <p className="text-xs text-theme-muted">{c.currentRole || 'Software Engineer'}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-subtle text-theme-accent border border-theme font-mono">
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>

                  {c.skills && c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] bg-surface-subtle text-theme-muted px-1.5 py-0.5 rounded border border-theme"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Scorecards & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-card p-5 rounded-2xl border border-theme shadow-sm space-y-4">
            <h3 className="text-base font-bold text-theme-primary flex items-center gap-2">
              <Activity className="h-4 w-4 text-theme-accent" /> Quick Launchpad
            </h3>
            <div className="space-y-2.5">
              <Button
                onClick={() => setIsScheduleModalOpen(true)}
                className="w-full justify-start gradient-theme-btn text-xs font-semibold gap-2 h-10"
              >
                <Plus className="h-4 w-4" /> Schedule New Round
              </Button>
              <Button
                onClick={() => setIsAddCandidateOpen(true)}
                variant="outline"
                className="w-full justify-start border-theme bg-surface text-theme-primary hover:bg-surface-subtle text-xs font-semibold gap-2 h-10"
              >
                <Users className="h-4 w-4 text-theme-accent" /> Add Candidate Profile
              </Button>
              <Link href="/questions" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full justify-start border-theme bg-surface text-theme-primary hover:bg-surface-subtle text-xs font-semibold gap-2 h-10"
                >
                  <Briefcase className="h-4 w-4 text-theme-accent" /> Technical Question Bank
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Drawers & Modals */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={() => {
          setIsScheduleModalOpen(false);
          refetchInterviews();
        }}
      />

      <AddCandidateModal
        isOpen={isAddCandidateOpen}
        onClose={() => setIsAddCandidateOpen(false)}
        onSuccess={() => {
          setIsAddCandidateOpen(false);
          refetchCandidates();
        }}
      />

      {selectedInterviewId && (
        <InterviewDetailDrawer
          interviewId={selectedInterviewId}
          onClose={() => setSelectedInterviewId(null)}
          onOpenFeedback={(interview: InterviewDto) => {
            setSelectedInterviewId(null);
            setFeedbackInterview(interview);
          }}
          onRefresh={refetchInterviews}
        />
      )}

      {feedbackInterview && (
        <FeedbackFormModal
          isOpen={!!feedbackInterview}
          onClose={() => setFeedbackInterview(null)}
          interview={feedbackInterview}
          onSuccess={() => {
            setFeedbackInterview(null);
            refetchInterviews();
          }}
        />
      )}
    </div>
  );
}
