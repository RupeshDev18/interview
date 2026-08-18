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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { candidatesService } from '@/services/candidates.service';
import { CandidateDossierModal } from '@/features/candidates/components/CandidateDossierModal';
import { ScheduleInterviewModal } from '@/features/interviews/components/ScheduleInterviewModal';
import { AddCandidateModal } from '@/features/candidates/components/AddCandidateModal';
import { Plus } from 'lucide-react';
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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'NEXT_ROUND':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'INTERVIEW_SCHEDULED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'ON_HOLD':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sunset-cream flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center shadow-md shadow-sunset-orange/20">
              <Users className="h-4 w-4 text-sunset-cream" />
            </div>
            Candidate Pipeline & Dossiers
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            View all candidates, skills, statuses, and their complete multi-round interview history.
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
            onClick={() => setIsAddModalOpen(true)}
            className="gradient-sunset-btn text-xs font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Candidate
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-[#18110C]/90 p-4 rounded-xl border border-[#36271D] space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sunset-amber/60" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates by name, role, or skills..."
            className="pl-9 bg-[#120B07] border-[#36271D] text-sunset-cream placeholder:text-stone-500 focus-visible:ring-sunset-orange focus-visible:border-sunset-orange"
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
                    ? 'bg-gradient-to-r from-sunset-orange to-sunset-crimson text-sunset-cream shadow-sm shadow-sunset-orange/30'
                    : 'bg-[#231711] text-stone-300 border border-[#3D2D22] hover:border-sunset-orange/50 hover:text-sunset-cream'
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
            <div key={i} className="h-44 rounded-xl bg-[#18110C]/80 border border-[#36271D] p-4">
              <Skeleton className="h-5 w-36 bg-[#251A13] mb-2" />
              <Skeleton className="h-4 w-24 bg-[#251A13] mb-4" />
              <Skeleton className="h-3 w-full bg-[#251A13]" />
            </div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 text-center bg-[#18110C]/40 rounded-xl border border-[#36271D]">
          <Users className="h-10 w-10 text-stone-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-sunset-cream">No candidates found</h3>
          <p className="text-xs text-stone-400 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              onClick={() => setSelectedCandidateId(cand.id)}
              className="p-5 rounded-xl bg-[#18110C]/90 border border-[#36271D] hover:border-sunset-orange/40 hover:bg-[#20150F] transition-all cursor-pointer flex flex-col justify-between group space-y-4 shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sunset-cream group-hover:text-sunset-amber transition-colors">
                      {cand.firstName} {cand.lastName}
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3 text-sunset-orange" />
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
                  <p className="text-xs text-stone-400 mt-2 font-mono">
                    Experience: {cand.experienceYears} years
                  </p>
                )}

                {cand.skills && cand.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {cand.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] bg-[#241710] text-stone-300 px-2 py-0.5 rounded border border-[#3D2D22]"
                      >
                        {skill}
                      </span>
                    ))}
                    {cand.skills.length > 4 && (
                      <span className="text-[10px] text-stone-500 self-center">
                        +{cand.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#36271D] flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCandidateId(cand.id);
                  }}
                  className="text-xs text-sunset-amber hover:text-sunset-cream hover:bg-sunset-orange/10 p-0 h-auto font-semibold gap-1"
                >
                  <History className="h-3.5 w-3.5 text-sunset-orange" /> View 360° Dossier
                </Button>

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setScheduleCandidateId(cand.id);
                  }}
                  className="text-xs bg-[#251A13] hover:bg-[#332219] text-sunset-cream border border-[#36271D] h-7 font-medium"
                >
                  <Calendar className="h-3 w-3 mr-1 text-sunset-orange" /> Schedule
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
