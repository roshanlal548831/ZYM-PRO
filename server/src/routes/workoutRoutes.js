import { Router } from 'express';
import { z } from 'zod';
import * as controller from '../controllers/workoutController.js';
import authenticate from '../middleware/authenticate.js';
import authorize from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import auditAdminAction from '../middleware/auditAdminAction.js';

const id = z.string().regex(/^[a-f\d]{24}$/i);
const exercise = z.object({ name: z.string().trim().min(1).max(150), sets: z.number().int().positive(), reps: z.string().trim().min(1).max(50), restSeconds: z.number().int().nonnegative(), videoUrl: z.string().url().optional() });
const workoutBody = z.object({ title: z.string().trim().min(2).max(150), description: z.string().max(3000).optional(), difficulty: z.enum(['beginner', 'intermediate', 'advanced']), exercises: z.array(exercise).min(1).max(100), assignedTo: id.optional(), isActive: z.boolean().optional() });
const createSchema = z.object({ body: workoutBody.strict() });
const updateSchema = z.object({ params: z.object({ id }), body: workoutBody.partial().strict().refine((value) => Object.keys(value).length > 0) });
const idSchema = z.object({ params: z.object({ id }) });

const router = Router();
router.use(authenticate);
router.get('/my', authorize('member'), controller.myWorkouts);
router.post('/', authorize('admin'), auditAdminAction, validate(createSchema), controller.createWorkout);
router.patch('/:id', authorize('admin'), auditAdminAction, validate(updateSchema), controller.updateWorkout);
router.delete('/:id', authorize('admin'), auditAdminAction, validate(idSchema), controller.deactivateWorkout);
export default router;