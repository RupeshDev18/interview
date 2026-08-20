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
  User,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Wifi,
  WifiOff,
  Eye,
  FileText,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { interviewsService } from '@/services/interviews.service';
import { useWebRtcRoom } from '@/hooks/use-webrtc-room';
import { VideoGrid } from '@/components/interview/VideoGrid';
import type { GuestJoinDetailsDto } from '@intvwplt/shared';

export default function GuestJoinPage() {
  const { token } = useParams<{ token: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState<GuestJoinDetailsDto | null>(null);
  const [guestName, setGuestName] = useState('HR Observer');
  const [hasJoinedLobby, setHasJoinedLobby] = useState(false);
  const [isCallEnded, setIsCallEnded] = useState(false);

  // Pre-join preview state
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [previewMic, setPreviewMic] = useState(true);
  const [previewCam, setPreviewCam] = useState(true);

  // Guest Observer private scratchpad
  const [observerNotes, setObserverNotes] = useState('');
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Call timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch interview details by guest token
  useEffect(() => {
    if (!token) return;

    async function loadGuestInterview() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await interviewsService.getGuestJoinDetails(token);
        setInterviewData(data);
        if (data.guestName) {
          setGuestName(data.guestName);
        }
      } catch (err: any) {
        console.error('Guest link validation failed:', err);
        setError(
          err?.response?.data?.error?.message ||
            'This guest invitation link is invalid or has expired. Please request a new invite.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadGuestInterview();
  }, [token]);

  // Pre-join webcam preview
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

  // Multi-Peer WebRTC room hook
  const {
    status,
    participants,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    permissionError,
    localVideoRef,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    disconnect,
  } = useWebRtcRoom({
    meetingRoomId: interviewData?.meetingRoomId || '',
    guestToken: token,
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

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(observerNotes);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
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
          <h1 className="text-xl font-bold text-theme-primary">Guest Invite Link Invalid</h1>
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
            <h1 className="text-xl font-bold text-theme-primary">Observer Session Concluded</h1>
            <p className="text-sm text-theme-muted">
              Thank you for attending the interview with{' '}
              <span className="text-theme-primary font-semibold">{interviewData.company.name}</span>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-subtle border border-theme text-xs text-theme-muted space-y-1">
            <p>Session Duration: {formatTimer(elapsedSeconds)}</p>
            <p>You may now close this browser window safely.</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Pre-Join Lobby
  if (!hasJoinedLobby) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col justify-between p-6 text-theme-primary">
        {/* Header */}
        <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2 border-b border-theme">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-black/10">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-theme-primary">
                {interviewData.company.name}
              </span>
              <span className="text-xs text-theme-muted ml-2 font-mono">
                HR & Guest Observer Portal
              </span>
            </div>
          </div>

          <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-600 dark:text-purple-300 bg-purple-500/10">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Observer Mode
          </Badge>
        </header>

        {/* Center Lobby */}
        <main className="max-w-4xl mx-auto w-full my-auto py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left: Camera Preview */}
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

              {/* Floating Controls */}
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
              Check your camera and microphone settings before joining the panel.
            </p>
          </div>

          {/* Right: Join Info Form */}
          <div className="md:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-theme space-y-5 shadow-sm">
              <div>
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-300 uppercase tracking-wider font-mono">
                  {interviewData.role.replace('_', ' ')} Invitation
                </span>
                <h2 className="text-xl font-bold text-theme-primary mt-1">
                  {interviewData.interviewType.name}
                </h2>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-primary">Your Display Name</label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Sarah Connor (HR)"
                  className="bg-surface border-theme text-theme-primary text-xs"
                />
              </div>

              <div className="space-y-3 text-xs text-theme-muted pt-1 border-t border-theme">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-theme-accent shrink-0" />
                  <span>Candidate: <strong className="text-theme-primary">{interviewData.candidate.firstName} {interviewData.candidate.lastName}</strong></span>
                </div>

                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-theme-accent shrink-0" />
                  <span>Lead Interviewer: <strong className="text-theme-primary">{interviewData.interviewerName}</strong></span>
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
                  Join Panel Interview
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-theme-muted py-3">
          Powered by InterviewOS • Panel & Observer Mode
        </footer>
      </div>
    );
  }

  // 5. In-Meeting Video Room (Observer / Guest View)
  return (
    <div className="min-h-screen bg-theme-bg flex flex-col text-theme-primary">
      {/* Top Bar */}
      <header className="px-6 py-3 bg-surface border-b border-theme flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
            <Eye className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-theme-primary leading-none">
              {interviewData.interviewType.name}
            </h1>
            <p className="text-[11px] text-theme-muted font-mono mt-1">
              Candidate: {interviewData.candidate.firstName} {interviewData.candidate.lastName} • Lead: {interviewData.interviewerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-600 dark:text-purple-300 bg-purple-500/10 font-mono">
            {interviewData.role.replace('_', ' ')}
          </Badge>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle border border-theme text-xs font-mono">
            {status === 'connected' ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Connected ({1 + participants.length} online)</span>
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

          <div className="px-3 py-1 rounded-full bg-surface-subtle border border-theme text-xs font-mono text-theme-primary font-bold">
            {formatTimer(elapsedSeconds)}
          </div>
        </div>
      </header>

      {/* Main Grid + Sidebar */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Multi-Peer Video Grid */}
        <div className="lg:col-span-2 space-y-4">
          {permissionError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>{permissionError}</span>
            </div>
          )}

          <VideoGrid
            localVideoRef={localVideoRef}
            localName={`${guestName}`}
            localRole={interviewData.role}
            isLocalMicOn={isMicOn}
            isLocalCameraOn={isCameraOn}
            isScreenSharing={isScreenSharing}
            participants={participants}
            status={status}
            emptyWaitingMessage="Waiting for interviewers and candidate..."
          />
        </div>

        {/* Right Sidebar: Observer Notes & Panel Roster */}
        <aside className="space-y-4">
          {/* Observer Scratchpad */}
          <section className="rounded-xl border border-theme bg-card p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-theme-primary flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-theme-accent" />
                Private Observer Notes
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyNotes}
                className="h-7 text-xs border-theme text-theme-primary hover:bg-surface-subtle bg-surface"
              >
                {copiedNotes ? <Check className="h-3.5 w-3.5 text-emerald-500 mr-1" /> : <Copy className="h-3.5 w-3.5 text-theme-accent mr-1" />}
                {copiedNotes ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <textarea
              value={observerNotes}
              onChange={(e) => setObserverNotes(e.target.value)}
              placeholder="Record your observations, cultural fit impressions, and HR remarks here..."
              className="min-h-[220px] w-full rounded-lg bg-surface border border-theme p-3 text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-1 focus:ring-theme-accent font-mono leading-relaxed resize-none"
            />
            <p className="text-[11px] text-theme-muted">
              Notes taken here remain private and are not visible to the candidate.
            </p>
          </section>

          {/* Active Participants List */}
          <section className="rounded-xl border border-theme bg-card p-4 space-y-3 shadow-sm">
            <h2 className="font-semibold text-xs text-theme-primary uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-theme-accent" />
              Room Roster ({1 + participants.length})
            </h2>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface border border-theme">
                <span className="font-medium text-theme-primary">{guestName} (You)</span>
                <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-600 dark:text-purple-300 font-mono">
                  {interviewData.role.replace('_', ' ')}
                </Badge>
              </div>

              {participants.map((p) => (
                <div key={p.socketId} className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle border border-theme">
                  <span className="font-medium text-theme-primary">{p.name}</span>
                  <Badge variant="outline" className="text-[10px] border-theme font-mono">
                    {p.role.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        </aside>
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
