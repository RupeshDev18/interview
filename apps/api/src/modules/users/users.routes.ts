import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateUserSchema } from './users.validator';

const router = Router();

router.use(authenticate);

// ADMIN: manage all users. COMPANY_ADMIN: can list users in their own company (filtered by service)
router.get('/', authorize('ADMIN', 'COMPANY_ADMIN'), usersController.list);
router.get('/:id', authorize('ADMIN', 'COMPANY_ADMIN'), usersController.getById);
router.post('/', authorize('ADMIN'), validate(createUserSchema), usersController.create);
router.patch('/:id', authorize('ADMIN'), validate(updateUserSchema), usersController.update);
router.delete('/:id', authorize('ADMIN'), usersController.delete);

export { router as usersRoutes };
