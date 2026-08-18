'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Plus,
  Clock,
  PlayCircle,
  CheckCircle2,
  Award,
  Users,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InterviewFilters } from '@/features/interviews/components/InterviewFilters';
import { InterviewTable } from '@/features/interviews/components/InterviewTable';
import { ScheduleInterviewModal } from '@/features/interviews/components/ScheduleInterviewModal';
import { InterviewDetailDrawer } from '@/features/interviews/components/InterviewDetailDrawer';
import { FeedbackFormModal } from '@/features/interviews/components/FeedbackFormModal';
import { CandidateDossierModal } from '@/features/candidates/components/CandidateDossierModal';
import { interviewsService } from '@/services/interviews.service';
import type { InterviewDto, InterviewStatus } from '@intvwplt/shared';

export default function InterviewsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InterviewStatus | undefined>(undefined);

  // Modals & Drawers state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleCandidateId, setScheduleCandidateId] = useState<string | undefined>(undefined);

  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [feedbackInterview, setFeedbackInterview] = useState<InterviewDto | null>(null);
  const [dossierCandidateId, setDossierCandidateId] = useState<string | null>(null);

  // Query interviews
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['interviews', { search, status }],
    queryFn: () =>
      interviewsService.list({
        search: search.trim() || undefined,
        status,
        limit: 100,
      }),
  });

  const interviews: InterviewDto[] = data?.items || [];

  // Metrics computation
  const totalCount = interviews.length;
  const scheduledCount = interviews.filter(
    (i: InterviewDto) => i.status === 'SCHEDULED' || i.status === 'CONFIRMED',
  ).length;
  const liveCount = interviews.filter((i: InterviewDto) => i.status === 'IN_PROGRESS').length;
  const completedCount = interviews.filter((i: InterviewDto) => i.status === 'COMPLETED').length;
  const pendingFeedbackCount = interviews.filter(
    (i: InterviewDto) => i.status === 'COMPLETED' && !i.feedback,
  ).length;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['interviews'] });
    refetch();
  };

  const handleOpenScheduleForCandidate = (candidateId: string) => {
    setScheduleCandidateId(candidateId);
    setIsScheduleModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sunset-cream flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center shadow-md shadow-sunset-orange/20">
              <Building2 className="h-4 w-4 text-sunset-cream" />
            </div>
            Company Interview Records Hub
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Centralized ledger for all scheduled technical interviews, live notes, round progressions, and feedback scorecards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="border-[#36271D] bg-[#18110C] text-stone-300 hover:text-sunset-cream hover:bg-[#251A13]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin text-sunset-orange' : 'text-sunset-amber'}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setScheduleCandidateId(undefined);
              setIsScheduleModalOpen(true);
            }}
            className="gradient-sunset-btn text-xs font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" /> Schedule Interview
          </Button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-[#18110C]/90 border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Total Records</span>
            <Calendar className="h-4 w-4 text-sunset-amber" />
          </div>
          <p className="text-2xl font-bold text-sunset-cream font-mono">{totalCount}</p>
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
            <span className="text-xs font-medium">Live Now</span>
            <PlayCircle className="h-4 w-4 text-sunset-orange animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-sunset-orange font-mono">{liveCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#18110C]/90 border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{completedCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#18110C]/90 border border-[#36271D] hover:border-sunset-orange/40 transition-colors space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-medium">Pending Feedback</span>
            <Award className="h-4 w-4 text-sunset-crimson" />
          </div>
          <p className="text-2xl font-bold text-sunset-crimson font-mono">{pendingFeedbackCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <InterviewFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        onReset={() => {
          setSearch('');
          setStatus(undefined);
        }}
        isLoading={isLoading}
      />

      {/* Interview Records Table */}
      <InterviewTable
        interviews={interviews}
        isLoading={isLoading}
        onSelectInterview={(interview) => setSelectedInterviewId(interview.id)}
        onOpenFeedback={(interview) => setFeedbackInterview(interview)}
        onViewCandidateDossier={(candidateId) => setDossierCandidateId(candidateId)}
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={handleRefresh}
        preselectedCandidateId={scheduleCandidateId}
      />

      {/* Live Notes & Details Drawer */}
      <InterviewDetailDrawer
        interviewId={selectedInterviewId}
        onClose={() => setSelectedInterviewId(null)}
        onOpenFeedback={(interview) => setFeedbackInterview(interview)}
        onRefresh={handleRefresh}
      />

      {/* Feedback Scorecard Modal */}
      {feedbackInterview && (
        <FeedbackFormModal
          isOpen={Boolean(feedbackInterview)}
          interview={feedbackInterview}
          onClose={() => setFeedbackInterview(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* Candidate 360° Dossier Modal */}
      <CandidateDossierModal
        candidateId={dossierCandidateId}
        onClose={() => setDossierCandidateId(null)}
        onScheduleNextRound={handleOpenScheduleForCandidate}
      />
    </div>
  );
}
