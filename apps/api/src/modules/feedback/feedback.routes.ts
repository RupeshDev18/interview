import { Router } from 'express';
import { feedbackController } from './feedback.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { submitFeedbackSchema } from './feedback.validator';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/:interviewId/feedback',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'),
  feedbackController.getByInterviewId,
);

router.post(
  '/:interviewId/feedback',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'),
  validate(submitFeedbackSchema),
  feedbackController.submit,
);

export { router as feedbackRoutes };
