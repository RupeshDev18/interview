import { feedbackRepository } from './feedback.repository';
import { interviewsRepository } from '../interviews/interviews.repository';
import { candidatesRepository } from '../candidates/candidates.repository';
import { auditService } from '../audit/audit.service';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { AuditAction, InterviewStatus } from '@intvwplt/shared';
import type { SubmitFeedbackInput } from './feedback.validator';

interface RequestingUser {
  id: string;
  role: string;
  companyId?: string;
}

export const feedbackService = {
  async getByInterviewId(interviewId: string, user: RequestingUser) {
    const interview = await interviewsRepository.findById(
      interviewId,
      user.role === 'ADMIN' ? undefined : user.companyId,
    );

    if (!interview) throw new NotFoundError('Interview');

    const feedback = await feedbackRepository.findByInterviewId(interviewId);
    if (!feedback) throw new NotFoundError('Feedback for this interview');

    return feedback;
  },

  async submit(interviewId: string, input: SubmitFeedbackInput, user: RequestingUser) {
    const interview = await interviewsRepository.findById(
      interviewId,
      user.role === 'ADMIN' ? undefined : user.companyId,
    );

    if (!interview) throw new NotFoundError('Interview');

    // Only assigned interviewer or company admin/recruiter can submit feedback
    if (user.role === 'INTERVIEWER' && interview.interviewer.userId !== user.id) {
      throw new AuthorizationError('You are not authorized to submit feedback for this interview.');
    }

    // Compute overall score from scores map if not provided
    let calculatedScore = input.overallScore;
    if (!calculatedScore && input.scores && Object.keys(input.scores).length > 0) {
      const values = Object.values(input.scores);
      const sum = values.reduce((acc, curr) => acc + curr, 0);
      calculatedScore = Math.round((sum / values.length) * 100) / 100;
    }

    const feedback = await feedbackRepository.upsert({
      interviewId,
      interviewerId: interview.interviewerId,
      templateId: input.templateId || interview.interviewType?.evaluationTemplateId || undefined,
      scores: input.scores,
      overallScore: calculatedScore,
      strengths: input.strengths,
      weaknesses: input.weaknesses,
      concerns: input.concerns,
      recommendation: input.recommendation as any,
      submittedAt: new Date(),
    });

    // Mark interview as COMPLETED if not already completed
    if (interview.status !== InterviewStatus.COMPLETED) {
      await interviewsRepository.update(interviewId, {
        status: InterviewStatus.COMPLETED,
        actualEnd: interview.actualEnd || new Date(),
      });
    }

    // Update candidate status if requested
    if (input.nextCandidateStatus) {
      await candidatesRepository.updateStatus(interview.candidateId, input.nextCandidateStatus);
    }

    await auditService.log({
      actorId: user.id,
      companyId: interview.companyId,
      action: AuditAction.FEEDBACK_SUBMITTED,
      entityType: 'InterviewFeedback',
      entityId: feedback.id,
      metadata: {
        interviewId,
        recommendation: input.recommendation,
        overallScore: calculatedScore,
      },
    });

    return feedback;
  },
};
