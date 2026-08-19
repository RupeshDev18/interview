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

interface UseWebRtcRoomOptions {
  meetingRoomId: string;
  token?: string | null;
  candidateToken?: string | null;
  autoConnect?: boolean;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

export function useWebRtcRoom({
  meetingRoomId,
  token,
  candidateToken,
  autoConnect = true,
}: UseWebRtcRoomOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [remoteParticipant, setRemoteParticipant] = useState<{
    role?: string;
    name?: string;
    socketId?: string;
  } | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const isMakingOfferRef = useRef(false);

  // Candidate is polite (yields on collisions), Interviewer is impolite
  const isPolite = !token && !!candidateToken;

  // Flush queued ICE candidates after remote description is set
  const flushIceCandidates = useCallback(async (peer: RTCPeerConnection) => {
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      if (candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Could not add queued candidate:', err);
        }
      }
    }
  }, []);

  // Setup Peer Connection
  const createPeerConnection = useCallback(
    (socket: Socket) => {
      if (peerRef.current) {
        try {
          peerRef.current.close();
        } catch {}
      }

      const peer = new RTCPeerConnection(ICE_SERVERS);
      peerRef.current = peer;

      // Attach existing local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peer.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle remote media stream arrival
      peer.ontrack = (event) => {
        const [stream] = event.streams;
        if (remoteVideoRef.current && stream) {
          remoteVideoRef.current.srcObject = stream;
          setStatus('connected');
        }
      };

      // Handle ICE candidates generated locally
      peer.onicecandidate = (event) => {
        if (event.candidate && socket.connected) {
          socket.emit('webrtc-signal', {
            meetingRoomId,
            signal: {
              type: 'candidate',
              candidate: event.candidate.toJSON(),
            },
          });
        }
      };

      peer.onconnectionstatechange = () => {
        switch (peer.connectionState) {
          case 'connected':
            setStatus('connected');
            break;
          case 'disconnected':
            setStatus('disconnected');
            break;
          case 'failed':
            setStatus('failed');
            break;
          case 'closed':
            setStatus('idle');
            break;
        }
      };

      return peer;
    },
    [meetingRoomId],
  );

  // Safe media stream acquisition
  const acquireMediaStream = async (): Promise<MediaStream | null> => {
    setPermissionError(null);
    try {
      // 1. Try full video + audio
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

      // 2. Try audio-only if video failed
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
        setPermissionError('Camera is unavailable or permission was blocked. Audio is connected.');
        return audioOnlyStream;
      } catch (audioErr: any) {
        console.warn('Audio acquisition also failed:', audioErr?.name);
        setIsCameraOn(false);
        setIsMicOn(false);
        if (audioErr?.name === 'NotAllowedError' || err?.name === 'NotAllowedError') {
          setPermissionError(
            'Camera and microphone access were blocked. Please click the lock or camera icon in your browser address bar to allow permissions.',
          );
        } else {
          setPermissionError('No camera or microphone device was detected.');
        }
        return null;
      }
    }
  };

  // Connect to media & socket
  const connect = useCallback(async () => {
    if (!meetingRoomId || (!token && !candidateToken)) return;

    setStatus('connecting');

    try {
      // 1. Attempt to get media stream (gracefully handles permission blocks)
      const stream = await acquireMediaStream();
      localStreamRef.current = stream;
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }

      // 2. Connect Socket.IO with polling first for 100% reliable handshake
      const socket = io(BASE_URL, {
        auth: candidateToken ? { candidateToken } : { token },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        createPeerConnection(socket);

        socket.emit(
          'join-interview',
          { meetingRoomId },
          (response: { ok: boolean; role?: string; name?: string; error?: string }) => {
            if (!response.ok) {
              console.error('Failed to join room:', response.error);
              setStatus('failed');
            }
          },
        );
      });

      // When another participant joins, send an initial offer
      socket.on(
        'participant-joined',
        async (data: { socketId: string; role?: string; name?: string }) => {
          setRemoteParticipant(data);
          let peer = peerRef.current;
          if (!peer) {
            peer = createPeerConnection(socket);
          }

          try {
            isMakingOfferRef.current = true;
            const offer = await peer.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });

            if (peer.signalingState !== 'stable') {
              console.warn('Signaling state is not stable for offer:', peer.signalingState);
              return;
            }

            await peer.setLocalDescription(offer);

            socket.emit('webrtc-signal', {
              meetingRoomId,
              to: data.socketId,
              signal: {
                type: 'offer',
                sdp: offer,
              },
            });
          } catch (err) {
            console.error('Error creating WebRTC offer:', err);
          } finally {
            isMakingOfferRef.current = false;
          }
        },
      );

      // Handle WebRTC signaling signals (offer, answer, candidate)
      socket.on(
        'webrtc-signal',
        async ({ from, signal }: { from: string; signal: any }) => {
          let peer = peerRef.current;
          if (!peer) {
            peer = createPeerConnection(socket);
          }

          try {
            if (signal.type === 'offer') {
              const offerCollision =
                isMakingOfferRef.current || peer.signalingState !== 'stable';

              // If glare / collision occurs
              if (offerCollision) {
                if (!isPolite) {
                  // Impolite peer ignores incoming offer
                  return;
                }
                // Polite peer accepts incoming offer
              }

              await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              await flushIceCandidates(peer);

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
                await flushIceCandidates(peer);
              } else {
                console.warn(`Ignoring answer received in state: ${peer.signalingState}`);
              }
            } else if (signal.type === 'candidate' && signal.candidate) {
              if (peer.remoteDescription && peer.remoteDescription.type) {
                try {
                  await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
                } catch (err) {
                  console.warn('Error adding ICE candidate:', err);
                }
              } else {
                iceCandidatesQueue.current.push(signal.candidate);
              }
            }
          } catch (err) {
            console.error('Error handling WebRTC signal:', err);
          }
        },
      );

      socket.on('participant-left', () => {
        setRemoteParticipant(null);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        setStatus('disconnected');
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setStatus('failed');
      });
    } catch (err) {
      console.error('Failed to initialize connection:', err);
      setStatus('failed');
    }
  }, [meetingRoomId, token, candidateToken, isPolite, createPeerConnection, flushIceCandidates]);

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
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setStatus('idle');
    setRemoteParticipant(null);
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
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  }, [isMicOn]);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
    }
  }, [isCameraOn]);

  const toggleScreenShare = useCallback(async () => {
    if (!peerRef.current || !localStreamRef.current) return;

    if (isScreenSharing) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const senders = peerRef.current.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === 'video');
      if (videoSender && videoTrack) {
        await videoSender.replaceTrack(videoTrack);
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

        const senders = peerRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
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
    connect,
    disconnect,
  };
}
