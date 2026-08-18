'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  Award,
  Calendar,
  Clock,
  User,
  Star,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { candidatesService } from '@/services/candidates.service';
import type { CandidateDossierDto, Recommendation } from '@intvwplt/shared';

interface CandidateDossierModalProps {
  candidateId: string | null;
  onClose: () => void;
  onScheduleNextRound?: (candidateId: string) => void;
}

export function CandidateDossierModal({
  candidateId,
  onClose,
  onScheduleNextRound,
}: CandidateDossierModalProps) {
  const [dossier, setDossier] = useState<CandidateDossierDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;

    async function loadDossier() {
      setIsLoading(true);
      try {
        const data = await candidatesService.getDossier(candidateId!);
        setDossier(data);
        if (data.interviews.length > 0) {
          setExpandedRound(data.interviews[data.interviews.length - 1].id);
        }
      } catch (err) {
        console.error('Failed to load candidate dossier:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDossier();
  }, [candidateId]);

  if (!candidateId) return null;

  const toggleRound = (id: string) => {
    setExpandedRound(expandedRound === id ? null : id);
  };

  const getRecommendationBadge = (rec: Recommendation) => {
    switch (rec) {
      case 'STRONG_HIRE':
      case 'HIRE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            {rec.replace('_', ' ')}
          </span>
        );
      case 'NEXT_ROUND':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
            {rec.replace('_', ' ')}
          </span>
        );
      case 'HOLD':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            {rec}
          </span>
        );
      case 'REJECT':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            {rec}
          </span>
        );
      default:
        return <Badge variant="outline">{rec}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#18110C] border border-[#36271D] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#36271D] bg-[#120B07] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center text-sunset-cream shadow-md shadow-sunset-orange/20">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-sunset-cream">
                Candidate 360° Interview Dossier
              </h2>
              <p className="text-xs text-stone-400">
                Full chronological record of all interview rounds, notes, and evaluator scorecards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-sunset-cream hover:bg-[#251A13] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-stone-400 text-xs animate-pulse">
              Loading candidate journey and round records...
            </div>
          ) : !dossier ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              Candidate history not found.
            </div>
          ) : (
            <>
              {/* Top Overview Box */}
              <div className="p-5 rounded-2xl bg-[#20150F] border border-[#36271D] flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-sunset-cream">
                      {dossier.candidate.firstName} {dossier.candidate.lastName}
                    </h3>
                    <Badge variant="outline" className="text-xs border-[#3D2D22] text-sunset-amber bg-sunset-orange/10 font-mono">
                      {dossier.candidate.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-400">
                    {dossier.candidate.currentRole || 'Candidate'} •{' '}
                    {dossier.candidate.experienceYears ? `${dossier.candidate.experienceYears} yrs exp` : ''}{' '}
                    • {dossier.candidate.email}
                  </p>
                  {dossier.candidate.skills && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dossier.candidate.skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded bg-[#2A1D16] text-stone-300 text-[11px] border border-[#3D2D22]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score & Recommendation Card */}
                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-[#36271D] pt-3 sm:pt-0 sm:pl-5">
                  <div className="text-center">
                    <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block font-mono">
                      Rounds Done
                    </span>
                    <span className="text-xl font-bold text-sunset-cream font-mono">
                      {dossier.completedRounds} / {dossier.totalRounds}
                    </span>
                  </div>

                  {dossier.averageScore && (
                    <div className="text-center">
                      <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block font-mono">
                        Avg Score
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-sunset-amber text-sunset-amber" />
                        <span className="text-xl font-bold text-sunset-cream font-mono">
                          {Number(dossier.averageScore || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}

                  {dossier.finalRecommendation && (
                    <div className="text-center">
                      <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block mb-0.5 font-mono">
                        Consensus
                      </span>
                      {getRecommendationBadge(dossier.finalRecommendation)}
                    </div>
                  )}
                </div>
              </div>

              {/* Rounds Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sunset-amber font-mono">
                    Interview Rounds History
                  </h4>
                  {onScheduleNextRound && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        onScheduleNextRound(dossier.candidate.id);
                      }}
                      className="text-xs gradient-sunset-btn font-semibold h-7 gap-1"
                    >
                      <Plus className="h-3 w-3" /> Schedule Next Round
                    </Button>
                  )}
                </div>

                {dossier.interviews.length === 0 ? (
                  <div className="p-8 text-center bg-[#120B07] rounded-xl border border-[#36271D] text-xs text-stone-400">
                    No interview rounds scheduled yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dossier.interviews.map((interview) => {
                      const isExpanded = expandedRound === interview.id;
                      return (
                        <div
                          key={interview.id}
                          className="rounded-xl border border-[#36271D] bg-[#20150F] overflow-hidden transition-all shadow-md"
                        >
                          {/* Round Header Bar */}
                          <button
                            type="button"
                            onClick={() => toggleRound(interview.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-[#2A1D16] transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-sunset-orange/20 border border-sunset-orange/30 text-sunset-amber font-bold text-xs flex items-center justify-center font-mono">
                                R{interview.roundNumber}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-sunset-cream">
                                    {interview.interviewType.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] font-normal border-[#3D2D22] text-stone-400 font-mono"
                                  >
                                    {interview.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-stone-400 mt-0.5">
                                  Interviewer: {interview.interviewer.user.firstName}{' '}
                                  {interview.interviewer.user.lastName} •{' '}
                                  {format(new Date(interview.scheduledStart), 'MMM d, yyyy • h:mm a')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {interview.feedback && (
                                <div className="flex items-center gap-2">
                                  {interview.feedback.overallScore && (
                                    <span className="text-xs font-semibold text-sunset-amber flex items-center gap-1 font-mono">
                                      <Star className="h-3 w-3 fill-sunset-amber text-sunset-amber" />
                                      {Number(interview.feedback.overallScore).toFixed(1)}/5
                                    </span>
                                  )}
                                  {getRecommendationBadge(interview.feedback.recommendation)}
                                </div>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-stone-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-stone-400" />
                              )}
                            </div>
                          </button>

                          {/* Round Details (Collapsible) */}
                          {isExpanded && (
                            <div className="p-5 border-t border-[#36271D] bg-[#140E0A] space-y-4 text-xs">
                              {/* Live Notes */}
                              {interview.notes && (
                                <div className="space-y-1">
                                  <span className="font-semibold text-sunset-cream flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-sunset-orange" /> Interview Notes & Observations
                                  </span>
                                  <div className="p-3 rounded-lg bg-[#120B07] border border-[#36271D] font-mono text-stone-200 text-xs whitespace-pre-wrap shadow-inner">
                                    {interview.notes}
                                  </div>
                                </div>
                              )}

                              {/* Feedback Scorecard Details */}
                              {interview.feedback ? (
                                <div className="space-y-3 pt-2 border-t border-[#36271D]">
                                  <span className="font-semibold text-sunset-cream flex items-center gap-1.5">
                                    <Award className="h-3.5 w-3.5 text-sunset-orange" /> Evaluator Scorecard Breakdown
                                  </span>

                                  {interview.feedback.scores && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      {Object.entries(interview.feedback.scores).map(([k, v]) => (
                                        <div
                                          key={k}
                                          className="p-2 rounded bg-[#20150F] border border-[#36271D] text-center shadow-sm"
                                        >
                                          <span className="text-[10px] text-stone-400 capitalize block truncate">
                                            {k.replace('_', ' ')}
                                          </span>
                                          <span className="font-bold text-sunset-amber text-xs font-mono">{v}/5</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {interview.feedback.strengths && (
                                    <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-800/40 text-stone-200">
                                      <span className="text-emerald-400 font-semibold flex items-center gap-1 mb-1">
                                        <ThumbsUp className="h-3 w-3" /> Strengths:
                                      </span>
                                      {interview.feedback.strengths}
                                    </div>
                                  )}

                                  {interview.feedback.weaknesses && (
                                    <div className="p-2.5 rounded bg-sunset-amber/10 border border-sunset-amber/30 text-stone-200">
                                      <span className="text-sunset-amber font-semibold flex items-center gap-1 mb-1">
                                        <ThumbsDown className="h-3 w-3" /> Weaknesses:
                                      </span>
                                      {interview.feedback.weaknesses}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-stone-500 italic">No feedback scorecard submitted for this round.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
