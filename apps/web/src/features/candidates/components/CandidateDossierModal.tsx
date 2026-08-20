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
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
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
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            {rec.replace('_', ' ')}
          </span>
        );
      case 'NEXT_ROUND':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            {rec.replace('_', ' ')}
          </span>
        );
      case 'HOLD':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            {rec}
          </span>
        );
      case 'REJECT':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            {rec}
          </span>
        );
      default:
        return <Badge variant="outline">{rec}</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-theme rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme bg-surface-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-theme-accent flex items-center justify-center text-white shadow-md shadow-black/10">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-primary">
                Candidate 360° Interview Dossier
              </h2>
              <p className="text-xs text-theme-muted">
                Full chronological record of all interview rounds, notes, and evaluator scorecards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-surface transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-12 text-theme-muted text-xs animate-pulse">
              Loading candidate journey and round records...
            </div>
          ) : !dossier ? (
            <div className="text-center py-12 text-theme-muted text-xs">
              Candidate history not found.
            </div>
          ) : (
            <>
              {/* Top Overview Box */}
              <div className="p-5 rounded-2xl bg-surface border border-theme flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-theme-primary">
                      {dossier.candidate.firstName} {dossier.candidate.lastName}
                    </h3>
                    <Badge variant="outline" className="text-xs border-theme text-theme-accent bg-surface-subtle font-mono">
                      {dossier.candidate.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-theme-muted">
                    {dossier.candidate.currentRole || 'Candidate'} •{' '}
                    {dossier.candidate.experienceYears ? `${dossier.candidate.experienceYears} yrs exp` : ''}{' '}
                    • {dossier.candidate.email}
                  </p>
                  {dossier.candidate.skills && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {dossier.candidate.skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded bg-surface-subtle text-theme-primary text-[11px] border border-theme"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score & Recommendation Card */}
                <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-theme pt-3 sm:pt-0 sm:pl-5">
                  <div className="text-center">
                    <span className="text-[11px] uppercase tracking-wider text-theme-muted font-semibold block font-mono">
                      Rounds Done
                    </span>
                    <span className="text-xl font-bold text-theme-primary font-mono">
                      {dossier.completedRounds} / {dossier.totalRounds}
                    </span>
                  </div>

                  {dossier.averageScore && (
                    <div className="text-center">
                      <span className="text-[11px] uppercase tracking-wider text-theme-muted font-semibold block font-mono">
                        Avg Score
                      </span>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-xl font-bold text-theme-primary font-mono">
                          {Number(dossier.averageScore || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}

                  {dossier.finalRecommendation && (
                    <div className="text-center">
                      <span className="text-[11px] uppercase tracking-wider text-theme-muted font-semibold block mb-0.5 font-mono">
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-theme-accent font-mono">
                    Interview Rounds History
                  </h4>
                  {onScheduleNextRound && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onClose();
                        onScheduleNextRound(dossier.candidate.id);
                      }}
                      className="text-xs gradient-theme-btn font-semibold h-7 gap-1"
                    >
                      <Plus className="h-3 w-3" /> Schedule Next Round
                    </Button>
                  )}
                </div>

                {dossier.interviews.length === 0 ? (
                  <div className="p-8 text-center bg-surface-subtle rounded-xl border border-theme text-xs text-theme-muted">
                    No interview rounds scheduled yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dossier.interviews.map((interview) => {
                      const isExpanded = expandedRound === interview.id;
                      return (
                        <div
                          key={interview.id}
                          className="rounded-xl border border-theme bg-surface overflow-hidden transition-all shadow-sm"
                        >
                          {/* Round Header Bar */}
                          <button
                            type="button"
                            onClick={() => toggleRound(interview.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-surface-subtle transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-theme-accent/15 border border-theme-accent/30 text-theme-accent font-bold text-xs flex items-center justify-center font-mono">
                                R{interview.roundNumber}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-theme-primary">
                                    {interview.interviewType.name}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] font-normal border-theme text-theme-muted font-mono"
                                  >
                                    {interview.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-theme-muted mt-0.5">
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
                                    <span className="text-xs font-semibold text-theme-primary flex items-center gap-1 font-mono">
                                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                      {Number(interview.feedback.overallScore).toFixed(1)}/5
                                    </span>
                                  )}
                                  {getRecommendationBadge(interview.feedback.recommendation)}
                                </div>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-theme-muted" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-theme-muted" />
                              )}
                            </div>
                          </button>

                          {/* Round Details (Collapsible) */}
                          {isExpanded && (
                            <div className="p-5 border-t border-theme bg-surface-subtle space-y-4 text-xs">
                              {/* Live Notes */}
                              {interview.notes && (
                                <div className="space-y-1">
                                  <span className="font-semibold text-theme-primary flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5 text-theme-accent" /> Interview Notes & Observations
                                  </span>
                                  <div className="p-3 rounded-lg bg-surface border border-theme font-mono text-theme-primary text-xs whitespace-pre-wrap shadow-inner">
                                    {interview.notes}
                                  </div>
                                </div>
                              )}

                              {/* Feedback Scorecard Details */}
                              {interview.feedback ? (
                                <div className="space-y-3 pt-2 border-t border-theme">
                                  <span className="font-semibold text-theme-primary flex items-center gap-1.5">
                                    <Award className="h-3.5 w-3.5 text-theme-accent" /> Evaluator Scorecard Breakdown
                                  </span>

                                  {interview.feedback.scores && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                      {Object.entries(interview.feedback.scores).map(([k, v]) => (
                                        <div
                                          key={k}
                                          className="p-2 rounded bg-surface border border-theme text-center shadow-sm"
                                        >
                                          <span className="text-[10px] text-theme-muted capitalize block truncate">
                                            {k.replace('_', ' ')}
                                          </span>
                                          <span className="font-bold text-theme-accent text-xs font-mono">{v}/5</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {interview.feedback.strengths && (
                                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-theme-primary">
                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mb-1">
                                        <ThumbsUp className="h-3 w-3" /> Strengths:
                                      </span>
                                      {interview.feedback.strengths}
                                    </div>
                                  )}

                                  {interview.feedback.weaknesses && (
                                    <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-theme-primary">
                                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mb-1">
                                        <ThumbsDown className="h-3 w-3" /> Weaknesses:
                                      </span>
                                      {interview.feedback.weaknesses}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-theme-muted italic">No feedback scorecard submitted for this round.</p>
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
