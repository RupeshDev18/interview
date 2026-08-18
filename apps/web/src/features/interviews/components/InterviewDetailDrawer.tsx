'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  Award,
  CheckCircle2,
  PlayCircle,
  XCircle,
  Copy,
  ExternalLink,
  Plus,
  Save,
  Check,
  Star,
  FileSpreadsheet,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { interviewsService } from '@/services/interviews.service';
import type {
  InterviewDto,
  InterviewQuestionDto,
  InterviewStatus,
} from '@intvwplt/shared';

interface InterviewDetailDrawerProps {
  interviewId: string | null;
  onClose: () => void;
  onOpenFeedback: (interview: InterviewDto) => void;
  onRefresh: () => void;
}

type TabType = 'notes' | 'questions' | 'feedback' | 'details';

export function InterviewDetailDrawer({
  interviewId,
  onClose,
  onOpenFeedback,
  onRefresh,
}: InterviewDetailDrawerProps) {
  const [interview, setInterview] = useState<InterviewDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('notes');

  // Notes state & autosave
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Questions state
  const [questions, setQuestions] = useState<InterviewQuestionDto[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Status update
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!interviewId) return;

    async function loadInterview() {
      setIsLoading(true);
      try {
        const data = await interviewsService.getById(interviewId!);
        setInterview(data);
        setNotes(data.notes || '');
        setQuestions(data.questions || []);
      } catch (err) {
        console.error('Failed to load interview details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadInterview();
  }, [interviewId]);

  // Debounced autosave for notes
  const handleNotesChange = (val: string) => {
    setNotes(val);
    setSaveStatus('saving');

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      if (!interviewId) return;
      try {
        await interviewsService.updateNotes(interviewId, { notes: val });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (err) {
        console.error('Failed to autosave notes:', err);
        setSaveStatus('error');
      }
    }, 1000);
  };

  const handleManualSaveNotes = async () => {
    if (!interviewId) return;
    setSaveStatus('saving');
    try {
      await interviewsService.updateNotes(interviewId, { notes });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleUpdateQuestion = async (
    questionId: string,
    field: 'candidateAnswer' | 'interviewerNotes' | 'score',
    value: any,
  ) => {
    if (!interviewId) return;
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)),
    );

    try {
      await interviewsService.updateQuestionNotes(interviewId, questionId, {
        [field]: value,
      });
    } catch (err) {
      console.error('Failed to update question:', err);
    }
  };

  const handleStatusChange = async (newStatus: InterviewStatus) => {
    if (!interviewId || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await interviewsService.updateStatus(interviewId, newStatus);
      setInterview(updated);
      onRefresh();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCopyMeetingLink = () => {
    if (!interview) return;
    const url = `${window.location.origin}/interviews/${interview.meetingRoomId}/room`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!interviewId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-[#18110C] border-l border-[#36271D] h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Top Header */}
        <div className="px-6 py-4 border-b border-[#36271D] bg-[#120B07] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sunset-orange to-sunset-crimson flex items-center justify-center text-sunset-cream font-bold text-sm shadow-md shadow-sunset-orange/20">
              R{interview?.roundNumber || 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-sunset-cream">
                  {interview?.candidate.firstName} {interview?.candidate.lastName}
                </h2>
                <Badge variant="outline" className="text-xs text-sunset-amber border-sunset-amber/40 bg-sunset-amber/10">
                  {interview?.interviewType.name}
                </Badge>
              </div>
              <p className="text-xs text-stone-400 mt-0.5 font-mono">
                {interview && format(new Date(interview.scheduledStart), 'EEEE, MMMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-sunset-cream hover:bg-[#251A13] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action / Status Bar */}
        <div className="px-6 py-2.5 bg-[#140E0A] border-b border-[#36271D] flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-medium">Status:</span>
            <span className="px-2.5 py-0.5 rounded-full font-medium bg-[#231711] text-sunset-cream border border-[#3D2D22]">
              {interview?.status}
            </span>

            {interview?.status === 'SCHEDULED' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStatusChange('IN_PROGRESS' as InterviewStatus)}
                disabled={isUpdatingStatus}
                className="h-7 text-xs text-sunset-orange hover:bg-sunset-orange/10 font-semibold"
              >
                <PlayCircle className="h-3.5 w-3.5 mr-1" /> Start Interview
              </Button>
            )}

            {interview?.status === 'IN_PROGRESS' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStatusChange('COMPLETED' as InterviewStatus)}
                disabled={isUpdatingStatus}
                className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10 font-semibold"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Finish Interview
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyMeetingLink}
              className="h-7 text-xs border-[#3D2D22] text-stone-300 hover:text-sunset-cream bg-[#231711]"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1 text-sunset-amber" />}
              {copiedLink ? 'Link Copied' : 'Copy Room Link'}
            </Button>

            {interview && (
              <Button
                size="sm"
                onClick={() => onOpenFeedback(interview)}
                className="h-7 text-xs gradient-sunset-btn font-semibold"
              >
                <Award className="h-3.5 w-3.5 mr-1" />
                {interview.feedback ? 'Edit Scorecard' : 'Submit Scorecard'}
              </Button>
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-[#36271D] bg-[#120B07] px-6">
          {[
            { key: 'notes', label: 'Live Notes', icon: FileText },
            { key: 'questions', label: `Questions (${questions.length})`, icon: FileSpreadsheet },
            { key: 'feedback', label: 'Feedback Scorecard', icon: Award },
            { key: 'details', label: 'Overview & Profile', icon: User },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                  isActive
                    ? 'border-sunset-orange text-sunset-amber bg-sunset-orange/5'
                    : 'border-transparent text-stone-400 hover:text-sunset-cream hover:bg-[#231711]'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: LIVE NOTES */}
          {activeTab === 'notes' && (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-sunset-cream">Interviewer Live Scratchpad</span>
                  <span className="text-stone-500 font-mono">• Autosaved in real-time</span>
                </div>

                <div className="flex items-center gap-2">
                  {saveStatus === 'saving' && (
                    <span className="text-[11px] text-sunset-amber flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sunset-orange animate-pulse" />
                      Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> All changes saved
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Save failed
                    </span>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleManualSaveNotes}
                    className="h-7 text-xs border-[#36271D] text-stone-300 hover:text-sunset-cream bg-[#231711]"
                  >
                    <Save className="h-3 w-3 mr-1 text-sunset-amber" /> Save
                  </Button>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Type your real-time notes here during the interview... (e.g. key observations, algorithm approach, code syntax, behavioral responses, edge cases discussed)"
                className="w-full flex-1 min-h-[350px] p-4 rounded-xl bg-[#120B07] border border-[#36271D] text-sunset-cream text-sm placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-sunset-orange font-mono leading-relaxed resize-none shadow-inner"
              />
            </div>
          )}

          {/* TAB 2: QUESTIONS & OBSERVATIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-sunset-cream">
                    Interview Questions & Score Tracker
                  </h3>
                  <p className="text-xs text-stone-400">
                    Track answers, notes, and individual ratings for each technical question.
                  </p>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="p-8 text-center bg-[#120B07] rounded-xl border border-[#36271D]">
                  <p className="text-xs text-stone-400">No questions attached to this interview.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-[#20150F] border border-[#36271D] space-y-3 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-sunset-orange/20 border border-sunset-orange/30 text-sunset-amber flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 font-mono">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-sunset-cream">{q.questionText}</p>
                            {q.category && (
                              <span className="text-[10px] text-sunset-amber bg-sunset-orange/10 border border-sunset-orange/20 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">
                                {q.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Question Score Rating */}
                        <div className="flex items-center gap-1 shrink-0">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleUpdateQuestion(q.id, 'score', star)}
                              className={`p-1 rounded transition-colors ${
                                (q.score || 0) >= star
                                  ? 'text-sunset-amber'
                                  : 'text-stone-700 hover:text-stone-500'
                              }`}
                            >
                              <Star className="h-4 w-4 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {q.expectedAnswer && (
                        <div className="p-2.5 rounded-lg bg-sunset-orange/10 border border-sunset-orange/20 text-xs text-sunset-amber/90">
                          <span className="font-bold text-sunset-amber">Expected Solution / Hint: </span>
                          {q.expectedAnswer}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-stone-400">
                            Candidate's Response / Approach
                          </label>
                          <textarea
                            rows={2}
                            value={q.candidateAnswer || ''}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, 'candidateAnswer', e.target.value)
                            }
                            placeholder="Summary of candidate's answer..."
                            className="w-full p-2 rounded-lg bg-[#120B07] border border-[#36271D] text-xs text-sunset-cream focus:outline-none focus:ring-1 focus:ring-sunset-orange"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-stone-400">
                            Interviewer Observation Notes
                          </label>
                          <textarea
                            rows={2}
                            value={q.interviewerNotes || ''}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, 'interviewerNotes', e.target.value)
                            }
                            placeholder="Observations, hints needed, test cases missed..."
                            className="w-full p-2 rounded-lg bg-[#120B07] border border-[#36271D] text-xs text-sunset-cream focus:outline-none focus:ring-1 focus:ring-sunset-orange"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FEEDBACK SCORECARD */}
          {activeTab === 'feedback' && (
            <div className="space-y-5">
              {interview?.feedback ? (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-[#20150F] border border-[#36271D] space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Award className="h-5 w-5 text-sunset-orange" />
                        <h4 className="text-sm font-bold text-sunset-cream">Overall Recommendation</h4>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-sunset-orange/20 text-sunset-amber border border-sunset-orange/40">
                        {interview.feedback.recommendation.replace('_', ' ')}
                      </span>
                    </div>

                    {interview.feedback.overallScore && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-400">Overall Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-sunset-amber text-sunset-amber" />
                          <span className="text-sm font-bold text-sunset-cream font-mono">
                            {Number(interview.feedback.overallScore).toFixed(1)} / 5.0
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rubric Breakdown */}
                  {interview.feedback.scores && Object.keys(interview.feedback.scores).length > 0 && (
                    <div className="p-4 rounded-xl bg-[#120B07] border border-[#36271D] space-y-3">
                      <h4 className="text-xs font-semibold text-sunset-amber uppercase tracking-wider font-mono">
                        Criteria Scores Breakdown
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(interview.feedback.scores).map(([key, val]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-[#20150F] border border-[#36271D] text-xs"
                          >
                            <span className="text-stone-300 capitalize">
                              {key.replace('_', ' ')}
                            </span>
                            <span className="font-bold text-sunset-amber font-mono">{val} / 5</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Qualitative summary */}
                  {interview.feedback.strengths && (
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1.5">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <ThumbsUp className="h-3.5 w-3.5" /> Key Strengths
                      </span>
                      <p className="text-xs text-stone-200 leading-relaxed whitespace-pre-wrap">
                        {interview.feedback.strengths}
                      </p>
                    </div>
                  )}

                  {interview.feedback.weaknesses && (
                    <div className="p-4 rounded-xl bg-sunset-amber/10 border border-sunset-amber/30 space-y-1.5">
                      <span className="text-xs font-semibold text-sunset-amber flex items-center gap-1.5">
                        <ThumbsDown className="h-3.5 w-3.5" /> Areas for Improvement
                      </span>
                      <p className="text-xs text-stone-200 leading-relaxed whitespace-pre-wrap">
                        {interview.feedback.weaknesses}
                      </p>
                    </div>
                  )}

                  {interview.feedback.concerns && (
                    <div className="p-4 rounded-xl bg-sunset-crimson/15 border border-sunset-crimson/30 space-y-1.5">
                      <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> Red Flags & Concerns
                      </span>
                      <p className="text-xs text-stone-200 leading-relaxed whitespace-pre-wrap">
                        {interview.feedback.concerns}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 text-center bg-[#120B07] rounded-2xl border border-[#36271D] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-sunset-orange/20 text-sunset-amber mx-auto flex items-center justify-center">
                    <Award className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-sunset-cream">No Feedback Submitted Yet</h4>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto">
                    Evaluate this candidate against the technical rubric to provide hiring recommendations.
                  </p>
                  <Button
                    onClick={() => onOpenFeedback(interview!)}
                    className="text-xs gradient-sunset-btn font-semibold mt-2"
                  >
                    Open Feedback Form
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OVERVIEW & CANDIDATE PROFILE */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Candidate Info */}
              <div className="p-4 rounded-xl bg-[#20150F] border border-[#36271D] space-y-3">
                <h4 className="text-xs font-semibold text-sunset-amber uppercase tracking-wider font-mono">
                  Candidate Dossier
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-stone-500">Full Name:</span>
                    <p className="font-semibold text-sunset-cream">
                      {interview?.candidate.firstName} {interview?.candidate.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-stone-500">Email:</span>
                    <p className="text-stone-200">{interview?.candidate.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Current Role:</span>
                    <p className="text-stone-200">{interview?.candidate.currentRole || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-stone-500">Experience:</span>
                    <p className="text-stone-200">{interview?.candidate.experienceYears ? `${interview.candidate.experienceYears} years` : 'N/A'}</p>
                  </div>
                </div>

                {interview?.candidate.skills && (
                  <div className="pt-2 border-t border-[#36271D]">
                    <span className="text-stone-500 text-[11px]">Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {interview.candidate.skills.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-[#2A1D16] border border-[#3D2D22] text-stone-300 text-[11px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interviewer Info */}
              <div className="p-4 rounded-xl bg-[#20150F] border border-[#36271D] space-y-2 text-xs">
                <h4 className="text-xs font-semibold text-sunset-amber uppercase tracking-wider font-mono">
                  Assigned Interviewer
                </h4>
                <p className="font-semibold text-sunset-cream">
                  {interview?.interviewer.user.firstName} {interview?.interviewer.user.lastName} ({interview?.interviewer.user.email})
                </p>
                <p className="text-stone-400 font-mono">
                  Timezone: {interview?.interviewer.timezone} • Expertise: {interview?.interviewer.expertise.join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
