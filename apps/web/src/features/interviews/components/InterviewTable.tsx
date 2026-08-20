'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  XCircle,
  FileText,
  Award,
  ChevronRight,
  History,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  InterviewDto,
  InterviewStatus,
  Recommendation,
} from '@intvwplt/shared';

interface InterviewTableProps {
  interviews: InterviewDto[];
  isLoading: boolean;
  onSelectInterview: (interview: InterviewDto) => void;
  onOpenFeedback: (interview: InterviewDto) => void;
  onViewCandidateDossier: (candidateId: string) => void;
}

export function InterviewTable({
  interviews,
  isLoading,
  onSelectInterview,
  onOpenFeedback,
  onViewCandidateDossier,
}: InterviewTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className="h-20 bg-card rounded-xl border border-theme p-4 flex items-center justify-between"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 bg-surface-subtle" />
              <Skeleton className="h-3 w-32 bg-surface-subtle" />
            </div>
            <Skeleton className="h-8 w-24 bg-surface-subtle" />
          </div>
        ))}
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-theme shadow-sm">
        <div className="w-12 h-12 rounded-full bg-surface-subtle flex items-center justify-center text-theme-muted mb-3 opacity-60">
          <Calendar className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-theme-primary">No interviews found</h3>
        <p className="text-sm text-theme-muted max-w-sm mt-1">
          No interview records match the selected filters. Try adjusting your search or schedule a new interview.
        </p>
      </div>
    );
  }

  const renderStatusBadge = (status: InterviewStatus) => {
    switch (status) {
      case InterviewStatus.SCHEDULED:
      case InterviewStatus.CONFIRMED:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 gap-1 font-medium text-xs">
            <Clock className="h-3 w-3" /> Scheduled
          </Badge>
        );
      case InterviewStatus.IN_PROGRESS:
        return (
          <Badge className="bg-theme-accent text-white gap-1 font-bold text-xs animate-pulse">
            <PlayCircle className="h-3 w-3" /> Live Now
          </Badge>
        );
      case InterviewStatus.COMPLETED:
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1 font-medium text-xs">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case InterviewStatus.CANCELLED:
      case InterviewStatus.NO_SHOW:
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 gap-1 font-medium text-xs">
            <XCircle className="h-3 w-3" /> {status === InterviewStatus.CANCELLED ? 'Cancelled' : 'No Show'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderRecommendationPill = (interview: InterviewDto) => {
    if (!interview.feedback) {
      if (interview.status === InterviewStatus.COMPLETED) {
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenFeedback(interview);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-theme-accent-light text-theme-primary border border-theme hover:opacity-90 transition-all shadow-sm"
          >
            <Award className="h-3 w-3 text-theme-accent" />
            Submit Feedback
          </button>
        );
      }
      return (
        <span className="text-xs text-theme-muted italic">
          Feedback pending
        </span>
      );
    }

    const { recommendation, overallScore } = interview.feedback;
    let colorClass = 'bg-surface-subtle text-theme-primary border-theme';

    if (recommendation === Recommendation.STRONG_HIRE || recommendation === Recommendation.HIRE) {
      colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    } else if (recommendation === Recommendation.NEXT_ROUND) {
      colorClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    } else if (recommendation === Recommendation.HOLD) {
      colorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    } else if (recommendation === Recommendation.REJECT) {
      colorClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    }

    return (
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}
        >
          <Award className="h-3 w-3 text-theme-accent" />
          {recommendation.replace('_', ' ')}
          {overallScore && (
            <span className="ml-1 font-bold text-theme-primary font-mono">({Number(overallScore).toFixed(1)}/5)</span>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-theme bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-theme-primary">
          <thead className="bg-surface-subtle text-xs uppercase tracking-wider text-theme-muted border-b border-theme font-semibold">
            <tr>
              <th className="py-3.5 px-4">Candidate & Role</th>
              <th className="py-3.5 px-4">Interview Type</th>
              <th className="py-3.5 px-4">Interviewer</th>
              <th className="py-3.5 px-4">Date & Time</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Scorecard / Result</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {interviews.map((interview) => {
              const startDate = new Date(interview.scheduledStart);
              const endDate = new Date(interview.scheduledEnd);

              return (
                <tr
                  key={interview.id}
                  onClick={() => onSelectInterview(interview)}
                  className="hover:bg-surface-subtle cursor-pointer transition-colors group"
                >
                  {/* Candidate */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-theme-primary group-hover:text-theme-accent transition-colors">
                          {interview.candidate.firstName} {interview.candidate.lastName}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCandidateDossier(interview.candidate.id);
                          }}
                          title="View 360° Round Dossier"
                          className="text-theme-muted hover:text-theme-accent transition-colors"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-xs text-theme-muted">
                        {interview.candidate.currentRole || 'Candidate'}
                      </span>
                      {interview.candidate.skills && interview.candidate.skills.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {interview.candidate.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] bg-surface-subtle text-theme-muted px-1.5 py-0.5 rounded border border-theme"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Interview Type & Round */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-theme-primary">
                        {interview.interviewType.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block text-[11px] font-semibold text-theme-accent bg-surface-subtle px-1.5 py-0.5 rounded border border-theme">
                          Round {interview.roundNumber}
                        </span>
                        <span className="text-xs text-theme-muted font-mono">
                          {interview.interviewType.durationMinutes}m
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Interviewer */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-theme-accent">
                        {interview.interviewer.user.firstName[0]}
                        {interview.interviewer.user.lastName[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-theme-primary">
                          {interview.interviewer.user.firstName} {interview.interviewer.user.lastName}
                        </span>
                        <span className="text-xs text-theme-muted">
                          {interview.interviewer.timezone}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-theme-primary flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-theme-accent" />
                        {format(startDate, 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs text-theme-muted flex items-center gap-1.5 mt-0.5 font-mono">
                        <Clock className="h-3.5 w-3.5 text-theme-muted" />
                        {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                      </span>
                      <span className="text-[11px] text-theme-muted mt-0.5">
                        {formatDistanceToNow(startDate, { addSuffix: true })}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    {renderStatusBadge(interview.status)}
                  </td>

                  {/* Scorecard */}
                  <td className="py-4 px-4">
                    {renderRecommendationPill(interview)}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInterview(interview);
                        }}
                        className="text-xs text-theme-muted hover:text-theme-primary hover:bg-surface-subtle gap-1 px-2.5"
                      >
                        <FileText className="h-3.5 w-3.5 text-theme-accent" />
                        Notes
                      </Button>
                      <ChevronRight className="h-4 w-4 text-theme-muted group-hover:text-theme-accent transition-colors" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
