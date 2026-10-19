import { z } from 'zod';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
export const idParamsSchema = z.object({ params: z.object({ id: objectId }) });
export const createPlanSchema = z.object({ body: z.object({
  name: z.string().trim().min(2).max(100), description: z.string().max(2000).optional(),
  price: z.number().positive().max(10_000_000), durationDays: z.number().int().positive().max(3650),
  features: z.array(z.string().trim().min(1).max(200)).max(50).optional()
}).strict() });
export const updatePlanSchema = z.object({ params: z.object({ id: objectId }), body: z.object({
  name: z.string().trim().min(2).max(100).optional(), description: z.string().max(2000).optional(),
  price: z.number().positive().max(10_000_000).optional(), durationDays: z.number().int().positive().max(3650).optional(),
  features: z.array(z.string().trim().min(1).max(200)).max(50).optional(), isActive: z.boolean().optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required') });
export const createMembershipSchema = z.object({ body: z.object({ planId: objectId }).strict() });
export const statusSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ status: z.enum(['cancelled', 'active']) }).strict() });