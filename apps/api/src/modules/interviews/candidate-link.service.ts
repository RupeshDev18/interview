import { createHash, randomBytes } from 'crypto';
import { prisma } from '../../lib/prisma';
import { AuthorizationError, NotFoundError } from '../../utils/errors';

const hash = (token: string) => createHash('sha256').update(token).digest('hex');
export const candidateLinkService = {
  async create(interviewId: string, user: { role: string; companyId?: string }) {
    const interview = await prisma.interview.findFirst({ where: { id: interviewId, ...(user.role === 'ADMIN' ? {} : { companyId: user.companyId }) } });
    if (!interview) throw new NotFoundError('Interview');
    if (user.role === 'INTERVIEWER') throw new AuthorizationError('Only recruiters and admins can create candidate links');
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Math.max(Date.now() + 60 * 60 * 1000, interview.scheduledEnd.getTime() + 24 * 60 * 60 * 1000));
    await prisma.$executeRaw`UPDATE "interviews" SET "candidateJoinTokenHash" = ${hash(token)}, "candidateJoinExpiresAt" = ${expiresAt} WHERE id = ${interviewId}`;
    return { token, expiresAt };
  },
};
