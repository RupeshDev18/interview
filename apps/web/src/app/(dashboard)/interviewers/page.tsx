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
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center shadow-md shadow-black/10">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
            Technical Interviewers Directory
          </h1>
          <p className="text-sm text-theme-muted mt-1">
            Browse active technical evaluators, domain expertise, timezones, and scheduling availability.
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
        </div>
      </div>

      {/* Search & Availability Toggle */}
      <div className="bg-card p-4 rounded-xl border border-theme flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search interviewers by name or technical skills..."
            className="pl-9 bg-surface border-theme text-theme-primary placeholder:text-theme-muted focus-visible:ring-theme-accent focus-visible:border-theme-accent"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setOnlyAvailable(undefined)}
            className={`px-3 py-1.5 rounded-full transition-all ${
              onlyAvailable === undefined
                ? 'bg-theme-accent text-white shadow-sm'
                : 'bg-surface text-theme-muted border border-theme hover:border-theme-accent/50 hover:text-theme-primary'
            }`}
          >
            All Evaluators ({interviewers.length})
          </button>
          <button
            onClick={() => setOnlyAvailable(true)}
            className={`px-3 py-1.5 rounded-full transition-all ${
              onlyAvailable === true
                ? 'bg-theme-accent text-white shadow-sm'
                : 'bg-surface text-theme-muted border border-theme hover:border-theme-accent/50 hover:text-theme-primary'
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
            <div key={i} className="h-44 rounded-xl bg-card border border-theme p-4 space-y-3">
              <Skeleton className="h-5 w-36 bg-surface-subtle" />
              <Skeleton className="h-4 w-24 bg-surface-subtle" />
              <Skeleton className="h-3 w-full bg-surface-subtle" />
            </div>
          ))}
        </div>
      ) : interviewers.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border border-theme shadow-sm">
          <UserCheck className="h-10 w-10 text-theme-muted mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-theme-primary">No interviewers found</h3>
          <p className="text-xs text-theme-muted mt-1">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviewers.map((intv) => (
            <div
              key={intv.id}
              className="p-5 rounded-xl bg-card border border-theme hover:border-theme-accent/40 hover:bg-surface-subtle/50 transition-all flex flex-col justify-between group space-y-4 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent font-bold text-sm font-mono">
                      {intv.user.firstName[0]}{intv.user.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-theme-primary group-hover:text-theme-accent transition-colors">
                        {intv.user.firstName} {intv.user.lastName}
                      </h3>
                      <p className="text-xs text-theme-muted font-mono">{intv.user.email}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border font-mono ${
                      intv.isAvailable
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-surface-subtle text-theme-muted border-theme'
                    }`}
                  >
                    {intv.isAvailable ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {intv.isAvailable ? 'Available' : 'Busy'}
                  </span>
                </div>

                {intv.bio && (
                  <p className="text-xs text-theme-muted mt-3 leading-relaxed line-clamp-2">
                    {intv.bio}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-theme-muted">
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-theme-accent" />
                    {intv.yearsOfExperience} yrs exp
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Globe className="h-3.5 w-3.5 text-theme-accent" />
                    {intv.timezone}
                  </span>
                </div>

                {intv.expertise && intv.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {intv.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="text-[10px] bg-surface-subtle text-theme-primary px-2 py-0.5 rounded border border-theme font-mono font-medium"
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
