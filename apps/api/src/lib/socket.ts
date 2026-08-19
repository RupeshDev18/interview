import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { authService } from '../modules/auth/auth.service';
import { prisma } from './prisma';
import { env } from '../config/env';

export function initSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, { cors: { origin: env.CORS_ORIGINS.split(',').map((x) => x.trim()), credentials: true } });
  io.use((socket, next) => { try { const token = socket.handshake.auth.token; if (!token) throw new Error(); socket.data.user = authService.verifyAccessToken(token); next(); } catch { next(new Error('Unauthorized')); } });
  io.on('connection', (socket) => {
    socket.on('join-interview', async ({ meetingRoomId }: { meetingRoomId: string }, done?: (result: { ok: boolean; error?: string }) => void) => {
      const interview = await prisma.interview.findUnique({ where: { meetingRoomId }, include: { interviewer: true } });
      const user = socket.data.user as { sub: string; role: string; companyId?: string };
      const allowed = interview && (user.role === 'ADMIN' || (user.companyId === interview.companyId && (user.role !== 'INTERVIEWER' || interview.interviewer.userId === user.sub)));
      if (!allowed) return done?.({ ok: false, error: 'Not authorized for this room' });
      socket.join(`interview:${meetingRoomId}`); socket.to(`interview:${meetingRoomId}`).emit('participant-joined', { socketId: socket.id }); done?.({ ok: true });
    });
    socket.on('webrtc-signal', ({ meetingRoomId, signal }) => { if (socket.rooms.has(`interview:${meetingRoomId}`)) socket.to(`interview:${meetingRoomId}`).emit('webrtc-signal', { from: socket.id, signal }); });
    socket.on('disconnecting', () => socket.rooms.forEach((room) => { if (room.startsWith('interview:')) socket.to(room).emit('participant-left', { socketId: socket.id }); }));
  });
  return io;
}
