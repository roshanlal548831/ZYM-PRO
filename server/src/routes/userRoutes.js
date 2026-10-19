import { Router } from 'express';
import * as controller from '../controllers/userController.js';
import authenticate from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import imageUpload from '../middleware/imageUpload.js';
import { updateMeSchema } from '../validators/userValidators.js';

const router = Router();
router.use(authenticate);
router.get('/me', controller.getMe);
router.patch('/me', imageUpload, (req, _res, next) => {
	if (req.file && Object.keys(req.body).length === 0) req.body.profileImage = undefined;
	next();
}, validate(updateMeSchema), controller.updateMe);
export default router;