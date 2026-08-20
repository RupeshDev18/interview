import { Router } from 'express';
import { companiesController } from './companies.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createCompanySchema, updateCompanySchema, onboardCompanySchema } from './companies.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'COMPANY_ADMIN'), companiesController.list);
router.post('/onboard', authorize('ADMIN'), validate(onboardCompanySchema), companiesController.onboard);
router.get('/:id', authorize('ADMIN', 'COMPANY_ADMIN'), companiesController.getById);
router.post('/', authorize('ADMIN'), validate(createCompanySchema), companiesController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateCompanySchema), companiesController.update);
router.delete('/:id', authorize('ADMIN'), companiesController.delete);

export { router as companiesRoutes };
