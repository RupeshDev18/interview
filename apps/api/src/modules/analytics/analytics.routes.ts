import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get(
  '/overview',
  authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'),
  analyticsController.getOverview,
);

export { router as analyticsRoutes };
