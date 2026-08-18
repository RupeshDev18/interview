import { Router } from 'express';
import { interviewTypesController } from './interview-types.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', interviewTypesController.list);
router.get('/templates', interviewTypesController.listTemplates);
router.get('/:id', interviewTypesController.getById);

export { router as interviewTypesRoutes };
