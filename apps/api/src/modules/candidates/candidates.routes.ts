import { Router } from 'express';
import multer from 'multer';
import { candidatesController } from './candidates.controller';
import { resumesController } from '../resumes/resumes.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createCandidateSchema,
  updateCandidateSchema,
  updateCandidateStatusSchema,
} from './candidates.validator';
import { env } from '../../config/env';

// Multer: store in memory for immediate S3 upload (limit enforced in service too)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});

const router = Router();

router.use(authenticate);

// ── Candidates ────────────────────────────────────────────────────────────────
router.get('/pipeline-counts', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'), candidatesController.getPipelineCounts);
router.get('/', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'), candidatesController.list);
router.get('/:id', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'), candidatesController.getById);
router.post('/', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'), validate(createCandidateSchema), candidatesController.create);
router.patch('/:id', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'), validate(updateCandidateSchema), candidatesController.update);
router.patch('/:id/status', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'), validate(updateCandidateStatusSchema), candidatesController.updateStatus);
router.delete('/:id', authorize('ADMIN', 'COMPANY_ADMIN'), candidatesController.delete);

// ── Resumes ───────────────────────────────────────────────────────────────────
router.post('/:candidateId/resume', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER'), upload.single('resume'), resumesController.upload);
router.get('/:candidateId/resumes', authorize('ADMIN', 'COMPANY_ADMIN', 'RECRUITER', 'INTERVIEWER'), resumesController.list);

export { router as candidatesRoutes };
