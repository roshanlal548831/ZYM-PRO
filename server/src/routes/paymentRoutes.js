import { Router } from 'express';
import * as controller from '../controllers/paymentController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { createPaymentSchema, paymentIdSchema, refundSchema, listPaymentsSchema } from '../validators/paymentValidators.js';
import auditAdminAction from '../middleware/auditAdminAction.js';

const router = Router();
router.use(authenticate);
router.post('/', authorize('admin'), auditAdminAction, validate(createPaymentSchema), controller.createPayment);
router.get('/my', authorize('member'), controller.myPayments);
router.get('/', authorize('admin'), validate(listPaymentsSchema), controller.listPayments);
router.get('/:id', validate(paymentIdSchema), controller.getPayment);
router.patch('/:id/confirm', authorize('admin'), auditAdminAction, validate(paymentIdSchema), controller.confirm);
router.post('/:id/refund', authorize('admin'), auditAdminAction, validate(refundSchema), controller.refund);
export default router;