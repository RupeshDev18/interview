'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UserCheck,
  Search,
  Calendar,
  Clock,
  Briefcase,
  Star,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { interviewersService } from '@/services/interviewers.service';
import type { InterviewerSummary } from '@intvwplt/shared';

export default function InterviewersPage() {
  const [search, setSearch] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean | undefined>(undefined);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['interviewers', { search, onlyAvailable }],
    queryFn: () =>
      interviewersService.list({
        search: search.trim() || undefined,
        isAvailable: onlyAvailable,
      }),
  });

  const interviewers: InterviewerSummary[] = Array.isArray(data) ? data : [];

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sunset-cream flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center shadow-md shadow-sunset-orange/20">
              <UserCheck className="h-4 w-4 text-sunset-cream" />
            </div>
            Technical Interviewers Directory
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Browse active technical evaluators, domain expertise, timezones, and scheduling availability.
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
        </div>
      </div>

      {/* Search & Availability Toggle */}
      <div className="bg-[#18110C]/90 p-4 rounded-xl border border-[#36271D] flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sunset-amber/60" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interviewers by name or technical skills..."
            className="pl-9 bg-[#120B07] border-[#36271D] text-sunset-cream placeholder:text-stone-500 focus-visible:ring-sunset-orange focus-visible:border-sunset-orange"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setOnlyAvailable(undefined)}
            className={`px-3 py-1.5 rounded-full transition-all ${
              onlyAvailable === undefined
                ? 'bg-gradient-to-r from-sunset-orange to-sunset-crimson text-sunset-cream shadow-sm'
                : 'bg-[#231711] text-stone-400 hover:text-sunset-cream'
            }`}
          >
            All Evaluators ({interviewers.length})
          </button>
          <button
            onClick={() => setOnlyAvailable(true)}
            className={`px-3 py-1.5 rounded-full transition-all ${
              onlyAvailable === true
                ? 'bg-gradient-to-r from-sunset-orange to-sunset-crimson text-sunset-cream shadow-sm'
                : 'bg-[#231711] text-stone-400 hover:text-sunset-cream'
            }`}
          >
            Available Only
          </button>
        </div>
      </div>

      {/* Evaluator Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-[#18110C]/80 border border-[#36271D] p-4 animate-pulse" />
          ))}
        </div>
      ) : interviewers.length === 0 ? (
        <div className="p-12 text-center bg-[#18110C]/40 rounded-xl border border-[#36271D]">
          <UserCheck className="h-10 w-10 text-stone-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-sunset-cream">No interviewers found</h3>
          <p className="text-xs text-stone-400 mt-1">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviewers.map((intv) => (
            <div
              key={intv.id}
              className="p-5 rounded-xl bg-[#18110C]/90 border border-[#36271D] hover:border-sunset-orange/40 hover:bg-[#20150F] transition-all flex flex-col justify-between group space-y-4 shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sunset-orange/20 border border-sunset-orange/30 flex items-center justify-center text-sunset-amber font-bold text-sm font-mono">
                      {intv.user.firstName[0]}{intv.user.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sunset-cream group-hover:text-sunset-amber transition-colors">
                        {intv.user.firstName} {intv.user.lastName}
                      </h3>
                      <p className="text-xs text-stone-400 font-mono">{intv.user.email}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${
                      intv.isAvailable
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-stone-800 text-stone-400 border-stone-700'
                    }`}
                  >
                    {intv.isAvailable ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {intv.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </div>

                {intv.bio && (
                  <p className="text-xs text-stone-300 mt-3 leading-relaxed line-clamp-2">
                    {intv.bio}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-stone-400">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-sunset-orange" />
                    {intv.yearsOfExperience} yrs exp
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Globe className="h-3.5 w-3.5 text-sunset-amber" />
                    {intv.timezone}
                  </span>
                </div>

                {intv.expertise && intv.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {intv.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="text-[10px] bg-[#241710] text-sunset-amber px-2 py-0.5 rounded border border-[#3D2D22] font-mono"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
