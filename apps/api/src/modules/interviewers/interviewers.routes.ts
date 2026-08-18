import { Router } from 'express';
import { interviewersController } from './interviewers.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'),
  interviewersController.list,
);

router.get(
  '/:id',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'),
  interviewersController.getById,
);

export { router as interviewersRoutes };
