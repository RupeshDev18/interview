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
  ExternalLink,
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
            className="h-20 bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex items-center justify-between"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 bg-slate-800" />
              <Skeleton className="h-3 w-32 bg-slate-800" />
            </div>
            <Skeleton className="h-8 w-24 bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
          <Calendar className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">No interviews found</h3>
        <p className="text-sm text-slate-400 max-w-sm mt-1">
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
          <Badge className="bg-sunset-amber/10 text-sunset-amber border border-sunset-amber/30 hover:bg-sunset-amber/20 gap-1 font-medium text-xs">
            <Clock className="h-3 w-3" /> Scheduled
          </Badge>
        );
      case InterviewStatus.IN_PROGRESS:
        return (
          <Badge className="bg-sunset-orange/20 text-sunset-orange border border-sunset-orange/40 hover:bg-sunset-orange/30 gap-1 font-bold text-xs animate-pulse">
            <PlayCircle className="h-3 w-3" /> Live Now
          </Badge>
        );
      case InterviewStatus.COMPLETED:
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 gap-1 font-medium text-xs">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case InterviewStatus.CANCELLED:
      case InterviewStatus.NO_SHOW:
        return (
          <Badge className="bg-sunset-crimson/15 text-rose-400 border border-sunset-crimson/30 hover:bg-sunset-crimson/25 gap-1 font-medium text-xs">
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
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-sunset-orange/20 to-sunset-amber/20 text-sunset-amber border border-sunset-orange/40 hover:bg-sunset-orange/30 transition-all shadow-sm"
          >
            <Award className="h-3 w-3 text-sunset-orange" />
            Submit Feedback
          </button>
        );
      }
      return (
        <span className="text-xs text-stone-500 italic">
          Feedback pending
        </span>
      );
    }

    const { recommendation, overallScore } = interview.feedback;
    let colorClass = 'bg-[#231711] text-stone-300 border-[#3D2D22]';

    if (recommendation === Recommendation.STRONG_HIRE || recommendation === Recommendation.HIRE) {
      colorClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    } else if (recommendation === Recommendation.NEXT_ROUND) {
      colorClass = 'bg-sunset-amber/15 text-sunset-amber border-sunset-amber/40';
    } else if (recommendation === Recommendation.HOLD) {
      colorClass = 'bg-sunset-orange/15 text-sunset-orange border-sunset-orange/40';
    } else if (recommendation === Recommendation.REJECT) {
      colorClass = 'bg-sunset-crimson/20 text-rose-300 border-sunset-crimson/40';
    }

    return (
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass}`}
        >
          <Award className="h-3 w-3 text-sunset-amber" />
          {recommendation.replace('_', ' ')}
          {overallScore && (
            <span className="ml-1 font-bold text-sunset-cream font-mono">({Number(overallScore).toFixed(1)}/5)</span>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#36271D] bg-[#18110C]/90 shadow-2xl backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-stone-200">
          <thead className="bg-[#120B07] text-xs uppercase tracking-wider text-stone-400 border-b border-[#36271D] font-semibold">
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
          <tbody className="divide-y divide-[#36271D]">
            {interviews.map((interview) => {
              const startDate = new Date(interview.scheduledStart);
              const endDate = new Date(interview.scheduledEnd);
              const isPastDate = isPast(endDate);

              return (
                <tr
                  key={interview.id}
                  onClick={() => onSelectInterview(interview)}
                  className="hover:bg-[#231711] cursor-pointer transition-colors group"
                >
                  {/* Candidate */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sunset-cream group-hover:text-sunset-amber transition-colors">
                          {interview.candidate.firstName} {interview.candidate.lastName}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCandidateDossier(interview.candidate.id);
                          }}
                          title="View 360° Round Dossier"
                          className="text-stone-500 hover:text-sunset-amber transition-colors"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-xs text-stone-400">
                        {interview.candidate.currentRole || 'Candidate'}
                      </span>
                      {interview.candidate.skills && interview.candidate.skills.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {interview.candidate.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] bg-[#241710] text-stone-300 px-1.5 py-0.2 rounded border border-[#3D2D22]"
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
                      <span className="font-medium text-stone-200">
                        {interview.interviewType.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block text-[11px] font-semibold text-sunset-orange bg-sunset-orange/10 px-1.5 py-0.5 rounded border border-sunset-orange/30">
                          Round {interview.roundNumber}
                        </span>
                        <span className="text-xs text-stone-400 font-mono">
                          {interview.interviewType.durationMinutes}m
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Interviewer */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-sunset-orange/20 border border-sunset-orange/30 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-sunset-amber">
                        {interview.interviewer.user.firstName[0]}
                        {interview.interviewer.user.lastName[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-stone-200">
                          {interview.interviewer.user.firstName} {interview.interviewer.user.lastName}
                        </span>
                        <span className="text-xs text-stone-400">
                          {interview.interviewer.timezone}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Date & Time */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-stone-200 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-sunset-amber" />
                        {format(startDate, 'MMM d, yyyy')}
                      </span>
                      <span className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5 font-mono">
                        <Clock className="h-3.5 w-3.5 text-stone-500" />
                        {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                      </span>
                      <span className="text-[11px] text-stone-500 mt-0.5">
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
                        className="text-xs text-stone-300 hover:text-sunset-cream hover:bg-[#2A1D16] gap-1 px-2.5"
                      >
                        <FileText className="h-3.5 w-3.5 text-sunset-orange" />
                        Notes
                      </Button>
                      <ChevronRight className="h-4 w-4 text-stone-600 group-hover:text-sunset-amber transition-colors" />
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
