import type { Request, Response } from 'express';
import { feedbackService } from './feedback.service';
import { sendSuccess } from '../../utils/response';

export const feedbackController = {
  async getByInterviewId(req: Request, res: Response): Promise<void> {
    const interviewId = req.params.interviewId as string;
    const feedback = await feedbackService.getByInterviewId(interviewId, req.user!);
    sendSuccess(res, feedback);
  },

  async submit(req: Request, res: Response): Promise<void> {
    const interviewId = req.params.interviewId as string;
    const feedback = await feedbackService.submit(
      interviewId,
      req.body,
      req.user!,
    );
    sendSuccess(res, feedback, 'Feedback scorecard submitted successfully');
  },
};
