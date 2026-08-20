import { interviewersRepository } from './interviewers.repository';
import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError, AuthorizationError } from '../../utils/errors';
import type { CreateInterviewerInput } from './interviewers.validator';
import argon2 from 'argon2';

interface RequestingUser {
  id: string;
  role: string;
  companyId?: string;
}

export const interviewersService = {
  async list(query: { isAvailable?: boolean; search?: string }, user: RequestingUser) {
    const companyId = user.role === 'ADMIN' ? undefined : user.companyId;
    return interviewersRepository.findAll({
      companyId,
      isAvailable: query.isAvailable,
      search: query.search,
    });
  },

  async getById(id: string) {
    const interviewer = await interviewersRepository.findById(id);
    if (!interviewer) throw new NotFoundError('Interviewer');
    return interviewer;
  },

  async getByUserId(userId: string) {
    const interviewer = await interviewersRepository.findByUserId(userId);
    if (!interviewer) throw new NotFoundError('Interviewer profile');
    return interviewer;
  },

  async create(data: CreateInterviewerInput, user: RequestingUser) {
    const companyId = user.role === 'ADMIN' ? data.companyId || user.companyId : user.companyId;
    if (!companyId) {
      throw new AuthorizationError('Company ID is required to create an interviewer');
    }

    const existing = await prisma.user.findFirst({
      where: { email: data.email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictError('A user with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordToHash = data.password || 'Interviewer@123456';
    const passwordHash = await argon2.hash(passwordToHash, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const timezone = data.timezone || 'UTC';

    const result = await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          role: 'INTERVIEWER',
          companyId,
          isActive: true,
        },
      });

      const dbInterviewer = await tx.interviewer.create({
        data: {
          userId: dbUser.id,
          bio: data.bio || undefined,
          yearsOfExperience: data.yearsOfExperience ?? 3,
          expertise: data.expertise || [],
          technologies: data.technologies || [],
          timezone,
          isAvailable: data.isAvailable ?? true,
        },
      });

      // Default availability rules: Monday to Friday, 09:00 - 17:00
      const days = [1, 2, 3, 4, 5]; // Mon-Fri
      for (const day of days) {
        await tx.availabilityRule.create({
          data: {
            interviewerId: dbInterviewer.id,
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00',
            timezone,
            isActive: true,
          },
        });
      }

      return dbInterviewer;
    });

    return this.getById(result.id);
  },
};
