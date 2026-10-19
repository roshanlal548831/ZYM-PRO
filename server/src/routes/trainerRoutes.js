import { Router } from 'express';
import * as controller from '../controllers/trainerController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import auditAdminAction from '../middleware/auditAdminAction.js';
import imageUpload from '../middleware/imageUpload.js';
import { z } from 'zod';

const trainerBody = z.object({ body: z.object({
  name: z.string().trim().min(2).max(100), specialization: z.string().trim().min(2).max(200),
  experienceYears: z.coerce.number().int().min(0).max(80), bio: z.string().max(3000).optional(),
  imageUrl: z.string().url().optional().nullable(), availability: z.array(z.string().max(100)).max(50).optional(), isActive: z.boolean().optional()
}).strict() });
const updateBody = z.object({ params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }), body: trainerBody.shape.body.partial().refine((value) => Object.keys(value).length > 0) });
const deleteSchema = z.object({ params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }) });

const router = Router();
router.get('/', controller.listTrainers);
router.post('/', authenticate, authorize('admin'), auditAdminAction, imageUpload, validate(trainerBody), controller.createTrainer);
router.patch('/:id', authenticate, authorize('admin'), auditAdminAction, imageUpload, (req, _res, next) => {
  if (req.file && Object.keys(req.body).length === 0) req.body.imageUrl = undefined;
  next();
}, validate(updateBody), controller.updateTrainer);
router.delete('/:id', authenticate, authorize('admin'), auditAdminAction, validate(deleteSchema), controller.deactivateTrainer);
export default router;