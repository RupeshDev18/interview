'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Calendar,
  Clock,
  Building2,
  User,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { interviewsService } from '@/services/interviews.service';
import { useWebRtcRoom } from '@/hooks/use-webrtc-room';
import type { CandidateJoinDetailsDto } from '@intvwplt/shared';

export default function CandidateJoinPage() {
  const { token } = useParams<{ token: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<CandidateJoinDetailsDto | null>(null);
  const [hasJoinedLobby, setHasJoinedLobby] = useState(false);
  const [isCallEnded, setIsCallEnded] = useState(false);

  // Pre-join preview state
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewMic, setPreviewMic] = useState(true);
  const [previewCam, setPreviewCam] = useState(true);

  // Call timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch interview details by candidate token
  useEffect(() => {
    if (!token) return;

    async function loadCandidateInterview() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await interviewsService.getCandidateJoinDetails(token);
        setInterviewData(data);
      } catch (err: any) {
        console.error('Candidate link validation failed:', err);
        setError(
          err?.response?.data?.error?.message ||
            'This interview link is invalid or has expired. Please contact your recruiter.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadCandidateInterview();
  }, [token]);

  // Handle pre-join webcam preview
  useEffect(() => {
    if (!interviewData || hasJoinedLobby) return;

    let stream: MediaStream | null = null;
    async function startPreview() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true,
        });
        setPreviewStream(stream);
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Camera/Mic permission not granted in lobby:', err);
      }
    }

    startPreview();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [interviewData, hasJoinedLobby]);

  // Toggle preview mic/cam
  const togglePreviewMic = () => {
    if (previewStream) {
      previewStream.getAudioTracks().forEach((t) => {
        t.enabled = !previewMic;
      });
      setPreviewMic(!previewMic);
    }
  };

  const togglePreviewCam = () => {
    if (previewStream) {
      previewStream.getVideoTracks().forEach((t) => {
        t.enabled = !previewCam;
      });
      setPreviewCam(!previewCam);
    }
  };

  // WebRTC room hook for actual call
  const {
    status,
    remoteParticipant,
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
    meetingRoomId: interviewData?.meetingRoomId || '',
    candidateToken: token,
    autoConnect: hasJoinedLobby,
  });

  // Call timer interval
  useEffect(() => {
    if (!hasJoinedLobby || isCallEnded) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [hasJoinedLobby, isCallEnded]);

  const handleJoinCall = () => {
    // Stop preview stream before starting full WebRTC stream
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
      setPreviewStream(null);
    }
    setHasJoinedLobby(true);
  };

  const handleEndCall = () => {
    disconnect();
    setIsCallEnded(true);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6 text-theme-primary">
        <div className="w-full max-w-md space-y-4 p-8 rounded-2xl bg-card border border-theme shadow-sm">
          <Skeleton className="h-8 w-48 mx-auto bg-surface-subtle" />
          <Skeleton className="h-4 w-64 mx-auto bg-surface-subtle" />
          <Skeleton className="h-64 w-full rounded-xl bg-surface-subtle" />
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error || !interviewData) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6 text-theme-primary">
        <div className="w-full max-w-md text-center p-8 rounded-2xl bg-card border border-theme space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mx-auto flex items-center justify-center">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-theme-primary">Interview Link Invalid</h1>
          <p className="text-sm text-theme-muted leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // 3. Call Ended Screen
  if (isCallEnded) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6 text-theme-primary">
        <div className="w-full max-w-md text-center p-8 rounded-2xl bg-card border border-theme space-y-5 shadow-sm animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-theme-accent/15 border border-theme-accent/30 text-theme-accent mx-auto flex items-center justify-center shadow-sm">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-theme-primary">Interview Finished</h1>
            <p className="text-sm text-theme-muted">
              Thank you for attending your interview with{' '}
              <span className="text-theme-primary font-semibold">{interviewData.company.name}</span>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-subtle border border-theme text-xs text-theme-muted space-y-1">
            <p>Duration: {formatTimer(elapsedSeconds)}</p>
            <p>You may now close this browser window safely.</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Pre-Join Screen (Lobby)
  if (!hasJoinedLobby) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col justify-between p-6 text-theme-primary">
        {/* Header */}
        <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center text-white font-bold text-sm shadow-md shadow-black/10">
              {interviewData.company.name.charAt(0)}
            </div>
            <div>
              <span className="text-sm font-bold text-theme-primary">
                {interviewData.company.name}
              </span>
              <span className="text-xs text-theme-muted ml-2 font-mono">
                Candidate Interview Portal
              </span>
            </div>
          </div>

          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Secure Session
          </Badge>
        </header>

        {/* Center Lobby Content */}
        <main className="max-w-4xl mx-auto w-full my-auto py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Preview Box */}
          <div className="md:col-span-7 space-y-4">
            <div className="relative aspect-video rounded-2xl bg-black border border-theme overflow-hidden shadow-md flex items-center justify-center">
              <video
                ref={previewVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover scale-x-[-1] ${!previewCam ? 'hidden' : ''}`}
              />

              {!previewCam && (
                <div className="text-center space-y-2 text-stone-400">
                  <div className="w-16 h-16 rounded-full bg-stone-800 text-stone-400 mx-auto flex items-center justify-center">
                    <VideoOff className="h-8 w-8" />
                  </div>
                  <p className="text-xs">Camera is turned off</p>
                </div>
              )}

              {/* In-preview Floating Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                <button
                  type="button"
                  onClick={togglePreviewMic}
                  className={`p-2.5 rounded-full transition-all ${
                    previewMic
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-rose-500/80 text-white'
                  }`}
                  title={previewMic ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {previewMic ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={togglePreviewCam}
                  className={`p-2.5 rounded-full transition-all ${
                    previewCam
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-rose-500/80 text-white'
                  }`}
                  title={previewCam ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {previewCam ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-theme-muted">
              Check your lighting, camera position, and microphone before entering.
            </p>
          </div>

          {/* Right Details & Join Card */}
          <div className="md:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-theme space-y-5 shadow-sm">
              <div>
                <span className="text-[11px] font-semibold text-theme-accent uppercase tracking-wider font-mono">
                  Welcome, {interviewData.candidate.firstName}!
                </span>
                <h2 className="text-xl font-bold text-theme-primary mt-1">
                  {interviewData.interviewType.name}
                </h2>
              </div>

              <div className="space-y-3 text-xs text-theme-muted">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-theme-accent shrink-0" />
                  <span>Interviewer: <strong className="text-theme-primary">{interviewData.interviewerName}</strong></span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-theme-accent shrink-0" />
                  <span>Duration: <strong className="text-theme-primary">{interviewData.interviewType.durationMinutes} minutes</strong></span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-theme-accent shrink-0" />
                  <span>
                    {format(new Date(interviewData.scheduledStart), 'MMM d, yyyy • h:mm a')} ({interviewData.timezone})
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleJoinCall}
                  className="w-full h-11 text-sm gradient-theme-btn font-bold rounded-xl shadow-md"
                >
                  Join Interview Room
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-theme-muted py-3">
          Powered by InterviewOS • No downloads or account required
        </footer>
      </div>
    );
  }

  // 5. In-Meeting Video Room
  return (
    <div className="min-h-screen bg-theme-bg flex flex-col text-theme-primary">
      {/* Meeting Top Bar */}
      <header className="px-6 py-3 bg-surface border-b border-theme flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-theme-accent flex items-center justify-center text-white font-bold text-xs shadow-md">
            {interviewData.company.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-sm font-bold text-theme-primary leading-none">
              {interviewData.interviewType.name}
            </h1>
            <p className="text-[11px] text-theme-muted font-mono mt-1">
              {interviewData.company.name} • {interviewData.interviewerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle border border-theme text-xs">
            {status === 'connected' ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Live</span>
              </>
            ) : status === 'connecting' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-600 dark:text-amber-400 font-mono">Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-theme-muted" />
                <span className="text-theme-muted font-mono">Waiting for interviewer</span>
              </>
            )}
          </div>

          {/* Call Elapsed Timer */}
          <div className="px-3 py-1 rounded-full bg-surface-subtle border border-theme text-xs font-mono text-theme-primary font-bold">
            {formatTimer(elapsedSeconds)}
          </div>
        </div>
      </header>

      {/* Main Video Stage */}
      <main className="flex-1 p-6 flex flex-col items-center justify-center space-y-4">
        {permissionError && (
          <div className="w-full max-w-4xl p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>{permissionError}</span>
          </div>
        )}
        <div className="w-full max-w-6xl flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Remote Video (Interviewer) */}
          <div className="relative w-full aspect-video rounded-2xl bg-black border border-theme overflow-hidden shadow-md flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {status !== 'connected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-black/80">
                <div className="w-16 h-16 rounded-full bg-theme-accent/20 border border-theme-accent/30 text-white flex items-center justify-center">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Waiting for Interviewer
                  </h3>
                  <p className="text-xs text-stone-300 mt-1 max-w-xs">
                    {interviewData.interviewerName} will join the video room shortly.
                  </p>
                </div>
              </div>
            )}

            {status === 'connected' && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-xs font-medium text-white">
                {interviewData.interviewerName} (Interviewer)
              </div>
            )}
          </div>

          {/* Local Video (Candidate) */}
          <div className="relative w-full aspect-video rounded-2xl bg-black border border-theme overflow-hidden shadow-md flex items-center justify-center">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''} ${!isCameraOn ? 'hidden' : ''}`}
            />

            {!isCameraOn && (
              <div className="text-center space-y-2 text-stone-400">
                <div className="w-14 h-14 rounded-full bg-stone-800 text-stone-400 mx-auto flex items-center justify-center">
                  <VideoOff className="h-7 w-7" />
                </div>
                <p className="text-xs">Your camera is off</p>
              </div>
            )}

            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-xs font-medium text-white flex items-center gap-2">
              <span>{interviewData.candidate.firstName} (You)</span>
              {!isMicOn && <MicOff className="h-3.5 w-3.5 text-rose-400" />}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Bottom Control Bar */}
      <footer className="py-4 px-6 bg-surface border-t border-theme flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={toggleMic}
          className={`rounded-full w-12 h-12 p-0 border transition-all ${
            isMicOn
              ? 'border-theme bg-surface text-theme-primary hover:bg-surface-subtle'
              : 'border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
          }`}
          title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={toggleCamera}
          className={`rounded-full w-12 h-12 p-0 border transition-all ${
            isCameraOn
              ? 'border-theme bg-surface text-theme-primary hover:bg-surface-subtle'
              : 'border-rose-500/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
          }`}
          title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={toggleScreenShare}
          className={`rounded-full w-12 h-12 p-0 border transition-all ${
            isScreenSharing
              ? 'border-theme bg-theme-accent text-white'
              : 'border-theme bg-surface text-theme-primary hover:bg-surface-subtle'
          }`}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
        >
          <ScreenShare className="h-5 w-5" />
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={handleEndCall}
          className="rounded-full px-6 h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 shadow-md shadow-rose-600/30"
        >
          <PhoneOff className="h-5 w-5" />
          <span>Leave</span>
        </Button>
      </footer>
    </div>
  );
}
