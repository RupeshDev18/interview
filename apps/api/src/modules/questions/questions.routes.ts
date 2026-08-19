import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { questionsController } from './questions.controller';
import {
  addInterviewQuestionSchema,
  createQuestionSchema,
  questionsQuerySchema,
  updateQuestionSchema,
} from './questions.validator';
import { z } from 'zod';

const router = Router();
const reorderInterviewQuestionsSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(0),
});

router.use(authenticate);

router.get('/categories', questionsController.getCategories);
router.get('/technologies', questionsController.getTechnologies);
router.get('/', validate(questionsQuerySchema, 'query'), questionsController.list);
router.get('/:id', questionsController.getById);
router.post('/', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'), validate(createQuestionSchema), questionsController.create);
router.patch('/:id', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'), validate(updateQuestionSchema), questionsController.update);
router.delete('/:id', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'), questionsController.delete);

const interviewRouter = Router();
interviewRouter.use(authenticate);
interviewRouter.post('/:interviewId/questions', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'), validate(addInterviewQuestionSchema), questionsController.addToInterview);
interviewRouter.patch('/:interviewId/questions/reorder', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'), validate(reorderInterviewQuestionsSchema), questionsController.reorderInterviewQuestions);
interviewRouter.delete('/:interviewId/questions/:questionId', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'), questionsController.deleteFromInterview);

export { router as questionsRoutes, interviewRouter as interviewQuestionsRoutes };
