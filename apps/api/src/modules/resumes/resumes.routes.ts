import { Router } from 'express';
import { resumesController } from './resumes.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

// Get signed download URL for a resume — used in interview room
router.get('/:resumeId/download-url', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'), resumesController.getSignedUrl);

// Delete a resume
router.delete('/:resumeId', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'), resumesController.delete);

export { router as resumesRoutes };
