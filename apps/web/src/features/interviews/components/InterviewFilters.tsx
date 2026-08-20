'use client';

import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InterviewStatus } from '@intvwplt/shared';

interface InterviewFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  status?: InterviewStatus;
  onStatusChange: (status?: InterviewStatus) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const STATUS_TABS: Array<{ label: string; value?: InterviewStatus }> = [
  { label: 'All Records', value: undefined },
  { label: 'Scheduled', value: InterviewStatus.SCHEDULED },
  { label: 'In Progress', value: InterviewStatus.IN_PROGRESS },
  { label: 'Completed', value: InterviewStatus.COMPLETED },
  { label: 'Cancelled', value: InterviewStatus.CANCELLED },
];

export function InterviewFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onReset,
  isLoading,
}: InterviewFiltersProps) {
  const hasActiveFilters = Boolean(search || status);

  return (
    <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-theme shadow-sm">
      {/* Top row: Search & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by candidate, interviewer, or round type..."
            className="pl-9 bg-surface border-theme text-theme-primary placeholder:text-theme-muted focus-visible:ring-theme-accent focus-visible:border-theme-accent"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-theme-muted hover:text-theme-primary hover:bg-surface-subtle"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Bottom row: Status Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm">
        <span className="text-xs font-medium text-theme-muted mr-1.5 flex items-center gap-1">
          <Filter className="h-3 w-3 text-theme-accent" /> Status:
        </span>
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => onStatusChange(tab.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-theme-accent text-white shadow-sm'
                  : 'bg-surface text-theme-muted border border-theme hover:border-theme-accent/50 hover:text-theme-primary'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
