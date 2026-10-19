import { z } from 'zod';

export const updateMeSchema = z.object({ body: z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/).optional().nullable(),
  profileImage: z.string().url().max(2048).optional().nullable()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required') });