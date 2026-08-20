import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { AuthorizationError, NotFoundError } from '../../utils/errors';
import { env } from '../../config/env';
import { ParticipantRole, type CreateGuestLinkDto, type GuestJoinDetailsDto, type InterviewStatus } from '@intvwplt/shared';

interface GuestTokenPayload {
  type: 'GUEST_JOIN';
  interviewId: string;
  meetingRoomId: string;
  role: ParticipantRole;
  guestName?: string;
}

export const guestLinkService = {
  async create(
    interviewId: string,
    user: { id?: string; sub?: string; role: string; companyId?: string },
    dto: CreateGuestLinkDto = {},
  ) {
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        ...(user.role === 'ADMIN' ? {} : { companyId: user.companyId }),
      },
      include: {
        candidate: true,
        company: true,
        interviewType: true,
      },
    });

    if (!interview) {
      throw new NotFoundError('Interview');
    }

    const role = dto.role || ParticipantRole.HR_OBSERVER;
    const guestName =
      dto.guestName?.trim() ||
      (role === ParticipantRole.HR_OBSERVER ? 'HR Observer' : 'Co-Interviewer');

    // Expiration: 48h default or custom
    const expiresInSeconds = dto.expiresInMinutes
      ? dto.expiresInMinutes * 60
      : Math.max(
          48 * 3600,
          Math.floor((interview.scheduledEnd.getTime() + 24 * 3600 * 1000 - Date.now()) / 1000),
        );

    const payload: GuestTokenPayload = {
      type: 'GUEST_JOIN',
      interviewId: interview.id,
      meetingRoomId: interview.meetingRoomId,
      role,
      guestName,
    };

    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: expiresInSeconds,
    });

    const webOrigin = env.CORS_ORIGINS.split(',')[0].trim();
    const guestJoinUrl = `${webOrigin}/interview/guest/${token}`;

    return {
      token,
      guestJoinUrl,
      role,
      guestName,
      expiresInSeconds,
    };
  },

  async verifyToken(token: string): Promise<GuestJoinDetailsDto> {
    let payload: GuestTokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as GuestTokenPayload;
    } catch {
      throw new AuthorizationError('Invalid or expired guest invitation link');
    }

    if (payload.type !== 'GUEST_JOIN' || !payload.interviewId) {
      throw new AuthorizationError('Invalid guest token format');
    }

    const interview = await prisma.interview.findFirst({
      where: {
        id: payload.interviewId,
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        interviewType: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
          },
        },
        interviewer: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundError('Interview not found');
    }

    return {
      interviewId: interview.id,
      meetingRoomId: interview.meetingRoomId,
      scheduledStart: interview.scheduledStart.toISOString(),
      scheduledEnd: interview.scheduledEnd.toISOString(),
      timezone: interview.timezone,
      status: interview.status as unknown as InterviewStatus,
      role: payload.role || ParticipantRole.HR_OBSERVER,
      guestName: payload.guestName || 'Guest Observer',
      candidate: {
        id: interview.candidate.id,
        firstName: interview.candidate.firstName,
        lastName: interview.candidate.lastName,
      },
      company: {
        name: interview.company.name,
        logoUrl: interview.company.logoUrl,
      },
      interviewType: {
        name: interview.interviewType.name,
        durationMinutes: interview.interviewType.durationMinutes,
      },
      interviewerName: `${interview.interviewer.user.firstName} ${interview.interviewer.user.lastName}`,
    };
  },
};
