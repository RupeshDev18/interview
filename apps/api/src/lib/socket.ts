import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { authService } from '../modules/auth/auth.service';
import { candidateLinkService } from '../modules/interviews/candidate-link.service';
import { guestLinkService } from '../modules/interviews/guest-link.service';
import { prisma } from './prisma';
import { env } from '../config/env';
import { logger } from './logger';
import { ParticipantRole } from '@intvwplt/shared';

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(',').map((x) => x.trim()),
      credentials: true,
    },
    pingTimeout: 10000,
    pingInterval: 5000,
  });

  io.use(async (socket, next) => {
    try {
      const candidateToken =
        (socket.handshake.auth.candidateToken as string | undefined) ||
        (socket.handshake.query.candidateToken as string | undefined);
      const guestToken =
        (socket.handshake.auth.guestToken as string | undefined) ||
        (socket.handshake.query.guestToken as string | undefined);
      const userToken =
        (socket.handshake.auth.token as string | undefined) ||
        (socket.handshake.query.token as string | undefined);

      // 1. Candidate Join Token
      if (candidateToken) {
        try {
          const candidateDetails = await candidateLinkService.verifyToken(candidateToken);
          socket.data.participant = {
            socketId: socket.id,
            role: ParticipantRole.CANDIDATE,
            name: `${candidateDetails.candidate.firstName} ${candidateDetails.candidate.lastName}`,
            meetingRoomId: candidateDetails.meetingRoomId,
            interviewId: candidateDetails.interviewId,
            identifier: `candidate:${candidateDetails.candidate.id}`,
          };
          return next();
        } catch {
          // Fall through
        }
      }

      // 2. Guest / HR Observer Token
      if (guestToken) {
        try {
          const guestDetails = await guestLinkService.verifyToken(guestToken);
          socket.data.participant = {
            socketId: socket.id,
            role: guestDetails.role || ParticipantRole.HR_OBSERVER,
            name: guestDetails.guestName || (guestDetails.role === ParticipantRole.HR_OBSERVER ? 'HR Observer' : 'Guest'),
            meetingRoomId: guestDetails.meetingRoomId,
            interviewId: guestDetails.interviewId,
            identifier: `guest:${guestToken}`,
          };
          return next();
        } catch {
          // Fall through
        }
      }

      // 3. Authenticated User Token (JWT)
      if (userToken) {
        try {
          const payload = authService.verifyAccessToken(userToken);
          socket.data.user = payload;
          return next();
        } catch {
          // Token might be candidate or guest token passed in 'token' parameter
          try {
            const candidateDetails = await candidateLinkService.verifyToken(userToken);
            socket.data.participant = {
              socketId: socket.id,
              role: ParticipantRole.CANDIDATE,
              name: `${candidateDetails.candidate.firstName} ${candidateDetails.candidate.lastName}`,
              meetingRoomId: candidateDetails.meetingRoomId,
              interviewId: candidateDetails.interviewId,
              identifier: `candidate:${candidateDetails.candidate.id}`,
            };
            return next();
          } catch {
            try {
              const guestDetails = await guestLinkService.verifyToken(userToken);
              socket.data.participant = {
                socketId: socket.id,
                role: guestDetails.role || ParticipantRole.HR_OBSERVER,
                name: guestDetails.guestName || 'Guest',
                meetingRoomId: guestDetails.meetingRoomId,
                interviewId: guestDetails.interviewId,
                identifier: `guest:${userToken}`,
              };
              return next();
            } catch {
              return next(new Error('Unauthorized'));
            }
          }
        }
      }

      return next(new Error('Unauthorized: No valid credentials provided'));
    } catch (err) {
      logger.warn('Socket authentication failed', { error: err });
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on(
      'join-interview',
      async (
        { meetingRoomId }: { meetingRoomId: string },
        done?: (result: {
          ok: boolean;
          participant?: any;
          existingParticipants?: any[];
          error?: string;
        }) => void,
      ) => {
        try {
          let participant: any = null;
          let roomName = '';

          // Case A: Pre-verified Candidate or Guest
          if (socket.data.participant) {
            const p = socket.data.participant;
            const isMatch =
              p.meetingRoomId === meetingRoomId || p.interviewId === meetingRoomId;

            if (!isMatch) {
              return done?.({ ok: false, error: 'Unauthorized for this room' });
            }

            participant = p;
            roomName = `interview:${p.meetingRoomId}`;
          }

          // Case B: Authenticated User (Lead Interviewer, Co-Interviewer, Recruiter, Admin)
          else if (socket.data.user) {
            const interview = await prisma.interview.findFirst({
              where: {
                OR: [{ meetingRoomId }, { id: meetingRoomId }],
              },
              include: {
                interviewer: {
                  include: { user: true },
                },
              },
            });

            if (!interview) {
              return done?.({ ok: false, error: 'Interview room not found' });
            }

            const user = socket.data.user as {
              sub: string;
              role: string;
              companyId?: string;
              email?: string;
            };

            const isAssignedLead =
              interview.interviewer?.userId === user.sub ||
              interview.interviewerId === user.sub;
            const isCreator = interview.createdById === user.sub;
            const isCompanyMember = !!user.companyId && user.companyId === interview.companyId;
            const isAdmin = user.role === 'ADMIN';

            const allowed =
              isAdmin ||
              isAssignedLead ||
              isCreator ||
              isCompanyMember ||
              user.role === 'COMPANY_ADMIN' ||
              user.role === 'RECRUITER' ||
              user.role === 'INTERVIEWER';

            if (!allowed) {
              return done?.({ ok: false, error: 'Not authorized for this room' });
            }

            // Determine specific role in this interview
            let role: ParticipantRole = ParticipantRole.CO_INTERVIEWER;
            if (isAssignedLead || isAdmin) {
              role = ParticipantRole.LEAD_INTERVIEWER;
            } else if (user.role === 'RECRUITER') {
              role = ParticipantRole.HR_OBSERVER;
            }

            const dbUser = await prisma.user.findUnique({
              where: { id: user.sub },
              select: { firstName: true, lastName: true },
            });

            participant = {
              socketId: socket.id,
              role,
              name: dbUser ? `${dbUser.firstName} ${dbUser.lastName}` : 'Interviewer',
              meetingRoomId: interview.meetingRoomId,
              interviewId: interview.id,
              identifier: `user:${user.sub}`,
            };

            socket.data.participant = participant;
            roomName = `interview:${interview.meetingRoomId}`;
          } else {
            return done?.({ ok: false, error: 'Unauthorized: No session found' });
          }

          // ─── EVICT OLD/STALE GHOST CONNECTIONS FOR SAME IDENTITY ───────────
          const socketsInRoom = await io.in(roomName).fetchSockets();
          for (const s of socketsInRoom) {
            if (s.id !== socket.id && s.data.participant) {
              const sameUser =
                s.data.participant.identifier &&
                participant.identifier &&
                s.data.participant.identifier === participant.identifier;

              if (sameUser) {
                s.leave(roomName);
                s.disconnect(true);
                socket.to(roomName).emit('participant-left', { socketId: s.id });
              }
            }
          }

          // Fetch deduplicated existing peers in the room
          const remainingSockets = await io.in(roomName).fetchSockets();
          const existingParticipants = remainingSockets
            .filter((s) => s.id !== socket.id && s.data.participant)
            .map((s) => s.data.participant);

          socket.join(roomName);
          socket.to(roomName).emit('participant-joined', participant);

          return done?.({
            ok: true,
            participant,
            existingParticipants,
          });
        } catch (err) {
          logger.error('Error joining interview room socket', { error: err });
          return done?.({ ok: false, error: 'Internal server error' });
        }
      },
    );

    // Multi-Peer WebRTC Signaling Relay
    socket.on(
      'webrtc-signal',
      ({
        meetingRoomId,
        signal,
        to,
      }: {
        meetingRoomId: string;
        signal: any;
        to?: string;
      }) => {
        const roomName = `interview:${meetingRoomId}`;
        if (to) {
          io.to(to).emit('webrtc-signal', { from: socket.id, signal });
        } else {
          socket.to(roomName).emit('webrtc-signal', { from: socket.id, signal });
        }
      },
    );

    // Sync media status (mic muted, camera off) across all participants
    socket.on(
      'participant-media-status',
      ({
        meetingRoomId,
        isMicOn,
        isCameraOn,
      }: {
        meetingRoomId: string;
        isMicOn: boolean;
        isCameraOn: boolean;
      }) => {
        const roomName = `interview:${meetingRoomId}`;
        socket.to(roomName).emit('participant-media-status', {
          socketId: socket.id,
          isMicOn,
          isCameraOn,
        });
      },
    );

    // ─── Real-Time Collaborative Code Editor Sync ──────────────────────────────
    socket.on(
      'code-change',
      ({
        meetingRoomId,
        code,
        language,
        senderName,
      }: {
        meetingRoomId: string;
        code: string;
        language: string;
        senderName?: string;
      }) => {
        const roomName = `interview:${meetingRoomId}`;
        socket.to(roomName).emit('code-change', {
          from: socket.id,
          code,
          language,
          senderName,
        });
      },
    );

    socket.on(
      'code-run-output',
      ({
        meetingRoomId,
        output,
        executionTime,
        status,
        runnerName,
      }: {
        meetingRoomId: string;
        output: string;
        executionTime: number;
        status: 'success' | 'error';
        runnerName?: string;
      }) => {
        const roomName = `interview:${meetingRoomId}`;
        socket.to(roomName).emit('code-run-output', {
          from: socket.id,
          output,
          executionTime,
          status,
          runnerName,
        });
      },
    );

    socket.on(
      'request-code-sync',
      ({ meetingRoomId }: { meetingRoomId: string }) => {
        const roomName = `interview:${meetingRoomId}`;
        socket.to(roomName).emit('request-code-sync', { requesterId: socket.id });
      },
    );

    socket.on(
      'code-sync-state',
      ({
        meetingRoomId,
        code,
        language,
        to,
      }: {
        meetingRoomId: string;
        code: string;
        language: string;
        to: string;
      }) => {
        io.to(to).emit('code-change', {
          from: socket.id,
          code,
          language,
          isSyncInitial: true,
        });
      },
    );

    socket.on('disconnecting', () => {
      socket.rooms.forEach((room) => {
        if (room.startsWith('interview:')) {
          socket.to(room).emit('participant-left', { socketId: socket.id });
        }
      });
    });

    socket.on('disconnect', () => {
      if (socket.data.participant?.meetingRoomId) {
        const room = `interview:${socket.data.participant.meetingRoomId}`;
        socket.to(room).emit('participant-left', { socketId: socket.id });
      }
    });
  });

  return io;
}
