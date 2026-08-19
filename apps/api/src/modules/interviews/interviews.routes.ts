import { Router } from 'express';
import { interviewsController } from './interviews.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createInterviewSchema,
  updateInterviewSchema,
  updateInterviewStatusSchema,
  updateInterviewNotesSchema,
  updateQuestionNotesSchema,
} from './interviews.validator';

const router = Router();

router.use(authenticate);

// List & Get
router.get(
  '/',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'),
  interviewsController.list,
);

router.get(
  '/:id',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'),
  interviewsController.getById,
);

// Schedule
router.post(
  '/',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'),
  validate(createInterviewSchema),
  interviewsController.create,
);

// Reschedule / Update
router.patch(
  '/:id',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'),
  validate(updateInterviewSchema),
  interviewsController.update,
);

// Status Change (Start, Complete, Cancel)
router.patch(
  '/:id/status',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'),
  validate(updateInterviewStatusSchema),
  interviewsController.updateStatus,
);

// Live Notes Autosave
router.patch(
  '/:id/notes',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'),
  validate(updateInterviewNotesSchema),
  interviewsController.updateNotes,
);

// Question-specific candidate answer, notes, and score
router.patch(
  '/:id/questions/:questionId',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'),
  validate(updateQuestionNotesSchema),
  interviewsController.updateQuestionNotes,
);

router.post(
  '/:id/candidate-link',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'),
  interviewsController.createCandidateLink,
);

export { router as interviewsRoutes };
