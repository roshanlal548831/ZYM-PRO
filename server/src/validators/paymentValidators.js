import { z } from 'zod';
import { objectId } from './membershipValidators.js';

export const createPaymentSchema = z.object({ body: z.object({
  memberId: objectId, membershipId: objectId, amount: z.number().positive().max(10_000_000),
  method: z.enum(['cash', 'upi']), transactionReference: z.string().trim().max(150).optional(), notes: z.string().trim().max(1000).optional()
}).strict() });
export const paymentIdSchema = z.object({ params: z.object({ id: objectId }) });
export const refundSchema = z.object({ params: z.object({ id: objectId }), body: z.object({ reason: z.string().trim().min(3).max(500) }).strict() });
export const listPaymentsSchema = z.object({ query: z.object({ page: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().positive().max(100).optional(), status: z.enum(['pending', 'paid', 'refunded']).optional(), memberId: objectId.optional() }).passthrough() });