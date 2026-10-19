import { z } from 'zod';
import { objectId } from './membershipValidators.js';

export const createEnquirySchema = z.object({ body: z.object({
  name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/), message: z.string().trim().min(5).max(3000),
  enquiryType: z.enum(['general', 'trial']).default('general')
}).strict() });
export const updateEnquirySchema = z.object({ params: z.object({ id: objectId }), body: z.object({
  status: z.enum(['new', 'contacted', 'converted', 'closed']).optional(), assignedTo: objectId.nullable().optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required') });