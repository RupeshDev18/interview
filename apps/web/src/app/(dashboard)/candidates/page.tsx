'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  History,
  Calendar,
  Award,
  RefreshCw,
  ExternalLink,
  Clock,
  Briefcase,
  MapPin,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { candidatesService } from '@/services/candidates.service';
import { CandidateDossierModal } from '@/features/candidates/components/CandidateDossierModal';
import { ScheduleInterviewModal } from '@/features/interviews/components/ScheduleInterviewModal';
import { AddCandidateModal } from '@/features/candidates/components/AddCandidateModal';
import type { CandidateSummary, CandidateStatus } from '@intvwplt/shared';

const STATUS_FILTERS: Array<{ label: string; value?: CandidateStatus }> = [
  { label: 'All Candidates', value: undefined },
  { label: 'New', value: 'NEW' as CandidateStatus },
  { label: 'Interview Scheduled', value: 'INTERVIEW_SCHEDULED' as CandidateStatus },
  { label: 'Next Round', value: 'NEXT_ROUND' as CandidateStatus },
  { label: 'Hired', value: 'HIRED' as CandidateStatus },
  { label: 'On Hold', value: 'ON_HOLD' as CandidateStatus },
  { label: 'Rejected', value: 'REJECTED' as CandidateStatus },
];

export default function CandidatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CandidateStatus | undefined>(undefined);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [scheduleCandidateId, setScheduleCandidateId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['candidates', { search, status }],
    queryFn: () =>
      candidatesService.list({
        search: search.trim() || undefined,
        status,
        limit: 100,
      }),
  });

  const candidates: CandidateSummary[] = data?.items || [];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['candidates'] });
    refetch();
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case 'HIRED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'NEXT_ROUND':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'ON_HOLD':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-surface-subtle text-theme-muted border-theme';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center shadow-md shadow-black/10">
              <Users className="h-4 w-4 text-white" />
            </div>
            Candidate Pipeline & Dossiers
          </h1>
          <p className="text-sm text-theme-muted mt-1">
            View all candidates, skills, statuses, and their complete multi-round interview history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="border-theme bg-card text-theme-primary hover:bg-surface-subtle"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin text-theme-accent' : 'text-theme-muted'}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gradient-theme-btn text-xs font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Candidate
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-card p-4 rounded-xl border border-theme space-y-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates by name, role, or skills..."
            className="pl-9 bg-surface border-theme text-theme-primary placeholder:text-theme-muted focus-visible:ring-theme-accent focus-visible:border-theme-accent"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm">
          {STATUS_FILTERS.map((f) => {
            const isActive = status === f.value;
            return (
              <button
                key={f.label}
                onClick={() => setStatus(f.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-theme-accent text-white shadow-sm'
                    : 'bg-surface text-theme-muted border border-theme hover:border-theme-accent/50 hover:text-theme-primary'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Candidate Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-card border border-theme p-4 space-y-3">
              <Skeleton className="h-5 w-36 bg-surface-subtle" />
              <Skeleton className="h-4 w-24 bg-surface-subtle" />
              <Skeleton className="h-3 w-full bg-surface-subtle" />
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border border-theme shadow-sm">
          <Users className="h-10 w-10 text-theme-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-theme-primary">No candidates found</h3>
          <p className="text-xs text-theme-muted mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              onClick={() => setSelectedCandidateId(cand.id)}
              className="p-5 rounded-xl bg-card border border-theme hover:border-theme-accent/40 hover:bg-surface-subtle/50 transition-all cursor-pointer flex flex-col justify-between group space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-theme-primary group-hover:text-theme-accent transition-colors">
                      {cand.firstName} {cand.lastName}
                    </h3>
                    <p className="text-xs text-theme-muted mt-0.5 flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3 text-theme-accent" />
                      {cand.currentRole || 'Software Engineer'}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${getStatusBadgeClass(
                      cand.status,
                    )}`}
                  >
                    {cand.status.replace('_', ' ')}
                  </span>
                </div>

                {cand.experienceYears && (
                  <p className="text-xs text-theme-muted mt-2 font-mono">
                    Experience: {cand.experienceYears} years
                  </p>
                )}

                {cand.skills && cand.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {cand.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] bg-surface-subtle text-theme-muted px-2 py-0.5 rounded border border-theme font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {cand.skills.length > 4 && (
                      <span className="text-[10px] text-theme-muted self-center">
                        +{cand.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-theme flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCandidateId(cand.id);
                  }}
                  className="text-xs text-theme-accent hover:underline hover:bg-transparent p-0 h-auto font-semibold gap-1"
                >
                  <History className="h-3.5 w-3.5 text-theme-accent" /> View 360° Dossier
                </Button>

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setScheduleCandidateId(cand.id);
                  }}
                  variant="outline"
                  className="text-xs border-theme bg-surface hover:bg-surface-subtle text-theme-primary h-7 font-medium"
                >
                  <Calendar className="h-3 w-3 mr-1 text-theme-accent" /> Schedule
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate Dossier Modal */}
      <CandidateDossierModal
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
        onScheduleNextRound={(cId) => setScheduleCandidateId(cId)}
      />

      {/* Schedule Interview Modal */}
      {scheduleCandidateId && (
        <ScheduleInterviewModal
          isOpen={Boolean(scheduleCandidateId)}
          onClose={() => setScheduleCandidateId(null)}
          onSuccess={handleRefresh}
          preselectedCandidateId={scheduleCandidateId}
        />
      )}

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
