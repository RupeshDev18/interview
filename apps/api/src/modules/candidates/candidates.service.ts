import { candidatesRepository } from './candidates.repository';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { normalizePagination, buildPaginationMeta } from '../../utils/pagination';
import { auditService } from '../audit/audit.service';
import { AuditAction } from '@intvwplt/shared';
import type { CreateCandidateInput, UpdateCandidateInput, UpdateCandidateStatusInput } from './candidates.validator';
import type { CandidateStatus } from '@prisma/client';

interface RequestingUser {
  id: string;
  role: string;
  companyId?: string;
}

export const candidatesService = {
  async list(
    query: {
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: string;
      search?: string;
      status?: CandidateStatus;
      skills?: string;
    },
    user: RequestingUser,
  ) {
    const pagination = normalizePagination(query);
    const skillsFilter = query.skills?.split(',').map((s) => s.trim()).filter(Boolean);

    // Non-admins can only see their own company's candidates
    const companyId = user.role === 'ADMIN' ? undefined : user.companyId;

    const { items, total } = await candidatesRepository.findAll(pagination, {
      companyId,
      status: query.status,
      search: query.search,
      skills: skillsFilter,
    });

    return { items, pagination: buildPaginationMeta(total, pagination.page, pagination.limit) };
  },

  async getById(id: string, user: RequestingUser) {
    const companyId = user.role === 'ADMIN' ? undefined : user.companyId;
    const candidate = await candidatesRepository.findById(id, companyId);
    if (!candidate) throw new NotFoundError('Candidate');
    return candidate;
  },

  async getDossier(id: string, user: RequestingUser) {
    const companyId = user.role === 'ADMIN' ? undefined : user.companyId;
    const candidate = await candidatesRepository.findDossierById(id, companyId);
    if (!candidate) throw new NotFoundError('Candidate');

    const totalRounds = candidate.interviews.length;
    const completedInterviews = candidate.interviews.filter(
      (i) => i.status === 'COMPLETED' && i.feedback?.overallScore,
    );
    const completedRounds = completedInterviews.length;

    let averageScore: number | null = null;
    if (completedRounds > 0) {
      const sum = completedInterviews.reduce(
        (acc, i) => acc + Number(i.feedback!.overallScore),
        0,
      );
      averageScore = Math.round((sum / completedRounds) * 100) / 100;
    }

    const latestFeedback = candidate.interviews
      .slice()
      .reverse()
      .find((i) => i.feedback?.recommendation);

    return {
      candidate,
      interviews: candidate.interviews,
      totalRounds,
      completedRounds,
      averageScore,
      finalRecommendation: latestFeedback?.feedback?.recommendation || null,
    };
  },

  async create(input: CreateCandidateInput, user: RequestingUser) {
    // Resolve companyId: admin can specify, others use their own company
    const companyId =
      user.role === 'ADMIN' && input.companyId
        ? input.companyId
        : user.companyId;

    if (!companyId) {
      throw new AuthorizationError('No company context. Cannot create candidate.');
    }

    const candidate = await candidatesRepository.create({
      companyId,
      createdById: user.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      location: input.location,
      currentRole: input.currentRole,
      experienceYears: input.experienceYears,
      skills: input.skills,
      linkedinUrl: input.linkedinUrl,
    });

    await auditService.log({
      actorId: user.id,
      companyId,
      action: AuditAction.CANDIDATE_CREATED,
      entityType: 'Candidate',
      entityId: candidate.id,
      metadata: { name: `${input.firstName} ${input.lastName}` },
    });

    return candidate;
  },

  async update(id: string, input: UpdateCandidateInput, user: RequestingUser) {
    const candidate = await candidatesService.getById(id, user);

    const updated = await candidatesRepository.update(id, {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      location: input.location,
      currentRole: input.currentRole,
      experienceYears: input.experienceYears,
      skills: input.skills,
      linkedinUrl: input.linkedinUrl,
    });

    await auditService.log({
      actorId: user.id,
      companyId: candidate.companyId,
      action: AuditAction.CANDIDATE_UPDATED,
      entityType: 'Candidate',
      entityId: id,
    });

    return updated;
  },

  async updateStatus(id: string, input: UpdateCandidateStatusInput, user: RequestingUser) {
    const candidate = await candidatesService.getById(id, user);
    const updated = await candidatesRepository.updateStatus(id, input.status as CandidateStatus);

    const action =
      input.status === 'HIRED'
        ? AuditAction.CANDIDATE_HIRED
        : input.status === 'REJECTED'
        ? AuditAction.CANDIDATE_REJECTED
        : input.status === 'NEXT_ROUND'
        ? AuditAction.CANDIDATE_NEXT_ROUND
        : AuditAction.CANDIDATE_UPDATED;

    await auditService.log({
      actorId: user.id,
      companyId: candidate.companyId,
      action,
      entityType: 'Candidate',
      entityId: id,
      metadata: { previousStatus: candidate.status, newStatus: input.status },
    });

    return updated;
  },

  async delete(id: string, user: RequestingUser) {
    await candidatesService.getById(id, user);
    await candidatesRepository.softDelete(id);

    await auditService.log({
      actorId: user.id,
      action: AuditAction.CANDIDATE_DELETED,
      entityType: 'Candidate',
      entityId: id,
    });
  },

  async getPipelineCounts(user: RequestingUser) {
    const companyId = user.companyId;
    if (!companyId) return {};
    return candidatesRepository.countByStatus(companyId);
  },
};
