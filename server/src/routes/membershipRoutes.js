import { Router } from 'express';
import * as controller from '../controllers/membershipController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { createMembershipSchema, idParamsSchema, statusSchema } from '../validators/membershipValidators.js';
import auditAdminAction from '../middleware/auditAdminAction.js';

const router = Router();
router.use(authenticate);
router.post('/', authorize('member'), validate(createMembershipSchema), controller.createMembership);
router.get('/my', authorize('member'), controller.myMemberships);
router.get('/', authorize('admin'), controller.listMemberships);
router.patch('/:id/status', authorize('admin'), auditAdminAction, validate(statusSchema), controller.updateStatus);
router.post('/:id/renew', authorize('member'), validate(idParamsSchema), controller.renewMembership);
export default router;