'use client';

import React, { useEffect, useRef } from 'react';
import {
  User,
  VideoOff,
  MicOff,
  ShieldCheck,
  Award,
  Users,
  Eye,
  Sparkles,
} from 'lucide-react';
import type { RemoteParticipant } from '@/hooks/use-webrtc-room';

interface VideoGridProps {
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  localName: string;
  localRole: string;
  isLocalMicOn: boolean;
  isLocalCameraOn: boolean;
  isScreenSharing: boolean;
  participants: RemoteParticipant[];
  status: string;
  emptyWaitingMessage?: string;
}

function RemoteVideoTile({ participant }: { participant: RemoteParticipant }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  const roleBadge = getRoleBadge(participant.role);

  return (
    <div className="relative aspect-video rounded-2xl bg-black border border-theme overflow-hidden shadow-md flex items-center justify-center group">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${participant.isCameraOn === false ? 'hidden' : ''}`}
      />

      {participant.isCameraOn === false && (
        <div className="text-center space-y-2 text-stone-400">
          <div className="w-14 h-14 rounded-full bg-stone-800 text-stone-300 mx-auto flex items-center justify-center text-lg font-bold">
            {participant.name?.charAt(0) || 'P'}
          </div>
          <p className="text-xs text-stone-400">Camera is off</p>
        </div>
      )}

      {/* Top Role Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border backdrop-blur-md shadow-sm ${roleBadge.style}`}>
          {roleBadge.icon}
          {roleBadge.label}
        </span>
      </div>

      {/* Bottom Name & Mic status */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
        <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs font-medium text-white flex items-center gap-2 max-w-[80%] truncate">
          <span className="truncate">{participant.name}</span>
        </div>

        {participant.isMicOn === false && (
          <div className="p-1.5 rounded-lg bg-rose-500/80 text-white shadow-sm">
            <MicOff className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'LEAD_INTERVIEWER':
      return {
        label: 'Lead Interviewer',
        style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: <ShieldCheck className="h-3 w-3 mr-1 inline" />,
      };
    case 'CO_INTERVIEWER':
      return {
        label: 'Co-Interviewer',
        style: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
        icon: <Award className="h-3 w-3 mr-1 inline" />,
      };
    case 'HR_OBSERVER':
      return {
        label: 'HR Observer',
        style: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        icon: <Eye className="h-3 w-3 mr-1 inline" />,
      };
    case 'CANDIDATE':
      return {
        label: 'Candidate',
        style: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: <User className="h-3 w-3 mr-1 inline" />,
      };
    default:
      return {
        label: role.replace('_', ' '),
        style: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
        icon: <Users className="h-3 w-3 mr-1 inline" />,
      };
  }
}

export function VideoGrid({
  localVideoRef,
  localName,
  localRole,
  isLocalMicOn,
  isLocalCameraOn,
  isScreenSharing,
  participants,
  status,
  emptyWaitingMessage = 'Waiting for other participants to join...',
}: VideoGridProps) {
  const totalCount = 1 + participants.length;

  const localRoleBadge = getRoleBadge(localRole);

  const gridClass =
    totalCount === 1
      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
      : totalCount === 2
      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
      : totalCount <= 4
      ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3';

  return (
    <div className={gridClass}>
      {/* 1. Local Participant Tile */}
      <div className="relative aspect-video rounded-2xl bg-black border border-theme overflow-hidden shadow-md flex items-center justify-center group">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''} ${!isLocalCameraOn ? 'hidden' : ''}`}
        />

        {!isLocalCameraOn && (
          <div className="text-center space-y-1 text-stone-400">
            <div className="w-14 h-14 rounded-full bg-stone-800 text-stone-300 mx-auto flex items-center justify-center text-lg font-bold">
              {localName?.charAt(0) || 'Y'}
            </div>
            <p className="text-xs">Your camera is off</p>
          </div>
        )}

        {/* Top Role Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border backdrop-blur-md shadow-sm ${localRoleBadge.style}`}>
            {localRoleBadge.icon}
            {localRoleBadge.label} (You)
          </span>
        </div>

        {/* Bottom Local Name tag & status */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs font-medium text-white flex items-center gap-2">
            <span>{localName}</span>
          </div>

          {!isLocalMicOn && (
            <div className="p-1.5 rounded-lg bg-rose-500/80 text-white shadow-sm">
              <MicOff className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* 2. Remote Participant Tiles */}
      {participants.map((p) => (
        <RemoteVideoTile key={p.socketId} participant={p} />
      ))}

      {/* 3. Empty Placeholder Tile if alone */}
      {participants.length === 0 && (
        <div className="relative aspect-video rounded-2xl bg-surface border border-theme border-dashed flex flex-col items-center justify-center p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-theme-accent/15 border border-theme-accent/30 text-theme-accent flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-theme-primary">
            {emptyWaitingMessage}
          </p>
          <p className="text-[11px] text-theme-muted max-w-xs">
            Interviewers, candidates, and guests will automatically appear in this grid when connected.
          </p>
        </div>
      )}
    </div>
  );
}
