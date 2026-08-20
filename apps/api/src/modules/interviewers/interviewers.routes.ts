import { Router } from 'express';
import { interviewersController } from './interviewers.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createInterviewerSchema } from './interviewers.validator';
import { availabilityController } from '../availability/availability.controller';
import { createExceptionSchema, dateRangeQuerySchema, replaceRulesSchema, slotsQuerySchema } from '../availability/availability.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'),
  interviewersController.list,
);

router.post(
  '/',
  authorize('ADMIN', 'COMPANY_ADMIN'),
  validate(createInterviewerSchema),
  interviewersController.create,
);

router.get('/me', authorize('INTERVIEWER'), interviewersController.getMine);

router.get(
  '/:id',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'),
  interviewersController.getById,
);

router.get('/:id/availability/rules', availabilityController.rules);
router.put('/:id/availability/rules', validate(replaceRulesSchema), availabilityController.replaceRules);
router.get('/:id/availability/exceptions', validate(dateRangeQuerySchema, 'query'), availabilityController.exceptions);
router.post('/:id/availability/exceptions', validate(createExceptionSchema), availabilityController.createException);
router.delete('/:id/availability/exceptions/:exceptionId', availabilityController.deleteException);
router.get('/:id/available-slots', validate(slotsQuerySchema, 'query'), availabilityController.slots);

export { router as interviewersRoutes };
