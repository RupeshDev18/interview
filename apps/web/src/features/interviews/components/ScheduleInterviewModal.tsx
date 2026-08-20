'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  UserCheck,
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { candidatesService } from '@/services/candidates.service';
import { interviewersService } from '@/services/interviewers.service';
import { interviewTypesService } from '@/services/interview-types.service';
import { interviewsService } from '@/services/interviews.service';
import type {
  CandidateSummary,
  InterviewerSummary,
  InterviewTypeDto,
  CreateInterviewDto,
} from '@intvwplt/shared';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedCandidateId?: string;
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedCandidateId,
}: ScheduleInterviewModalProps) {
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [interviewers, setInterviewers] = useState<InterviewerSummary[]>([]);
  const [interviewTypes, setInterviewTypes] = useState<InterviewTypeDto[]>([]);

  const [candidateId, setCandidateId] = useState(preselectedCandidateId || '');
  const [interviewerId, setInterviewerId] = useState('');
  const [interviewTypeId, setInterviewTypeId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [roundNumber, setRoundNumber] = useState(1);
  const [notes, setNotes] = useState('');
  const [questions, setQuestions] = useState<Array<{ questionText: string; category?: string }>>([]);

  const [newQuestionText, setNewQuestionText] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Default to tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);

    async function loadData() {
      setIsLoadingData(true);
      try {
        const [cands, ints, types] = await Promise.all([
          candidatesService.list({ limit: 100 }),
          interviewersService.list(),
          interviewTypesService.list(),
        ]);
        const candList = cands?.items || [];
        const intList = Array.isArray(ints) ? ints : [];
        const typeList = Array.isArray(types) ? types : [];

        setCandidates(candList);
        setInterviewers(intList);
        setInterviewTypes(typeList);

        if (preselectedCandidateId) {
          setCandidateId(preselectedCandidateId);
        } else if (candList.length > 0) {
          setCandidateId(candList[0].id);
        }

        if (intList.length > 0) setInterviewerId(intList[0].id);
        if (typeList.length > 0) setInterviewTypeId(typeList[0].id);
      } catch (err: any) {
        console.error('Failed to load scheduling data:', err);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, [isOpen, preselectedCandidateId]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    setQuestions([...questions, { questionText: newQuestionText.trim() }]);
    setNewQuestionText('');
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!candidateId || !interviewerId || !interviewTypeId || !date || !startTime) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const selectedType = interviewTypes.find((t) => t.id === interviewTypeId);
    const durationMins = selectedType?.durationMinutes || 60;

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMins * 60 * 1000);

    const payload: CreateInterviewDto = {
      candidateId,
      interviewerId,
      interviewTypeId,
      scheduledStart: startDateTime.toISOString(),
      scheduledEnd: endDateTime.toISOString(),
      roundNumber: Number(roundNumber),
      notes: notes.trim() || undefined,
      initialQuestions: questions.length > 0 ? questions : undefined,
    };

    setIsSubmitting(true);
    try {
      await interviewsService.create(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to schedule interview. Please check for conflicting slots.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-theme rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center text-white shadow-md shadow-black/10">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-primary">Schedule Technical Interview</h2>
              <p className="text-xs text-theme-muted">Create a new interview record with double-booking checks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-surface transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Row 1: Candidate & Round */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Candidate *</Label>
              <select
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface border border-theme text-theme-primary text-sm focus:outline-none focus:ring-1 focus:ring-theme-accent"
              >
                {candidates.map((cand) => (
                  <option key={cand.id} value={cand.id}>
                    {cand.firstName} {cand.lastName} ({cand.currentRole || 'Candidate'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Round #</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={roundNumber}
                onChange={(e) => setRoundNumber(parseInt(e.target.value, 10) || 1)}
                className="bg-surface border-theme text-theme-primary font-mono text-sm"
              />
            </div>
          </div>

          {/* Row 2: Interview Type & Interviewer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Interview Type *</Label>
              <select
                value={interviewTypeId}
                onChange={(e) => setInterviewTypeId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface border border-theme text-theme-primary text-sm focus:outline-none focus:ring-1 focus:ring-theme-accent"
              >
                {interviewTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.durationMinutes} mins)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Assigned Interviewer *</Label>
              <select
                value={interviewerId}
                onChange={(e) => setInterviewerId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface border border-theme text-theme-primary text-sm focus:outline-none focus:ring-1 focus:ring-theme-accent"
              >
                {interviewers.map((intv) => (
                  <option key={intv.id} value={intv.id}>
                    {intv.user.firstName} {intv.user.lastName} ({intv.expertise.join(', ') || intv.timezone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Date & Start Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Date *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-surface border-theme text-theme-primary text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-theme-primary">Start Time *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-surface border-theme text-theme-primary font-mono text-xs"
              />
            </div>
          </div>

          {/* Initial Meeting Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-theme-primary">
              Briefing / Pre-Interview Notes (Optional)
            </Label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Focus areas, topics to test, or candidate background context..."
              className="w-full p-2.5 rounded-lg bg-surface border border-theme text-theme-primary text-xs placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-accent"
            />
          </div>

          {/* Initial Question Bank */}
          <div className="space-y-2 pt-2 border-t border-theme">
            <Label className="text-xs font-semibold text-theme-primary flex items-center justify-between">
              <span>Interview Questions Checklist (Optional)</span>
              <span className="text-[11px] text-theme-accent font-mono">{questions.length} questions attached</span>
            </Label>

            <div className="flex gap-2">
              <Input
                placeholder="e.g. Design a URL Shortener or Explain JavaScript Event Loop"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
                className="bg-surface border-theme text-xs text-theme-primary"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddQuestion}
                className="text-xs shrink-0 border-theme bg-surface hover:bg-surface-subtle text-theme-primary"
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-theme-accent" /> Add
              </Button>
            </div>

            {questions.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {questions.map((q, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle border border-theme text-xs text-theme-primary"
                  >
                    <span className="truncate pr-2">
                      {index + 1}. {q.questionText}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(index)}
                      className="text-theme-muted hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-theme bg-surface-subtle">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-theme-muted hover:text-theme-primary"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingData}
            className="text-xs gradient-theme-btn font-semibold"
          >
            {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
          </Button>
        </div>
      </div>
    </div>
  );
}
