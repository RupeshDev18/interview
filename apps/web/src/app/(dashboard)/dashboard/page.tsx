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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { interviewsService } from '@/services/interviews.service';
import { candidatesService } from '@/services/candidates.service';
import { ScheduleInterviewModal } from '@/features/interviews/components/ScheduleInterviewModal';
import { AddCandidateModal } from '@/features/candidates/components/AddCandidateModal';
import { InterviewDetailDrawer } from '@/features/interviews/components/InterviewDetailDrawer';
import { FeedbackFormModal } from '@/features/interviews/components/FeedbackFormModal';
import type { InterviewDto, CandidateSummary } from '@intvwplt/shared';
import { format, isPast, formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
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
  const liveCount = interviews.filter((i: InterviewDto) => i.status === 'IN_PROGRESS').length;
  const completedCount = interviews.filter((i: InterviewDto) => i.status === 'COMPLETED').length;
  const pendingScorecards = interviews.filter(
    (i: InterviewDto) => i.status === 'COMPLETED' && !i.feedback,
  ).length;

  const scoredInterviews = interviews.filter((i: InterviewDto) => i.feedback?.overallScore);
  const averageTechScore =
    scoredInterviews.length > 0
      ? (
          scoredInterviews.reduce(
            (acc: number, cur: InterviewDto) => acc + Number(cur.feedback?.overallScore || 0),
            0,
          ) / scoredInterviews.length
        ).toFixed(1)
      : '4.5';

  const upcomingInterviews = interviews
    .filter((i: InterviewDto) => i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS')
    .slice(0, 4);

  const recentFeedback = interviews
    .filter((i: InterviewDto) => Boolean(i.feedback))
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Sunset Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sunset-cream flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center shadow-md shadow-sunset-orange/20">
              <LayoutDashboard className="h-4 w-4 text-sunset-cream" />
            </div>
            Technical Interview Executive OS
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Real-time hiring velocity, candidate pipelines, and technical round consensus.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetchingInterviews || isFetchingCandidates}
            className="border-[#36271D] bg-[#18110C] text-stone-300 hover:text-sunset-cream hover:bg-[#251A13]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${
                isFetchingInterviews || isFetchingCandidates
                  ? 'animate-spin text-sunset-orange'
                  : 'text-sunset-amber'
              }`}
            />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddCandidateOpen(true)}
            className="bg-[#251A13] hover:bg-[#332219] text-sunset-cream border border-[#36271D] text-xs font-semibold gap-1.5"
          >
            <Users className="h-4 w-4 text-sunset-orange" /> Add Candidate
          </Button>

          <Button
            size="sm"
            onClick={() => setIsScheduleModalOpen(true)}
            className="gradient-sunset-btn text-xs font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" /> Schedule Interview
          </Button>
        </div>
      </div>

      {/* 5-Card Sunset Metric Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-[#18110C]/90 border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Total Interviews</span>
            <Calendar className="h-4 w-4 text-sunset-amber" />
          </div>
          <p className="text-2xl font-bold text-sunset-cream font-mono">{totalInterviews}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#18110C]/90 border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Scheduled</span>
            <Clock className="h-4 w-4 text-sunset-amber" />
          </div>
          <p className="text-2xl font-bold text-sunset-amber font-mono">{scheduledCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#18110C]/90 border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Active Candidates</span>
            <Users className="h-4 w-4 text-sunset-orange" />
          </div>
          <p className="text-2xl font-bold text-sunset-orange font-mono">{candidates.length}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#18110C]/90 border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Avg Tech Score</span>
            <Star className="h-4 w-4 text-sunset-amber fill-sunset-amber" />
          </div>
          <p className="text-2xl font-bold text-sunset-cream font-mono">{averageTechScore} / 5.0</p>
        </div>

        <div className="p-4 rounded-xl bg-[#18110C]/90 border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Pending Feedback</span>
            <Award className="h-4 w-4 text-sunset-crimson" />
          </div>
          <p className="text-2xl font-bold text-sunset-crimson font-mono">{pendingScorecards}</p>
        </div>
      </div>

      {/* Main Grid: Left Column (Upcoming & Live) + Right Column (Pipeline & Consensus) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Upcoming & Scheduled Interviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#18110C]/90 p-5 rounded-2xl border border-[#36271D] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-sunset-orange" />
                <h3 className="text-base font-bold text-sunset-cream">Upcoming Technical Rounds</h3>
              </div>
              <Link
                href="/interviews"
                className="text-xs text-sunset-amber hover:text-sunset-cream flex items-center gap-1 font-semibold"
              >
                View Full Ledger <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {isLoadingInterviews ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-[#20150F] animate-pulse" />
                ))}
              </div>
            ) : upcomingInterviews.length === 0 ? (
              <div className="p-8 text-center bg-[#120B07] rounded-xl border border-[#36271D]">
                <Clock className="h-8 w-8 text-stone-500 mx-auto mb-2" />
                <p className="text-xs text-stone-400">No upcoming interviews scheduled today.</p>
                <Button
                  size="sm"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="mt-3 text-xs gradient-sunset-btn font-semibold"
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
                      className="p-4 rounded-xl bg-[#20150F] border border-[#36271D] hover:border-sunset-orange/40 hover:bg-[#2A1D16] transition-all cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                            isLive
                              ? 'bg-sunset-orange/20 text-sunset-orange border border-sunset-orange/40 animate-pulse'
                              : 'bg-sunset-amber/10 text-sunset-amber border border-sunset-amber/30'
                          }`}
                        >
                          R{intv.roundNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-sunset-cream group-hover:text-sunset-amber transition-colors">
                              {intv.candidate.firstName} {intv.candidate.lastName}
                            </span>
                            <span className="text-xs text-stone-400">
                              ({intv.candidate.currentRole || 'Candidate'})
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {intv.interviewType.name} • Assigned:{' '}
                            {intv.interviewer.user.firstName} {intv.interviewer.user.lastName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-semibold text-sunset-amber block font-mono">
                            {format(new Date(intv.scheduledStart), 'h:mm a')}
                          </span>
                          <span className="text-[11px] text-stone-500 font-mono">
                            {formatDistanceToNow(new Date(intv.scheduledStart), { addSuffix: true })}
                          </span>
                        </div>
                        {isLive && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sunset-orange/20 text-sunset-orange border border-sunset-orange/40 animate-pulse">
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
          <div className="bg-[#18110C]/90 p-5 rounded-2xl border border-[#36271D] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sunset-amber" />
                <h3 className="text-base font-bold text-sunset-cream">Candidate Pipeline Snapshot</h3>
              </div>
              <Link
                href="/candidates"
                className="text-xs text-sunset-amber hover:text-sunset-cream flex items-center gap-1 font-semibold"
              >
                View Pipeline <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidates.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  href="/candidates"
                  className="p-3.5 rounded-xl bg-[#20150F] border border-[#36271D] hover:border-sunset-orange/40 hover:bg-[#2A1D16] transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-sunset-cream group-hover:text-sunset-amber transition-colors">
                        {c.firstName} {c.lastName}
                      </h4>
                      <p className="text-xs text-stone-400">{c.currentRole || 'Software Engineer'}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sunset-orange/10 text-sunset-amber border border-sunset-orange/20 font-mono">
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>

                  {c.skills && c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] bg-[#120B07] text-stone-300 px-1.5 py-0.5 rounded border border-[#3D2D22]"
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
          <div className="bg-gradient-to-br from-[#271C15] to-[#18110C] p-5 rounded-2xl border border-[#36271D] shadow-xl space-y-4">
            <h3 className="text-base font-bold text-sunset-cream flex items-center gap-2">
              <Activity className="h-4 w-4 text-sunset-orange" /> Quick Launchpad
            </h3>
            <div className="space-y-2.5">
              <Button
                onClick={() => setIsScheduleModalOpen(true)}
                className="w-full justify-start gradient-sunset-btn text-xs font-semibold gap-2 h-10"
              >
                <Plus className="h-4 w-4" /> Schedule New Round
              </Button>
              <Button
                onClick={() => setIsAddCandidateOpen(true)}
                variant="outline"
                className="w-full justify-start border-[#36271D] bg-[#18110C] text-sunset-cream hover:bg-[#2A1D16] text-xs font-semibold gap-2 h-10"
              >
                <Users className="h-4 w-4 text-sunset-amber" /> Add Candidate Profile
              </Button>
              <Link href="/questions" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full justify-start border-[#36271D] bg-[#18110C] text-sunset-cream hover:bg-[#2A1D16] text-xs font-semibold gap-2 h-10"
                >
                  <Briefcase className="h-4 w-4 text-sunset-orange" /> Technical Question Bank
                </Button>
              </Link>
            </div>
          </div>

          {/* Recent Consensus & Scorecards */}
          <div className="bg-[#18110C]/90 p-5 rounded-2xl border border-[#36271D] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-sunset-orange" />
                <h3 className="text-base font-bold text-sunset-cream">Recent Scorecards</h3>
              </div>
            </div>

            {recentFeedback.length === 0 ? (
              <div className="p-6 text-center bg-[#120B07] rounded-xl border border-[#36271D]">
                <Award className="h-6 w-6 text-stone-500 mx-auto mb-1" />
                <p className="text-xs text-stone-400">No scorecards submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentFeedback.map((intv) => (
                  <div
                    key={intv.id}
                    onClick={() => setFeedbackInterview(intv)}
                    className="p-3 rounded-xl bg-[#20150F] border border-[#36271D] hover:border-sunset-orange/40 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-sunset-cream truncate">
                        {intv.candidate.firstName} {intv.candidate.lastName}
                      </span>
                      <span className="text-xs font-bold text-sunset-amber font-mono">
                        {Number(intv.feedback?.overallScore || 0).toFixed(1)} / 5
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>{intv.interviewType.name}</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {intv.feedback?.recommendation.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <AddCandidateModal
        isOpen={isAddCandidateOpen}
        onClose={() => setIsAddCandidateOpen(false)}
        onSuccess={handleRefresh}
      />

      <InterviewDetailDrawer
        interviewId={selectedInterviewId}
        onClose={() => setSelectedInterviewId(null)}
        onOpenFeedback={(intv) => setFeedbackInterview(intv)}
        onRefresh={handleRefresh}
      />

      {feedbackInterview && (
        <FeedbackFormModal
          isOpen={Boolean(feedbackInterview)}
          interview={feedbackInterview}
          onClose={() => setFeedbackInterview(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
