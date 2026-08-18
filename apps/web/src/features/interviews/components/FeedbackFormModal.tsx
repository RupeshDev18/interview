'use client';

import React, { useState } from 'react';
import {
  Award,
  Star,
  CheckCircle2,
  AlertCircle,
  X,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { feedbackService } from '@/services/feedback.service';
import {
  InterviewDto,
  Recommendation,
  CandidateStatus,
  SubmitFeedbackDto,
} from '@intvwplt/shared';

interface FeedbackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  interview: InterviewDto;
}

const DEFAULT_CRITERIA = [
  { id: 'problem_solving', name: 'Problem Solving & DSA', description: 'Approach to algorithm design, edge case handling, and complexity analysis' },
  { id: 'coding_proficiency', name: 'Coding & Code Quality', description: 'Clean code, readability, proper variable naming, and modularity' },
  { id: 'system_design', name: 'Architecture & Scalability', description: 'System trade-offs, database choices, caching, and resiliency' },
  { id: 'communication', name: 'Communication & Culture', description: 'Articulation of ideas, receptiveness to hints, and collaboration' },
];

const RECOMMENDATION_OPTIONS: Array<{
  value: Recommendation;
  label: string;
  desc: string;
  color: string;
  borderColor: string;
}> = [
  {
    value: Recommendation.STRONG_HIRE,
    label: 'Strong Hire',
    desc: 'Exceptional candidate, clear top performer',
    color: 'bg-emerald-500/20 text-emerald-300',
    borderColor: 'border-emerald-500',
  },
  {
    value: Recommendation.HIRE,
    label: 'Hire',
    desc: 'Meets and exceeds all technical criteria',
    color: 'bg-green-500/20 text-green-300',
    borderColor: 'border-green-500',
  },
  {
    value: Recommendation.NEXT_ROUND,
    label: 'Next Round',
    desc: 'Promising, recommend next interview round',
    color: 'bg-blue-500/20 text-blue-300',
    borderColor: 'border-blue-500',
  },
  {
    value: Recommendation.HOLD,
    label: 'Hold',
    desc: 'Borderline or pending team fit discussion',
    color: 'bg-amber-500/20 text-amber-300',
    borderColor: 'border-amber-500',
  },
  {
    value: Recommendation.REJECT,
    label: 'Reject',
    desc: 'Does not meet technical hiring standards',
    color: 'bg-rose-500/20 text-rose-300',
    borderColor: 'border-rose-500',
  },
];

export function FeedbackFormModal({
  isOpen,
  onClose,
  onSuccess,
  interview,
}: FeedbackFormModalProps) {
  const existingFeedback = interview.feedback;

  const activeCriteria =
    interview.interviewType.evaluationTemplate?.criteria &&
    interview.interviewType.evaluationTemplate.criteria.length > 0
      ? interview.interviewType.evaluationTemplate.criteria
      : DEFAULT_CRITERIA;

  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (existingFeedback?.scores) {
      return existingFeedback.scores as Record<string, number>;
    }
    const initial: Record<string, number> = {};
    activeCriteria.forEach((c) => {
      initial[c.id] = 3; // Default 3/5
    });
    return initial;
  });

  const [strengths, setStrengths] = useState(existingFeedback?.strengths || '');
  const [weaknesses, setWeaknesses] = useState(existingFeedback?.weaknesses || '');
  const [concerns, setConcerns] = useState(existingFeedback?.concerns || '');
  const [recommendation, setRecommendation] = useState<Recommendation>(
    existingFeedback?.recommendation || Recommendation.HIRE,
  );
  const [nextStatus, setNextStatus] = useState<CandidateStatus | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: value,
    }));
  };

  // Calculate live average score
  const scoreValues = Object.values(scores);
  const averageScore =
    scoreValues.length > 0
      ? (scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(1)
      : '0.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload: SubmitFeedbackDto = {
      scores,
      strengths: strengths.trim() || undefined,
      weaknesses: weaknesses.trim() || undefined,
      concerns: concerns.trim() || undefined,
      recommendation,
      templateId: interview.interviewType.evaluationTemplateId || undefined,
      nextCandidateStatus: nextStatus,
    };

    setIsSubmitting(true);
    try {
      await feedbackService.submit(interview.id, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message || 'Failed to submit feedback scorecard.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#18110C] border border-[#36271D] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#36271D] bg-[#120B07]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center text-sunset-cream shadow-md shadow-sunset-orange/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-sunset-cream">
                Interview Feedback & Scorecard
              </h2>
              <p className="text-xs text-stone-400">
                {interview.candidate.firstName} {interview.candidate.lastName} •{' '}
                {interview.interviewType.name} (Round {interview.roundNumber})
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-sunset-crimson/15 border border-sunset-crimson/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Section 1: Rubric Criteria Ratings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sunset-amber uppercase tracking-wider text-xs font-mono">
                Evaluation Rubric Ratings (1 to 5)
              </h3>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sunset-orange/20 border border-sunset-orange/30 text-sunset-amber text-xs font-bold font-mono">
                <Star className="h-3.5 w-3.5 fill-sunset-amber text-sunset-amber" />
                Score: {averageScore} / 5.0
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeCriteria.map((c) => {
                const currentScore = scores[c.id] || 3;
                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-[#20150F] border border-[#36271D] space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sunset-cream">{c.name}</span>
                      <span className="text-xs font-bold text-sunset-amber font-mono">{currentScore} / 5</span>
                    </div>
                    {c.description && (
                      <p className="text-[11px] text-stone-400 leading-tight">{c.description}</p>
                    )}

                    <div className="flex items-center gap-1 pt-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleScoreChange(c.id, val)}
                          className={`flex-1 py-1 rounded text-xs font-bold font-mono transition-all ${
                            currentScore >= val
                              ? 'bg-gradient-to-r from-sunset-orange to-sunset-crimson text-sunset-cream shadow-sm'
                              : 'bg-[#120B07] text-stone-500 hover:bg-[#2A1D16] hover:text-stone-300'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Final Recommendation Selection */}
          <div className="space-y-2.5 pt-2 border-t border-[#36271D]">
            <Label className="text-xs font-bold text-sunset-amber uppercase tracking-wider font-mono">
              Hiring Recommendation *
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {RECOMMENDATION_OPTIONS.map((opt) => {
                const isSelected = recommendation === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRecommendation(opt.value)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? `${opt.borderColor} ${opt.color} ring-2 ring-offset-2 ring-offset-[#18110C] ring-sunset-orange shadow-lg`
                        : 'border-[#36271D] bg-[#120B07] text-stone-400 hover:border-sunset-orange/40 hover:text-stone-200'
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Qualitative Feedback Notes */}
          <div className="space-y-4 pt-2 border-t border-[#36271D]">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" /> Key Strengths
              </Label>
              <textarea
                rows={2}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="What did the candidate do exceptionally well?"
                className="w-full p-2.5 rounded-lg bg-[#120B07] border border-[#36271D] text-sunset-cream text-xs placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-sunset-orange"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <ThumbsDown className="h-3.5 w-3.5 text-sunset-amber" /> Areas for Improvement / Weaknesses
              </Label>
              <textarea
                rows={2}
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                placeholder="Where did the candidate struggle or need hints?"
                className="w-full p-2.5 rounded-lg bg-[#120B07] border border-[#36271D] text-sunset-cream text-xs placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-sunset-orange"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-sunset-crimson" /> Red Flags / Critical Concerns
              </Label>
              <textarea
                rows={2}
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                placeholder="Any attitude, plagiarism, or dealbreaker issues..."
                className="w-full p-2.5 rounded-lg bg-[#120B07] border border-[#36271D] text-sunset-cream text-xs placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-sunset-orange"
              />
            </div>
          </div>

          {/* Section 4: Candidate Status Progression */}
          <div className="p-3.5 rounded-xl bg-[#120B07] border border-[#36271D] space-y-2">
            <Label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-sunset-orange" /> Update Candidate Status Automatically
            </Label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Keep current status', value: undefined },
                { label: 'Move to Next Round', value: CandidateStatus.NEXT_ROUND },
                { label: 'Mark as Hired', value: CandidateStatus.HIRED },
                { label: 'Place On Hold', value: CandidateStatus.ON_HOLD },
                { label: 'Reject Candidate', value: CandidateStatus.REJECTED },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setNextStatus(opt.value as CandidateStatus)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    nextStatus === opt.value
                      ? 'bg-gradient-to-r from-sunset-orange to-sunset-crimson text-sunset-cream border-transparent shadow-sm'
                      : 'bg-[#20150F] border-[#36271D] text-stone-400 hover:text-sunset-cream hover:border-sunset-orange/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#36271D] bg-[#120B07]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-stone-400 hover:text-sunset-cream"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs gradient-sunset-btn font-semibold"
          >
            {isSubmitting ? 'Submitting Scorecard...' : 'Submit Feedback Scorecard'}
          </Button>
        </div>
      </div>
    </div>
  );
}
