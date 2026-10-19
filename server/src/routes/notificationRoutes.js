import { Router } from 'express';
import { listNotifications } from '../controllers/notificationController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';

const router = Router();
router.get('/', authenticate, authorize('admin'), listNotifications);
export default router;