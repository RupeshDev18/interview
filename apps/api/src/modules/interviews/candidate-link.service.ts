import { createHash, randomBytes } from 'crypto';
import { prisma } from '../../lib/prisma';
import { AuthorizationError, NotFoundError } from '../../utils/errors';
import { publishKafkaEvent } from '../../lib/kafka';
import { KAFKA_TOPICS } from '../../events/kafka/topics';
import { env } from '../../config/env';

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

export const candidateLinkService = {
  async create(interviewId: string, user: { role: string; companyId?: string }) {
    const interview = await prisma.interview.findFirst({
      where: { id: interviewId, ...(user.role === 'ADMIN' ? {} : { companyId: user.companyId }) },
      include: {
        candidate: true,
        company: true,
        interviewType: true,
      },
    });
    if (!interview) throw new NotFoundError('Interview');
    if (user.role === 'INTERVIEWER') {
      throw new AuthorizationError('Only recruiters and admins can create candidate links');
    }
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Math.max(Date.now() + 60 * 60 * 1000, interview.scheduledEnd.getTime() + 24 * 60 * 60 * 1000),
    );
    await prisma.$executeRaw`UPDATE "interviews" SET "candidateJoinTokenHash" = ${hash(token)}, "candidateJoinExpiresAt" = ${expiresAt} WHERE id = ${interviewId}`;

    const webOrigin = env.CORS_ORIGINS.split(',')[0].trim();
    if (interview.candidate.email) {
      publishKafkaEvent(KAFKA_TOPICS.CANDIDATE_LINK_CREATED, {
        interviewId,
        candidateEmail: interview.candidate.email,
        candidateName: `${interview.candidate.firstName} ${interview.candidate.lastName}`,
        companyName: interview.company.name,
        interviewTypeName: interview.interviewType.name,
        scheduledStart: interview.scheduledStart.toISOString(),
        timezone: interview.timezone,
        joinUrl: `${webOrigin}/interview/join/${token}`,
      }).catch(() => {});
    }

    return { token, expiresAt };
  },

  async verifyToken(token: string) {
    const tokenHash = hash(token);
    const interview = await prisma.interview.findFirst({
      where: {
        candidateJoinTokenHash: tokenHash,
        candidateJoinExpiresAt: {
          gt: new Date(),
        },
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
      throw new NotFoundError('Invalid or expired candidate join link');
    }

    return {
      interviewId: interview.id,
      meetingRoomId: interview.meetingRoomId,
      scheduledStart: interview.scheduledStart.toISOString(),
      scheduledEnd: interview.scheduledEnd.toISOString(),
      timezone: interview.timezone,
      status: interview.status,
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

