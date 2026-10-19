import { Router } from 'express';
import * as controller from '../controllers/enquiryController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { enquiryLimiter } from '../middleware/rateLimiters.js';
import { createEnquirySchema, updateEnquirySchema } from '../validators/enquiryValidators.js';

const router = Router();
router.post('/', enquiryLimiter, validate(createEnquirySchema), controller.createEnquiry);
router.get('/', authenticate, authorize('admin'), controller.listEnquiries);
router.patch('/:id', authenticate, authorize('admin'), validate(updateEnquirySchema), controller.updateEnquiry);
export default router;