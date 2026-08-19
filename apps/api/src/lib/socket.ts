import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { authService } from '../modules/auth/auth.service';
import { candidateLinkService } from '../modules/interviews/candidate-link.service';
import { prisma } from './prisma';
import { env } from '../config/env';
import { logger } from './logger';

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(',').map((x) => x.trim()),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const candidateToken =
        (socket.handshake.auth.candidateToken as string | undefined) ||
        (socket.handshake.query.candidateToken as string | undefined);
      const userToken =
        (socket.handshake.auth.token as string | undefined) ||
        (socket.handshake.query.token as string | undefined);

      if (candidateToken) {
        try {
          const candidateDetails = await candidateLinkService.verifyToken(candidateToken);
          socket.data.candidate = {
            candidateId: candidateDetails.candidate.id,
            name: `${candidateDetails.candidate.firstName} ${candidateDetails.candidate.lastName}`,
            meetingRoomId: candidateDetails.meetingRoomId,
            interviewId: candidateDetails.interviewId,
            role: 'CANDIDATE',
          };
          return next();
        } catch {
          // If candidate token failed, proceed to try user token if present
        }
      }

      if (userToken) {
        // Try user JWT first
        try {
          const payload = authService.verifyAccessToken(userToken);
          socket.data.user = payload;
          return next();
        } catch {
          // If token wasn't a valid JWT, see if it is a candidate token
          try {
            const candidateDetails = await candidateLinkService.verifyToken(userToken);
            socket.data.candidate = {
              candidateId: candidateDetails.candidate.id,
              name: `${candidateDetails.candidate.firstName} ${candidateDetails.candidate.lastName}`,
              meetingRoomId: candidateDetails.meetingRoomId,
              interviewId: candidateDetails.interviewId,
              role: 'CANDIDATE',
            };
            return next();
          } catch {
            return next(new Error('Unauthorized'));
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
        done?: (result: { ok: boolean; role?: string; name?: string; error?: string }) => void,
      ) => {
        try {
          if (socket.data.candidate) {
            const isMatch =
              socket.data.candidate.meetingRoomId === meetingRoomId ||
              socket.data.candidate.interviewId === meetingRoomId;

            if (!isMatch) {
              return done?.({ ok: false, error: 'Unauthorized for this room' });
            }

            const roomName = `interview:${socket.data.candidate.meetingRoomId}`;
            socket.join(roomName);
            socket.to(roomName).emit('participant-joined', {
              socketId: socket.id,
              role: 'CANDIDATE',
              name: socket.data.candidate.name,
            });

            return done?.({
              ok: true,
              role: 'CANDIDATE',
              name: socket.data.candidate.name,
            });
          }

          if (socket.data.user) {
            const interview = await prisma.interview.findFirst({
              where: {
                OR: [{ meetingRoomId }, { id: meetingRoomId }],
              },
              include: { interviewer: true },
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

            const isAdmin = user.role === 'ADMIN';
            const isAssignedInterviewer =
              interview.interviewer?.userId === user.sub ||
              interview.interviewerId === user.sub;
            const isCreator = interview.createdById === user.sub;
            const isCompanyMember = !!user.companyId && user.companyId === interview.companyId;
            const isCompanyAdminOrRecruiter =
              (user.role === 'COMPANY_ADMIN' || user.role === 'RECRUITER') &&
              (!user.companyId || user.companyId === interview.companyId);

            const allowed =
              isAdmin ||
              isAssignedInterviewer ||
              isCreator ||
              isCompanyMember ||
              isCompanyAdminOrRecruiter ||
              user.role === 'INTERVIEWER';

            if (!allowed) {
              return done?.({ ok: false, error: 'Not authorized for this room' });
            }

            const roomName = `interview:${interview.meetingRoomId}`;
            socket.join(roomName);
            socket.to(roomName).emit('participant-joined', {
              socketId: socket.id,
              role: user.role,
              name: 'Interviewer',
            });

            return done?.({
              ok: true,
              role: user.role,
              name: 'Interviewer',
            });
          }

          return done?.({ ok: false, error: 'Unauthorized: No session found' });
        } catch (err) {
          logger.error('Error joining interview room socket', { error: err });
          return done?.({ ok: false, error: 'Internal server error' });
        }
      },
    );

    socket.on(
      'webrtc-signal',
      ({ meetingRoomId, signal, to }: { meetingRoomId: string; signal: any; to?: string }) => {
        const roomName = `interview:${meetingRoomId}`;
        if (to) {
          io.to(to).emit('webrtc-signal', { from: socket.id, signal });
        } else {
          socket.to(roomName).emit('webrtc-signal', { from: socket.id, signal });
        }
      },
    );

    socket.on('disconnecting', () => {
      socket.rooms.forEach((room) => {
        if (room.startsWith('interview:')) {
          socket.to(room).emit('participant-left', { socketId: socket.id });
        }
      });
    });
  });

  return io;
}


