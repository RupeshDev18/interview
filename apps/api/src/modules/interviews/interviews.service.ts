import { interviewsRepository } from './interviews.repository';
import { candidatesRepository } from '../candidates/candidates.repository';
import { interviewersRepository } from '../interviewers/interviewers.repository';
import { auditService } from '../audit/audit.service';
import { NotFoundError, ConflictError, AuthorizationError } from '../../utils/errors';
import { normalizePagination, buildPaginationMeta } from '../../utils/pagination';
import { AuditAction, CandidateStatus, InterviewStatus } from '@intvwplt/shared';
import type {
  CreateInterviewInput,
  UpdateInterviewInput,
  UpdateInterviewStatusInput,
  UpdateInterviewNotesInput,
  UpdateQuestionNotesInput,
} from './interviews.validator';

interface RequestingUser {
  id: string;
  role: string;
  companyId?: string;
}

export const interviewsService = {
  async list(
    query: {
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: string;
      candidateId?: string;
      interviewerId?: string;
      companyId?: string;
      status?: InterviewStatus;
      roundNumber?: string;
      from?: string;
      to?: string;
      search?: string;
    },
    user: RequestingUser,
  ) {
    const pagination = normalizePagination(query);

    // Tenant scoping: Non-admins can only view their own company's interviews
    const effectiveCompanyId =
      user.role === 'ADMIN' ? query.companyId : user.companyId;

    // Interviewers can only see their own assigned interviews if role is INTERVIEWER
    let effectiveInterviewerId = query.interviewerId;
    if (user.role === 'INTERVIEWER') {
      const interviewer = await interviewersRepository.findByUserId(user.id);
      if (interviewer) {
        effectiveInterviewerId = interviewer.id;
      }
    }

    const { items, total } = await interviewsRepository.findAll(pagination, {
      companyId: effectiveCompanyId,
      candidateId: query.candidateId,
      interviewerId: effectiveInterviewerId,
      status: query.status as any,
      roundNumber: query.roundNumber ? parseInt(query.roundNumber, 10) : undefined,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      search: query.search,
    });

    return {
      items,
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  },

  async getById(id: string, user: RequestingUser) {
    const companyId = user.role === 'ADMIN' ? undefined : user.companyId;
    const interview = await interviewsRepository.findById(id, companyId);
    if (!interview) throw new NotFoundError('Interview');

    // If role is INTERVIEWER, ensure they are assigned to this interview
    if (user.role === 'INTERVIEWER' && interview.interviewer.userId !== user.id) {
      throw new AuthorizationError('You are not authorized to view this interview.');
    }

    return interview;
  },

  async create(input: CreateInterviewInput, user: RequestingUser) {
    const companyId =
      user.role === 'ADMIN' && input.companyId ? input.companyId : user.companyId;

    if (!companyId) {
      throw new AuthorizationError('No company context. Cannot create interview.');
    }

    // Verify candidate belongs to the company
    const candidate = await candidatesRepository.findById(input.candidateId, companyId);
    if (!candidate) {
      throw new NotFoundError('Candidate not found in this company');
    }

    // Verify interviewer exists
    const interviewer = await interviewersRepository.findById(input.interviewerId);
    if (!interviewer) {
      throw new NotFoundError('Interviewer');
    }

    const start = new Date(input.scheduledStart);
    const end = new Date(input.scheduledEnd);

    // Double-booking check: ensure interviewer is not already booked in this time window
    const conflicts = await interviewsRepository.findOverlappingInterviews({
      interviewerId: input.interviewerId,
      start,
      end,
    });

    if (conflicts.length > 0) {
      throw new ConflictError(
        `Interviewer is already booked for another interview between ${start.toLocaleTimeString()} and ${end.toLocaleTimeString()}.`,
      );
    }

    const interview = await interviewsRepository.create({
      candidateId: input.candidateId,
      interviewerId: input.interviewerId,
      companyId,
      interviewTypeId: input.interviewTypeId,
      scheduledStart: start,
      scheduledEnd: end,
      timezone: input.timezone || interviewer.timezone || 'UTC',
      roundNumber: input.roundNumber || 1,
      notes: input.notes,
      createdById: user.id,
      initialQuestions: input.initialQuestions,
    });

    // Update candidate status to INTERVIEW_SCHEDULED if currently NEW
    if (candidate.status === CandidateStatus.NEW) {
      await candidatesRepository.updateStatus(candidate.id, CandidateStatus.INTERVIEW_SCHEDULED);
    }

    await auditService.log({
      actorId: user.id,
      companyId,
      action: AuditAction.INTERVIEW_SCHEDULED,
      entityType: 'Interview',
      entityId: interview.id,
      metadata: {
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        roundNumber: interview.roundNumber,
        scheduledStart: interview.scheduledStart,
      },
    });

    return interview;
  },

  async update(id: string, input: UpdateInterviewInput, user: RequestingUser) {
    const existing = await interviewsService.getById(id, user);

    const start = input.scheduledStart ? new Date(input.scheduledStart) : existing.scheduledStart;
    const end = input.scheduledEnd ? new Date(input.scheduledEnd) : existing.scheduledEnd;
    const interviewerId = input.interviewerId || existing.interviewerId;

    if (input.scheduledStart || input.scheduledEnd || input.interviewerId) {
      // Re-verify conflicts
      const conflicts = await interviewsRepository.findOverlappingInterviews({
        interviewerId,
        start,
        end,
        excludeInterviewId: id,
      });

      if (conflicts.length > 0) {
        throw new ConflictError('Interviewer has a scheduling conflict during this time slot.');
      }
    }

    const updated = await interviewsRepository.update(id, {
      ...(input.scheduledStart && { scheduledStart: start }),
      ...(input.scheduledEnd && { scheduledEnd: end }),
      ...(input.timezone && { timezone: input.timezone }),
      ...(input.interviewerId && { interviewerId: input.interviewerId }),
      ...(input.interviewTypeId && { interviewTypeId: input.interviewTypeId }),
      ...(input.roundNumber && { roundNumber: input.roundNumber }),
      ...(input.notes !== undefined && { notes: input.notes }),
    });

    await auditService.log({
      actorId: user.id,
      companyId: existing.companyId,
      action: AuditAction.INTERVIEW_RESCHEDULED,
      entityType: 'Interview',
      entityId: id,
    });

    return updated;
  },

  async updateStatus(id: string, input: UpdateInterviewStatusInput, user: RequestingUser) {
    const existing = await interviewsService.getById(id, user);

    const updateData: any = {
      status: input.status,
    };

    if (input.status === InterviewStatus.IN_PROGRESS && !existing.actualStart) {
      updateData.actualStart = new Date();
    } else if (input.status === InterviewStatus.COMPLETED && !existing.actualEnd) {
      updateData.actualEnd = new Date();
    } else if (input.status === InterviewStatus.CANCELLED) {
      updateData.cancelReason = input.cancelReason;
      updateData.cancelledById = user.id;
    }

    const updated = await interviewsRepository.update(id, updateData);

    const auditAction =
      input.status === InterviewStatus.IN_PROGRESS
        ? AuditAction.INTERVIEW_STARTED
        : input.status === InterviewStatus.COMPLETED
        ? AuditAction.INTERVIEW_COMPLETED
        : input.status === InterviewStatus.CANCELLED
        ? AuditAction.INTERVIEW_CANCELLED
        : AuditAction.INTERVIEW_RESCHEDULED;

    await auditService.log({
      actorId: user.id,
      companyId: existing.companyId,
      action: auditAction,
      entityType: 'Interview',
      entityId: id,
      metadata: { newStatus: input.status, reason: input.cancelReason },
    });

    return updated;
  },

  async updateNotes(id: string, input: UpdateInterviewNotesInput, user: RequestingUser) {
    await interviewsService.getById(id, user);
    return interviewsRepository.updateNotes(id, input.notes);
  },

  async updateQuestionNotes(
    interviewId: string,
    questionId: string,
    input: UpdateQuestionNotesInput,
    user: RequestingUser,
  ) {
    await interviewsService.getById(interviewId, user);
    return interviewsRepository.updateQuestionNotes(questionId, input);
  },
};
