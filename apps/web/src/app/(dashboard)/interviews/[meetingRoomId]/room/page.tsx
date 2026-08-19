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

  // Sync initial notes
  useEffect(() => {
    if (interview?.notes) {
      setNotes(interview.notes);
    }
  }, [interview?.notes]);

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebRTC Hook
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
    token,
    autoConnect: !!token && !!meetingRoomId,
  });

  // Save notes mutation
  const saveNotes = useMutation({
    mutationFn: () => interviewsService.updateNotes(interview!.id, { notes }),
    onSuccess: () => {
      toast({ title: 'Notes saved' });
    },
    onError: () => {
      toast({ title: 'Failed to save notes', variant: 'destructive' });
    },
  });

  // Submit scorecard feedback mutation
  const submitFeedback = useMutation({
    mutationFn: () =>
      feedbackService.submit(interview!.id, {
        scores,
        recommendation,
      }),
    onSuccess: () => {
      toast({ title: 'Scorecard submitted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to submit scorecard', variant: 'destructive' });
    },
  });

  const handleLeave = () => {
    disconnect();
    router.push('/interviews');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (room.isLoading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="p-8 rounded-2xl bg-[#18110C] border border-[#36271D] text-stone-300">
        Interview room not found or you do not have permission to join.
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px] pb-8">
      {/* Left Column: Video Feeds & Controls */}
      <main className="space-y-4">
        {/* Room Header */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-[#36271D] bg-[#18110C]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-sunset-cream">
                {interview.candidate.firstName} {interview.candidate.lastName}
              </h1>
              <Badge
                variant="outline"
                className="text-xs text-sunset-amber border-sunset-amber/40 bg-sunset-amber/10"
              >
                {interview.interviewType.name}
              </Badge>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Round {interview.roundNumber} • {interview.company.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#120B07] border border-[#36271D] text-xs">
              {status === 'connected' ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-mono">Connected</span>
                </>
              ) : status === 'connecting' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-sunset-amber animate-ping" />
                  <span className="text-sunset-amber font-mono">Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-stone-500" />
                  <span className="text-stone-400 font-mono">Waiting for candidate</span>
                </>
              )}
            </div>

            <div className="px-3 py-1 rounded-full bg-[#120B07] border border-[#36271D] text-xs font-mono text-stone-300">
              {formatTimer(elapsedSeconds)}
            </div>
          </div>
        </div>

        {permissionError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <span className="font-semibold">Notice:</span> {permissionError}
          </div>
        )}

        {/* Video Stage */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Remote (Candidate) Video */}
          <div className="relative aspect-video rounded-2xl bg-black border border-[#36271D] overflow-hidden shadow-xl flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {status !== 'connected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2 bg-[#120B07]/90">
                <div className="w-12 h-12 rounded-full bg-sunset-orange/10 border border-sunset-orange/20 text-sunset-orange flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-sunset-cream">
                  Waiting for candidate to join
                </p>
                <p className="text-[11px] text-stone-500 max-w-xs">
                  {interview.candidate.firstName} {interview.candidate.lastName} has not entered the room yet.
                </p>
              </div>
            )}

            {status === 'connected' && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs font-medium text-sunset-cream">
                {interview.candidate.firstName} {interview.candidate.lastName} (Candidate)
              </div>
            )}
          </div>

          {/* Local (Interviewer) Video */}
          <div className="relative aspect-video rounded-2xl bg-black border border-[#36271D] overflow-hidden shadow-xl flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''} ${!isCameraOn ? 'hidden' : ''}`}
            />

            {!isCameraOn && (
              <div className="text-center space-y-1 text-stone-500">
                <VideoOff className="h-6 w-6 mx-auto" />
                <p className="text-xs">Camera is off</p>
              </div>
            )}

            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs font-medium text-sunset-cream flex items-center gap-2">
              <span>You (Interviewer)</span>
              {!isMicOn && <MicOff className="h-3.5 w-3.5 text-rose-400" />}
            </div>
          </div>
        </div>

        {/* Video Control Bar */}
        <div className="flex justify-center items-center gap-3 p-3 rounded-xl border border-[#36271D] bg-[#18110C]">
          <Button
            variant="outline"
            onClick={toggleMic}
            className={`rounded-full w-10 h-10 p-0 ${
              isMicOn
                ? 'border-[#3D2D22] bg-[#20150F] text-sunset-cream'
                : 'border-rose-500/50 bg-rose-500/20 text-rose-400'
            }`}
            title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}
          >
            {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            onClick={toggleCamera}
            className={`rounded-full w-10 h-10 p-0 ${
              isCameraOn
                ? 'border-[#3D2D22] bg-[#20150F] text-sunset-cream'
                : 'border-rose-500/50 bg-rose-500/20 text-rose-400'
            }`}
            title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          <Button
            variant="outline"
            onClick={toggleScreenShare}
            className={`rounded-full w-10 h-10 p-0 ${
              isScreenSharing
                ? 'border-sunset-orange bg-sunset-orange/20 text-sunset-amber'
                : 'border-[#3D2D22] bg-[#20150F] text-sunset-cream'
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
        <section className="rounded-xl border border-[#36271D] bg-[#18110C] p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-sunset-cream flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-sunset-orange" />
              Live Notes
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveNotes.mutate()}
              disabled={saveNotes.isPending}
              className="h-7 text-xs border-[#36271D] text-stone-300 hover:text-sunset-cream bg-[#231711]"
            >
              {saveNotes.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type observations, candidate responses, technical feedback during the call..."
            className="min-h-[160px] w-full rounded-lg bg-[#120B07] border border-[#36271D] p-3 text-xs text-sunset-cream placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-sunset-orange font-mono leading-relaxed resize-none"
          />
        </section>

        {/* Evaluation Scorecard */}
        <section className="rounded-xl border border-[#36271D] bg-[#18110C] p-4 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-sunset-cream flex items-center gap-1.5">
              <Award className="h-4 w-4 text-sunset-orange" />
              Scorecard & Rating
            </h2>
          </div>

          {/* Question Scoring */}
          {interview.questions && interview.questions.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {interview.questions.map((q: InterviewQuestionDto, idx: number) => (
                <div
                  key={q.id}
                  className="p-2.5 rounded-lg bg-[#120B07] border border-[#36271D] space-y-2"
                >
                  <p className="text-xs text-sunset-cream font-medium">
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
                            ? 'text-sunset-amber'
                            : 'text-stone-700 hover:text-stone-500'
                        }`}
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </button>
                    ))}
                    {scores[q.id] && (
                      <span className="text-[11px] text-sunset-amber font-mono ml-2">
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
            <label className="text-xs font-medium text-stone-300">
              Recommendation
            </label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value as Recommendation)}
              className="w-full rounded-lg bg-[#120B07] border border-[#36271D] p-2 text-xs text-sunset-cream focus:outline-none focus:ring-1 focus:ring-sunset-orange"
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
            className="w-full text-xs gradient-sunset-btn font-semibold"
          >
            {submitFeedback.isPending ? 'Submitting…' : 'Submit Scorecard'}
          </Button>
        </section>
      </aside>
    </div>
  );
}
