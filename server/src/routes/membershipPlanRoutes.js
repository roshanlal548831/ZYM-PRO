import { Router } from 'express';
import * as controller from '../controllers/membershipPlanController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { createPlanSchema, updatePlanSchema, idParamsSchema } from '../validators/membershipValidators.js';
import auditAdminAction from '../middleware/auditAdminAction.js';

const router = Router();
router.get('/', controller.listPlans);
router.post('/', authenticate, authorize('admin'), auditAdminAction, validate(createPlanSchema), controller.createPlan);
router.patch('/:id', authenticate, authorize('admin'), auditAdminAction, validate(updatePlanSchema), controller.updatePlan);
router.delete('/:id', authenticate, authorize('admin'), auditAdminAction, validate(idParamsSchema), controller.deactivatePlan);
export default router;