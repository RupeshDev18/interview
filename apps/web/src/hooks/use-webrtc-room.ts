'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface RemoteParticipant {
  socketId: string;
  name: string;
  role: string;
  stream: MediaStream | null;
  isMicOn?: boolean;
  isCameraOn?: boolean;
}

interface UseWebRtcRoomOptions {
  meetingRoomId: string;
  token?: string | null;
  candidateToken?: string | null;
  guestToken?: string | null;
  autoConnect?: boolean;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

export function useWebRtcRoom({
  meetingRoomId,
  token,
  candidateToken,
  guestToken,
  autoConnect = true,
}: UseWebRtcRoomOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [myParticipantInfo, setMyParticipantInfo] = useState<{
    socketId?: string;
    name?: string;
    role?: string;
  } | null>(null);

  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const iceQueuesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const isMakingOfferMapRef = useRef<Map<string, boolean>>(new Map());

  // Flush queued ICE candidates for a specific peer
  const flushIceQueue = useCallback(async (remoteSocketId: string, peer: RTCPeerConnection) => {
    const queue = iceQueuesRef.current.get(remoteSocketId) || [];
    while (queue.length > 0) {
      const candidate = queue.shift();
      if (candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn(`Could not add queued candidate for ${remoteSocketId}:`, err);
        }
      }
    }
  }, []);

  // Create & configure a PeerConnection for a specific remote participant
  const createPeerForRemote = useCallback(
    (remoteSocketId: string, socket: Socket): RTCPeerConnection => {
      // Close existing peer if any
      const existing = peersRef.current.get(remoteSocketId);
      if (existing) {
        try {
          existing.close();
        } catch {}
      }

      const peer = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current.set(remoteSocketId, peer);

      // Attach current local tracks (or screen track if sharing)
      const streamToAttach = screenStreamRef.current || localStreamRef.current;
      if (streamToAttach) {
        streamToAttach.getTracks().forEach((track) => {
          peer.addTrack(track, streamToAttach);
        });
      }

      // Handle receiving remote tracks
      peer.ontrack = (event) => {
        const [incomingStream] = event.streams;
        if (incomingStream) {
          setParticipants((prev) =>
            prev.map((p) =>
              p.socketId === remoteSocketId ? { ...p, stream: incomingStream } : p,
            ),
          );
        }
      };

      // Handle ICE candidate generation
      peer.onicecandidate = (event) => {
        if (event.candidate && socket.connected) {
          socket.emit('webrtc-signal', {
            meetingRoomId,
            to: remoteSocketId,
            signal: {
              type: 'candidate',
              candidate: event.candidate.toJSON(),
            },
          });
        }
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') {
          setStatus('connected');
        } else if (
          peer.connectionState === 'failed' ||
          peer.connectionState === 'closed' ||
          peer.connectionState === 'disconnected'
        ) {
          // Check if any other peer is connected
          const hasAnyConnected = Array.from(peersRef.current.values()).some(
            (p) => p.connectionState === 'connected',
          );
          if (!hasAnyConnected) {
            setStatus(peer.connectionState === 'failed' ? 'failed' : 'disconnected');
          }
        }
      };

      return peer;
    },
    [meetingRoomId],
  );

  // Initiate an offer to a specific remote participant
  const sendOfferToRemote = useCallback(
    async (remoteSocketId: string, socket: Socket) => {
      let peer = peersRef.current.get(remoteSocketId);
      if (!peer) {
        peer = createPeerForRemote(remoteSocketId, socket);
      }

      try {
        isMakingOfferMapRef.current.set(remoteSocketId, true);
        const offer = await peer.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });

        if (peer.signalingState !== 'stable') {
          console.warn('Signaling state not stable for offer:', peer.signalingState);
          return;
        }

        await peer.setLocalDescription(offer);

        socket.emit('webrtc-signal', {
          meetingRoomId,
          to: remoteSocketId,
          signal: {
            type: 'offer',
            sdp: offer,
          },
        });
      } catch (err) {
        console.error(`Error creating offer for ${remoteSocketId}:`, err);
      } finally {
        isMakingOfferMapRef.current.set(remoteSocketId, false);
      }
    },
    [meetingRoomId, createPeerForRemote],
  );

  // Safe media stream acquisition
  const acquireMediaStream = async (): Promise<MediaStream | null> => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setIsCameraOn(true);
      setIsMicOn(true);
      return stream;
    } catch (err: any) {
      console.warn('Full media acquisition failed, trying audio-only fallback:', err?.name);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        setIsCameraOn(false);
        setIsMicOn(true);
        setPermissionError('Camera is unavailable or permission blocked. Connected with audio only.');
        return audioOnlyStream;
      } catch (audioErr: any) {
        console.warn('Audio acquisition also failed:', audioErr?.name);
        setIsCameraOn(false);
        setIsMicOn(false);
        if (audioErr?.name === 'NotAllowedError' || err?.name === 'NotAllowedError') {
          setPermissionError(
            'Camera/Microphone access was blocked. Please enable browser permissions.',
          );
        } else {
          setPermissionError('No audio or video input device detected.');
        }
        return null;
      }
    }
  };

  // Connect to media & Socket.IO
  const connect = useCallback(async () => {
    if (!meetingRoomId || (!token && !candidateToken && !guestToken)) return;

    setStatus('connecting');

    try {
      // 1. Acquire local webcam & mic
      const stream = await acquireMediaStream();
      localStreamRef.current = stream;
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Connect Socket.IO
      const authPayload: Record<string, any> = {};
      if (candidateToken) authPayload.candidateToken = candidateToken;
      else if (guestToken) authPayload.guestToken = guestToken;
      else if (token) authPayload.token = token;

      const socket = io(BASE_URL, {
        auth: authPayload,
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit(
          'join-interview',
          { meetingRoomId },
          async (response: {
            ok: boolean;
            participant?: { socketId: string; role: string; name: string };
            existingParticipants?: Array<{ socketId: string; role: string; name: string }>;
            error?: string;
          }) => {
            if (!response.ok) {
              console.error('Failed to join room:', response.error);
              setStatus('failed');
              return;
            }

            if (response.participant) {
              setMyParticipantInfo(response.participant);
            }

            // If other participants already in room, initialize peer connection and send offer
            if (response.existingParticipants && response.existingParticipants.length > 0) {
              setParticipants(
                response.existingParticipants.map((p) => ({
                  socketId: p.socketId,
                  name: p.name,
                  role: p.role,
                  stream: null,
                  isMicOn: true,
                  isCameraOn: true,
                })),
              );

              for (const existingPeer of response.existingParticipants) {
                await sendOfferToRemote(existingPeer.socketId, socket);
              }
            }
          },
        );
      });

      // When a new participant joins
      socket.on(
        'participant-joined',
        (data: { socketId: string; role?: string; name?: string }) => {
          setParticipants((prev) => {
            if (prev.some((p) => p.socketId === data.socketId)) return prev;
            return [
              ...prev,
              {
                socketId: data.socketId,
                name: data.name || 'Participant',
                role: data.role || 'GUEST',
                stream: null,
                isMicOn: true,
                isCameraOn: true,
              },
            ];
          });
        },
      );

      // Handle WebRTC signaling per remote peer
      socket.on(
        'webrtc-signal',
        async ({ from, signal }: { from: string; signal: any }) => {
          let peer = peersRef.current.get(from);
          if (!peer) {
            peer = createPeerForRemote(from, socket);
          }

          // Deterministic polite rule: socket with smaller ID yields during glare
          const isPolite = socket.id ? socket.id < from : false;

          try {
            if (signal.type === 'offer') {
              const isMakingOffer = isMakingOfferMapRef.current.get(from) || false;
              const offerCollision = isMakingOffer || peer.signalingState !== 'stable';

              if (offerCollision) {
                if (!isPolite) {
                  return; // Impolite peer ignores colliding incoming offer
                }
              }

              await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              await flushIceQueue(from, peer);

              if (peer.signalingState === 'have-remote-offer') {
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);

                socket.emit('webrtc-signal', {
                  meetingRoomId,
                  to: from,
                  signal: {
                    type: 'answer',
                    sdp: answer,
                  },
                });
              }
            } else if (signal.type === 'answer') {
              if (peer.signalingState === 'have-local-offer') {
                await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                await flushIceQueue(from, peer);
              }
            } else if (signal.type === 'candidate' && signal.candidate) {
              if (peer.remoteDescription && peer.remoteDescription.type) {
                try {
                  await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
                } catch (err) {
                  console.warn(`Error adding ICE candidate from ${from}:`, err);
                }
              } else {
                const queue = iceQueuesRef.current.get(from) || [];
                queue.push(signal.candidate);
                iceQueuesRef.current.set(from, queue);
              }
            }
          } catch (err) {
            console.error(`Error handling signal from ${from}:`, err);
          }
        },
      );

      // Handle media status sync (e.g. participant muted/unmuted)
      socket.on(
        'participant-media-status',
        ({
          socketId,
          isMicOn: remoteMic,
          isCameraOn: remoteCam,
        }: {
          socketId: string;
          isMicOn: boolean;
          isCameraOn: boolean;
        }) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.socketId === socketId
                ? { ...p, isMicOn: remoteMic, isCameraOn: remoteCam }
                : p,
            ),
          );
        },
      );

      // When a participant leaves
      socket.on('participant-left', ({ socketId }: { socketId: string }) => {
        const peer = peersRef.current.get(socketId);
        if (peer) {
          try {
            peer.close();
          } catch {}
          peersRef.current.delete(socketId);
        }
        iceQueuesRef.current.delete(socketId);
        isMakingOfferMapRef.current.delete(socketId);

        setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setStatus('failed');
      });
    } catch (err) {
      console.error('Failed to initialize WebRTC connection:', err);
      setStatus('failed');
    }
  }, [
    meetingRoomId,
    token,
    candidateToken,
    guestToken,
    createPeerForRemote,
    sendOfferToRemote,
    flushIceQueue,
  ]);

  // Clean up
  const disconnect = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    peersRef.current.forEach((peer) => {
      try {
        peer.close();
      } catch {}
    });
    peersRef.current.clear();
    iceQueuesRef.current.clear();
    isMakingOfferMapRef.current.clear();

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setParticipants([]);
    setStatus('idle');
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Controls
  const toggleMic = useCallback(() => {
    if (localStreamRef.current) {
      const nextMicState = !isMicOn;
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextMicState;
      });
      setIsMicOn(nextMicState);

      if (socketRef.current?.connected) {
        socketRef.current.emit('participant-media-status', {
          meetingRoomId,
          isMicOn: nextMicState,
          isCameraOn,
        });
      }
    }
  }, [isMicOn, isCameraOn, meetingRoomId]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const nextCamState = !isCameraOn;
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextCamState;
      });
      setIsCameraOn(nextCamState);

      if (socketRef.current?.connected) {
        socketRef.current.emit('participant-media-status', {
          meetingRoomId,
          isMicOn,
          isCameraOn: nextCamState,
        });
      }
    }
  }, [isCameraOn, isMicOn, meetingRoomId]);

  const toggleScreenShare = useCallback(async () => {
    if (!localStreamRef.current) return;

    if (isScreenSharing) {
      const originalVideoTrack = localStreamRef.current.getVideoTracks()[0];
      for (const peer of peersRef.current.values()) {
        const videoSender = peer.getSenders().find((s) => s.track?.kind === 'video');
        if (videoSender && originalVideoTrack) {
          await videoSender.replaceTrack(originalVideoTrack);
        }
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        for (const peer of peersRef.current.values()) {
          const videoSender = peer.getSenders().find((s) => s.track?.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    }
  }, [isScreenSharing]);

  return {
    status,
    myParticipantInfo,
    participants,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    permissionError,
    localVideoRef,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    connect,
    disconnect,
  };
}
