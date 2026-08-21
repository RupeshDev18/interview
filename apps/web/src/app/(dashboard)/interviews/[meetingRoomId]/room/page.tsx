'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  User,
  FileText,
  Award,
  Star,
  Check,
  Wifi,
  WifiOff,
  Copy,
  Users,
  Eye,
  ShieldCheck,
  Code2,
  LayoutGrid,
  Columns,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { interviewsService } from '@/services/interviews.service';
import { feedbackService } from '@/services/feedback.service';
import { useAuthStore } from '@/stores/auth.store';
import { useWebRtcRoom } from '@/hooks/use-webrtc-room';
import { VideoGrid } from '@/components/interview/VideoGrid';
import { CollaborativeCodeEditor } from '@/components/interview/CollaborativeCodeEditor';
import {
  Recommendation,
  ParticipantRole,
  type InterviewDto,
  type InterviewQuestionDto,
} from '@intvwplt/shared';

type ViewMode = 'split' | 'code' | 'video';

export default function InterviewRoomPage() {
  const router = useRouter();
  const { meetingRoomId } = useParams<{ meetingRoomId: string }>();
  const token = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);

  const [notes, setNotes] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [recommendation, setRecommendation] = useState<Recommendation>(
    Recommendation.HIRE,
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  const [candidateLinkCopied, setCandidateLinkCopied] = useState(false);
  const [guestLinkCopied, setGuestLinkCopied] = useState(false);
  const [guestLinkBusy, setGuestLinkBusy] = useState(false);

  // Fetch interview details
  const room = useQuery({
    queryKey: ['interview-room', meetingRoomId],
    queryFn: async () => {
      const result = await interviewsService.list({ limit: 100 });
      return result.items.find(
        (item: InterviewDto) => item.meetingRoomId === meetingRoomId,
      );
    },
    enabled: !!meetingRoomId,
  });

  const interview = room.data;

  // Multi-peer WebRTC hook
  const {
    status,
    myParticipantInfo,
    participants,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    permissionError,
    localVideoRef,
    socket,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    disconnect,
  } = useWebRtcRoom({
    meetingRoomId: meetingRoomId || '',
    token: token || undefined,
    autoConnect: true,
  });

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const saveNotes = useMutation({
    mutationFn: () =>
      interviewsService.updateNotes(interview!.id, { notes }),
    onSuccess: () => {
      toast({ title: 'Notes saved' });
    },
  });

  const submitFeedback = useMutation({
    mutationFn: () =>
      feedbackService.submit(interview!.id, {
        scores,
        recommendation,
        strengths: notes || undefined,
      }),
    onSuccess: () => {
      toast({ title: 'Feedback submitted successfully' });
    },
  });

  const handleCopyCandidateLink = async () => {
    if (!interview) return;
    try {
      const res = await interviewsService.generateCandidateLink(interview.id);
      await navigator.clipboard.writeText(res.link);
      setCandidateLinkCopied(true);
      toast({
        title: 'Candidate Link Copied',
        description: 'One-time secure link copied to clipboard.',
      });
      setTimeout(() => setCandidateLinkCopied(false), 3000);
    } catch {
      toast({ title: 'Failed to generate link', variant: 'destructive' });
    }
  };

  const handleCopyGuestLink = async (role: ParticipantRole = ParticipantRole.HR_OBSERVER) => {
    if (!interview) return;
    try {
      setGuestLinkBusy(true);
      const res = await interviewsService.generateGuestLink(interview.id, {
        role,
        guestName: 'HR Observer',
      });
      await navigator.clipboard.writeText(res.link);
      setGuestLinkCopied(true);
      toast({
        title: 'HR / Observer Link Copied',
        description: 'Guest invite link copied to clipboard.',
      });
      setTimeout(() => setGuestLinkCopied(false), 3000);
    } catch {
      toast({ title: 'Failed to generate link', variant: 'destructive' });
    } finally {
      setGuestLinkBusy(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (room.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl bg-surface-subtle" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[650px]">
          <Skeleton className="lg:col-span-2 h-full rounded-2xl bg-surface-subtle" />
          <Skeleton className="h-full rounded-2xl bg-surface-subtle" />
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="p-12 text-center bg-card rounded-2xl border border-theme">
        <h2 className="text-base font-bold text-theme-primary">Interview Room Not Found</h2>
        <p className="text-xs text-theme-muted mt-1">This session may have ended or been rescheduled.</p>
      </div>
    );
  }

  const localName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : 'Lead Interviewer';

  return (
    <div className="flex flex-col space-y-3 pb-8">
      {/* Top Header Bar */}
      <div className="p-3 bg-card rounded-2xl border border-theme flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent flex items-center justify-center font-bold text-xs font-mono">
            R{interview.roundNumber}
          </div>
          <div>
            <h1 className="font-bold text-sm text-theme-primary">
              {interview.candidate.firstName} {interview.candidate.lastName} • {interview.interviewType.name}
            </h1>
            <p className="text-[11px] text-theme-muted font-mono">
              Room: {meetingRoomId}
            </p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-theme">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'split'
                ? 'bg-theme-accent text-white shadow-sm'
                : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Split View</span>
          </button>

          <button
            onClick={() => setViewMode('code')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'code'
                ? 'bg-theme-accent text-white shadow-sm'
                : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Code Focus</span>
          </button>

          <button
            onClick={() => setViewMode('video')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'video'
                ? 'bg-theme-accent text-white shadow-sm'
                : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Video Focus</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyCandidateLink}
            className="h-7 text-xs border-theme text-theme-primary hover:bg-surface-subtle bg-surface"
          >
            {candidateLinkCopied ? (
              <Check className="h-3 w-3 mr-1 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3 mr-1 text-amber-500" />
            )}
            {candidateLinkCopied ? 'Copied' : 'Candidate Link'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopyGuestLink(ParticipantRole.HR_OBSERVER)}
            disabled={guestLinkBusy}
            className="h-7 text-xs border-theme text-theme-primary hover:bg-surface-subtle bg-surface"
          >
            {guestLinkCopied ? (
              <Check className="h-3 w-3 mr-1 text-emerald-500" />
            ) : (
              <Eye className="h-3 w-3 mr-1 text-purple-500" />
            )}
            {guestLinkCopied ? 'Copied' : 'HR/Guest Link'}
          </Button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-theme text-xs font-mono">
            {status === 'connected' ? (
              <>
                <Wifi className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {1 + participants.length} Live
                </span>
              </>
            ) : status === 'connecting' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-600 dark:text-amber-400">Connecting…</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-theme-muted" />
                <span className="text-theme-muted">Waiting</span>
              </>
            )}
          </div>

          <div className="px-2.5 py-1 rounded-full bg-surface border border-theme text-xs font-mono text-theme-primary font-bold">
            {formatTimer(elapsedSeconds)}
          </div>
        </div>
      </div>

      {permissionError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center gap-2">
          <span className="font-semibold">Notice:</span> {permissionError}
        </div>
      )}

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[620px]">
        {/* Left / Center Area: Code Editor or Video Stage based on viewMode */}
        <div
          className={`${
            viewMode === 'code'
              ? 'lg:col-span-9'
              : viewMode === 'split'
              ? 'lg:col-span-7'
              : 'lg:col-span-8'
          } flex flex-col gap-3`}
        >
          {viewMode === 'video' ? (
            <div className="flex-1 flex flex-col gap-3">
              <VideoGrid
                localVideoRef={localVideoRef}
                localName={localName}
                localRole="LEAD_INTERVIEWER"
                isLocalMicOn={isMicOn}
                isLocalCameraOn={isCameraOn}
                isScreenSharing={isScreenSharing}
                participants={participants}
                status={status}
                emptyWaitingMessage={`Waiting for ${interview.candidate.firstName} or other panel guests...`}
              />
            </div>
          ) : (
            <div className="flex-1 min-h-[560px]">
              <CollaborativeCodeEditor
                meetingRoomId={meetingRoomId || ''}
                socket={socket}
                userName={localName}
              />
            </div>
          )}

          {/* Media Control Bar */}
          <div className="flex justify-center items-center gap-2.5 p-2 rounded-xl border border-theme bg-card shadow-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMic}
              className={`rounded-full w-9 h-9 p-0 border ${
                isMicOn
                  ? 'border-theme bg-surface text-theme-primary hover:bg-surface-subtle'
                  : 'border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
              }`}
              title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleCamera}
              className={`rounded-full w-9 h-9 p-0 border ${
                isCameraOn
                  ? 'border-theme bg-surface text-theme-primary hover:bg-surface-subtle'
                  : 'border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
              }`}
              title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleScreenShare}
              className={`rounded-full w-9 h-9 p-0 border ${
                isScreenSharing
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-theme bg-surface text-theme-primary hover:bg-surface-subtle'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <ScreenShare className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                disconnect();
                router.push('/interviews');
              }}
              className="rounded-full px-3 h-9 text-xs font-semibold gap-1.5"
            >
              <PhoneOff className="h-3.5 w-3.5" /> End Call
            </Button>
          </div>
        </div>

        {/* Right Sidebar: Video Grid (in Split/Code mode) + Live Scorecard & Notes */}
        <div
          className={`${
            viewMode === 'code'
              ? 'lg:col-span-3'
              : viewMode === 'split'
              ? 'lg:col-span-5'
              : 'lg:col-span-4'
          } flex flex-col gap-3`}
        >
          {/* In Split or Code mode, show compact Video Grid on top right */}
          {viewMode !== 'video' && (
            <div className="h-56 rounded-2xl overflow-hidden border border-theme bg-card shadow-sm">
              <VideoGrid
                localVideoRef={localVideoRef}
                localName={localName}
                localRole="LEAD_INTERVIEWER"
                isLocalMicOn={isMicOn}
                isLocalCameraOn={isCameraOn}
                isScreenSharing={isScreenSharing}
                participants={participants}
                status={status}
                emptyWaitingMessage={`Waiting for candidate...`}
              />
            </div>
          )}

          {/* Evaluation & Live Scorecard Panel */}
          <div className="flex-1 flex flex-col rounded-2xl border border-theme bg-card p-4 space-y-4 shadow-sm overflow-y-auto max-h-[500px]">
            <div className="flex items-center justify-between border-b border-theme pb-2.5">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-theme-accent" />
                <h3 className="text-xs font-bold text-theme-primary uppercase tracking-wider font-mono">
                  Live Evaluation Scorecard
                </h3>
              </div>
            </div>

            {/* Questions list */}
            {interview.questions && interview.questions.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-theme-muted uppercase font-mono">
                  Assigned Question Bank
                </label>
                <div className="space-y-1.5">
                  {interview.questions.map((iq: InterviewQuestionDto) => (
                    <div
                      key={iq.id}
                      className="p-2.5 rounded-xl bg-surface border border-theme text-xs space-y-1"
                    >
                      <div className="font-semibold text-theme-primary flex items-center justify-between">
                        <span>{iq.questionText}</span>
                        {iq.difficulty && (
                          <Badge variant="outline" className="text-[10px] border-theme">
                            {iq.difficulty}
                          </Badge>
                        )}
                      </div>
                      {iq.category && (
                        <p className="text-[11px] text-theme-muted">
                          Category: {iq.category}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Criteria Scores */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-theme-muted uppercase font-mono">
                Competency Ratings (1 - 5)
              </label>
              {[
                { key: 'problemSolving', label: 'Problem Solving & Algorithmic Design' },
                { key: 'codeQuality', label: 'Code Quality & Clean Architecture' },
                { key: 'communication', label: 'Technical Communication & Clarity' },
                { key: 'speed', label: 'Execution Speed & Edge Cases' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-theme-primary font-medium">{label}</span>
                    <span className="font-mono text-theme-accent font-bold">
                      {scores[key] || '-'}/5
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setScores({ ...scores, [key]: val })}
                        className={`flex-1 py-1 rounded-md text-xs font-mono font-bold border transition-all ${
                          scores[key] === val
                            ? 'bg-theme-accent text-white border-theme-accent shadow-sm'
                            : 'bg-surface text-theme-muted border-theme hover:text-theme-primary hover:border-theme-accent/40'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Private Interviewer Scratchpad */}
            <div className="space-y-1.5 flex-1">
              <label className="text-[11px] font-bold text-theme-muted uppercase font-mono flex items-center justify-between">
                <span>Private Interviewer Notes</span>
                <button
                  type="button"
                  onClick={() => saveNotes.mutate()}
                  disabled={saveNotes.isPending}
                  className="text-theme-accent hover:underline lowercase font-normal"
                >
                  {saveNotes.isPending ? 'saving…' : 'save notes'}
                </button>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key observations, trade-offs discussed, edge cases identified..."
                className="w-full p-2.5 rounded-xl bg-surface border border-theme text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-accent resize-none font-mono"
              />
            </div>

            {/* Final Recommendation */}
            <div className="space-y-2 pt-2 border-t border-theme">
              <label className="text-[11px] font-bold text-theme-muted uppercase font-mono">
                Overall Hiring Recommendation
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: Recommendation.STRONG_HIRE, label: 'Strong Hire' },
                  { value: Recommendation.HIRE, label: 'Hire' },
                  { value: Recommendation.NEXT_ROUND, label: 'Next Round' },
                  { value: Recommendation.HOLD, label: 'Hold' },
                  { value: Recommendation.REJECT, label: 'Reject' },
                ].map((rec) => (
                  <button
                    key={rec.value}
                    type="button"
                    onClick={() => setRecommendation(rec.value)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      recommendation === rec.value
                        ? 'bg-theme-accent text-white border-theme-accent shadow-sm'
                        : 'bg-surface text-theme-muted border-theme hover:text-theme-primary'
                    }`}
                  >
                    {rec.label}
                  </button>
                ))}
              </div>

              <Button
                onClick={() => submitFeedback.mutate()}
                disabled={submitFeedback.isPending}
                className="w-full gradient-theme-btn text-xs font-bold mt-2 shadow-md"
              >
                {submitFeedback.isPending ? 'Submitting…' : 'Submit Final Evaluation'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
