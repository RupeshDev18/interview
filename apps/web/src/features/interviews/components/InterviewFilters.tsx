'use client';

import React from 'react';
import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <div className="flex flex-col gap-3 bg-[#18110C]/90 p-4 rounded-xl border border-[#36271D]">
      {/* Top row: Search & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sunset-amber/60" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by candidate, interviewer, or round type..."
            className="pl-9 bg-[#120B07] border-[#36271D] text-sunset-cream placeholder:text-stone-500 focus-visible:ring-sunset-orange focus-visible:border-sunset-orange"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-sunset-cream"
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
              className="text-xs text-sunset-amber hover:text-sunset-cream hover:bg-[#231711]"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Bottom row: Status Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm">
        <span className="text-xs font-medium text-stone-400 mr-1.5 flex items-center gap-1">
          <Filter className="h-3 w-3 text-sunset-orange" /> Status:
        </span>
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.value;
          return (
            <button
              key={tab.label}
              onClick={() => onStatusChange(tab.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-sunset-orange to-sunset-crimson text-sunset-cream shadow-sm shadow-sunset-orange/30'
                  : 'bg-[#231711] text-stone-300 border border-[#3D2D22] hover:border-sunset-orange/50 hover:text-sunset-cream'
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
