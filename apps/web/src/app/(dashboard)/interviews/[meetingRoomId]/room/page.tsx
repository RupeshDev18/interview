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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { interviewsService } from '@/services/interviews.service';
import { feedbackService } from '@/services/feedback.service';
import { useAuthStore } from '@/stores/auth.store';
import { useWebRtcRoom } from '@/hooks/use-webrtc-room';
import {
  Recommendation,
  type InterviewDto,
  type InterviewQuestionDto,
} from '@intvwplt/shared';

export default function InterviewRoomPage() {
  const router = useRouter();
  const { meetingRoomId } = useParams<{ meetingRoomId: string }>();
  const token = useAuthStore((s) => s.accessToken);

  const [notes, setNotes] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [recommendation, setRecommendation] = useState<Recommendation>(
    Recommendation.HIRE,
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  // WebRTC hook
  const {
    status,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    permissionError,
    localVideoRef,
    remoteVideoRef,
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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeave = () => {
    disconnect();
    router.push('/interviews');
  };

  if (room.isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-72 bg-surface-subtle" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl bg-surface-subtle" />
          <Skeleton className="h-96 rounded-2xl bg-surface-subtle" />
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="p-12 text-center rounded-2xl bg-card border border-theme space-y-3">
        <h2 className="text-base font-bold text-theme-primary">Meeting room not found</h2>
        <p className="text-xs text-theme-muted">The requested interview session could not be resolved.</p>
        <Button onClick={() => router.push('/interviews')} className="gradient-theme-btn text-xs">
          Back to Interviews
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
      {/* Left Column: Video & Controls */}
      <main className="lg:col-span-2 space-y-4">
        {/* Meeting Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-card border border-theme shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent flex items-center justify-center font-bold text-sm font-mono">
              R{interview.roundNumber}
            </div>
            <div>
              <h1 className="font-bold text-sm text-theme-primary">
                {interview.candidate.firstName} {interview.candidate.lastName} • {interview.interviewType.name}
              </h1>
              <p className="text-xs text-theme-muted font-mono mt-0.5">
                Room: {meetingRoomId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-theme text-xs font-mono">
              {status === 'connected' ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Connected</span>
                </>
              ) : status === 'connecting' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-amber-600 dark:text-amber-400">Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-theme-muted" />
                  <span className="text-theme-muted">Waiting</span>
                </>
              )}
            </div>

            <div className="px-3 py-1 rounded-full bg-surface border border-theme text-xs font-mono text-theme-primary font-bold">
              {formatTimer(elapsedSeconds)}
            </div>
          </div>
        </div>

        {permissionError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center gap-2">
            <span className="font-semibold">Notice:</span> {permissionError}
          </div>
        )}

        {/* Video Stage */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Remote (Candidate) Video */}
          <div className="relative aspect-video rounded-2xl bg-black border border-theme overflow-hidden shadow-md flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {status !== 'connected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2 bg-black/80">
                <div className="w-12 h-12 rounded-full bg-theme-accent/20 border border-theme-accent/30 text-white flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-white">
                  Waiting for candidate to join
                </p>
                <p className="text-[11px] text-stone-300 max-w-xs">
                  {interview.candidate.firstName} {interview.candidate.lastName} has not entered the room yet.
                </p>
              </div>
            )}

            {status === 'connected' && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs font-medium text-white">
                {interview.candidate.firstName} {interview.candidate.lastName} (Candidate)
              </div>
            )}
          </div>

          {/* Local (Interviewer) Video */}
          <div className="relative aspect-video rounded-2xl bg-black border border-theme overflow-hidden shadow-md flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''} ${!isCameraOn ? 'hidden' : ''}`}
            />

            {!isCameraOn && (
              <div className="text-center space-y-1 text-stone-400">
                <VideoOff className="h-6 w-6 mx-auto" />
                <p className="text-xs">Camera is off</p>
              </div>
            )}

            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs font-medium text-white flex items-center gap-2">
              <span>You (Interviewer)</span>
              {!isMicOn && <MicOff className="h-3.5 w-3.5 text-rose-400" />}
            </div>
          </div>
        </div>

        {/* Video Control Bar */}
        <div className="flex justify-center items-center gap-3 p-3 rounded-xl border border-theme bg-card shadow-sm">
          <Button
            variant="outline"
            onClick={toggleMic}
            className={`rounded-full w-10 h-10 p-0 border ${
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
            onClick={toggleCamera}
            className={`rounded-full w-10 h-10 p-0 border ${
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
            onClick={toggleScreenShare}
            className={`rounded-full w-10 h-10 p-0 border ${
              isScreenSharing
                ? 'border-theme bg-theme-accent text-white'
                : 'border-theme bg-surface text-theme-primary hover:bg-surface-subtle'
            }`}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          >
            <ScreenShare className="h-4 w-4" />
          </Button>

          <Button
            variant="destructive"
            onClick={handleLeave}
            className="rounded-full px-5 h-10 bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1.5"
          >
            <PhoneOff className="h-4 w-4" />
            <span>Leave</span>
          </Button>
        </div>
      </main>

      {/* Right Column: Live Notes & Scorecard */}
      <aside className="space-y-4">
        {/* Live Scratchpad */}
        <section className="rounded-xl border border-theme bg-card p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-theme-primary flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-theme-accent" />
              Live Notes
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveNotes.mutate()}
              disabled={saveNotes.isPending}
              className="h-7 text-xs border-theme text-theme-primary hover:bg-surface-subtle bg-surface"
            >
              {saveNotes.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type observations, candidate responses, technical feedback during the call..."
            className="min-h-[160px] w-full rounded-lg bg-surface border border-theme p-3 text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-accent font-mono leading-relaxed resize-none"
          />
        </section>

        {/* Evaluation Scorecard */}
        <section className="rounded-xl border border-theme bg-card p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-theme-primary flex items-center gap-1.5">
              <Award className="h-4 w-4 text-theme-accent" />
              Scorecard & Rating
            </h2>
          </div>

          {/* Question Scoring */}
          {interview.questions && interview.questions.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {interview.questions.map((q: InterviewQuestionDto, idx: number) => (
                <div
                  key={q.id}
                  className="p-2.5 rounded-lg bg-surface border border-theme space-y-2"
                >
                  <p className="text-xs text-theme-primary font-medium">
                    {idx + 1}. {q.questionText}
                  </p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() =>
                          setScores((prev) => ({ ...prev, [q.id]: val }))
                        }
                        className={`p-1 rounded transition-colors ${
                          (scores[q.id] || 0) >= val
                            ? 'text-amber-400'
                            : 'text-stone-300 dark:text-stone-700 hover:text-stone-400'
                        }`}
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </button>
                    ))}
                    {scores[q.id] && (
                      <span className="text-[11px] text-theme-accent font-mono ml-2 font-bold">
                        {scores[q.id]}/5
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overall Recommendation */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-theme-primary">
              Recommendation
            </label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value as Recommendation)}
              className="w-full rounded-lg bg-surface border border-theme p-2 text-xs text-theme-primary focus:outline-none focus:ring-1 focus:ring-theme-accent"
            >
              {Object.values(Recommendation).map((value) => (
                <option key={value} value={value}>
                  {value.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={() => submitFeedback.mutate()}
            disabled={submitFeedback.isPending}
            className="w-full text-xs gradient-theme-btn font-semibold"
          >
            {submitFeedback.isPending ? 'Submitting…' : 'Submit Scorecard'}
          </Button>
        </section>
      </aside>
    </div>
  );
}
